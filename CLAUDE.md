# CLAUDE.md — SalonPro Platform

## Qué es este proyecto

SalonPro es una plataforma SaaS multi-tenant de gestión integral para peluquerías y salones de belleza. Permite que múltiples salones (clientes) operen de forma independiente, cada uno con una o varias sedes, bajo un mismo sistema centralizado.

El proyecto tiene dos grandes aplicaciones:
1. **Admin Panel** (`admin.salonpro.com.co`) — Centro de administración de la plataforma. Solo accesible por el equipo de SalonPro. Permite crear salones/clientes, gestionar suscripciones, configurar sedes, y monitorear toda la plataforma.
2. **Salon App** (`{slug}.salonpro.com.co`) — Aplicación que usan los clientes (dueños de salón, cajeros, peluqueros). Incluye POS, inventario, liquidaciones, reportes, caja, etc.

## Stack Tecnológico

- **Backend:** .NET 8, C#, ASP.NET Core Web API
- **Frontend:** Angular 18+, TypeScript, SCSS
- **Base de datos:** SQL Server 2022 (Express en desarrollo, Azure SQL en producción)
- **ORM:** Entity Framework Core 8
- **Autenticación:** JWT + Refresh Tokens
- **Arquitectura backend:** Modular Monolith (Clean Architecture por módulo)
- **Patrón:** CQRS con MediatR (Commands y Queries separados)
- **Validación:** FluentValidation
- **Mapping:** AutoMapper o Mapster
- **Testing:** xUnit + Moq + FluentAssertions
- **Infraestructura producción:** Azure (App Service Linux, Azure SQL Database)

## Arquitectura del Backend

El backend es un **monolito modular**. Un solo ejecutable (SalonPro.Host) que registra todos los módulos. Internamente, cada módulo es independiente con su propia carpeta de Domain, Application, Infrastructure y Api.

```
src/
├── SalonPro.Host/              → Proyecto de arranque (Program.cs, registra módulos)
├── SalonPro.Gateway/           → Middleware: tenant resolution, auth, rate limiting
├── SalonPro.Shared/            → DTOs compartidos, interfaces, eventos, excepciones base
│
└── Modules/
    ├── SalonPro.Tenants/       → Gestión de salones, sedes, suscripciones (Admin)
    ├── SalonPro.Identity/      → Usuarios, roles, permisos, autenticación
    ├── SalonPro.Operations/    → POS, servicios, ventas, inventario, clientes
    ├── SalonPro.Settlements/   → Liquidaciones, anticipos, comisiones
    └── SalonPro.Reporting/     → Reportes, dashboards, exportaciones
```

Cada módulo sigue Clean Architecture:
```
SalonPro.{Modulo}/
├── Domain/           → Entidades, Value Objects, Enums, interfaces de repositorio
├── Application/      → Casos de uso (Commands/Queries con MediatR), DTOs, validaciones
├── Infrastructure/   → Implementaciones de repos (EF Core), servicios externos
└── Api/              → Controllers, filtros, middleware específico del módulo
```

**Regla:** Los módulos se comunican entre sí SOLO a través de interfaces definidas en SalonPro.Shared. Nunca referencia directa entre módulos.

## Multi-Tenant

- Estrategia: **Base de datos compartida con TenantId** como discriminador en todas las tablas de negocio.
- Las tablas de la plataforma (Tenants, Subscriptions, Plans) NO tienen TenantId.
- Resolución: Middleware en el Gateway extrae el slug del subdominio, busca el tenant, inyecta TenantId en el HttpContext.
- EF Core aplica **Global Query Filters** automáticos por TenantId.
- El Admin Panel accede sin filtro de tenant (ve todo).

## Reglas de Negocio Críticas

### Motor de Cálculo de Ventas

Cada venta pasa por este flujo de cálculo exacto:

**PASO 1 — Totales brutos:**
- Total servicios = Σ precios de servicios prestados
- Total productos vendidos = Σ precios de venta de productos a cliente
- Total propina = monto de propina registrado
- Total consumo interno = Σ precios de COMPRA de productos usados por el peluquero

**PASO 2 — Deducciones por método de pago:**
- Cada método de pago tiene un % de deducción parametrizable (ej: Tarjeta crédito = 7%)
- Se aplica sobre: servicios, productos vendidos, y propina
- NO se aplica sobre consumo interno (no es un ingreso)
- Fórmula: deducción_servicios = total_servicios × %_deducción
- Fórmula: deducción_productos = total_productos × %_deducción
- Fórmula: deducción_propina = total_propina × %_deducción

**PASO 3 — Bases netas:**
- Base servicios = total_servicios − deducción_servicios
- Base productos = total_productos − deducción_productos
- Propina neta = total_propina − deducción_propina

**PASO 4 — Comisiones:**
- Comisión peluquero servicios = base_servicios × %_peluquero (parametrizable por peluquero)
- Comisión salón servicios = base_servicios × %_salón
- Comisión peluquero productos = base_productos × 10% (fijo)
- Comisión salón productos = base_productos × 90%
- Propina neta = 100% del peluquero (el salón NO toca la propina)

**PASO 5 — Consumo interno:**
- Se descuenta a PRECIO DE COMPRA del producto
- Se resta de la comisión del peluquero en la liquidación (no en la venta individual)

**PASO 6 — Neto de la venta:**
- Neto peluquero = comisión_servicios + comisión_productos + propina_neta
- Neto salón = comisión_salón_servicios + comisión_salón_productos
- Nota: el consumo interno se acumula y se descuenta en la liquidación, no venta por venta

