# Esquema de Base de Datos — SalonPro

## Diagrama de Relaciones

```
TABLAS DE PLATAFORMA (sin TenantId)
═══════════════════════════════════════

┌──────────────┐     ┌──────────────────┐     ┌──────────────┐
│    Plans     │────▶│  Subscriptions   │◀────│   Tenants    │
│              │     │                  │     │              │
│ Id           │     │ Id               │     │ Id           │
│ Name         │     │ TenantId (FK)    │     │ BusinessName │
│ MaxBranches  │     │ PlanId (FK)      │     │ Nit          │
│ PriceMonthly │     │ StartDate        │     │ Slug         │
│ PricePerExtra│     │ NextBillingDate  │     │ Status       │
│ Features     │     │ Status           │     │ CreatedAt    │
└──────────────┘     └──────────────────┘     └──────┬───────┘
                                                      │
                                                      │ 1:N
                                                      ▼
TABLAS DE NEGOCIO (con TenantId)              ┌──────────────┐
═══════════════════════════════════            │   Branches   │
                                              │              │
┌──────────────┐                              │ Id           │
│    Users     │─────────────────────────────▶│ TenantId(FK) │
│              │     pertenece a sede         │ Name         │
│ Id           │                              │ Address      │
│ TenantId(FK) │                              │ City         │
│ BranchId(FK) │                              │ Phone        │
│ FullName     │                              │ IsActive     │
│ Email        │                              └──────────────┘
│ Role         │
│ Commission%  │              ┌──────────────────┐
│ IsActive     │              │  PaymentMethods  │
└──────┬───────┘              │                  │
       │                      │ Id               │
       │ peluquero            │ TenantId (FK)    │
       │                      │ Name             │
       ▼                      │ HasDeduction     │
┌──────────────┐              │ DeductionPercent │
│    Sales     │◀─────────────│ IsActive         │
│              │  método pago └──────────────────┘
│ Id           │
│ TenantId(FK) │     ┌──────────────┐
│ BranchId(FK) │     │   Services   │
│ StylistId(FK)│     │              │
│ ClientId(FK) │     │ Id           │
│ CashReg.(FK) │     │ TenantId(FK) │
│ PaymentMeth. │     │ Name         │
│ DateTime     │     │ Category     │
│ GrossTotal   │     │ Price        │
│ TotalDeduct. │     │ Duration     │
│ NetBase      │     │ HasSalonFee  │
│ TipAmount    │     │ SalonFee%    │
│ TipDeduction │     │ IsActive     │
│ NetTip       │     └──────┬───────┘
│ StylistTotal │            │
│ SalonTotal   │            │ referenciado en
│ Status       │            ▼
└──────┬───────┘     ┌──────────────────┐
       │             │   SaleDetails    │
       │ 1:N         │                  │
       └────────────▶│ Id               │
                     │ SaleId (FK)      │
                     │ Type (enum)      │  ← Service/ProductSale/ProductInternal
                     │ ServiceId (FK)   │  ← nullable
                     │ ProductId (FK)   │  ← nullable
                     │ Description      │
                     │ UnitPrice        │
                     │ Quantity         │
                     │ GrossAmount      │
                     │ DeductionPercent │
                     │ DeductionAmount  │
                     │ NetAmount        │
                     │ StylistCommission│
                     │ SalonCommission  │
                     └──────────────────┘

┌──────────────┐     ┌──────────────────┐
│   Clients    │     │    Products      │
│              │     │                  │
│ Id           │     │ Id               │
│ TenantId(FK) │     │ TenantId (FK)    │
│ DocumentType │     │ Name             │
│ DocumentNum  │     │ Brand            │
│ FullName     │     │ Category         │
│ Email        │     │ PurchasePrice    │
│ Phone        │     │ SalePrice        │
│ CreatedAt    │     │ Stock            │
│              │     │ MinStock         │
└──────────────┘     │ IsForSale        │  ← si se vende a clientes
                     │ IsActive         │
                     └──────────────────┘

┌──────────────────┐     ┌──────────────────────┐
│  CashRegisters   │     │  CashRegisterDetails  │
│                  │     │                       │
│ Id               │     │ Id                    │
│ TenantId (FK)    │     │ CashRegisterId (FK)   │
│ BranchId (FK)    │     │ PaymentMethodId (FK)  │
│ CashierId (FK)   │     │ TotalAmount           │
│ OpenedAt         │     │ TotalDeductions       │
│ ClosedAt         │     │ NetAmount             │
│ OpeningBalance   │     └───────────────────────┘
│ DeclaredCash     │
│ ExpectedCash     │
│ Difference       │
│ Status           │  ← Open/Closed
│ Notes            │
│ IsDeleted = false│  ← NUNCA se pone en true
└──────────────────┘

┌──────────────────┐     ┌──────────────────────┐
│  Settlements     │     │  SettlementDetails    │
│                  │     │                       │
│ Id               │     │ Id                    │
│ TenantId (FK)    │     │ SettlementId (FK)     │
│ BranchId (FK)    │     │ SaleId (FK)           │  ← nullable
│ StylistId (FK)   │     │ AdvanceId (FK)        │  ← nullable
│ PeriodStart      │     │ Type (enum)           │  ← ServiceComm/ProductComm/
│ PeriodEnd        │     │                       │     Tip/InternalConsumption/
│ TotalServices    │     │                       │     AdvanceDeduction
│ TotalProducts    │     │ Description           │
│ TotalTips        │     │ GrossAmount           │
│ TotalInternal    │     │ DeductionAmount       │
│ TotalAdvances    │     │ NetAmount             │
│ GrandTotal       │     │ CommissionPercent     │
│ NetPayable       │     │ CommissionAmount      │
│ Status           │     └───────────────────────┘
│ GeneratedBy      │
│ GeneratedAt      │
│ ApprovedBy       │
│ ApprovedAt       │
│ PaidBy           │
│ PaidAt           │
│ PaymentMethod    │
└──────────────────┘

┌──────────────────┐
│    Advances      │
│                  │
│ Id               │
│ TenantId (FK)    │
│ BranchId (FK)    │
│ StylistId (FK)   │
│ Amount           │
│ PaymentMethodId  │
│ AuthorizedBy(FK) │
│ Date             │
│ Notes            │
│ Status           │  ← Active/Voided
│ VoidedReason     │
│ VoidedAt         │
│ VoidedBy         │
│ SettlementId(FK) │  ← nullable, se llena al liquidar
│ CreatedAt        │
└──────────────────┘

┌──────────────────┐     ┌──────────────────────┐
│ ProductMovements │     │    AuditLogs          │
│                  │     │                       │
│ Id               │     │ Id                    │
│ TenantId (FK)    │     │ TenantId (FK)         │  ← nullable (plataforma)
│ ProductId (FK)   │     │ UserId (FK)           │
│ Type (enum)      │     │ Action                │
│ Quantity         │     │ EntityType             │
│ UnitCost         │     │ EntityId               │
│ SaleId (FK)      │     │ OldValues (JSON)       │
│ Notes            │     │ NewValues (JSON)       │
│ CreatedBy        │     │ Timestamp              │
│ CreatedAt        │     │ IpAddress              │
└──────────────────┘     └───────────────────────┘

┌──────────────────┐
│  ServicePriceLog │
│                  │
│ Id               │
│ ServiceId (FK)   │
│ OldPrice         │
│ NewPrice         │
│ ChangedBy (FK)   │
│ ChangedAt        │
└──────────────────┘
```

