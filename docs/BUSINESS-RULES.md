# Reglas de Negocio — SalonPro

## 1. Motor de Cálculo de Ventas

### 1.1 Flujo de Cálculo Completo

```
ENTRADA:
├── Servicios prestados (con precio unitario)
├── Productos vendidos a cliente (con precio de venta)
├── Productos consumo interno (con precio de compra)
├── Propina (monto)
└── Método de pago (con % deducción)

CÁLCULO:
│
├── PASO 1: Totales Brutos
│   ├── total_servicios = Σ precio_servicio
│   ├── total_productos_venta = Σ precio_venta_producto
│   ├── total_propina = monto_propina
│   └── total_consumo_interno = Σ precio_compra_producto
│
├── PASO 2: Deducciones (por método de pago)
│   ├── deduccion_servicios = total_servicios × %_deduccion
│   ├── deduccion_productos = total_productos_venta × %_deduccion
│   ├── deduccion_propina = total_propina × %_deduccion
│   └── consumo interno: SIN deducción
│
├── PASO 3: Bases Netas
│   ├── base_servicios = total_servicios − deduccion_servicios
│   ├── base_productos = total_productos_venta − deduccion_productos
│   └── propina_neta = total_propina − deduccion_propina
│
├── PASO 4: Comisiones
│   ├── comision_peluquero_servicios = base_servicios × %_peluquero
│   ├── comision_salon_servicios = base_servicios × %_salon
│   ├── comision_peluquero_productos = base_productos × 10%
│   ├── comision_salon_productos = base_productos × 90%
│   └── propina = 100% peluquero (salón no toca)
│
└── PASO 5: Netos
    ├── neto_peluquero_venta = comision_serv + comision_prod + propina_neta
    ├── neto_salon_venta = comision_salon_serv + comision_salon_prod
    └── consumo_interno → se descuenta en LIQUIDACIÓN (no por venta)

SALIDA: Registro completo con todos los valores calculados
```

### 1.2 Ejemplo Numérico Completo

**Escenario:** Carlos Restrepo (comisión 50/50) atiende a una clienta:
- Corte dama: $35.000
- Tintura completa: $80.000
- Vende shampoo Loreal: $32.000
- Usa tinte Igora (consumo interno): costo $12.000
- Usa oxidante 20vol (consumo interno): costo $8.000
- Clienta deja propina: $10.000
- Paga con tarjeta de crédito (deducción 7%)

```
PASO 1 — Brutos:
  Servicios:        $115.000 (35K + 80K)
  Productos venta:   $32.000
  Propina:           $10.000
  Consumo interno:   $20.000 (12K + 8K)

PASO 2 — Deducciones (7% tarjeta):
  Ded. servicios:    $8.050  (115K × 7%)
  Ded. productos:    $2.240  (32K × 7%)
  Ded. propina:        $700  (10K × 7%)

PASO 3 — Bases:
  Base servicios:   $106.950 (115K − 8.050)
  Base productos:    $29.760 (32K − 2.240)
  Propina neta:       $9.300 (10K − 700)

PASO 4 — Comisiones:
  Carlos servicios:  $53.475 (106.950 × 50%)
  Salón servicios:   $53.475 (106.950 × 50%)
  Carlos productos:   $2.976 (29.760 × 10%)
  Salón productos:   $26.784 (29.760 × 90%)
  Carlos propina:     $9.300 (100%)

PASO 5 — Netos de esta venta:
  Carlos:            $65.751 (53.475 + 2.976 + 9.300)
  Salón:             $80.259 (53.475 + 26.784)
  Consumo interno:   $20.000 → se descuenta en liquidación

  Validación:
  Total cliente pagó:             $157.000 (115K + 32K + 10K)
  Total deducciones tarjeta:       $10.990 (8.050 + 2.240 + 700)
  Base distribuible:              $146.010
  Carlos + Salón:                 $146.010 ✓ (65.751 + 80.259)
```

### 1.3 Deducción por Uso de Salón