### Datos Obligatorios por Venta
- Cédula o NIT del cliente
- Nombre completo del cliente
- Correo electrónico del cliente
- Teléfono del cliente
- Fecha y hora de la venta
- Peluquero/colaborador asignado
- Servicio(s) prestado(s) con precio unitario
- Producto(s) vendido(s) con precio de venta (opcional)
- Producto(s) consumo interno con precio de compra (opcional)
- Propina (opcional, default 0)
- Método de pago
- Todos los valores calculados (bruto, deducciones, bases, comisiones, netos)

### Anticipos
- Se registran en un módulo dedicado dentro de Settlements
- Cada anticipo: fecha, monto, peluquero, método de pago, quién autorizó, observaciones
- Los anticipos NO se pueden eliminar, solo anular (con motivo)
- Se acumulan y se restan automáticamente en la liquidación
- Saldo de anticipos visible en tiempo real por peluquero

### Liquidaciones
- Rango de fechas: diario, semanal, quincenal, mensual o personalizado
- Detalle exhaustivo por venta: fecha, cliente, servicios, valores, deducciones, comisiones
- Secciones: comisión servicios, comisión productos (10%), propinas netas, consumo interno (descuento), anticipos entregados (descuento), neto final
- Estados: Borrador → Aprobada → Pagada (con fecha y responsable de cada cambio)
- Inmutables una vez pagadas

### Caja
- Obligatoria: NO se puede registrar ventas sin caja abierta
- Se DEBE abrir cada día y cerrar al final
- Registros de caja INMUTABLES (no se pueden eliminar ni editar)
- Cierre genera registro permanente: base inicial, total ventas por método de pago, total deducciones, efectivo esperado vs declarado, diferencia, responsable

### Métodos de Pago
- Parametrizables por tenant
- Campos: nombre, aplica deducción (bool), porcentaje deducción, estado (activo/inactivo)
- La deducción SIEMPRE se aplica antes de calcular comisiones
- Ejemplos: Efectivo (0%), Tarjeta crédito (7%), Nequi (0%), Daviplata (0%), Transferencia (0%)

### Productos e Inventario
- Dos naturalezas: venta a cliente externo (con margen) y consumo interno (a precio de compra)
- Campos: nombre, marca, categoría, precio compra, precio venta, stock actual, stock mínimo
- Al vender al cliente: se usa precio de venta, peluquero gana 10% sobre base (después de deducción)
- Al usar internamente: se descuenta a precio de compra en la liquidación del peluquero
- Historial de movimientos (entradas por compra, salidas por venta/consumo)

## Convenciones de Código

### C# / .NET
- Usar nullable reference types habilitado
- Nomenclatura PascalCase para clases, métodos, propiedades
- Nomenclatura camelCase para variables locales y parámetros
- Prefijo I para interfaces (IRepository, IService)
- Sufijos: Controller, Service, Repository, Handler, Validator, Dto
- Async/await en todo acceso a datos. Sufijo Async en métodos
- Inyección de dependencias siempre por constructor
- No usar static para servicios
- Responses de API envueltos en ApiResponse<T> con estructura consistente

### Angular / TypeScript
- Standalone components (no NgModules)
- Signals para estado reactivo
- Lazy loading por módulo/ruta
- SCSS para estilos
- Nomenclatura: kebab-case para archivos, PascalCase para clases/componentes
- Servicios con sufijo Service, inyectados con inject()
- HttpClient con tipado fuerte (interfaces para responses)

### Base de datos
- Nombres de tablas en PascalCase plural (Tenants, Sales, SaleDetails)
- PKs: Id (int, identity) o GUID según contexto
- FKs: {Entidad}Id (ej: TenantId, StylistId)
- Siempre incluir: CreatedAt (datetime2), UpdatedAt (datetime2), CreatedBy (string)
- Soft delete con IsDeleted (bit) + DeletedAt (datetime2) donde aplique
- Índices en todas las FKs y campos de búsqueda frecuente

### Git
- Mensajes de commit: conventional commits (feat:, fix:, chore:, refactor:, docs:)
- Ramas: feature/*, bugfix/*, hotfix/*
- PRs siempre hacia develop, nunca directo a main
- main = producción estable, develop = integración

## Estructura de Ramas Activas

- `main` → Producción
- `develop` → Integración
- `feature/admin-panel` → Centro de administración (Diego)
- `feature/salon-operations` → App del salón (Ingeniero 2)

## Variables de Entorno (Desarrollo)

```
ConnectionStrings__DefaultConnection=Server=localhost;Database=SalonProDb;Trusted_Connection=true;TrustServerCertificate=true
Jwt__Secret=SalonPro-Dev-Secret-Key-2026-MinLength32Chars!
Jwt__Issuer=SalonPro
Jwt__Audience=SalonProApp
Jwt__ExpirationMinutes=60
```

## Comandos Frecuentes

```bash
# Backend
dotnet build src/SalonPro.Host/SalonPro.Host.csproj
dotnet run --project src/SalonPro.Host/SalonPro.Host.csproj
dotnet test

# Migraciones EF Core
dotnet ef migrations add NombreMigracion --project src/Modules/SalonPro.{Modulo}/SalonPro.{Modulo}.Infrastructure --startup-project src/SalonPro.Host
dotnet ef database update --startup-project src/SalonPro.Host

# Frontend Admin
cd frontend/admin-app && ng serve --port 4200

# Frontend Salon
cd frontend/salon-app && ng serve --port 4300
```
