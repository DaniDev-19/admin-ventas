CREATE TABLE IF NOT EXISTS clientes (
  id SERIAL PRIMARY KEY,
  cedula VARCHAR(50) NOT NULL UNIQUE,
  nombre VARCHAR(250),
  telefono VARCHAR(50),
  status VARCHAR(50) NOT NULL DEFAULT 'pago_pendiente'
);

CREATE TABLE IF NOT EXISTS productos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(250),
  precio_usd DECIMAL(12,2),
  stock INT,
  categoria VARCHAR(250),
  status VARCHAR(50) NOT NULL DEFAULT 'disponible'
);

CREATE TABLE IF NOT EXISTS tasa_moneda (
  id SERIAL PRIMARY KEY,
  moneda VARCHAR(50) DEFAULT 'Bs',
  tasa_usd DECIMAL(12,6),
  tasa_euro DECIMAL(12,6),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ventas (
  id SERIAL PRIMARY KEY,
  clientes_id INT NOT NULL,
  productos_id INT NOT NULL,
  tasa_moneda_id INT NOT NULL,
  cantidad INT NOT NULL DEFAULT 1,
  precio_unitario DECIMAL(12,2) NOT NULL,
  total DECIMAL(14,2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,
  status VARCHAR(50) NOT NULL DEFAULT 'no_pagada',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT fk_c_compra FOREIGN KEY (clientes_id) REFERENCES clientes(id) ON DELETE CASCADE,
  CONSTRAINT fk_p_venta FOREIGN KEY (productos_id) REFERENCES productos(id) ON DELETE CASCADE,
  CONSTRAINT fk_tasas_cambio FOREIGN KEY (tasa_moneda_id) REFERENCES tasa_moneda(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ventas_clientes_id ON ventas (clientes_id);
CREATE INDEX IF NOT EXISTS idx_ventas_productos_id ON ventas (productos_id);
CREATE INDEX IF NOT EXISTS idx_ventas_tasa_moneda_id ON ventas (tasa_moneda_id);
CREATE INDEX IF NOT EXISTS idx_ventas_created_at ON ventas (created_at);
CREATE INDEX IF NOT EXISTS idx_ventas_status_created_at ON ventas (status, created_at);
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos (categoria);
CREATE INDEX IF NOT EXISTS idx_productos_precio_usd ON productos (precio_usd);
CREATE INDEX IF NOT EXISTS idx_clientes_nombre ON clientes (nombre);


