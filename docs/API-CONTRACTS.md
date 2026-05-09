# Contratos de API — SalonPro

Este documento define las interfaces entre módulos. Cada módulo expone sus endpoints y otros módulos consumen a través de interfaces compartidas en SalonPro.Shared.

## Convenciones Generales

- Base URL: `https://localhost:5001/api/v1`
- Autenticación: Bearer JWT en header `Authorization`
- Tenant: Resuelto por subdominio o header `X-Tenant-Id` (solo admin)
- Responses envueltos en:
```json
{
  "success": true,
  "data": { },
  "message": "Operación exitosa",
  "errors": []
}
```
- Paginación:
```json
{
  "success": true,
  "data": {
    "items": [],
    "totalCount": 150,
    "page": 1,
    "pageSize": 20,
    "totalPages": 8
  }
}
```
- Errores:
```json
{
  "success": false,
  "data": null,
  "message": "Error de validación",
  "errors": ["El campo Email es obligatorio", "El porcentaje debe ser mayor a 0"]
}
```
- HTTP Status Codes: 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 500 Internal Server Error

## Módulo: Tenants (Admin Panel)

Solo accesible por PlatformAdmin.

| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| GET | /admin/tenants | Listar todos los salones | PlatformAdmin |
| GET | /admin/tenants/{id} | Detalle de un salón | PlatformAdmin |
| POST | /admin/tenants | Crear salón + owner + sede principal | PlatformAdmin |
| PUT | /admin/tenants/{id} | Actualizar datos del salón | PlatformAdmin |
| PATCH | /admin/tenants/{id}/status | Cambiar estado (activar/suspender) | PlatformAdmin |
| GET | /admin/tenants/{id}/branches | Listar sedes del salón | PlatformAdmin |
| POST | /admin/tenants/{id}/branches | Agregar sede | PlatformAdmin |
| GET | /admin/subscriptions/{tenantId} | Ver suscripción | PlatformAdmin |
| PUT | /admin/subscriptions/{tenantId} | Actualizar plan/sedes | PlatformAdmin |
| GET | /admin/plans | Listar planes disponibles | PlatformAdmin |
| POST | /admin/plans | Crear plan | PlatformAdmin |
| PUT | /admin/plans/{id} | Actualizar plan | PlatformAdmin |
| GET | /admin/dashboard | KPIs de la plataforma | PlatformAdmin |

## Módulo: Identity

| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| POST | /auth/login | Autenticación (devuelve JWT) | Público |
| POST | /auth/refresh | Renovar token | Autenticado |
| POST | /auth/logout | Invalidar refresh token | Autenticado |
| GET | /users | Listar usuarios del tenant | TenantOwner |
| GET | /users/{id} | Detalle de usuario | TenantOwner, Self |
| POST | /users | Crear usuario (cajero/peluquero) | TenantOwner |
| PUT | /users/{id} | Actualizar usuario | TenantOwner |
| PATCH | /users/{id}/commission | Cambiar % comisión | TenantOwner |
| PATCH | /users/{id}/status | Activar/desactivar | TenantOwner |
| GET | /users/me | Perfil del usuario logueado | Autenticado |
| PUT | /users/me/password | Cambiar contraseña propia | Autenticado |

## Módulo: Operations

### Servicios
| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| GET | /services | Listar servicios activos | TenantOwner, Cashier |
| GET | /services/{id} | Detalle de servicio | TenantOwner, Cashier |
| POST | /services | Crear servicio | TenantOwner |
| PUT | /services/{id} | Actualizar (precio, nombre, etc) | TenantOwner |
| PATCH | /services/{id}/status | Activar/desactivar | TenantOwner |
| GET | /services/{id}/price-history | Historial de precios | TenantOwner |

### Productos
| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| GET | /products | Listar productos | TenantOwner, Cashier |
| GET | /products/{id} | Detalle de producto | TenantOwner, Cashier |
| POST | /products | Crear producto | TenantOwner |
| PUT | /products/{id} | Actualizar producto | TenantOwner |
| PATCH | /products/{id}/stock | Ajustar stock (entrada/ajuste) | TenantOwner |
| GET | /products/low-stock | Productos bajo stock mínimo | TenantOwner |
| GET | /products/{id}/movements | Historial de movimientos | TenantOwner |

