import { SaleCalculation, SaleItem, SaleServiceItem } from '../models/ventas.models';

export interface SaleInput {
  items: SaleItem[];
  tipAmount: number;
  deductionPct: number;   // % del método de pago ponderado (ej: 7 para tarjeta)
  stylistCommPct: number; // % del peluquero (ej: 50)
}

export function calculateSale(input: SaleInput): SaleCalculation {
  const { items, tipAmount, deductionPct, stylistCommPct } = input;

  const pct  = deductionPct / 100;
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

  const grossTip = tipAmount;

  // PASO 2 — Deducciones por método de pago (NO aplica a consumo interno)
  const deductionServices = round(grossServices * pct);
  const deductionProducts = round(grossProducts * pct);
  const deductionTip      = round(grossTip * pct);
  const totalDeductions   = deductionServices + deductionProducts + deductionTip;

  // PASO 3 — Bases netas
  const baseServices = grossServices - deductionServices;
  const baseProducts = grossProducts - deductionProducts;
  const netTip       = grossTip - deductionTip;

  // PASO 4 — Comisiones de servicios (calculadas por item para respetar salonFee por servicio)
  //   Si el servicio tiene hasSalonFee=true, el salón retiene salonFeePercent% de la base
  //   de ese servicio ANTES de aplicar el split de comisión normal.
  let salonFeeServices    = 0;
  let stylistCommServices = 0;
  let salonCommServices   = 0;

  for (const item of items.filter(i => i.type === 'Service') as SaleServiceItem[]) {
    const itemBase = item.price * item.quantity * (1 - pct);

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

  // Redondear acumulados
  salonFeeServices    = round(salonFeeServices);
  stylistCommServices = round(stylistCommServices);
  salonCommServices   = round(salonCommServices);

  // Comisiones de productos: peluquero 10%, salón 90%
  const stylistCommProducts = round(baseProducts * 0.10);
  const salonCommProducts   = round(baseProducts * 0.90);

  // PASO 5 — Netos
  const stylistTotal = stylistCommServices + stylistCommProducts + netTip;
  const salonTotal   = salonCommServices + salonCommProducts;

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
