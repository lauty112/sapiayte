"""
conexion.py — Capa de acceso a datos para Sapy'Aite
Motor: PostgreSQL  |  Driver: psycopg2
"""
import bcrypt
import psycopg2
import psycopg2.extras
import os
from dotenv import load_dotenv

load_dotenv()

# ============================================================
# CONFIGURACIÓN DE LA CONEXIÓN
# Ajusta estos valores según tu entorno.
# ============================================================

DATABASE_URL = os.getenv("DATABASE_URL")

DB_CONFIG = {
    "host":     os.getenv("DB_HOST"),
    "port":     os.getenv("DB_PORT"),
    "dbname":   os.getenv("DB_NAME"),
    "user":     os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "sslmode": "require"
}

def obtener_categorias():
    """Devuelve lista de {id, nombre} de todas las categorías."""
    try:
        with get_connection() as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute("SELECT id_categoria as id, nombre FROM categorias ORDER BY orden")
                return cur.fetchall()
    except Exception as e:
        print(f"[ERROR] obtener_categorias: {e}")
        return []

def obtener_empleado_por_email(email):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT e.id_empleado, e.nombre, e.email, e.password_hash, r.nombre as rol_nombre
        FROM empleados e
        JOIN roles r ON e.rol_id = r.id_roles
        WHERE e.email = %s AND e.activo = true
    """, (email,))
    empleado = cur.fetchone()
    cur.close()
    conn.close()
    if empleado:
        return {
            'id_empleado': empleado[0],
            'nombre': empleado[1],
            'email': empleado[2],
            'password_hash': empleado[3],
            'rol_nombre': empleado[4]
        }
    return None

def obtener_todos_productos():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT p.id_producto, p.nombre, p.descripcion, p.precio, p.disponible, p.imagen_url, c.id_categoria, c.nombre as categoria_nombre
        FROM productos p
        JOIN categorias c ON p.categoria_id = c.id_categoria
        ORDER BY c.orden, p.nombre
    """)
    productos = cur.fetchall()
    cur.close()
    conn.close()
    return [{
        'id': row[0],
        'nombre': row[1],
        'descripcion': row[2],
        'precio': float(row[3]),
        'disponible': row[4],
        'imagen_url': row[5],
        'categoria_id': row[6],
        'categoria_nombre': row[7]
    } for row in productos]

