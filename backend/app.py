from flask import Flask, request, jsonify, session
from flask_cors import CORS
from functools import wraps
import os
import bcrypt
from conexion import (
    obtener_productos_por_categoria,
    crear_pedido,
    obtener_mesa_por_token,
    crear_reserva,
    actualizar_estado_pedido,
    obtener_pedidos_por_mesa,
    obtener_categorias,
    validar_mesa,
    PedidoError
)


app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY') or os.environ.get('app_secret_key')
if not app.secret_key:
    raise RuntimeError("Falta definir SECRET_KEY en las variables de entorno (backend/.env en local, Render en producción)")

FLASK_ENV = os.environ.get('FLASK_ENV', 'production')

app.config.update(
    # En producción (frontend y backend en sitios distintos) la cookie necesita
    # SameSite=None + Secure para funcionar sobre HTTPS. En desarrollo local
    # (HTTP, localhost) se usan Lax + sin Secure para que la cookie no se descarte.
    SESSION_COOKIE_SAMESITE='None' if FLASK_ENV == 'production' else 'Lax',
    SESSION_COOKIE_SECURE=(FLASK_ENV == 'production'),
    SESSION_COOKIE_HTTPONLY=True, # Protege contra XSS, la cookie no es accesible desde JavaScript
    SESSION_COOKIE_PATH='/' # Asegura que la cookie se envíe en todas las rutas del dominio
)

# ✅ FIX: origins="*" con supports_credentials=True es inválido según la spec CORS.

CORS(app, supports_credentials=True, origins=[
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8081",
    "http://127.0.0.1:8080",
    "https://sapiayte.vercel.app",
    "https://sapiayte-efor8gckb-lauty.vercel.app"
])


# ============================================================
# RUTAS
# ============================================================

@app.route('/', methods=['GET'])
def home():
    return jsonify({'message': "API de Sapy'Aite funcionando correctamente", 'status': 'online'})


@app.route('/api/menu', methods=['GET'])
def get_menu():
    """Obtiene el menú completo agrupado por categoría."""
    menu = obtener_productos_por_categoria()
    return jsonify({'success': True, 'menu': menu})


@app.route('/api/mesa/verificar', methods=['POST'])
def verificar_mesa():
    """Verifica un token QR de mesa y abre la sesión del cliente."""
    data = request.json or {}
    token = data.get('token', '').strip()

    if not token:
        return jsonify({'success': False, 'error': 'Token no proporcionado'})

    mesa = obtener_mesa_por_token(token)
    if mesa:
        session['mesa_id']     = mesa['id_mesa']
        session['mesa_numero'] = mesa['numero']
        return jsonify({
            'success': True,
            'mesa': {
                'id':     mesa['id_mesa'],
                'numero': mesa['numero']
            }
        })

    return jsonify({'success': False, 'error': 'Mesa no válida o QR expirado'})


@app.route('/api/mesa/actual', methods=['GET'])
def get_mesa_actual():
    """Devuelve la mesa guardada en la sesión actual."""
    mesa_id     = session.get('mesa_id')
    mesa_numero = session.get('mesa_numero')

    if mesa_id:
        return jsonify({'success': True,  'mesa': {'id': mesa_id, 'numero': mesa_numero}})
    return jsonify({'success': False, 'mesa': None})


@app.route('/api/pedidos/mesa', methods=['GET'])
def get_pedidos_mesa():
    """Obtiene los pedidos activos de la mesa en sesión."""
    mesa_id = session.get('mesa_id')
    if not mesa_id:
        return jsonify({'success': False, 'error': 'No hay mesa seleccionada'})

    pedidos = obtener_pedidos_por_mesa(mesa_id)
    return jsonify({'success': True, 'pedidos': pedidos})


