from flask import Flask, request, jsonify, session
from flask_cors import CORS
from functools import wraps
import bcrypt
from conexion import (
    obtener_productos_por_categoria,
    crear_pedido,
    obtener_mesa_por_token,
    crear_reserva,
    actualizar_estado_pedido,
    obtener_pedidos_por_mesa,
    obtener_categorias
)


app = Flask(__name__)
app.secret_key = app.config.get('app_secret_key')  # cambiar por una clave segura en producción(la clave se usa para firmar las cookies de sesión, no debe ser pública ni predecible)

app.config.update(
    SESSION_COOKIE_SAMESITE='Lax',  # Evita problemas de cookies en CORS sin requerir HTTPS
    SESSION_COOKIE_SECURE=True,   # Solo para desarrollo local (sin HTTPS)
    SESSION_COOKIE_HTTPONLY=True, # Protege contra XSS, la cookie no es accesible desde JavaScript
    SESSION_COOKIE_PATH='/' # Asegura que la cookie se envíe en todas las rutas del dominio
)

# ✅ FIX: origins="*" con supports_credentials=True es inválido según la spec CORS.
# El navegador rechaza las respuestas. Se deben declarar los orígenes explícitamente.
CORS(app, supports_credentials=True, origins=[
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "null",
    "https://sapiayte.vercel.app"   # Necesario cuando se abren archivos HTML directamente con file://
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

    # FIX: lee mesa_id primero del body (enviado desde localStorage por el frontend).
    # La sesión Flask falla cuando el navegador no envía la cookie entre orígenes distintos.
    mesa_id = data.get('mesa_id') or session.get('mesa_id')

    if not mesa_id:
        return jsonify({'success': False, 'error': 'No hay mesa seleccionada. Escaneá el QR nuevamente.'})

    items         = data.get('items', [])
    observaciones = data.get('observaciones', '')

    if not items:
        return jsonify({'success': False, 'error': 'El pedido está vacío'})

    pedido_id = crear_pedido(mesa_id, items, observaciones)
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
    data = request.json
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
    data = request.json
    required = ['nombre', 'precio', 'categoria_id']
    if not all(k in data for k in required):
        return jsonify({'success': False, 'error': 'Faltan campos obligatorios'})
    
    if float(data['precio']) <= 0:
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
    data = request.json
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
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)