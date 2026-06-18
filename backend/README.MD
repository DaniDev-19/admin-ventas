# Documentación Técnica Completa — Backend Single Sales

> Documento generado el 17/06/2026. Cubre la arquitectura, flujos, conexiones y estructura de cada módulo del sistema.

---

## 1. Visión General del Proyecto

**Single Sales** es un sistema de gestión de ventas construido sobre:

| Tecnología | Versión | Rol |
|---|---|---|
| Node.js + Express | v5.2 | Framework HTTP |
| TypeScript | v6.0 | Tipado estático |
| PostgreSQL | — | Base de datos relacional |
| Prisma ORM | v7.8 | Acceso a datos y migraciones |
| Zod | v4.4 | Validación de esquemas |
| node-cron | v3.0 | Tareas programadas |
| ExcelJS | v4.4 | Generación de reportes XLSX |
| PDFKit | v0.19 | Generación de reportes PDF |

---

## 2. Estructura de Directorios

```
backend/
├── prisma/
│   └── schema.prisma          # Modelos de base de datos
├── src/
│   ├── index.ts               # Punto de entrada del servidor
│   ├── app.ts                 # Configuración de Express y registro de rutas
│   ├── config/
│   │   └── prisma.ts          # Singleton de PrismaClient
│   ├── controllers/           # Orquestadores HTTP (req → service → res)
│   │   ├── clientes.controller.ts
│   │   ├── productos.controller.ts
│   │   ├── tasas.controller.ts
│   │   ├── ventas.controller.ts
│   │   └── reports.controller.ts
│   ├── services/              # Lógica de negocio pura
│   │   ├── clientes.services.ts
│   │   ├── productos.services.ts
│   │   ├── ventas.services.ts
│   │   ├── tasa_moneda.services.ts
│   │   ├── tasa_moneda.scheduler.ts
│   │   └── reports.services.ts
│   ├── routes/                # Definición de endpoints
│   │   ├── clientes.routes.ts
│   │   ├── product.routes.ts
│   │   ├── tasas.routes.ts
│   │   ├── ventas.routes.ts
│   │   └── reports.routes.ts
│   ├── schemas/               # Contratos de validación Zod
│   │   ├── clientes.schema.ts
│   │   ├── productos.schema.ts
│   │   └── ventas.schema.ts
│   ├── middleware/            # Preprocesadores de peticiones
│   │   ├── db_conex.ts
│   │   ├── procesamiento.ts
│   │   ├── validateZod.ts
│   │   └── global_errors.ts
│   ├── utils/                 # Herramientas transversales
│   │   ├── errors.ts
│   │   ├── nextError.ts
│   │   ├── cors.ts
│   │   ├── helmet.ts
│   │   ├── excel.utils.ts
│   │   └── pdf.utils.ts
│   └── types/
│       └── express.d.ts       # Extensión de tipos de Express
└── package.json
```

---

## 3. Ciclo de Vida de una Petición HTTP

```mermaid
sequenceDiagram
    participant C as Cliente HTTP
    participant H as Helmet
    participant CO as CORS
    participant J as JSON Parser
    participant P as Procesamiento
    participant DB as dbMiddleware
    participant V as validateZod
    participant CT as Controller
    participant S as Service
    participant PR as Prisma/PostgreSQL
    participant E as globalErrorHandler

    C->>H: Request HTTP
    H->>CO: Cabeceras de seguridad
    CO->>J: Validación de origen
    J->>P: Parseo del body JSON
    P->>DB: Inicia cronómetro + listener finish
    DB->>V: Inyecta req.prisma
    V->>CT: Valida body con Zod (si aplica)
    CT->>S: Invoca lógica de negocio
    S->>PR: Consultas y transacciones
    PR-->>S: Resultados
    S-->>CT: Datos procesados
    CT-->>C: res.json({ status, data })
    Note over CT,E: Si ocurre un error →
    CT->>E: enrichAndNext(err, next)
    E-->>C: res.json({ status: error, message })
```

