# Arquitectura — SalonPro Platform

## Visión General

SalonPro es un monolito modular que se despliega como una única aplicación .NET, con dos frontends Angular independientes (Admin y Salón). La comunicación entre módulos es interna (interfaces + MediatR), no HTTP. Esto permite trabajo en paralelo por módulos y futura extracción a microservicios sin reescritura.

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTES                                 │
│                                                                 │
│   admin.salonpro.com.co          {slug}.salonpro.com.co         │
│   ┌─────────────────────┐       ┌─────────────────────┐        │
│   │   Angular Admin App │       │   Angular Salon App │        │
│   │   (Puerto 4200)     │       │   (Puerto 4300)     │        │
│   └────────┬────────────┘       └────────┬────────────┘        │
│            │                              │                     │
└────────────┼──────────────────────────────┼─────────────────────┘
             │          HTTPS               │
             ▼                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SalonPro.Gateway                              │
│                                                                 │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐     │
│   │ Tenant       │  │ JWT Auth     │  │ Rate Limiting    │     │
│   │ Resolution   │  │ Middleware   │  │ Middleware       │     │
│   └──────────────┘  └──────────────┘  └──────────────────┘     │
│                                                                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SalonPro.Host                               │
│                  (ASP.NET Core App)                              │
│                                                                 │
│   ┌─────────────┐ ┌──────────────┐ ┌─────────────────────┐     │
│   │  Tenants    │ │  Identity    │ │  Operations         │     │
│   │  Module     │ │  Module      │ │  Module             │     │
│   │             │ │              │ │                     │     │
│   │ - Salones   │ │ - Usuarios   │ │ - POS / Ventas     │     │
│   │ - Sedes     │ │ - Roles      │ │ - Servicios        │     │
│   │ - Planes    │ │ - Permisos   │ │ - Inventario       │     │
│   │ - Suscrip.  │ │ - JWT/Auth   │ │ - Clientes         │     │
│   └─────────────┘ └──────────────┘ │ - Caja             │     │
│                                     └─────────────────────┘     │
│   ┌─────────────┐ ┌──────────────┐                              │
│   │ Settlements │ │  Reporting   │    ┌──────────────────┐     │
│   │ Module      │ │  Module      │    │  Shared          │     │
│   │             │ │              │    │                  │     │
│   │ - Liquidac. │ │ - Dashboards │    │ - DTOs           │     │
│   │ - Anticipos │ │ - Reportes   │    │ - Interfaces     │     │
│   │ - Comision. │ │ - Exports    │    │ - Eventos        │     │
│   └─────────────┘ └──────────────┘    │ - Excepciones    │     │
│                                        └──────────────────┘     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SQL Server                                 │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                    SalonProDb                            │   │
│   │                                                         │   │
│   │  Tablas Plataforma (sin TenantId):                      │   │
│   │  Tenants, Subscriptions, Plans, PlatformUsers            │   │
│   │                                                         │   │
│   │  Tablas Negocio (con TenantId):                         │   │
│   │  Branches, Users, Services, Products, Sales,             │   │
│   │  SaleDetails, CashRegisters, Settlements,                │   │
│   │  Advances, Clients, AuditLogs                            │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Clean Architecture por Módulo

Cada módulo sigue el patrón de capas concéntricas:

```
┌──────────────────────────────────────────────────┐
│                    Api Layer                      │
│  Controllers, Filters, Request/Response models    │
│                                                   │
│  ┌────────────────────────────────────────────┐   │
│  │           Application Layer                │   │
│  │  Commands, Queries, Handlers (MediatR)     │   │
│  │  DTOs, Validators (FluentValidation)       │   │
│  │  Interfaces de servicios                   │   │
│  │                                            │   │
│  │  ┌────────────────────────────────────┐    │   │
│  │  │          Domain Layer              │    │   │
│  │  │  Entities, Value Objects           │    │   │
│  │  │  Enums, Domain Events              │    │   │
│  │  │  Repository Interfaces             │    │   │
│  │  │  Business Rules                    │    │   │
│  │  └────────────────────────────────────┘    │   │
│  └────────────────────────────────────────────┘   │
│                                                   │
│  ┌────────────────────────────────────────────┐   │
│  │         Infrastructure Layer               │   │
│  │  EF Core DbContext, Repositories           │   │
│  │  Configuraciones de entidades (Fluent API) │   │
│  │  Servicios externos, Email, etc.           │   │
│  └────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────┘
```

**Regla de dependencia:** Domain no depende de nada. Application depende solo de Domain. Infrastructure implementa interfaces de Domain/Application. Api depende de Application.

## Multi-Tenant: Flujo de Resolución

```
Request: GET https://estudio54.salonpro.com.co/api/sales

1. Request llega al Gateway
2. TenantResolutionMiddleware:
   - Extrae "estudio54" del Host header
   - Busca en caché/DB: SELECT * FROM Tenants WHERE Slug = 'estudio54'
   - Valida estado del tenant (activo, no suspendido)
   - Inyecta TenantId en HttpContext.Items["TenantId"]
3. Auth Middleware:
   - Valida JWT token
   - Verifica que el usuario pertenezca a este tenant
4. Controller recibe la request
5. EF Core Global Query Filter:
   - Todas las queries agregan automáticamente WHERE TenantId = @tenantId
   - El desarrollador NO necesita filtrar manualmente
```

## Comunicación entre Módulos

```
Módulo A necesita datos del Módulo B:

  SalonPro.Operations                    SalonPro.Shared
  ┌──────────────────┐                  ┌────────────────────────┐
  │  SaleHandler     │───usa───────────▶│  IStylistService       │
  │                  │                  │  (interfaz compartida) │
  └──────────────────┘                  └───────────┬────────────┘
                                                    │
                                                    │ implementa
                                                    ▼
                                        SalonPro.Identity
                                        ┌────────────────────────┐
                                        │  StylistService        │
                                        │  (implementación real) │
                                        └────────────────────────┘

Registrado en DI en Program.cs del Host.
```

**Para el futuro (microservicios):** Se reemplaza la implementación directa por un HttpClient o gRPC client que llama al servicio externo, sin cambiar la interfaz.

## Seguridad

- JWT con claims: UserId, TenantId, BranchId, Role
- Roles: PlatformAdmin, TenantOwner, Cashier, Stylist
- Permisos granulares por funcionalidad (basado en claims)
- Refresh tokens con rotación
- Passwords hasheados con BCrypt o ASP.NET Identity
- HTTPS obligatorio
- CORS configurado por ambiente
- Rate limiting por tenant

## Entornos

| Entorno | Backend | Frontend Admin | Frontend Salon | DB |
|---------|---------|---------------|----------------|-----|
| Desarrollo | localhost:5001 | localhost:4200 | localhost:4300 | SQL Server Express local |
| Producción | Azure App Service | Azure Static Web Apps | Azure Static Web Apps | Azure SQL Database |

## Ruta de Escalamiento Futura

Cuando el volumen lo justifique:

1. **Primer servicio a extraer:** Operations (POS es el más transaccional)
2. **Segundo:** Billing (facturación electrónica DIAN, procesamiento pesado de XML)
3. **Comunicación:** Event Bus (Azure Service Bus) para eventos entre servicios
4. **Cache:** Redis para tenant resolution y sesiones
5. **Base de datos:** Sharding por tenant si algún salón crece mucho
