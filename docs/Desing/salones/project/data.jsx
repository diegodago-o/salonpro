// Mock data for SalonPro - Studio 54 Hair & Beauty, Bogotá

const SALONS = [
  { id: 's1', name: 'Studio 54 Hair & Beauty', address: 'Cra. 11 #93-07, Chapinero, Bogotá', phone: '+57 320 555 0154', initials: 'S54' },
  { id: 's2', name: 'Studio 54 — Usaquén', address: 'Cl. 119 #6-68, Usaquén, Bogotá', phone: '+57 320 555 0155', initials: 'S54' },
];

const STYLISTS = [
  { id: 'p1', name: 'Carlos Restrepo',      role: 'Estilista Senior',  pct: 50, since: '2019', tone: '#C97B5C', initials: 'CR', tag: 'Senior · Color' },
  { id: 'p2', name: 'Valentina Muñoz',      role: 'Estilista',         pct: 40, since: '2022', tone: '#A8896E', initials: 'VM', tag: 'Cortes · Mechas' },
  { id: 'p3', name: 'Andrés Gómez',         role: 'Barbero',           pct: 40, since: '2023', tone: '#7A6B5D', initials: 'AG', tag: 'Barbería' },
  { id: 'p4', name: 'Luisa Fernanda Ríos',  role: 'Manicurista',       pct: 40, since: '2021', tone: '#B8917A', initials: 'LR', tag: 'Manicure · Pedi' },
];

const SERVICES = [
  { id: 'sv1', name: 'Corte Caballero',     category: 'Corte',        price: 25000,  duration: 30, active: true },
  { id: 'sv2', name: 'Corte Dama',          category: 'Corte',        price: 35000,  duration: 45, active: true },
  { id: 'sv3', name: 'Tintura completa',    category: 'Color',        price: 80000,  duration: 90, active: true },
  { id: 'sv4', name: 'Mechas / Balayage',   category: 'Color',        price: 120000, duration: 150, active: true },
  { id: 'sv5', name: 'Alisado Keratina',    category: 'Tratamiento',  price: 150000, duration: 180, active: true },
  { id: 'sv6', name: 'Manicure básico',     category: 'Manicure',     price: 15000,  duration: 30, active: true },
  { id: 'sv7', name: 'Pedicure',            category: 'Manicure',     price: 20000,  duration: 45, active: true },
  { id: 'sv8', name: 'Barba',               category: 'Barbería',     price: 12000,  duration: 20, active: true },
  { id: 'sv9', name: 'Lavado y secado',     category: 'Corte',        price: 18000,  duration: 25, active: true },
  { id: 'sv10', name: 'Tratamiento capilar', category: 'Tratamiento', price: 45000,  duration: 45, active: true },
];

const PRODUCTS = [
  { id: 'pr1', name: 'Shampoo Loreal 500ml',  brand: 'L\u2019Oréal',  category: 'Cuidado',  buy: 18000, sell: 32000, stock: 12, min: 4, internal: false },
  { id: 'pr2', name: 'Tratamiento Kerastase', brand: 'Kérastase',     category: 'Tratamiento', buy: 25000, sell: 45000, stock: 8,  min: 4, internal: false },
  { id: 'pr3', name: 'Tinte Igora Royal',     brand: 'Schwarzkopf',   category: 'Color',    buy: 12000, sell: 0,     stock: 24, min: 10, internal: true },
  { id: 'pr4', name: 'Oxidante 20vol',        brand: 'Schwarzkopf',   category: 'Color',    buy: 8000,  sell: 0,     stock: 15, min: 8,  internal: true },
  { id: 'pr5', name: 'Cera modeladora',       brand: 'American Crew', category: 'Styling',  buy: 10000, sell: 22000, stock: 6,  min: 4,  internal: false },
];

const PAYMENT_METHODS = [
  { id: 'efectivo',     label: 'Efectivo',     icon: 'cash',  enabled: true },
  { id: 'nequi',        label: 'Nequi',        icon: 'phone', enabled: true },
  { id: 'daviplata',    label: 'Daviplata',    icon: 'phone', enabled: true },
  { id: 'tarjeta',      label: 'Tarjeta',      icon: 'card',  enabled: true },
  { id: 'transferencia', label: 'Transferencia Bancolombia', icon: 'bank', enabled: true },
];