## Detalle de Tablas

### Tablas de Plataforma (sin TenantId)

#### Plans
| Columna | Tipo | Nullable | Descripción |
|---------|------|----------|-------------|
| Id | int | PK | Identity |
| Name | nvarchar(100) | NO | Nombre del plan (Básico, Estándar, Premium) |
| Description | nvarchar(500) | SÍ | Descripción del plan |
| MaxBranches | int | NO | Sedes incluidas en el plan |
| PriceMonthly | decimal(18,2) | NO | Precio mensual base (COP) |
| PricePerExtraBranch | decimal(18,2) | NO | Precio por sede adicional |
| Features | nvarchar(max) | SÍ | JSON con features del plan |
| IsActive | bit | NO | Default 1 |
| CreatedAt | datetime2 | NO | |
| UpdatedAt | datetime2 | NO | |

#### Tenants
| Columna | Tipo | Nullable | Descripción |
|---------|------|----------|-------------|
| Id | int | PK | Identity |
| BusinessName | nvarchar(200) | NO | Razón social del salón |
| TradeName | nvarchar(200) | NO | Nombre comercial |
| Nit | nvarchar(20) | NO | NIT con DV |
| Slug | nvarchar(50) | NO | Subdominio (UNIQUE) |
| Email | nvarchar(200) | NO | Email principal |
| Phone | nvarchar(20) | NO | Teléfono |
| Address | nvarchar(300) | SÍ | Dirección principal |
| City | nvarchar(100) | SÍ | Ciudad |
| LogoUrl | nvarchar(500) | SÍ | URL del logo |
| Status | nvarchar(20) | NO | Trial/Active/Suspended/Cancelled |
| TrialEndsAt | datetime2 | SÍ | Fecha fin del trial |
| CreatedAt | datetime2 | NO | |
| UpdatedAt | datetime2 | NO | |
| CreatedBy | nvarchar(100) | NO | |