@app.route('/api/pedido/crear', methods=['POST'])
def crear_nuevo_pedido():
    """Registra un nuevo pedido para la mesa."""
    data = request.json or {}

    # La mesa se valida contra la DB usando el token del QR (o la sesión).
    mesa_id = data.get('mesa_id') or session.get('mesa_id')
    if not mesa_id:
        return jsonify({'success': False, 'error': 'No hay mesa seleccionada. Escaneá el QR nuevamente.'})

    mesa = validar_mesa(mesa_id, data.get('mesa_token'))
    if not mesa:
        return jsonify({'success': False, 'error': 'Mesa no válida. Escaneá el QR nuevamente.'})

    items         = data.get('items', [])
    observaciones = data.get('observaciones', '')

    if not items:
        return jsonify({'success': False, 'error': 'El pedido está vacío'})

    try:
        pedido_id = crear_pedido(mesa_id, items, observaciones)
    except PedidoError as e:
        return jsonify({'success': False, 'error': str(e)})

    if pedido_id:
        return jsonify({'success': True, 'pedido_id': pedido_id})

    return jsonify({'success': False, 'error': 'Error interno al crear el pedido'})


@app.route('/api/reserva/crear', methods=['POST'])
def nueva_reserva():
    """Registra una nueva reserva."""
    data = request.json or {}

    required_fields = ['nombre', 'telefono', 'fecha', 'hora', 'personas']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'success': False, 'error': f'Falta el campo requerido: {field}'})

    success = crear_reserva(data)
    if success:
        return jsonify({'success': True, 'message': 'Reserva creada exitosamente'})

    return jsonify({'success': False, 'error': 'Error interno al crear la reserva'})

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'empleado_id' not in session:
            return jsonify({'success': False, 'error': 'No autorizado'}), 401
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if session.get('rol') != 'admin':
            return jsonify({'success': False, 'error': 'Se requieren permisos de administrador'}), 403
        return f(*args, **kwargs)
    return decorated_function

# --- Login ---
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json or {}
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'success': False, 'error': 'Email y contraseña requeridos'})
    
    from conexion import obtener_empleado_por_email
    empleado = obtener_empleado_por_email(email)
    if not empleado or not bcrypt.checkpw(password.encode('utf-8'), empleado['password_hash'].encode('utf-8')):
        return jsonify({'success': False, 'error': 'Credenciales inválidas'})
    
    session['empleado_id'] = empleado['id_empleado']
    session['rol'] = empleado['rol_nombre']
    session['nombre_empleado'] = empleado['nombre']
    return jsonify({'success': True, 'rol': empleado['rol_nombre'], 'nombre': empleado['nombre']})

@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'success': True})

@app.route('/api/empleado/actual', methods=['GET'])
def empleado_actual():
    if 'empleado_id' in session:
        return jsonify({'success': True, 'empleado': {'id': session['empleado_id'], 'rol': session['rol'], 'nombre': session['nombre_empleado']}})
    return jsonify({'success': False, 'empleado': None})

# --- CRUD productos (solo admin) ---
@app.route('/api/admin/productos', methods=['GET'])
@login_required
@admin_required
def listar_productos():
    from conexion import obtener_todos_productos
    productos = obtener_todos_productos()
    return jsonify({'success': True, 'productos': productos})


@app.route('/api/categorias', methods=['GET'])
def get_categorias():
    """Lista todas las categorías (para el panel de admin)"""
    categorias = obtener_categorias()
    return jsonify({'success': True, 'categorias': categorias})

@app.route('/api/admin/productos', methods=['POST'])
@login_required
@admin_required
def crear_producto():
    data = request.json or {}
    required = ['nombre', 'precio', 'categoria_id']
    if not all(k in data for k in required):
        return jsonify({'success': False, 'error': 'Faltan campos obligatorios'})

    try:
        precio = float(data['precio'])
    except (TypeError, ValueError):
        return jsonify({'success': False, 'error': 'El precio debe ser un número'})

    if precio <= 0:
        return jsonify({'success': False, 'error': 'El precio no puede ser negativo'})

    from conexion import crear_producto
    nuevo_id = crear_producto(data)
    if nuevo_id:
        return jsonify({'success': True, 'id': nuevo_id})
    return jsonify({'success': False, 'error': 'Error al crear'})