// Pre-generated sales for last 30 days
const today = new Date('2026-05-02T18:30:00');
const SALES = (() => {
  const out = [];
  let id = 1000;
  const seed = (n) => { let x = Math.sin(n) * 10000; return x - Math.floor(x); };
  for (let d = 29; d >= 0; d--) {
    const date = new Date(today); date.setDate(date.getDate() - d);
    const count = 8 + Math.floor(seed(d * 3) * 14);
    for (let k = 0; k < count; k++) {
      const stylist = STYLISTS[Math.floor(seed(d * 100 + k) * STYLISTS.length)];
      const svc = SERVICES[Math.floor(seed(d * 200 + k) * SERVICES.length)];
      const hour = 9 + Math.floor(seed(d * 300 + k) * 11);
      const min = Math.floor(seed(d * 400 + k) * 60);
      const dt = new Date(date); dt.setHours(hour, min, 0, 0);
      const productAttached = seed(d * 500 + k) > 0.7;
      const items = [{ kind: 'service', id: svc.id, name: svc.name, price: svc.price, qty: 1 }];
      if (productAttached) {
        const p = PRODUCTS.filter(p => !p.internal)[Math.floor(seed(d * 600 + k) * 3)];
        if (p) items.push({ kind: 'product', id: p.id, name: p.name, price: p.sell, qty: 1 });
      }
      const total = items.reduce((s, i) => s + i.price * i.qty, 0);
      const method = PAYMENT_METHODS[Math.floor(seed(d * 700 + k) * PAYMENT_METHODS.length)];
      const partStylist = Math.round(total * stylist.pct / 100);
      const partSalon = total - partStylist;
      const status = seed(d * 800 + k) > 0.97 ? 'Anulada' : (seed(d * 850 + k) > 0.95 ? 'Editada' : 'Activa');
      out.push({
        id: 'V-' + (id++),
        date: dt.toISOString(),
        stylistId: stylist.id, stylistName: stylist.name,
        items, total, partStylist, partSalon, pct: stylist.pct,
        method: method.label, methodId: method.id,
        client: seed(d * 900 + k) > 0.6 ? null : { name: 'Cliente ' + (id % 50), phone: '+57 30' + (id % 9) + ' ' + (100 + id % 800) + ' ' + (1000 + id % 9000) },
        status,
      });
    }
  }
  return out.reverse();
})();

const TODAY_KEY = today.toISOString().slice(0, 10);
const SALES_TODAY = SALES.filter(s => s.date.slice(0, 10) === TODAY_KEY);

// Helpers
const COP = (n) => '$' + Math.round(n).toLocaleString('es-CO').replace(/,/g, '.');
const COPshort = (n) => {
  if (n >= 1000000) return '$' + (n / 1000000).toFixed(1).replace('.0', '') + 'M';
  if (n >= 1000) return '$' + Math.round(n / 1000) + 'k';
  return '$' + n;
};

const fmtDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
};
const fmtTime = (iso) => {
  const d = new Date(iso);
  return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false });
};
const fmtDateTime = (iso) => fmtDate(iso) + ' · ' + fmtTime(iso);

// KPIs derived
const kpiToday = SALES_TODAY.filter(s => s.status !== 'Anulada').reduce((s, x) => s + x.total, 0);
const kpiWeek = SALES.filter(s => {
  const dt = new Date(s.date);
  const diff = (today - dt) / (1000 * 60 * 60 * 24);
  return diff <= 7 && s.status !== 'Anulada';
}).reduce((s, x) => s + x.total, 0);
const kpiMonth = SALES.filter(s => s.status !== 'Anulada').reduce((s, x) => s + x.total, 0);
const kpiYesterday = SALES.filter(s => {
  const dt = new Date(s.date);
  const k = dt.toISOString().slice(0, 10);
  const y = new Date(today); y.setDate(y.getDate() - 1);
  return k === y.toISOString().slice(0, 10) && s.status !== 'Anulada';
}).reduce((s, x) => s + x.total, 0);