#### Subscriptions
| Columna | Tipo | Nullable | Descripción |
|---------|------|----------|-------------|
| Id | int | PK | Identity |
| TenantId | int | FK → Tenants | |
| PlanId | int | FK → Plans | |
| ExtraBranches | int | NO | Sedes adicionales contratadas |
| TotalMonthly | decimal(18,2) | NO | Valor total mensual |
| BillingCycle | nvarchar(20) | NO | Monthly/Quarterly/Annual |
| StartDate | datetime2 | NO | |
| NextBillingDate | datetime2 | NO | |
| Status | nvarchar(20) | NO | Active/PastDue/Cancelled |
| CreatedAt | datetime2 | NO | |
| UpdatedAt | datetime2 | NO | |

### Tablas de Negocio (con TenantId)

#### Branches
| Columna | Tipo | Nullable | Descripción |
|---------|------|----------|-------------|
| Id | int | PK | Identity |
| TenantId | int | FK → Tenants | |
| Name | nvarchar(200) | NO | Nombre de la sede |
| Address | nvarchar(300) | NO | |
| City | nvarchar(100) | NO | |
| Phone | nvarchar(20) | SÍ | |
| IsActive | bit | NO | Default 1 |
| CreatedAt | datetime2 | NO | |
| UpdatedAt | datetime2 | NO | |

#### Users
| Columna | Tipo | Nullable | Descripción |
|---------|------|----------|-------------|
| Id | int | PK | Identity |
| TenantId | int | FK → Tenants | |
| BranchId | int | FK → Branches | Sede asignada |
| FullName | nvarchar(200) | NO | |
| Email | nvarchar(200) | NO | UNIQUE por tenant |
| PasswordHash | nvarchar(500) | NO | |
| DocumentType | nvarchar(5) | NO | CC/CE/NIT/PP |
| DocumentNumber | nvarchar(20) | NO | |
| Phone | nvarchar(20) | SÍ | |
| Role | nvarchar(20) | NO | TenantOwner/Cashier/Stylist |
| CommissionPercent | decimal(5,2) | SÍ | Solo para Stylist (ej: 40.00) |
| IsActive | bit | NO | Default 1 |
| CreatedAt | datetime2 | NO | |
| UpdatedAt | datetime2 | NO | |

#### Services
| Columna | Tipo | Nullable | Descripción |
|---------|------|----------|-------------|
| Id | int | PK | Identity |
| TenantId | int | FK → Tenants | |
| Name | nvarchar(200) | NO | |
| Category | nvarchar(100) | NO | Corte/Tintura/Manicure/Barba/etc |
| Price | decimal(18,2) | NO | Precio actual |
| DurationMinutes | int | SÍ | Duración estimada |
| HasSalonFee | bit | NO | Default 0. Aplica deducción uso salón |
| SalonFeePercent | decimal(5,2) | SÍ | % deducción uso salón (ej: 4.50) |
| IsActive | bit | NO | Default 1 |
| CreatedAt | datetime2 | NO | |
| UpdatedAt | datetime2 | NO | |

#### Products
| Columna | Tipo | Nullable | Descripción |
|---------|------|----------|-------------|
| Id | int | PK | Identity |
| TenantId | int | FK → Tenants | |
| Name | nvarchar(200) | NO | |
| Brand | nvarchar(100) | SÍ | |
| Category | nvarchar(100) | NO | |
| PurchasePrice | decimal(18,2) | NO | Precio de compra |
| SalePrice | decimal(18,2) | NO | Precio de venta al público |
| Stock | int | NO | Stock actual |
| MinStock | int | NO | Stock mínimo (alerta) |
| IsForSale | bit | NO | Si se vende a clientes |
| IsActive | bit | NO | Default 1 |
| CreatedAt | datetime2 | NO | |
| UpdatedAt | datetime2 | NO | |