def crear_producto(data):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO productos (categoria_id, nombre, descripcion, precio, disponible, imagen_url)
        VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING id_producto
    """, (data['categoria_id'], data['nombre'], data.get('descripcion'), data['precio'], data.get('disponible', True), data.get('imagen_url')))
    new_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()
    return new_id

def actualizar_producto(id, data):
    conn = get_connection()
    cur = conn.cursor()
    campos = []
    valores = []
    for key in ['categoria_id', 'nombre', 'descripcion', 'precio', 'disponible', 'imagen_url']:
        if key in data:
            campos.append(f"{key} = %s")
            valores.append(data[key])
    valores.append(id)
    cur.execute(f"UPDATE productos SET {', '.join(campos)} WHERE id_producto = %s", valores)
    conn.commit()
    updated = cur.rowcount > 0
    cur.close()
    conn.close()
    return updated

def eliminar_producto(id):
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE productos SET disponible = false WHERE id_producto = %s", (id,)
                )
            conn.commit()
            return True
    except Exception as e:
        print(f"Error al desactivar producto: {e}")
        return False

def get_connection():
    if DATABASE_URL:
        return psycopg2.connect(DATABASE_URL, sslmode ='require')
    else:
        DB_CONFIG ={
            "host": os.getenv("DB_HOST"),
            "port": os.getenv("DB_PORT"),
            "dbname": os.getenv("DB_NAME"),
            "user": os.getenv("DB_USER"),
            "password": os.getenv("DB_PASSWORD"),
            "sslmode": "require"
        }

    """Abre y devuelve una conexión nueva a PostgreSQL."""
    return psycopg2.connect(**DB_CONFIG)


# ============================================================
# MENÚ
# ============================================================

def obtener_productos_por_categoria() -> dict:
    """
    Devuelve todos los productos disponibles agrupados por categoría.
    Ejemplo de retorno:
        { "Merienda": [{id, nombre, descripcion, precio, disponible, imagen_url}, ...], ... }
    """
    menu = {}
    try:
        with get_connection() as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute("""
                    SELECT
                        c.nombre  AS categoria,
                        p.id_producto,
                        p.nombre,
                        p.descripcion,
                        p.precio,
                        p.disponible,
                        p.imagen_url
                    FROM productos p
                    JOIN categorias c ON c.id_categoria = p.categoria_id
                    WHERE p.disponible = TRUE
                    ORDER BY c.orden, p.nombre
                """)
                for row in cur.fetchall():
                    cat = row['categoria']
                    if cat not in menu:
                        menu[cat] = []
                    menu[cat].append({
                        'id':          row['id_producto'],
                        'nombre':      row['nombre'],
                        'descripcion': row['descripcion'],
                        'precio':      float(row['precio']),
                        'disponible':  row['disponible'],
                        'imagen_url':  row['imagen_url']
                    })
    except Exception as e:
        print(f"[ERROR] obtener_productos_por_categoria: {e}")
    return menu


# ============================================================
# MESAS
# ============================================================

def obtener_mesa_por_token(token: str) -> dict | None:
    """
    Busca una mesa activa por su qr_token.
    Retorna un dict con {id_mesa, numero} o None si no existe.
    """
    try:
        with get_connection() as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute("""
                    SELECT id_mesa, numero
                    FROM mesas
                    WHERE qr_token = %s AND activa = TRUE
                """, (token,))
                row = cur.fetchone()
                return dict(row) if row else None
    except Exception as e:
        print(f"[ERROR] obtener_mesa_por_token: {e}")
        return None


# ============================================================
# PEDIDOS
# ============================================================

def crear_pedido(mesa_id: int, items: list, observaciones: str = '') -> int | None:
    """
    Inserta un pedido y sus detalles en la base de datos.
    Retorna el id_pedido creado, o None si hubo un error.

    items: lista de dicts { producto_id, cantidad, precio }
    """
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                # Estado inicial: 'pendiente' (id=1 según el INSERT del SQL)
                cur.execute("""
                    INSERT INTO pedidos (mesa_id, estado_id, observaciones)
                    VALUES (%s, 1, %s)
                    RETURNING id_pedido
                """, (mesa_id, observaciones))
                pedido_id = cur.fetchone()[0]

                total = 0
                for item in items:
                    subtotal = item['precio'] * item['cantidad']
                    total   += subtotal
                    cur.execute("""
                        INSERT INTO detalles_pedido
                            (pedido_id, producto_id, cantidad, precio_unitario, subtotal)
                        VALUES (%s, %s, %s, %s, %s)
                    """, (pedido_id, item['producto_id'], item['cantidad'], item['precio'], subtotal))

                # Actualizar el total del pedido
                cur.execute("""
                    UPDATE pedidos SET total = %s WHERE id_pedido = %s
                """, (total, pedido_id))

                conn.commit()
                return pedido_id
    except Exception as e:
        print(f"[ERROR] crear_pedido: {e}")
        return None


def obtener_pedidos_por_mesa(mesa_id: int) -> list:
    """
    Devuelve todos los pedidos activos (no cancelados/pagados) de una mesa.
    """
    pedidos = []
    try:
        with get_connection() as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute("""
                    SELECT
                        p.id_pedido,
                        p.total,
                        p.observaciones,
                        p.fecha_creacion,
                        e.nombre AS estado
                    FROM pedidos p
                    JOIN estados_pedido e ON e.id_estado = p.estado_id
                    WHERE p.mesa_id = %s
                      AND e.nombre NOT IN ('cancelado', 'pagado')
                    ORDER BY p.fecha_creacion DESC
                """, (mesa_id,))
                pedidos = [dict(row) for row in cur.fetchall()]
    except Exception as e:
        print(f"[ERROR] obtener_pedidos_por_mesa: {e}")
    return pedidos


def actualizar_estado_pedido(pedido_id: int, nuevo_estado: str) -> bool:
    """
    Cambia el estado de un pedido.
    nuevo_estado debe coincidir con estados_pedido.nombre (ej: 'en_preparacion').
    """
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE pedidos
                    SET estado_id = (
                        SELECT id_estado FROM estados_pedido WHERE nombre = %s
                    ),
                    fecha_actualizacion = CURRENT_TIMESTAMP
                    WHERE id_pedido = %s
                """, (nuevo_estado, pedido_id))
                conn.commit()
                return cur.rowcount > 0
    except Exception as e:
        print(f"[ERROR] actualizar_estado_pedido: {e}")
        return False


# ============================================================
# RESERVAS
# ============================================================