### Clientes
| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| GET | /clients | Listar clientes | TenantOwner, Cashier |
| GET | /clients/{id} | Detalle de cliente | TenantOwner, Cashier |
| GET | /clients/search?document={num} | Buscar por cédula | Cashier |
| POST | /clients | Crear cliente | Cashier |
| PUT | /clients/{id} | Actualizar cliente | TenantOwner, Cashier |

### Ventas (POS)
| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| POST | /sales | Registrar venta completa | Cashier |
| GET | /sales | Listar ventas con filtros | TenantOwner, Cashier |
| GET | /sales/{id} | Detalle completo de venta | TenantOwner, Cashier |
| PUT | /sales/{id} | Editar venta (genera audit log) | Cashier |
| PATCH | /sales/{id}/void | Anular venta (con motivo) | TenantOwner |
| POST | /sales/calculate | Preview de cálculo (sin guardar) | Cashier |

### Métodos de Pago
| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| GET | /payment-methods | Listar métodos activos | TenantOwner, Cashier |
| POST | /payment-methods | Crear método de pago | TenantOwner |
| PUT | /payment-methods/{id} | Actualizar (nombre, %) | TenantOwner |
| PATCH | /payment-methods/{id}/status | Activar/desactivar | TenantOwner |

### Caja
| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| POST | /cash-registers/open | Abrir caja del día | Cashier |
| POST | /cash-registers/{id}/close | Cerrar caja | Cashier |
| GET | /cash-registers/current | Caja actual abierta | Cashier |
| GET | /cash-registers | Historial de cajas | TenantOwner |
| GET | /cash-registers/{id} | Detalle de cierre de caja | TenantOwner |

## Módulo: Settlements

### Anticipos
| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| POST | /advances | Registrar anticipo | TenantOwner, Cashier |
| GET | /advances | Listar anticipos con filtros | TenantOwner |
| GET | /advances/stylist/{id}/balance | Saldo de anticipos del peluquero | TenantOwner, Stylist(self) |
| PATCH | /advances/{id}/void | Anular anticipo (con motivo) | TenantOwner |

### Liquidaciones
| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| POST | /settlements/generate | Generar liquidación (borrador) | TenantOwner |
| GET | /settlements | Listar liquidaciones | TenantOwner |
| GET | /settlements/{id} | Detalle completo de liquidación | TenantOwner, Stylist(self) |
| PATCH | /settlements/{id}/approve | Aprobar liquidación | TenantOwner |
| PATCH | /settlements/{id}/pay | Marcar como pagada | TenantOwner |
| GET | /settlements/stylist/{id}/current | Acumulado actual del peluquero | TenantOwner, Stylist(self) |

## Módulo: Reporting

| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| GET | /reports/dashboard | Dashboard general del salón | TenantOwner |
| GET | /reports/sales-by-period | Ingresos por período | TenantOwner |
| GET | /reports/sales-by-stylist | Ingresos por peluquero | TenantOwner |
| GET | /reports/sales-by-service | Servicios más vendidos | TenantOwner |
| GET | /reports/sales-by-payment | Ventas por método de pago | TenantOwner |
| GET | /reports/products-movement | Movimientos de productos | TenantOwner |
| GET | /reports/stylist-ranking | Ranking de peluqueros | TenantOwner |
| GET | /reports/peak-hours | Horarios pico | TenantOwner |
| GET | /reports/stylist/{id}/summary | Resumen del peluquero | Stylist(self) |
| GET | /reports/export/{type} | Exportar a Excel/PDF | TenantOwner |

## Interfaces Compartidas (SalonPro.Shared)

```csharp
// Interfaces que los módulos exponen para comunicación interna
public interface IStylistService
{
    Task<StylistDto?> GetByIdAsync(int id, int tenantId);
    Task<decimal> GetCommissionPercentAsync(int stylistId, int tenantId);
    Task<IEnumerable<StylistDto>> GetByBranchAsync(int branchId, int tenantId);
}

public interface ITenantService
{
    Task<TenantDto?> GetBySlugAsync(string slug);
    Task<TenantDto?> GetByIdAsync(int id);
    Task<bool> IsActiveAsync(int tenantId);
    Task<int> GetMaxBranchesAsync(int tenantId);
}

public interface IBranchService
{
    Task<BranchDto?> GetByIdAsync(int id, int tenantId);
    Task<IEnumerable<BranchDto>> GetByTenantAsync(int tenantId);
}

public interface IPaymentMethodService
{
    Task<PaymentMethodDto?> GetByIdAsync(int id, int tenantId);
    Task<decimal> GetDeductionPercentAsync(int paymentMethodId, int tenantId);
}
```