### Detalle de cada capa:

1. **Helmet** → Inyecta cabeceras HTTP de seguridad (XSS, Sniffing, etc.).
2. **CORS** → Filtra orígenes permitidos desde `ALLOWED_ORIGINS` en `.env`.
3. **express.json()** → Parsea el cuerpo de la petición como JSON.
4. **procesamientoMiddleware** → Captura `req.startTime` y registra un listener `res.on('finish')` para loguear duración y status code al finalizar.
5. **dbMiddleware** → Inyecta la instancia singleton de Prisma en `req.prisma`.
6. **validateZod(schema)** → (Solo en rutas POST/PUT) Valida `req.body` contra el esquema Zod. Si falla, responde `400` inmediatamente.
7. **Controller** → Extrae parámetros, instancia el servicio con `req.prisma` y devuelve la respuesta formateada.
8. **Service** → Ejecuta la lógica de negocio, validaciones internas y transacciones de base de datos.
9. **enrichAndNext** → Captura errores, mapea códigos Prisma (`P2002`, `P2003`, `P2025`) y clases `AppError` a códigos HTTP automáticamente.
10. **globalErrorHandler** → Último middleware: responde con `{ status: 'error', message }` y el código HTTP apropiado.

---

## 4. Modelo de Base de Datos (Entidad-Relación)

```mermaid
erDiagram
    clientes {
        SERIAL id PK
        VARCHAR cedula UK
        VARCHAR nombre
        VARCHAR telefono
        VARCHAR status "DEFAULT 'activo'"
    }

    productos {
        SERIAL id PK
        VARCHAR nombre
        DECIMAL precio_usd
        INT stock
        VARCHAR categoria
        VARCHAR status "DEFAULT 'disponible'"
    }

    tasa_moneda {
        SERIAL id PK
        VARCHAR moneda "DEFAULT 'Bs'"
        DECIMAL tasa_usd
        DECIMAL tasa_euro
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    ventas {
        SERIAL id PK
        INT clientes_id FK
        INT productos_id FK
        INT tasa_moneda_id FK
        INT cantidad "DEFAULT 1"
        DECIMAL precio_unitario
        DECIMAL total "GENERATED (cantidad * precio_unitario)"
        VARCHAR status "DEFAULT 'no_pagada'"
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    ventas_idempotency {
        VARCHAR key PK
        INT venta_id
        VARCHAR status
        JSONB response
        TIMESTAMPTZ created_at
    }

    clientes ||--o{ ventas : "1:N RESTRICT"
    productos ||--o{ ventas : "1:N RESTRICT"
    tasa_moneda ||--o{ ventas : "1:N RESTRICT"
    ventas ||--o| ventas_idempotency : "1:1"
```

### Decisiones de diseño clave:
- **`ON DELETE RESTRICT`**: Impide eliminar clientes, productos o tasas que tengan ventas asociadas. Protege la integridad del historial financiero.
- **`total` GENERATED ALWAYS AS**: Columna calculada automáticamente por PostgreSQL. Prisma la lee pero no la escribe.
- **`tasa_moneda` como historial**: Cada sincronización de tasas crea un nuevo registro (INSERT), preservando el tipo de cambio exacto de cada venta.
- **Índices optimizados**: Trigram (`pg_trgm`) para búsquedas fuzzy de nombres, índices compuestos en ventas por `(status, created_at)` para reportes.

---

## 5. Módulos Funcionales — Flujo Detallado

---

### 5.1 Módulo de Clientes (`/api/clients`)

| Método | Ruta | Middleware | Controller | Descripción |
|---|---|---|---|---|
| `GET` | `/` | — | `getClientesAll` | Lista paginada con búsqueda por nombre/cédula |
| `GET` | `/:id` | — | `getClienteById` | Obtener cliente por ID |
| `POST` | `/` | `validateZod(clientesSchema)` | `createClient` | Crear cliente (cédula única) |
| `PUT` | `/:id` | `validateZod(updateClientesSchema)` | `updateClient` | Actualizar campos del cliente |
| `DELETE` | `/:id` | — | `deleteClient` | Eliminar (falla si tiene ventas) |