Algunos servicios tienen una deducción adicional por "uso del salón" (4.5%). Esta se aplica ADEMÁS de la deducción por método de pago. Se configura a nivel de servicio (campo `aplica_deduccion_salon`, `%_deduccion_salon`).

Flujo cuando aplica ambas deducciones:
```
Total servicio: $100.000
(-) Deducción tarjeta 7%: $7.000
(-) Deducción uso salón 4.5%: $4.500
Base comisionable: $88.500
```

## 2. Datos Obligatorios por Venta

| Campo | Tipo | Obligatorio | Notas |
|-------|------|-------------|-------|
| Cédula/NIT cliente | string | SÍ | |
| Nombre completo | string | SÍ | |
| Correo electrónico | string | SÍ | Formato email válido |
| Teléfono | string | SÍ | |
| Fecha y hora | datetime | SÍ | Auto-generado al registrar |
| Peluquero asignado | FK | SÍ | |
| Sede (Branch) | FK | SÍ | Auto del contexto |
| Servicios prestados | lista | SÍ (mín 1) | Con precio unitario |
| Productos vendidos | lista | NO | Con precio de venta |
| Productos consumo interno | lista | NO | Con precio de compra |
| Propina | decimal | NO | Default 0 |
| Método de pago | FK | SÍ | |
| Caja abierta | FK | SÍ | Validación: debe haber caja abierta |
| Valores calculados | varios | SÍ | Auto-calculados |

## 3. Anticipos

- Registro independiente: fecha, monto, peluquero, método de pago, autorizó (usuario), observaciones
- Si el anticipo se paga con tarjeta, se aplica la deducción del método de pago
- NO se pueden eliminar. Solo ANULAR con motivo obligatorio
- Se acumulan por peluquero y se restan automáticamente en la liquidación
- Saldo de anticipos visible en tiempo real
- Un anticipo anulado no se suma al acumulado

## 4. Liquidaciones

### 4.1 Estructura de una Liquidación

```
LIQUIDACIÓN #001
Peluquero: Carlos Restrepo
Sede: Studio 54 - Sede Norte
Período: 01/06/2026 — 15/06/2026
Generada: 16/06/2026 por Admin

DETALLE DE SERVICIOS:
─────────────────────────────────────────────
Fecha     | Cliente      | Servicio           | Bruto    | Deducc. | Base     | Comisión (50%)
01/06     | Ana López    | Corte + Tintura     | $115.000 | $8.050  | $106.950 | $53.475
02/06     | María Ruiz   | Corte dama          |  $35.000 | $0      |  $35.000 | $17.500
...
─────────────────────────────────────────────
SUBTOTAL COMISIÓN SERVICIOS:                                           $XXX.XXX

DETALLE DE PRODUCTOS VENDIDOS (10%):
─────────────────────────────────────────────
Fecha     | Cliente      | Producto            | Venta    | Deducc. | Base     | Comisión (10%)
01/06     | Ana López    | Shampoo Loreal       |  $32.000 | $2.240  | $29.760  | $2.976
...
─────────────────────────────────────────────
SUBTOTAL COMISIÓN PRODUCTOS:                                            $X.XXX

DETALLE DE PROPINAS:
─────────────────────────────────────────────
Fecha     | Cliente      | Propina  | Deducc. | Neta
01/06     | Ana López    | $10.000  | $700    | $9.300
...
─────────────────────────────────────────────
SUBTOTAL PROPINAS NETAS:                                                $X.XXX

DETALLE DE CONSUMO INTERNO (descuento):
─────────────────────────────────────────────
Fecha     | Producto              | Costo (compra)
01/06     | Tinte Igora Royal      | $12.000
01/06     | Oxidante 20vol         |  $8.000
...
─────────────────────────────────────────────
SUBTOTAL CONSUMO INTERNO:                                             −$XX.XXX

DETALLE DE ANTICIPOS (descuento):
─────────────────────────────────────────────
Fecha     | Monto    | Método pago | Autorizó
05/06     | $50.000  | Efectivo    | Admin
10/06     | $30.000  | Nequi       | Admin
─────────────────────────────────────────────
SUBTOTAL ANTICIPOS:                                                   −$XX.XXX

═══════════════════════════════════════════════════
RESUMEN:
  (+) Comisión servicios:       $XXX.XXX
  (+) Comisión productos:         $X.XXX
  (+) Propinas netas:             $X.XXX
  (−) Consumo interno:          −$XX.XXX
  (−) Anticipos entregados:     −$XX.XXX
  ─────────────────────────────────────
  NETO A PAGAR:                 $XXX.XXX
═══════════════════════════════════════════════════

Estado: BORRADOR
```

