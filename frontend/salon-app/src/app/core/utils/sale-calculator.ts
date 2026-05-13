import { SaleCalculation, SaleItem, SaleProductItem, SaleServiceItem } from '../models/ventas.models';

export interface SaleInput {
  items: SaleItem[];
  tipAmount: number;
  /** $ fijo de deducción bancaria: suma de (valor_pago × % del método).
   *  Se aplica SOLO a servicios+productos, nunca a la propina. */
  deductionAmount: number;
  stylistCommPct: number; // % del colaborador (ej: 50)
}

export function calculateSale(input: SaleInput): SaleCalculation {
  const { items, tipAmount, deductionAmount, stylistCommPct } = input;
  const sPct = stylistCommPct / 100;

  // PASO 1 — Totales brutos (precio × cantidad)
  const grossServices = items
    .filter(i => i.type === 'Service')
    .reduce((sum, i) => sum + i.price * i.quantity, 0);

  const grossProducts = items
    .filter(i => i.type === 'ProductSale')
    .reduce((sum, i) => sum + i.price * i.quantity, 0);

  const internalConsumption = items
    .filter(i => i.type === 'ProductInternal')
    .reduce((sum, i) => sum + i.price * i.quantity, 0);

  const grossTip  = tipAmount;
  const grossItems = grossServices + grossProducts; // base sobre la que se distribuye la deducción

  // PASO 2 — Deducciones: SOLO en servicios+productos, la propina no tiene deducción bancaria
  const totalDeductions    = round(deductionAmount);
  const deductionServices  = grossItems > 0 ? round(totalDeductions * grossServices / grossItems) : 0;
  const deductionProducts  = grossItems > 0 ? round(totalDeductions * grossProducts / grossItems) : 0;
  const deductionTip       = 0; // la propina va íntegra al colaborador

  // PASO 3 — Bases netas
  const baseServices = grossServices - deductionServices;
  const baseProducts = grossProducts - deductionProducts;
  const netTip       = grossTip; // sin deducción

  // PASO 4 — Comisiones de servicios (por ítem para respetar salonFee individual)
  let salonFeeServices    = 0;
  let stylistCommServices = 0;
  let salonCommServices   = 0;

  for (const item of items.filter(i => i.type === 'Service') as SaleServiceItem[]) {
    const frac     = grossItems > 0 ? (item.price * item.quantity) / grossItems : 0;
    const itemBase = item.price * item.quantity - round(totalDeductions * frac);

    if (item.hasSalonFee && item.salonFeePercent > 0) {
      const fee       = round(itemBase * item.salonFeePercent / 100);
      const remainder = itemBase - fee;
      salonFeeServices    += fee;
      stylistCommServices += round(remainder * sPct);
      salonCommServices   += round(remainder * (1 - sPct)) + fee;
    } else {
      stylistCommServices += round(itemBase * sPct);
      salonCommServices   += round(itemBase * (1 - sPct));
    }
  }

  salonFeeServices    = round(salonFeeServices);
  stylistCommServices = round(stylistCommServices);
  salonCommServices   = round(salonCommServices);

  // Comisiones de productos
  let stylistCommProducts = 0;
  let salonCommProducts   = 0;
  for (const item of items.filter(i => i.type === 'ProductSale') as SaleProductItem[]) {
    const frac     = grossItems > 0 ? (item.price * item.quantity) / grossItems : 0;
    const itemBase = item.price * item.quantity - round(totalDeductions * frac);
    const prodSPct = (item.stylistCommissionPercent ?? 10) / 100;
    stylistCommProducts += round(itemBase * prodSPct);
    salonCommProducts   += round(itemBase * (1 - prodSPct));
  }

  // PASO 5 — Totales netos
  const stylistTotal = stylistCommServices + stylistCommProducts + netTip;
  const salonTotal   = salonCommServices   + salonCommProducts;

  // deductionPct: porcentaje efectivo sobre items (referencia informativa para la UI)
  const deductionPct = grossItems > 0 ? (totalDeductions / grossItems) * 100 : 0;

  return {
    grossServices, grossProducts, grossTip, internalConsumption,
    deductionPct, deductionServices, deductionProducts, deductionTip, totalDeductions,
    baseServices, baseProducts, netTip,
    stylistCommPct, salonFeeServices, stylistCommServices, salonCommServices,
    stylistCommProducts, salonCommProducts,
    stylistTotal, salonTotal,
  };
}

function round(value: number): number {
  return Math.round(value);
}