**Flujo de creación**:
1. `validateZod` valida el body (cédula obligatoria 7-9 chars, nombre 3-50 chars).
2. El servicio verifica unicidad de cédula con `findUnique`.
3. Si hay conflicto → `ConflictError (409)`.
4. Si pasa → `prisma.clientes.create()` → respuesta `201`.

**Flujo de eliminación**:
1. Verifica existencia del cliente.
2. `prisma.clientes.delete()` ejecuta. Si hay ventas asociadas, PostgreSQL lanza `P2003` → `enrichAndNext` lo convierte en `409 Restrict`.

---

### 5.2 Módulo de Productos (`/api/product`)

| Método | Ruta | Middleware | Controller | Descripción |
|---|---|---|---|---|
| `GET` | `/` | — | `getProductsAll` | Lista paginada, búsqueda por nombre/categoría |
| `GET` | `/:id` | — | `getProductById` | Obtener producto por ID |
| `POST` | `/` | `validateZod(createProductSchema)` | `createProduct` | Crear producto (nombre único case-insensitive) |
| `PUT` | `/:id` | `validateZod(updateProductSchema)` | `updateProduct` | Actualizar producto |
| `DELETE` | `/:id` | — | `deleteProduct` | Eliminar (falla si tiene ventas) |

**Validación especial**: Los campos `precio_usd` y `stock` usan `z.preprocess()` para convertir strings a números automáticamente (útil para formularios HTML).

**Normalización**: El nombre del producto se normaliza con `.trim()` y se verifica unicidad case-insensitive con `mode: "insensitive"`.

---

### 5.3 Módulo de Ventas (`/api/ventas`) — Módulo Crítico

| Método | Ruta | Middleware | Controller | Descripción |
|---|---|---|---|---|
| `GET` | `/` | — | `getAllVentas` | Lista paginada, búsqueda por nombre/cédula del cliente |
| `GET` | `/:id` | — | `getVentaById` | Obtener venta por ID |
| `POST` | `/` | `validateZod(createVentaSchema)` | `createVenta` | Crear venta con idempotencia y lock |
| `DELETE` | `/:id` | — | `deleteVenta` | Eliminar venta y **restaurar stock** |
| `DELETE` | `/:id/no-restore` | — | `deleteVentaNoRestore` | Eliminar venta **sin restaurar stock** |

#### Flujo de Creación de Venta (Diagrama):

```mermaid
flowchart TD
    A["POST /api/ventas"] --> B{"¿Tiene Idempotency-Key?"}
    B -- No --> ERR1["400: Key requerido"]
    B -- Sí --> C["Abrir $transaction"]
    C --> D{"¿Key ya existe en ventas_idempotency?"}
    D -- Sí --> E["Retornar venta cacheada (fromCache: true)"]
    D -- No --> F["SELECT ... FOR UPDATE en productos"]
    F --> G{"¿Producto existe?"}
    G -- No --> ERR2["404: Producto no encontrado"]
    G -- Sí --> H{"¿Stock >= cantidad?"}
    H -- No --> ERR3["409: Stock insuficiente"]
    H -- Sí --> I["INSERT en ventas"]
    I --> J["UPDATE stock = stock - cantidad"]
    J --> K["INSERT en ventas_idempotency"]
    K --> L["COMMIT transacción"]
    L --> M["201: Venta creada"]

    style ERR1 fill:#ef4444,color:#fff
    style ERR2 fill:#ef4444,color:#fff
    style ERR3 fill:#f59e0b,color:#fff
    style E fill:#3b82f6,color:#fff
    style M fill:#22c55e,color:#fff
```