@app.route('/api/admin/productos/<int:id>', methods=['PUT'])
@login_required
@admin_required
def actualizar_producto(id):
    data = request.json or {}
    from conexion import actualizar_producto
    if actualizar_producto(id, data):
        return jsonify({'success': True})
    return jsonify({'success': False, 'error': 'Error al actualizar'})

@app.route('/api/admin/productos/<int:id>', methods=['DELETE'])
@login_required
@admin_required
def eliminar_producto(id):
    from conexion import eliminar_producto
    if eliminar_producto(id):
        return jsonify({'success': True})
    return jsonify({'success': False, 'error': 'Error al eliminar'})
# ============================================================
# MAIN
# ============================================================


@app.route('/api/admin/mesas', methods=['GET'])
@login_required
@admin_required
def listar_mesas():
    from conexion import obtener_todas_mesas
    mesas = obtener_todas_mesas()
    return jsonify({'success': True, 'mesas': mesas})

@app.route('/api/admin/mesas', methods=['POST'])
@login_required
@admin_required
def crear_mesa():
    data = request.json or {}
    numero = data.get('numero')
    qr_token = data.get('qr_token')
    if not numero:
        return jsonify({'success': False, 'error': 'Número de mesa requerido'})
    from conexion import insertar_mesa
    nueva_id = insertar_mesa(numero, qr_token)
    if nueva_id:
        return jsonify({'success': True, 'id': nueva_id})
    return jsonify({'success': False, 'error': 'Error al crear mesa'})

@app.route('/api/admin/mesas/<int:id>', methods=['PUT'])
@login_required
@admin_required
def actualizar_mesa(id):
    data = request.json or {}
    from conexion import actualizar_mesa
    if actualizar_mesa(id, data):
        return jsonify({'success': True})
    return jsonify({'success': False, 'error': 'Error al actualizar'})

@app.route('/api/admin/mesas/<int:id>', methods=['DELETE'])
@login_required
@admin_required
def eliminar_mesa(id):
    from conexion import eliminar_mesa
    if eliminar_mesa(id):
        return jsonify({'success': True})
    return jsonify({'success': False, 'error': 'Error al eliminar'})

@app.route('/api/admin/mesas/<int:id>/activa', methods=['PATCH'])
@login_required
@admin_required
def toggle_mesa_activa(id):
    data = request.json or {}
    activa = data.get('activa')
    if activa is None:
        return jsonify({'success': False, 'error': 'Falta el campo activa'})
    from conexion import actualizar_mesa
    if actualizar_mesa(id, {'activa': activa}):
        return jsonify({'success': True})
    return jsonify({'success': False, 'error': 'Error al actualizar'})

# ============================================================
# INFORMES (solo admin)
# ============================================================

@app.route('/api/admin/informes/ventas', methods=['GET'])
@login_required
@admin_required
def informes_ventas():
    """Devuelve ventas por día (últimos 7 días por defecto)."""
    dias = request.args.get('dias', default=7, type=int)
    from conexion import obtener_ventas_por_dia
    data = obtener_ventas_por_dia(dias)
    return jsonify({'success': True, 'data': data})

@app.route('/api/admin/informes/productos-top', methods=['GET'])
@login_required
@admin_required
def informes_productos_top():
    limite = request.args.get('limite', default=5, type=int)
    categoria_id = request.args.get('categoria_id', default=None, type=int)
    from conexion import obtener_productos_mas_vendidos
    data = obtener_productos_mas_vendidos(limite, categoria_id)
    return jsonify({'success': True, 'data': data})

@app.route('/api/admin/informes/estados-pedidos', methods=['GET'])
@login_required
@admin_required
def informes_estados_pedidos():
    """Devuelve la distribución de pedidos por estado."""
    from conexion import obtener_estado_pedidos
    data = obtener_estado_pedidos()
    return jsonify({'success': True, 'data': data})

@app.route('/api/admin/informes/reservas', methods=['GET'])
@login_required
@admin_required
def informes_reservas():
    """Devuelve reservas por mes."""
    meses = request.args.get('meses', default=6, type=int)
    from conexion import obtener_reservas_por_mes
    data = obtener_reservas_por_mes(meses)
    return jsonify({'success': True, 'data': data})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)