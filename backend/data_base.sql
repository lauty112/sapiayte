-- ============================================================
--  BASE DE DATOS - LOCAL DE COMIDA SAPY'AITE
--  Motor: PostgreSQL
-- ============================================================

-- Extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. ROLES Y EMPLEADOS
-- ============================================================

CREATE TABLE roles (
    id_roles    SERIAL PRIMARY KEY,
    nombre      VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE empleados (
    id_empleado     SERIAL PRIMARY KEY,
    rol_id          INTEGER NOT NULL REFERENCES roles(id_roles),
    nombre          VARCHAR(100) NOT NULL,
    email           VARCHAR(100) UNIQUE,
    telefono        VARCHAR(20)
    password_hash   VARCHAR(255) NOT NULL,   -- ← AGREGADO
    activo          BOOLEAN DEFAULT TRUE 
);

-- ============================================================
-- 2. MENÚ: CATEGORÍAS Y PRODUCTOS
-- ============================================================

CREATE TABLE categorias (
    id_categoria    SERIAL PRIMARY KEY,
    nombre          VARCHAR(80) NOT NULL UNIQUE,
    orden           INTEGER DEFAULT 0
);

CREATE TABLE productos (
    id_producto     SERIAL PRIMARY KEY,
    categoria_id    INTEGER NOT NULL REFERENCES categorias(id_categoria),
    nombre          VARCHAR(120) NOT NULL,
    descripcion     TEXT,
    precio          NUMERIC(10,2) NOT NULL CHECK (precio >= 0),
    disponible      BOOLEAN DEFAULT TRUE,
    imagen_url      TEXT
);

-- ============================================================
-- 3. MESAS Y QR
-- ============================================================

CREATE TABLE mesas (
    id_mesa         SERIAL PRIMARY KEY,
    numero          INTEGER NOT NULL UNIQUE CHECK (numero > 0),
    qr_token        VARCHAR(100) NOT NULL UNIQUE,
    activa          BOOLEAN NOT NULL DEFAULT TRUE
);

-- ============================================================
-- 4. ESTADOS DE PEDIDO
-- ============================================================

CREATE TABLE estados_pedido (
    id_estado       SERIAL PRIMARY KEY,
    nombre          VARCHAR(30) NOT NULL UNIQUE,
    descripcion     TEXT
);

INSERT INTO estados_pedido (nombre, descripcion) VALUES
    ('pendiente', 'Recibido, aún no visto en cocina'),
    ('en_preparacion', 'Chef lo aceptó'),
    ('listo', 'Listo para servir'),
    ('entregado', 'Llevado a la mesa'),
    ('cancelado', 'Cancelado por mozo o admin'),
    ('pagado', 'Cerrado y cobrado');

-- ============================================================
-- 5. PEDIDOS
-- ============================================================

CREATE TABLE pedidos (
    id_pedido           SERIAL PRIMARY KEY,
    mesa_id             INTEGER NOT NULL REFERENCES mesas(id_mesa),
    estado_id           INTEGER NOT NULL REFERENCES estados_pedido(id_estado),
    fecha_creacion      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total               NUMERIC(10,2) DEFAULT 0,
    observaciones       TEXT,
    empleado_id         INTEGER REFERENCES empleados(id_empleado)
);

CREATE TABLE detalles_pedido (
    id_detalle      SERIAL PRIMARY KEY,
    pedido_id       INTEGER NOT NULL REFERENCES pedidos(id_pedido),
    producto_id     INTEGER NOT NULL REFERENCES productos(id_producto),
    cantidad        INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(10,2) NOT NULL CHECK (precio_unitario >= 0),
    subtotal        NUMERIC(10,2) NOT NULL
);

-- ============================================================
-- 6. RESERVAS
-- ============================================================

CREATE TABLE reservas (
    id_reserva      SERIAL PRIMARY KEY,
    mesa_id         INTEGER REFERENCES mesas(id_mesa),
    nombre_cliente  VARCHAR(100) NOT NULL,
    telefono        VARCHAR(20) NOT NULL,
    fecha           DATE NOT NULL,
    hora            TIME NOT NULL,
    personas        INTEGER NOT NULL,
    mensaje         TEXT,
    estado          VARCHAR(20) DEFAULT 'pendiente'
);

-- ============================================================
-- 7. DATOS DE EJEMPLO
-- ============================================================

-- Categorías
INSERT INTO categorias (nombre, orden) VALUES
    ('Merienda', 1),
    ('Para picar', 2),
    ('Sandwiches', 3),
    ('Al plato', 4),
    ('Pizzas', 5);

-- Productos
INSERT INTO productos (categoria_id, nombre, descripcion, precio) VALUES
    (1, 'Te Taragui', 'Té de hierbas, con limón y miel', 1700),
    (1, 'Café', 'Café negro, con leche o sin leche', 3000),
    (1, 'Tostado de jamón y queso', 'Tostado de jamón y queso, con lechuga y tomate', 7800),
    (1, 'Chipas', 'Chipas de maíz, con queso y cebolla (x6)', 4100),
    (2, 'Aros de cebolla 200gr', 'Aros de cebolla fritos', 7680),
    (2, 'Papas fritas 200gr', 'Papas fritas', 7560),
    (2, 'Mandioca frita 250gr', 'Mandioca frita', 8100),
    (2, 'Panes saborizados con guacamole', 'Panes saborizados con guacamole', 9840),
    (3, 'Hamburguesa simple', 'Pan, medallón de carne 127gr y queso muzzarella', 8400),
    (3, 'Hamburguesa completa', 'Pan, medallón, queso, lechuga, tomate y huevo', 10600),
    (3, 'Sandwich de milanesa', 'Milanesa de carne, pan árabe, lechuga, tomate y huevo', 9800),
    (3, 'Pancho', 'Pancho con salchicha parrillera', 6550),
    (4, 'Hamburguesa simple al plato', 'Medallón de carne 127gr y queso muzzarella', 8200),
    (4, 'Hamburguesa completa al plato', 'Medallón, queso, lechuga, tomate y huevo', 9800),
    (4, 'Milanesa al plato', 'Milanesa de carne, lechuga, tomate y huevo', 10800),
    (4, 'Entrañas al plato', 'Entrañas de cerdo, lechuga, tomate y huevo', 10200);

-- Roles
INSERT INTO roles (nombre) VALUES ('admin'), ('mozo'), ('cocina');

-- Mesas (ejemplo para 10 mesas)
INSERT INTO mesas (numero, qr_token, activa) VALUES
    (1, 'mesa_001_token_xyz', true),
    (2, 'mesa_002_token_abc', true),
    (3, 'mesa_003_token_def', true),
    (4, 'mesa_004_token_ghi', true),
    (5, 'mesa_005_token_jkl', true);