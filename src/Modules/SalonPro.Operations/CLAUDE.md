# CLAUDE.md — Módulo SalonPro.Operations (Salon App)

## Contexto

Este módulo es el **núcleo operativo** de cada salón. Es la aplicación que usan los clientes de SalonPro (dueños de salón, cajeros, peluqueros) para operar su negocio día a día.

**Rama Git:** `feature/salon-operations`
**Frontend:** `frontend/salon-app/` (Angular, puerto 4300)
**Backend:** `src/Modules/SalonPro.Operations/`

## Alcance de este Módulo

Lo que SÍ se trabaja aquí:
- CRUD de Services (catálogo de servicios del salón)
- CRUD de Products (inventario, stock, movimientos)
- CRUD de Clients (registro de clientes del salón)
- CRUD de PaymentMethods (con configuración de deducciones)
- POS / Registro de Ventas (el módulo más importante)
- Motor de cálculo de ventas (deducciones, comisiones, propinas)
- Gestión de Caja (apertura, cierre, registros inmutables)

Lo que NO se trabaja aquí:
- Gestión de tenants/suscripciones (módulo Tenants)
- Liquidaciones y anticipos (módulo Settlements)
- Reportes y dashboards (módulo Reporting)
- Autenticación y gestión de usuarios (módulo Identity)

## Entidades que Manejo

- **Service:** Servicio prestado por el salón (corte, tintura, etc)
- **Product:** Producto en inventario (venta y consumo interno)
- **Client:** Cliente del salón (datos obligatorios: doc, nombre, email, teléfono)
- **PaymentMethod:** Método de pago con deducción parametrizable
- **Sale:** Venta registrada con todos los cálculos
- **SaleDetail:** Líneas de detalle (servicio, producto venta, producto consumo)
- **CashRegister:** Apertura/cierre de caja (inmutable)
- **CashRegisterDetail:** Desglose por método de pago del cierre
- **ProductMovement:** Historial de entradas/salidas de inventario
- **ServicePriceLog:** Historial de cambios de precio de servicios

## Motor de Cálculo de Ventas — REGLAS CRÍTICAS

Ver docs/BUSINESS-RULES.md para el flujo completo con ejemplo numérico.

Resumen del flujo:
1. Sumar totales brutos (servicios, productos venta, propina)
2. Aplicar % deducción del método de pago (sobre servicios, productos, propina)
3. Calcular bases netas
4. Calcular comisiones: servicios (% del peluquero), productos (10% fijo), propina (100% peluquero)
5. Registrar consumo interno a precio de COMPRA (se descuenta en liquidación, no aquí)
6. Guardar TODOS los valores calculados en la venta

**IMPORTANTE:** Si un servicio tiene deducción por uso de salón (HasSalonFee=true), se aplica ADEMÁS de la deducción del método de pago.

## Reglas de Caja — ESTRICTAS

- NO se registran ventas si no hay caja abierta en la sede
- Solo una caja abierta por sede a la vez
- Los registros de caja NO se eliminan NUNCA (IsDeleted siempre false)
- Al cerrar, calcular efectivo esperado = base + Σ ventas en efectivo
- Registrar diferencia (sobrante/faltante)

## Roles y Permisos en este Módulo

| Funcionalidad | TenantOwner | Cashier | Stylist |
|--------------|-------------|---------|---------|
| CRUD Servicios | ✅ | ❌ (solo lectura) | ❌ |
| CRUD Productos | ✅ | ❌ (solo lectura) | ❌ |
| Registrar venta | ✅ | ✅ | ❌ |
| Editar venta | ✅ | ✅ (con log) | ❌ |
| Anular venta | ✅ | ❌ | ❌ |
| Abrir/cerrar caja | ✅ | ✅ | ❌ |
| Ver historial caja | ✅ | ❌ | ❌ |
| Config métodos pago | ✅ | ❌ | ❌ |
| Ver su acumulado | ❌ | ❌ | ✅ (solo el suyo) |

## Dependencias con otros Módulos

- **SalonPro.Identity:** Obtener datos del peluquero (nombre, % comisión)
- **SalonPro.Shared:** Interfaces IStylistService, IPaymentMethodService
- **SalonPro.Settlements** consumirá las ventas de este módulo para generar liquidaciones

## Notas de Implementación

- TODAS las tablas de este módulo tienen TenantId
- EF Core Global Query Filter por TenantId obligatorio
- El endpoint POST /sales/calculate permite previsualizar sin guardar (útil para el POS)
- Al registrar una venta, decrementar stock de productos automáticamente
- Al editar una venta, generar AuditLog con valores anteriores y nuevos
- Los precios se guardan en la venta tal como estaban al momento del registro (no se afectan por cambios futuros de precio)