**Mecanismos de protección**:
- **Idempotencia**: Si el frontend reenvía la misma petición (por timeout, doble clic, etc.), la key evita duplicar la venta.
- **Bloqueo pesimista (`FOR UPDATE`)**: Congela la fila del producto en la transacción para que otra petición concurrente no pueda leer un stock desactualizado.
- **Restauración de stock en DELETE**: Al eliminar una venta, el stock del producto se incrementa automáticamente dentro de la misma transacción.

---

### 5.4 Módulo de Tasas de Cambio (`/api/tasas`)

| Método | Ruta | Controller | Descripción |
|---|---|---|---|
| `GET` | `/latest` | `getLatestTasa` | Obtener la tasa más reciente (USD y EUR) |
| `POST` | `/refresh` | `refreshTasas` | Forzar sincronización manual desde DolarApi |

#### Flujo de sincronización automática:

```mermaid
flowchart LR
    A["index.ts: startTasaScheduler()"] --> B["node-cron: TASA_CRON='0 * * * *'"]
    B --> C["fetchAndSaveTasasFromDolarApi()"]
    C --> D["GET dolarapi.com/v1/dolares"]
    C --> E["GET dolarapi.com/v1/euros"]
    D --> F{"¿Éxito?"}
    E --> G{"¿Éxito?"}
    F -- No --> H["Usar última tasa_usd de BD"]
    G -- No --> I["Usar última tasa_euro de BD"]
    F -- Sí --> J["tasa_usd = oficial ?? paralelo"]
    G -- Sí --> K["tasa_euro = oficial ?? paralelo"]
    J --> L["prisma.tasa_moneda.CREATE (historial)"]
    K --> L
    H --> L
    I --> L
```

**Modelo histórico**: Cada ejecución del scheduler crea un nuevo registro en `tasa_moneda`. Las ventas antiguas mantienen su referencia (`tasa_moneda_id`) apuntando a la tasa vigente en el momento de la compra.

---

### 5.5 Módulo de Reportes (`/api/reports`)

| Método | Ruta | Controller | Descripción |
|---|---|---|---|
| `GET` | `/sales/excel` | `exportSalesExcel` | Reporte de ventas en Excel |
| `GET` | `/sales/pdf` | `exportSalesPdf` | Reporte de ventas en PDF |
| `GET` | `/inventory/excel` | `exportInventoryExcel` | Inventario valorizado en Excel |
| `GET` | `/inventory/pdf` | `exportInventoryPdf` | Inventario valorizado en PDF |
| `GET` | `/debts/excel` | `exportDebtsExcel` | Cuentas por cobrar en Excel |
| `GET` | `/debts/pdf` | `exportDebtsPdf` | Cuentas por cobrar en PDF |

**Parámetros de filtro** (solo para ventas): `?startDate=2026-01-01&endDate=2026-06-30`

#### Datos incluidos por reporte:

| Reporte | Columnas principales | Cálculos |
|---|---|---|
| **Ventas** | Fecha, Cliente, Cédula, Producto, Categoría, Cantidad, Precio USD, Total USD, Tasa Bs, Total Bs, Estado | Total USD = cantidad × precio; Total Bs = Total USD × tasa histórica |
| **Inventario** | ID, Producto, Categoría, Precio USD, Stock, Valor Total USD, Valor Equiv. Bs, Estado | Valor = stock × precio; Bs = valor × última tasa |
| **Deudas** | Cédula, Cliente, Teléfono, Compras Pendientes, Deuda USD, Deuda Bs | Agrupa ventas `no_pagada` por cliente |

**Generación**: Los archivos se transmiten como stream binario directo al navegador con cabeceras `Content-Disposition: attachment`, sin almacenarse en disco.

---

## 6. Sistema Centralizado de Errores