#### PaymentMethods
| Columna | Tipo | Nullable | Descripción |
|---------|------|----------|-------------|
| Id | int | PK | Identity |
| TenantId | int | FK → Tenants | |
| Name | nvarchar(100) | NO | Efectivo, Tarjeta crédito, etc |
| HasDeduction | bit | NO | Default 0 |
| DeductionPercent | decimal(5,2) | NO | Default 0.00 (ej: 7.00) |
| IsActive | bit | NO | Default 1 |
| CreatedAt | datetime2 | NO | |
| UpdatedAt | datetime2 | NO | |

#### Clients
| Columna | Tipo | Nullable | Descripción |
|---------|------|----------|-------------|
| Id | int | PK | Identity |
| TenantId | int | FK → Tenants | |
| DocumentType | nvarchar(5) | NO | CC/CE/NIT |
| DocumentNumber | nvarchar(20) | NO | UNIQUE por tenant |
| FullName | nvarchar(200) | NO | |
| Email | nvarchar(200) | NO | |
| Phone | nvarchar(20) | NO | |
| CreatedAt | datetime2 | NO | |
| UpdatedAt | datetime2 | NO | |

#### Sales
| Columna | Tipo | Nullable | Descripción |
|---------|------|----------|-------------|
| Id | int | PK | Identity |
| TenantId | int | FK → Tenants | |
| BranchId | int | FK → Branches | |
| StylistId | int | FK → Users | Peluquero que prestó servicio |
| ClientId | int | FK → Clients | |
| CashRegisterId | int | FK → CashRegisters | Caja abierta al momento |
| PaymentMethodId | int | FK → PaymentMethods | |
| SaleDateTime | datetime2 | NO | Fecha y hora de la venta |
| GrossServices | decimal(18,2) | NO | Total bruto servicios |
| GrossProducts | decimal(18,2) | NO | Total bruto productos vendidos |
| GrossTotal | decimal(18,2) | NO | Bruto total (serv + prod) |
| TipAmount | decimal(18,2) | NO | Propina bruta |
| DeductionPercent | decimal(5,2) | NO | % deducción método pago |
| DeductionServices | decimal(18,2) | NO | Deducción sobre servicios |
| DeductionProducts | decimal(18,2) | NO | Deducción sobre productos |
| DeductionTip | decimal(18,2) | NO | Deducción sobre propina |
| TotalDeductions | decimal(18,2) | NO | Suma de todas las deducciones |
| NetBaseServices | decimal(18,2) | NO | Base neta servicios |
| NetBaseProducts | decimal(18,2) | NO | Base neta productos |
| NetTip | decimal(18,2) | NO | Propina neta |
| StylistCommPercent | decimal(5,2) | NO | % comisión del peluquero |
| StylistCommServices | decimal(18,2) | NO | Comisión servicios peluquero |
| StylistCommProducts | decimal(18,2) | NO | Comisión productos (10%) |
| StylistTotalSale | decimal(18,2) | NO | Total peluquero esta venta |
| SalonCommServices | decimal(18,2) | NO | Comisión servicios salón |
| SalonCommProducts | decimal(18,2) | NO | Comisión productos salón |
| SalonTotalSale | decimal(18,2) | NO | Total salón esta venta |
| InternalConsumption | decimal(18,2) | NO | Total consumo interno (costo) |
| Status | nvarchar(20) | NO | Active/Voided/Edited |
| VoidedReason | nvarchar(500) | SÍ | Motivo de anulación |
| Notes | nvarchar(500) | SÍ | Observaciones |
| CreatedBy | nvarchar(100) | NO | Usuario que registró |
| CreatedAt | datetime2 | NO | |
| UpdatedAt | datetime2 | NO | |

#### SaleDetails
| Columna | Tipo | Nullable | Descripción |
|---------|------|----------|-------------|
| Id | int | PK | Identity |
| SaleId | int | FK → Sales | |
| DetailType | nvarchar(20) | NO | Service/ProductSale/ProductInternal |
| ServiceId | int | SÍ | FK → Services (si es servicio) |
| ProductId | int | SÍ | FK → Products (si es producto) |
| Description | nvarchar(200) | NO | Nombre del servicio/producto |
| Quantity | int | NO | Default 1 |
| UnitPrice | decimal(18,2) | NO | Precio unitario usado |
| GrossAmount | decimal(18,2) | NO | Cantidad × precio |
| DeductionPercent | decimal(5,2) | NO | % deducción aplicada |
| DeductionAmount | decimal(18,2) | NO | Monto deducción |
| SalonFeePercent | decimal(5,2) | NO | % uso salón (0 si no aplica) |
| SalonFeeAmount | decimal(18,2) | NO | Monto uso salón |
| NetAmount | decimal(18,2) | NO | Neto después de deducciones |
| StylistCommission | decimal(18,2) | NO | Comisión peluquero |
| SalonCommission | decimal(18,2) | NO | Comisión salón |