// Daily revenue series
const DAILY_REVENUE = (() => {
  const map = {};
  SALES.forEach(s => {
    if (s.status === 'Anulada') return;
    const k = s.date.slice(0, 10);
    map[k] = (map[k] || 0) + s.total;
  });
  return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0])).map(([k, v]) => ({ date: k, value: v }));
})();

// Stylist ranking (this month)
const STYLIST_RANK = STYLISTS.map(p => {
  const sales = SALES.filter(s => s.stylistId === p.id && s.status !== 'Anulada');
  const total = sales.reduce((s, x) => s + x.total, 0);
  const services = sales.reduce((s, x) => s + x.items.filter(i => i.kind === 'service').length, 0);
  const commission = sales.reduce((s, x) => s + x.partStylist, 0);
  return { ...p, total, services, commission };
}).sort((a, b) => b.total - a.total);

// Top services
const TOP_SERVICES = (() => {
  const map = {};
  SALES.forEach(s => {
    if (s.status === 'Anulada') return;
    s.items.filter(i => i.kind === 'service').forEach(i => {
      if (!map[i.id]) map[i.id] = { id: i.id, name: i.name, count: 0, revenue: 0 };
      map[i.id].count += i.qty;
      map[i.id].revenue += i.price * i.qty;
    });
  });
  return Object.values(map).sort((a, b) => b.count - a.count);
})();

// Payment method distribution
const PAYMENT_DIST = (() => {
  const map = {};
  let total = 0;
  SALES.forEach(s => {
    if (s.status === 'Anulada') return;
    map[s.method] = (map[s.method] || 0) + s.total;
    total += s.total;
  });
  return Object.entries(map).map(([method, value]) => ({ method, value, pct: value / total })).sort((a, b) => b.value - a.value);
})();

// Pending liquidations (mock)
const LIQUIDATIONS = [
  { id: 'LQ-2026-04-2H', stylistId: 'p1', stylistName: 'Carlos Restrepo', period: '16 abr — 30 abr', billed: 4250000, pct: 50, commission: 2125000, internal: 85000, advance: 200000, net: 1840000, status: 'Aprobada', services: 38 },
  { id: 'LQ-2026-04-2V', stylistId: 'p2', stylistName: 'Valentina Muñoz', period: '16 abr — 30 abr', billed: 3120000, pct: 40, commission: 1248000, internal: 0, advance: 100000, net: 1148000, status: 'Borrador', services: 32 },
  { id: 'LQ-2026-04-2A', stylistId: 'p3', stylistName: 'Andrés Gómez', period: '16 abr — 30 abr', billed: 1840000, pct: 40, commission: 736000, internal: 0, advance: 0, net: 736000, status: 'Borrador', services: 41 },
  { id: 'LQ-2026-04-2L', stylistId: 'p4', stylistName: 'Luisa Fernanda Ríos', period: '16 abr — 30 abr', billed: 1290000, pct: 40, commission: 516000, internal: 12000, advance: 0, net: 504000, status: 'Pagada', services: 28 },
  { id: 'LQ-2026-04-1C', stylistId: 'p1', stylistName: 'Carlos Restrepo', period: '01 abr — 15 abr', billed: 3980000, pct: 50, commission: 1990000, internal: 95000, advance: 300000, net: 1595000, status: 'Pagada', services: 35 },
];

// Open shift (caja)
const SHIFT = {
  open: true,
  opened_at: '2026-05-02T08:15:00',
  opening_amount: 200000,
  cashier: 'María Fernández',
};

Object.assign(window, {
  SALONS, STYLISTS, SERVICES, PRODUCTS, PAYMENT_METHODS,
  SALES, SALES_TODAY, DAILY_REVENUE, STYLIST_RANK, TOP_SERVICES, PAYMENT_DIST, LIQUIDATIONS, SHIFT,
  COP, COPshort, fmtDate, fmtTime, fmtDateTime,
  kpiToday, kpiWeek, kpiMonth, kpiYesterday,
  TODAY_KEY, NOW_DATE: today,
});