### 4.2 Estados de Liquidación

```
BORRADOR ──▶ APROBADA ──▶ PAGADA
              │                │
              │                └── Fecha pago, quién pagó, método de pago
              └── Fecha aprobación, quién aprobó
```

- **Borrador:** Se puede regenerar, ajustar período
- **Aprobada:** Bloqueada, pendiente de pago
- **Pagada:** Inmutable, registro permanente

### 4.3 Rangos de Liquidación

- Diaria, Semanal, Quincenal, Mensual, Personalizado (fecha inicio — fecha fin)
- Una venta solo puede pertenecer a UNA liquidación (no se puede liquidar dos veces)

## 5. Caja

### 5.1 Reglas Estrictas

- OBLIGATORIA: no se registran ventas sin caja abierta
- Una caja por sede por día (solo una abierta a la vez por sede)
- Apertura: registrar base de caja (efectivo inicial)
- Cierre: declarar efectivo en caja física
- Registros INMUTABLES: no se eliminan, no se editan

### 5.2 Registro de Cierre

```
CIERRE DE CAJA
Sede: Studio 54 - Sede Norte
Fecha: 01/06/2026
Cajero: Laura Mendoza
Hora apertura: 8:00 AM | Hora cierre: 7:30 PM

Base inicial:                    $200.000

VENTAS POR MÉTODO DE PAGO:
  Efectivo:                      $450.000
  Tarjeta crédito:               $320.000
  Nequi:                         $180.000
  Daviplata:                      $75.000
  Transferencia:                 $120.000
  TOTAL VENTAS:                $1.145.000

DEDUCCIONES APLICADAS:
  Tarjeta crédito (7%):          −$22.400
  TOTAL DEDUCCIONES:             −$22.400

EFECTIVO ESPERADO:               $650.000 (base + ventas efectivo)
EFECTIVO DECLARADO:              $648.500
DIFERENCIA:                       −$1.500 (FALTANTE)

Observaciones: [campo libre]
```

## 6. Métodos de Pago

| Campo | Tipo | Descripción |
|-------|------|-------------|
| Nombre | string | Efectivo, Tarjeta crédito, Nequi, etc. |
| Aplica deducción | bool | Si se resta % antes de comisiones |
| % Deducción | decimal | Ej: 7.00 para tarjeta |
| Activo | bool | Si está disponible para seleccionar |

Configurables por tenant. La deducción SIEMPRE se aplica antes de calcular comisiones.

## 7. Productos e Inventario

### 7.1 Naturalezas

| Naturaleza | Precio usado | Afecta a | Cuándo se descuenta |
|-----------|-------------|----------|---------------------|
| Venta a cliente | Precio de VENTA | Base comisionable (10% peluquero) | En la venta |
| Consumo interno | Precio de COMPRA | Se resta de comisión del peluquero | En la liquidación |

### 7.2 Movimientos de Inventario

- **Entrada:** Compra/reposición (incrementa stock, registra precio de compra)
- **Salida por venta:** Al registrar venta con producto (decrementa stock)
- **Salida por consumo:** Al registrar consumo interno (decrementa stock)
- **Ajuste:** Corrección manual con motivo (inventario físico)

## 8. Comisiones de Peluqueros

- Porcentaje parametrizable por peluquero (ej: 40%, 50%)
- Se configura al crear/editar el peluquero
- Puede ser diferente por peluquero según acuerdo (antigüedad, etc.)
- El 10% de productos vendidos es FIJO para todos
- La propina es 100% del peluquero (después de deducción del método de pago)