```mermaid
classDiagram
    class AppError {
        +string message
        +number status
        +any details
    }
    class ValidationError {
        +status = 400
    }
    class NotFoundError {
        +status = 404
    }
    class ConflictError {
        +status = 409
    }
    class UnauthorizedError {
        +status = 401
    }
    class ForbiddenError {
        +status = 403
    }

    AppError <|-- ValidationError
    AppError <|-- NotFoundError
    AppError <|-- ConflictError
    AppError <|-- UnauthorizedError
    AppError <|-- ForbiddenError
```

Además, `enrichAndNext` intercepta errores nativos de Prisma:

| Código Prisma | HTTP | Significado |
|---|---|---|
| `P2002` | `409` | Violación de UNIQUE (cédula duplicada, nombre duplicado) |
| `P2003` | `409` | Violación de RESTRICT (eliminar cliente/producto con ventas) |
| `P2025` | `404` | Registro no encontrado |

---

## 7. Configuración y Variables de Entorno

| Variable | Ejemplo | Uso |
|---|---|---|
| `DATABASE_URL` | `postgresql://user:pass@localhost:5432/db_single_sales` | Conexión PostgreSQL |
| `PORT` | `4000` | Puerto del servidor |
| `ALLOWED_ORIGINS` | `http://localhost:3000, http://localhost:5173` | Orígenes CORS permitidos |
| `NODE_ENV` | `development` | Modo (activa logs de Prisma en dev) |
| `JWT_SECRET` | `single_sale_secret_key` | Secreto para JWT (preparado) |
| `JWT_EXPIRES_IN` | `1d` | Expiración de tokens (preparado) |
| `TASA_CRON` | `0 * * * *` | Expresión cron para sincronizar tasas |

---

## 8. Scripts de NPM

| Script | Comando | Descripción |
|---|---|---|
| `dev` | `ts-node-dev --respawn src/index.ts` | Desarrollo con hot-reload |
| `build` | `prisma:generate && tsc -p .` | Compilación de producción |
| `start` | `node dist/index.js` | Ejecutar build compilado |
| `prisma:generate` | `prisma generate` | Generar Prisma Client |
| `prisma:pull` | `prisma db pull` | Introspección de la BD |
| `prisma:migrate` | `prisma migrate dev` | Crear migraciones |

---

## 9. Arranque del Servidor

```mermaid
flowchart TD
    A["node dist/index.js"] --> B["prisma.$connect()"]
    B --> C{"¿Conexión exitosa?"}
    C -- No --> D["console.error → process.exit(1)"]
    C -- Sí --> E["SELECT NOW() (test query)"]
    E --> F["app.listen(PORT)"]
    F --> G["startTasaScheduler()"]
    G --> H["Sincronización inmediata de tasas"]
    G --> I["Cron: sincronización periódica"]

    style D fill:#ef4444,color:#fff
    style F fill:#22c55e,color:#fff
```

1. `index.ts` conecta a PostgreSQL vía Prisma.
2. Ejecuta una query de prueba `SELECT NOW()` para verificar la conectividad.
3. Inicia Express en el puerto configurado.
4. Lanza el scheduler de tasas que sincroniza inmediatamente y luego periódicamente.

---

## 10. Resumen de Endpoints (API Reference)

| Módulo | Base | Endpoints | Formatos |
|---|---|---|---|
| Clientes | `/api/clients` | GET `/`, GET `/:id`, POST `/`, PUT `/:id`, DELETE `/:id` | JSON |
| Productos | `/api/product` | GET `/`, GET `/:id`, POST `/`, PUT `/:id`, DELETE `/:id` | JSON |
| Ventas | `/api/ventas` | GET `/`, GET `/:id`, POST `/`, DELETE `/:id`, DELETE `/:id/no-restore` | JSON |
| Tasas | `/api/tasas` | GET `/latest`, POST `/refresh` | JSON |
| Reportes | `/api/reports` | GET `/sales/excel\|pdf`, GET `/inventory/excel\|pdf`, GET `/debts/excel\|pdf` | XLSX, PDF |
| Health | `/` | GET `/` | JSON |
