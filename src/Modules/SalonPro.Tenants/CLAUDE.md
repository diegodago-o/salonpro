# CLAUDE.md — Módulo SalonPro.Tenants (Admin Panel)

## Contexto

Este módulo es el **Centro de Administración** de la plataforma SalonPro. Es la aplicación que usa el equipo interno (PlatformAdmin) para gestionar todos los salones/clientes que contratan el SaaS.

**Rama Git:** `feature/admin-panel`
**Desarrollador:** Diego / Tecnofactory S.A.S.
**Frontend:** `frontend/admin-app/` (Angular, puerto 4200)
**Backend:** `src/Modules/SalonPro.Tenants/`

## Alcance de este Módulo

Lo que SÍ se trabaja aquí:
- CRUD de Tenants (salones/clientes)
- Gestión de Subscriptions (planes, facturación)
- CRUD de Plans (Básico, Estándar, Premium)
- Gestión de Branches (sedes) por tenant
- Creación del TenantOwner (primer usuario del salón)
- Configuración de subdominios (slug)
- Dashboard de plataforma (KPIs: total tenants, MRR, activos, trials)
- Activación/suspensión de tenants

Lo que NO se trabaja aquí (es del otro módulo):
- POS / Ventas
- Servicios y productos del salón
- Liquidaciones, anticipos
- Caja
- Reportes del salón
- Usuarios del salón (cajeros, peluqueros) — excepto la creación inicial del Owner

## Entidades que Manejo

- **Tenant:** Salón/cliente de la plataforma
- **Subscription:** Suscripción activa del tenant
- **Plan:** Planes disponibles (Básico, Estándar, Premium)
- **Branch:** Sedes del tenant (la primera viene con el plan, las adicionales se cobran)

## Flujos Principales

### Crear un nuevo salón (tenant)
1. Admin llena formulario: razón social, NIT, nombre comercial, slug, email, teléfono
2. Sistema valida que el slug no exista
3. Se crea el Tenant con status "Trial"
4. Se crea la Subscription asociada al plan seleccionado
5. Se crea la Branch principal (sede 1)
6. Se crea el User con rol TenantOwner (credenciales enviadas por email en el futuro)
7. El salón puede acceder vía {slug}.salonpro.com.co

### Agregar sede adicional
1. Validar que el tenant no exceda el máximo de sedes del plan + extras contratadas
2. Si excede, mostrar opción de contratar sede adicional (actualizar subscription)
3. Crear la Branch asociada al tenant

### Cambiar estado de tenant
- Trial → Active (cuando paga)
- Active → Suspended (por mora)
- Suspended → Active (cuando regulariza)
- Active → Cancelled (terminación de contrato)
- Suspended → Cancelled
- Un tenant Suspended o Cancelled NO puede acceder a la app del salón

## API Endpoints de este Módulo

Todos bajo `/api/v1/admin/` — requieren rol PlatformAdmin.

Ver docs/API-CONTRACTS.md para el detalle completo.

## Dependencias con otros Módulos

- **SalonPro.Identity:** Para crear el TenantOwner al registrar un nuevo salón
- **SalonPro.Shared:** Interfaces ITenantService, IBranchService que otros módulos consumen

## Notas de Implementación

- Las tablas de este módulo (Tenants, Subscriptions, Plans) NO tienen TenantId — son tablas de plataforma
- Branches SÍ tiene TenantId
- El frontend admin es una app Angular separada que corre en puerto 4200
- La autenticación del admin usa JWT pero con claims de PlatformAdmin
- EF Core DbContext separado o compartido con filtros condicionales