def crear_reserva(data: dict) -> bool:
    """
    Registra una nueva reserva.
    data debe incluir: nombre, telefono, fecha, hora, personas.
    Campos opcionales: mensaje, mesa_id.
    """
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO reservas
                        (nombre_cliente, telefono, fecha, hora, personas, mensaje, mesa_id)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """, (
                    data['nombre'],
                    data['telefono'],
                    data['fecha'],
                    data['hora'],
                    data['personas'],
                    data.get('mensaje', ''),
                    data.get('mesa_id')
                ))
                conn.commit()
                return True
    except Exception as e:
        print(f"[ERROR] crear_reserva: {e}")
        return False

# --- GESTIÓN DE MESAS  ---

def obtener_todas_mesas():
    try:
        with get_connection() as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute("SELECT id_mesa, numero, qr_token, activa FROM mesas ORDER BY numero")
                return cur.fetchall()
    except Exception as e:
        print(f"[ERROR] obtener_todas_mesas: {e}")
        return []

def insertar_mesa(numero, qr_token=None):
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                if qr_token:
                    cur.execute(
                        "INSERT INTO mesas (numero, qr_token, activa) VALUES (%s, %s, true) RETURNING id_mesa",
                        (numero, qr_token)
                    )
                else:
                    # Generar token automático si no se proporciona
                    token = f"mesa_{numero:03d}_{os.urandom(4).hex()}"
                    cur.execute(
                        "INSERT INTO mesas (numero, qr_token, activa) VALUES (%s, %s, true) RETURNING id_mesa",
                        (numero, token)
                    )
                return cur.fetchone()[0]
    except Exception as e:
        print(f"[ERROR] insertar_mesa: {e}")
        return None

def actualizar_mesa(id_mesa, data):
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                campos = []
                valores = []
                for key in ['numero', 'qr_token', 'activa']:
                    if key in data:
                        campos.append(f"{key} = %s")
                        valores.append(data[key])
                if not campos:
                    return False
                valores.append(id_mesa)
                cur.execute(f"UPDATE mesas SET {', '.join(campos)} WHERE id_mesa = %s", valores)
                conn.commit()
                return cur.rowcount > 0
    except Exception as e:
        print(f"[ERROR] actualizar_mesa: {e}")
        return False

def eliminar_mesa(id_mesa):
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM mesas WHERE id_mesa = %s", (id_mesa,))
                conn.commit()
                return cur.rowcount > 0
    except Exception as e:
        print(f"[ERROR] eliminar_mesa: {e}")
        return False
# ============================================================
# INFORMES Y ESTADÍSTICAS (CORREGIDO)
# ============================================================

def obtener_ventas_por_dia(dias: int = 7):
    """Devuelve el total de ventas agrupadas por día (últimos N días)."""
    try:
        with get_connection() as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute("""
                    SELECT 
                        DATE(fecha_creacion) as fecha,
                        COUNT(*) as total_pedidos,
                        SUM(total) as total_ventas
                    FROM pedidos
                    WHERE estado_id = (SELECT id_estado FROM estados_pedido WHERE nombre = 'pagado')
                        AND fecha_creacion >= CURRENT_DATE - INTERVAL '%s DAY'
                    GROUP BY DATE(fecha_creacion)
                    ORDER BY fecha ASC
                """, (dias,))  # ✅ PostgreSQL usa INTERVAL '7 days'
                return cur.fetchall()
    except Exception as e:
        print(f"[ERROR] obtener_ventas_por_dia: {e}")
        return []

def obtener_reservas_por_mes(meses: int = 6):
    """Devuelve la cantidad de reservas por mes."""
    try:
        with get_connection() as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute("""
                    SELECT 
                        TO_CHAR(fecha, 'YYYY-MM') as mes,
                        COUNT(*) as total_reservas
                    FROM reservas
                    WHERE fecha >= CURRENT_DATE - INTERVAL '%s MONTH'
                    GROUP BY TO_CHAR(fecha, 'YYYY-MM')
                    ORDER BY mes ASC
                """, (meses,))  # ✅ PostgreSQL usa INTERVAL '6 months'
                return cur.fetchall()
    except Exception as e:
        print(f"[ERROR] obtener_reservas_por_mes: {e}")
        return []
    
def obtener_productos_mas_vendidos(limite: int = 5):
    try:
        with get_connection() as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute("""
                    SELECT 
                        p.nombre,
                        SUM(dp.cantidad) as total_vendido,
                        SUM(dp.subtotal) as total_recaudado
                    FROM detalles_pedido dp
                    JOIN productos p ON dp.producto_id = p.id_producto
                    JOIN pedidos ped ON dp.pedido_id = ped.id_pedido
                    WHERE ped.estado_id = (SELECT id_estado FROM estados_pedido WHERE nombre = 'pagado')
                    GROUP BY p.id_producto, p.nombre
                    ORDER BY total_vendido DESC
                    LIMIT %s
                """, (limite,))
                return cur.fetchall()
    except Exception as e:
        print(f"[ERROR] obtener_productos_mas_vendidos: {e}")
        return []

def obtener_estado_pedidos():
    try:
        with get_connection() as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute("""
                    SELECT 
                        e.nombre as estado,
                        COUNT(p.id_pedido) as cantidad
                    FROM pedidos p
                    JOIN estados_pedido e ON p.estado_id = e.id_estado
                    GROUP BY e.nombre
                    ORDER BY cantidad DESC
                """)
                return cur.fetchall()
    except Exception as e:
        print(f"[ERROR] obtener_estado_pedidos: {e}")
        return []