#### CashRegisters
| Columna | Tipo | Nullable | Descripción |
|---------|------|----------|-------------|
| Id | int | PK | Identity |
| TenantId | int | FK → Tenants | |
| BranchId | int | FK → Branches | |
| CashierId | int | FK → Users | |
| OpenedAt | datetime2 | NO | |
| ClosedAt | datetime2 | SÍ | NULL si abierta |
| OpeningBalance | decimal(18,2) | NO | Base de caja |
| DeclaredCash | decimal(18,2) | SÍ | Efectivo declarado al cerrar |
| ExpectedCash | decimal(18,2) | SÍ | Efectivo calculado |
| Difference | decimal(18,2) | SÍ | Diferencia |
| Status | nvarchar(10) | NO | Open/Closed |
| Notes | nvarchar(500) | SÍ | |
| CreatedAt | datetime2 | NO | |

#### Settlements
| Columna | Tipo | Nullable | Descripción |
|---------|------|----------|-------------|
| Id | int | PK | Identity |
| TenantId | int | FK → Tenants | |
| BranchId | int | FK → Branches | |
| StylistId | int | FK → Users | |
| PeriodStart | datetime2 | NO | Inicio del período |
| PeriodEnd | datetime2 | NO | Fin del período |
| TotalGrossSales | decimal(18,2) | NO | |
| TotalCommServices | decimal(18,2) | NO | |
| TotalCommProducts | decimal(18,2) | NO | |
| TotalTips | decimal(18,2) | NO | |
| TotalInternalConsumption | decimal(18,2) | NO | |
| TotalAdvances | decimal(18,2) | NO | |
| NetPayable | decimal(18,2) | NO | NETO A PAGAR |
| Status | nvarchar(20) | NO | Draft/Approved/Paid |
| GeneratedBy | int | FK → Users | |
| GeneratedAt | datetime2 | NO | |
| ApprovedBy | int | SÍ | FK → Users |
| ApprovedAt | datetime2 | SÍ | |
| PaidBy | int | SÍ | FK → Users |
| PaidAt | datetime2 | SÍ | |
| PaidVia | nvarchar(50) | SÍ | Método pago de liquidación |
| CreatedAt | datetime2 | NO | |

#### Advances
| Columna | Tipo | Nullable | Descripción |
|---------|------|----------|-------------|
| Id | int | PK | Identity |
| TenantId | int | FK → Tenants | |
| BranchId | int | FK → Branches | |
| StylistId | int | FK → Users | |
| Amount | decimal(18,2) | NO | Monto del anticipo |
| PaymentMethodId | int | FK → PaymentMethods | |
| AuthorizedById | int | FK → Users | Quién autorizó |
| Date | datetime2 | NO | |
| Notes | nvarchar(500) | SÍ | |
| Status | nvarchar(20) | NO | Active/Voided |
| VoidedReason | nvarchar(500) | SÍ | |
| VoidedAt | datetime2 | SÍ | |
| VoidedById | int | SÍ | FK → Users |
| SettlementId | int | SÍ | FK → Settlements. Se llena al liquidar |
| CreatedAt | datetime2 | NO | |
| CreatedBy | nvarchar(100) | NO | |

## Índices Recomendados

```sql
-- Tenant resolution (más consultado)
CREATE UNIQUE INDEX IX_Tenants_Slug ON Tenants(Slug);

-- Filtros multi-tenant
CREATE INDEX IX_Branches_TenantId ON Branches(TenantId);
CREATE INDEX IX_Users_TenantId_Role ON Users(TenantId, Role);
CREATE INDEX IX_Sales_TenantId_DateTime ON Sales(TenantId, SaleDateTime);
CREATE INDEX IX_Sales_StylistId ON Sales(StylistId);
CREATE INDEX IX_Sales_CashRegisterId ON Sales(CashRegisterId);
CREATE INDEX IX_Advances_StylistId_Status ON Advances(StylistId, Status);
CREATE INDEX IX_Settlements_StylistId ON Settlements(StylistId);
CREATE INDEX IX_CashRegisters_BranchId_Status ON CashRegisters(BranchId, Status);
CREATE INDEX IX_Clients_TenantId_DocumentNumber ON Clients(TenantId, DocumentNumber);
CREATE INDEX IX_Products_TenantId ON Products(TenantId);
CREATE INDEX IX_Services_TenantId ON Services(TenantId);
```
