# SalonPro — Plataforma SaaS de Gestión para Peluquerías

Sistema integral de gestión para peluquerías y salones de belleza. Plataforma multi-tenant que permite a múltiples salones operar de forma independiente, cada uno con una o varias sedes.

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Backend | .NET 8, ASP.NET Core Web API, C# |
| Frontend | Angular 18+, TypeScript, SCSS |
| Base de datos | SQL Server 2022 |
| ORM | Entity Framework Core 8 |
| Autenticación | JWT + Refresh Tokens |

## Requisitos de Desarrollo

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 20 LTS](https://nodejs.org/)
- [Angular CLI](https://angular.io/cli) (`npm install -g @angular/cli`)
- [SQL Server 2022 Express](https://www.microsoft.com/en-us/sql-server/sql-server-downloads)
- [Git](https://git-scm.com/)
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) (`npm install -g @anthropic-ai/claude-code`)
- Visual Studio 2022 o VS Code

## Configuración Inicial

### 1. Clonar el repositorio

```bash
git clone https://github.com/{usuario}/salonpro.git
cd salonpro
```

### 2. Configurar la base de datos

Crear una base de datos `SalonProDb` en SQL Server Express local. Actualizar la cadena de conexión en `src/SalonPro.Host/appsettings.Development.json` si es necesario.

### 3. Ejecutar migraciones

```bash
dotnet ef database update --startup-project src/SalonPro.Host
```

### 4. Ejecutar el backend

```bash
dotnet run --project src/SalonPro.Host/SalonPro.Host.csproj
```

El API estará disponible en `https://localhost:5001`.

### 5. Ejecutar el frontend (Admin)

```bash
cd frontend/admin-app
npm install
ng serve --port 4200
```

Acceder a `http://localhost:4200`.

### 6. Ejecutar el frontend (Salón)

```bash
cd frontend/salon-app
npm install
ng serve --port 4300
```

Acceder a `http://localhost:4300`.

## Estructura del Proyecto

```
salonpro/
├── src/
│   ├── SalonPro.Host/              → Punto de arranque
│   ├── SalonPro.Gateway/           → Middleware (tenant, auth)
│   ├── SalonPro.Shared/            → Código compartido
│   └── Modules/
│       ├── SalonPro.Tenants/       → Admin: salones, sedes, suscripciones
│       ├── SalonPro.Identity/      → Auth, usuarios, roles
│       ├── SalonPro.Operations/    → POS, ventas, inventario, caja
│       ├── SalonPro.Settlements/   → Liquidaciones, anticipos
│       └── SalonPro.Reporting/     → Reportes y dashboards
├── frontend/
│   ├── admin-app/                  → Angular: panel de administración
│   └── salon-app/                  → Angular: app del salón
├── database/
│   └── migrations/
├── tests/
├── docs/
└── infra/
```

## Ramas

| Rama | Propósito |
|------|-----------|
| `main` | Producción estable |
| `develop` | Integración |
| `feature/admin-panel` | Centro de administración |
| `feature/salon-operations` | App del salón |

## Documentación

- [Arquitectura](docs/ARCHITECTURE.md)
- [Reglas de Negocio](docs/BUSINESS-RULES.md)
- [Esquema de Base de Datos](docs/DATABASE-SCHEMA.md)
- [Contratos de API](docs/API-CONTRACTS.md)
