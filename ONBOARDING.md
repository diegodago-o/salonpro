# SalonPro — Guía para desarrolladores

## Stack

| Capa | Tecnología |
|---|---|
| API | ASP.NET Core 8 · Modular Monolith · MediatR · EF Core 8 |
| BD | Azure SQL (producción) · SQL Server local (dev) |
| Frontend POS | Angular 18 · Signals · Standalone components |
| Frontend Admin | Angular 18 (carpeta `admin-app`) |
| CI/CD | GitHub Actions → SSH → VM Linux (nginx + systemd) |

---

## 1. Prerrequisitos locales

| Herramienta | Versión |
|---|---|
| .NET SDK | 8.x |
| Node.js | 20.x |
| SQL Server o SQL Server Express | cualquier versión reciente |
| Git | cualquier versión reciente |
| IDE recomendado | Visual Studio 2022 / Rider / VS Code |

---

## 2. Clonar el repositorio

```bash
git clone https://github.com/diegodago-o/salonpro.git
cd salonpro
```

---

## 3. Backend (API)

### 3.1 Configurar cadena de conexión local

Edita **`src/SalonPro.Host/appsettings.json`** y apunta `DefaultConnection` a tu instancia de SQL Server:

```json
"ConnectionStrings": {
  "DefaultConnection": "Server=TU_SERVIDOR\\SQLEXPRESS;Database=SalonProDb;Trusted_Connection=true;TrustServerCertificate=true"
}
```

> La base de datos se crea sola al primer arranque. Las migraciones se aplican automáticamente con `MigrateAsync()` en `Program.cs` — **no hay que correr `dotnet ef` manualmente nunca**.

### 3.2 Levantar la API

```bash
cd src
dotnet run --project SalonPro.Host/SalonPro.Host.csproj
```

La API queda en `http://localhost:5000`.

---

## 4. Frontend POS (salon-app)

```bash
cd frontend/salon-app
npm install
npx ng serve          # queda en http://localhost:4200
```

En modo desarrollo (`environment.ts`) el frontend usa **datos mock** — no necesita la API corriendo para trabajar con la UI.

Cuando `environment.production = true` (build de producción), apunta a `https://api.hubfusioncore.com.co/api/v1`.

---

## 5. Frontend Admin (admin-app)

```bash
cd frontend/admin-app
npm install
npx ng serve --port 4300   # queda en http://localhost:4300
```

---

## 6. Cómo se despliega (GitHub Actions)

**El despliegue es automático al hacer push a `main`.** No hay que hacer nada manual.

Hay tres workflows independientes — cada uno solo se dispara si cambiaron sus archivos:

| Workflow | Se activa cuando cambia | Despliega en |
|---|---|---|
| `deploy-api.yml` | `src/**` | `/var/www/salonpro-api` vía systemd |
| `deploy-salon-app.yml` | `frontend/salon-app/**` | `/var/www/salon-app` vía nginx |
| `deploy-admin-app.yml` | `frontend/admin-app/**` | `/var/www/admin-app` vía nginx |

### Flujo de trabajo diario

```
1. git pull                      # sincronizar con main
2. (hacer cambios)
3. Compilar local para verificar:
   - Backend:  dotnet build SalonPro.sln
   - Frontend: npx ng build --configuration development
4. git add <archivos>
5. git commit -m "descripción"
6. git push                      # ← esto dispara los Actions automáticamente
7. Ir a GitHub → Actions y verificar que pasen los jobs
```

> **Nunca hacer push sin compilar primero.** Si el build local falla, el Action también fallará.

---

## 7. Secrets de GitHub (ya configurados — no tocar)

Los workflows usan tres secrets del repositorio:

| Secret | Qué es |
|---|---|
| `VM_HOST` | IP o dominio de la VM de producción |
| `VM_USER` | Usuario SSH de la VM |
| `VM_SSH_KEY` | Clave privada SSH para conectarse |

Estos ya están configurados en **GitHub → Settings → Secrets and variables → Actions**. El nuevo desarrollador no necesita acceso directo a la VM.

---

## 8. Arquitectura del código

```
salonpro/
├── src/
│   ├── SalonPro.Host/              ← Entry point (Program.cs, appsettings)
│   ├── SalonPro.Gateway/           ← Middlewares, filtros globales
│   ├── SalonPro.Shared/            ← Excepciones comunes (NotFoundException, etc.)
│   └── Modules/
│       ├── SalonPro.SalonOperations/   ← Ventas, productos, servicios, caja
│       │   ├── Domain/Entities/        ← Entidades de dominio (lógica de negocio)
│       │   ├── Application/
│       │   │   ├── Commands/           ← Escrituras (MediatR IRequest)
│       │   │   ├── Queries/            ← Lecturas (MediatR IRequest)
│       │   │   └── DTOs/               ← Objetos de respuesta
│       │   └── Infrastructure/
│       │       ├── Data/               ← SalonOpsDbContext, configuraciones EF
│       │       └── Migrations/         ← Migraciones EF (auto-aplicadas al arrancar)
│       ├── SalonPro.Identity/          ← Autenticación JWT, usuarios, roles
│       └── SalonPro.Tenants/           ← Multi-tenant: salones y sedes
└── frontend/
    ├── salon-app/                  ← App POS para el punto de venta
    │   └── src/app/
    │       ├── core/
    │       │   ├── models/         ← Interfaces TypeScript
    │       │   ├── services/       ← Servicios HTTP + mocks para dev
    │       │   └── utils/          ← sale-calculator.ts (motor de cálculo)
    │       └── features/           ← Un componente por módulo (ventas, historial…)
    └── admin-app/                  ← App de administración del salón
```

---

## 9. Convenciones importantes

### Backend
- **Toda la lógica de negocio va en el dominio** (`Domain/Entities/`). Los handlers de MediatR solo orquestan.
- **Nunca correr migraciones manualmente.** Solo crear el archivo `.cs` de migración y el sistema las aplica al arrancar.
- **Para agregar un campo nuevo**: entidad → DTO → command/query → nueva migración → snapshot.
- Las excepciones de negocio usan `NotFoundException`, `ConflictException`, `ForbiddenException` de `SalonPro.Shared`.

### Frontend
- **Signals para estado reactivo** (`signal<T>()`, `computed()`). No usar variables planas para estado que se muestra en template.
- **`environment.production = false` en dev** → los servicios retornan mocks, no llaman la API.
- **`sale-calculator.ts`** es el motor de cálculo de comisiones. El backend lo replica exactamente en `CreateSaleCommand.cs`. Si se cambia la lógica, cambiar en **ambos sitios**.
- Los formularios usan **Reactive Forms** (`FormBuilder`). Los cambios en inputs que deben afectar signals se sincronizan vía `.valueChanges.subscribe()`.

---

## 10. Variables de entorno de producción

El archivo `appsettings.Production.json` en el servidor contiene la cadena de conexión a Azure SQL y el JWT secret de producción. **Nunca se sube al repositorio** (está en `.gitignore`). Si necesitas acceso, solicítalo al responsable del proyecto.
