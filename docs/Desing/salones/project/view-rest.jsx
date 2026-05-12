// SalonPro - remaining views (history, services, inventory, liquidaciones, mi-resumen, caja, reportes, settings)

// ============== HISTORIAL DE VENTAS ==============
const SalesHistory = ({ role }) => {
  const [filterStylist, setFilterStylist] = React.useState('all');
  const [filterMethod, setFilterMethod] = React.useState('all');
  const [filterStatus, setFilterStatus] = React.useState('all');
  const [selectedSale, setSelectedSale] = React.useState(null);

  const filtered = SALES.filter(s => {
    if (filterStylist !== 'all' && s.stylistId !== filterStylist) return false;
    if (filterMethod !== 'all' && s.methodId !== filterMethod) return false;
    if (filterStatus !== 'all' && s.status !== filterStatus) return false;
    return true;
  }).slice(0, 40);

  return (
    <div className="page">
      <PageHead eyebrow="Operación" title={<span><span className="serif">Historial de</span> <span className="serif-italic">ventas</span></span>} deck={`${SALES.length} transacciones · últimos 30 días`} />

      <div className="card" style={{ padding: 16, marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <Icon name="filter" size={14} />
        <span className="eyebrow">Filtros</span>
        <select className="select" style={{ width: 'auto' }} value={filterStylist} onChange={e => setFilterStylist(e.target.value)}>
          <option value="all">Todos los peluqueros</option>
          {STYLISTS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select className="select" style={{ width: 'auto' }} value={filterMethod} onChange={e => setFilterMethod(e.target.value)}>
          <option value="all">Todos los métodos</option>
          {PAYMENT_METHODS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
        </select>
        <select className="select" style={{ width: 'auto' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">Todos los estados</option>
          <option value="Activa">Activa</option>
          <option value="Editada">Editada</option>
          <option value="Anulada">Anulada</option>
        </select>
        <div style={{ flex: 1 }} />
        <button className="btn btn-ghost"><Icon name="download" size={14} /> CSV</button>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="table-wrap">
          <table className="tbl">
            <thead><tr>
              <th>Folio</th><th>Fecha</th><th>Peluquero</th><th>Ítems</th><th>Método</th><th style={{ textAlign: 'right' }}>Total</th><th>Estado</th><th></th>
            </tr></thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} style={{ opacity: s.status === 'Anulada' ? 0.5 : 1, textDecoration: s.status === 'Anulada' ? 'line-through' : 'none' }}>
                  <td className="mono" style={{ fontSize: 12 }}>{s.id}</td>
                  <td>{fmtDateTime(s.date)}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Avatar name={s.stylistName} tone={STYLISTS.find(p => p.id === s.stylistId)?.tone} size="sm" />
                      {s.stylistName}
                    </div>
                  </td>
                  <td style={{ color: 'var(--ink-3)' }}>{s.items.map(i => i.name).join(' · ')}</td>
                  <td>{s.method}</td>
                  <td className="tnum" style={{ textAlign: 'right', fontWeight: 500 }}>{COP(s.total)}</td>
                  <td><StatusPill status={s.status} /></td>
                  <td><button className="btn btn-icon btn-ghost" onClick={() => setSelectedSale(s)}><Icon name="eye" size={14} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedSale && (
        <Modal onClose={() => setSelectedSale(null)}>
          <div style={{ padding: 32 }}>
            <div className="eyebrow">Detalle</div>
            <h3 className="serif" style={{ fontSize: 28, fontWeight: 400, margin: '4px 0 18px' }}>{selectedSale.id}</h3>
            <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}><StatusPill status={selectedSale.status} /><Pill>{selectedSale.method}</Pill></div>
            <div style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 14 }}>{fmtDateTime(selectedSale.date)} · {selectedSale.stylistName}</div>
            <hr className="hr" />
            {selectedSale.items.map(i => (
              <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                <span>{i.name}</span><span className="tnum">{COP(i.price * i.qty)}</span>
              </div>
            ))}
            <hr className="hr" />
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontWeight: 600 }}><span>Total</span><span className="tnum">{COP(selectedSale.total)}</span></div>
            <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost"><Icon name="edit" size={14} /> Editar</button>
              {selectedSale.status === 'Activa' && <button className="btn btn-ghost" style={{ color: 'var(--danger)' }}><Icon name="x" size={14} /> Anular</button>}
              <button className="btn btn-primary" onClick={() => setSelectedSale(null)}>Cerrar</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ============== SERVICIOS ==============
const ServicesView = () => {
  const [services, setServices] = React.useState(SERVICES);
  const cats = Array.from(new Set(SERVICES.map(s => s.category)));
  return (
    <div className="page">
      <PageHead eyebrow="Catálogo" title={<span><span className="serif">Gestión de</span> <span className="serif-italic">servicios</span></span>} deck={`${services.length} servicios activos`}
        right={<button className="btn btn-primary"><Icon name="plus" size={14} /> Nuevo servicio</button>} />

      {cats.map(cat => (
        <div key={cat} style={{ marginBottom: 24 }}>
          <div className="section-header"><h2>{cat}</h2><span className="sub">{services.filter(s => s.category === cat).length} servicios</span></div>
          <div className="card" style={{ overflow: 'hidden' }}>
            <table className="tbl">
              <thead><tr><th>Servicio</th><th>Precio</th><th>Duración</th><th>Historial</th><th>Estado</th><th></th></tr></thead>
              <tbody>
                {services.filter(s => s.category === cat).map(s => (
                  <tr key={s.id}>
                    <td><div style={{ fontWeight: 500 }}>{s.name}</div></td>
                    <td className="tnum serif" style={{ fontSize: 17 }}>{COP(s.price)}</td>
                    <td style={{ color: 'var(--ink-3)' }}>{s.duration} min</td>
                    <td><div style={{ width: 80 }}><Sparkline values={[1, 1.05, 1, 1.1, 1.15, 1.15]} color="var(--accent)" height={20} /></div></td>
                    <td><div className={'toggle ' + (s.active ? 'on' : '')} onClick={() => setServices(services.map(x => x.id === s.id ? { ...x, active: !x.active } : x))} /></td>
                    <td><button className="btn btn-icon btn-ghost"><Icon name="edit" size={14} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};

// ============== INVENTARIO ==============
const InventoryView = () => {
  const [tab, setTab] = React.useState('all');
  const list = tab === 'all' ? PRODUCTS : tab === 'sale' ? PRODUCTS.filter(p => !p.internal) : PRODUCTS.filter(p => p.internal);
  return (
    <div className="page">
      <PageHead eyebrow="Stock" title={<span><span className="serif">Inventario de</span> <span className="serif-italic">productos</span></span>} deck={`${PRODUCTS.length} productos · ${PRODUCTS.filter(p => p.stock <= p.min).length} con stock bajo`}
        right={<>
          <button className="btn btn-ghost"><Icon name="download" size={14} /> Entrada</button>
          <button className="btn btn-primary"><Icon name="plus" size={14} /> Nuevo producto</button>
        </>} />

      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        <button className={'btn btn-sm ' + (tab === 'all' ? 'btn-primary' : 'btn-ghost')} onClick={() => setTab('all')}>Todos</button>
        <button className={'btn btn-sm ' + (tab === 'sale' ? 'btn-primary' : 'btn-ghost')} onClick={() => setTab('sale')}>Venta a cliente</button>
        <button className={'btn btn-sm ' + (tab === 'internal' ? 'btn-primary' : 'btn-ghost')} onClick={() => setTab('internal')}>Consumo interno</button>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <table className="tbl">
          <thead><tr><th>Producto</th><th>Marca</th><th>Tipo</th><th style={{ textAlign: 'right' }}>Compra</th><th style={{ textAlign: 'right' }}>Venta</th><th style={{ textAlign: 'right' }}>Margen</th><th>Stock</th><th></th></tr></thead>
          <tbody>
            {list.map(p => {
              const margin = p.sell > 0 ? ((p.sell - p.buy) / p.sell * 100) : 0;
              const lowStock = p.stock <= p.min;
              return (
                <tr key={p.id}>
                  <td><div style={{ fontWeight: 500 }}>{p.name}</div><div style={{ fontSize: 11, color: 'var(--ink-4)' }}>{p.category}</div></td>
                  <td>{p.brand}</td>
                  <td>{p.internal ? <Pill kind="default">Consumo</Pill> : <Pill kind="accent">Venta</Pill>}</td>
                  <td className="tnum" style={{ textAlign: 'right', color: 'var(--ink-3)' }}>{COP(p.buy)}</td>
                  <td className="tnum" style={{ textAlign: 'right' }}>{p.sell ? COP(p.sell) : '—'}</td>
                  <td className="tnum" style={{ textAlign: 'right', color: margin > 40 ? 'var(--success)' : 'var(--ink-3)' }}>{p.sell ? margin.toFixed(0) + '%' : '—'}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="tnum serif" style={{ fontSize: 17, color: lowStock ? 'var(--warn)' : 'var(--ink)' }}>{p.stock}</span>
                      {lowStock && <Pill kind="warn">Bajo</Pill>}
                    </div>
                    <div className="bar" style={{ width: 80, marginTop: 4 }}><div className="bar-fill" style={{ width: `${Math.min(100, p.stock / (p.min * 3) * 100)}%`, background: lowStock ? 'var(--warn)' : 'var(--ink-3)' }} /></div>
                  </td>
                  <td><button className="btn btn-icon btn-ghost"><Icon name="edit" size={14} /></button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ============== LIQUIDACIONES ==============
const LiquidationsView = () => {
  const [selectedStylist, setSelectedStylist] = React.useState('p1');
  const [period, setPeriod] = React.useState('quincena');
  const stylist = STYLISTS.find(s => s.id === selectedStylist);
  const stylistSales = SALES.filter(s => s.stylistId === selectedStylist && s.status !== 'Anulada').slice(0, 12);
  const billed = stylistSales.reduce((acc, s) => acc + s.total, 0);
  const commission = stylistSales.reduce((acc, s) => acc + s.partStylist, 0);
  const internal = 85000;
  const advance = 200000;
  const net = commission - internal - advance;

  return (
    <div className="page">
      <PageHead eyebrow="Comisiones" title={<span><span className="serif">Liquidación de</span> <span className="serif-italic">peluqueros</span></span>} deck="Genera y aprueba pagos por período" />

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16 }}>
        <div className="card" style={{ padding: 20 }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Peluquero</div>
          {STYLISTS.map(s => (
            <button key={s.id} className={'tile' + (selectedStylist === s.id ? ' selected' : '')} onClick={() => setSelectedStylist(s.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, marginBottom: 6, width: '100%' }}>
              <Avatar name={s.name} tone={s.tone} size="sm" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{s.name}</div>
                <div className="tile-meta" style={{ fontSize: 10 }}>{s.role} · {s.pct}%</div>
              </div>
            </button>
          ))}

          <hr className="hr" style={{ margin: '20px 0 14px' }} />

          <div className="eyebrow" style={{ marginBottom: 10 }}>Período</div>
          {[['hoy', 'Hoy'], ['semana', 'Esta semana'], ['quincena', 'Esta quincena'], ['mes', 'Este mes'], ['custom', 'Personalizado']].map(([k, lbl]) => (
            <div key={k} className="nav-item" style={{ padding: '7px 10px', background: period === k ? 'var(--ink)' : 'transparent', color: period === k ? 'var(--bone)' : 'var(--ink-2)' }} onClick={() => setPeriod(k)}>
              <Icon name="calendar" size={13} /><span>{lbl}</span>
            </div>
          ))}
        </div>

        <div>
          <div className="card" style={{ padding: 28, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <div className="eyebrow">Liquidación · 16 abr — 30 abr 2026</div>
                <h2 className="serif" style={{ fontSize: 32, fontWeight: 400, margin: '6px 0 4px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar name={stylist.name} tone={stylist.tone} size="lg" />
                  {stylist.name}
                </h2>
                <div style={{ color: 'var(--ink-3)', fontSize: 13 }}>{stylist.role} · {stylistSales.length} servicios · {stylist.pct}% comisión</div>
              </div>
              <StatusPill status="Borrador" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
              <div style={{ padding: 16, background: 'var(--bone)', borderRadius: 6 }}>
                <div className="eyebrow">Total facturado</div>
                <div className="serif tnum" style={{ fontSize: 26, marginTop: 4 }}>{COPshort(billed)}</div>
              </div>
              <div style={{ padding: 16, background: 'var(--bone)', borderRadius: 6 }}>
                <div className="eyebrow">Comisión</div>
                <div className="serif tnum" style={{ fontSize: 26, marginTop: 4 }}>{COPshort(commission)}</div>
              </div>
              <div style={{ padding: 16, background: 'var(--ink)', color: 'var(--bone)', borderRadius: 6 }}>
                <div className="eyebrow" style={{ color: 'var(--ink-5)' }}>Neto a pagar</div>
                <div className="serif tnum" style={{ fontSize: 26, marginTop: 4 }}>{COPshort(net)}</div>
              </div>
            </div>

            <div className="receipt" style={{ background: 'var(--bone)' }}>
              <div className="row"><span style={{ color: 'var(--ink-3)' }}>Facturado en período</span><span className="tnum">{COP(billed)}</span></div>
              <div className="row"><span style={{ color: 'var(--ink-3)' }}>× comisión {stylist.pct}%</span><span className="tnum">{COP(commission)}</span></div>
              <hr className="hr-dotted" style={{ margin: '8px 0' }} />
              <div className="row"><span style={{ color: 'var(--ink-3)' }}>(−) Consumo interno</span><span className="tnum" style={{ color: 'var(--danger)' }}>−{COP(internal)}</span></div>
              <div className="row"><span style={{ color: 'var(--ink-3)' }}>(−) Anticipos entregados</span><span className="tnum" style={{ color: 'var(--danger)' }}>−{COP(advance)}</span></div>
              <div className="row total"><span>Neto a pagar</span><span className="tnum serif" style={{ fontSize: 22 }}>{COP(net)}</span></div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost"><Icon name="download" size={14} /> Exportar PDF</button>
              <button className="btn btn-ghost">Guardar borrador</button>
              <button className="btn btn-primary"><Icon name="check" size={14} /> Aprobar</button>
              <button className="btn btn-accent"><Icon name="cash" size={14} /> Marcar pagada</button>
            </div>
          </div>

          <div className="card" style={{ padding: 24 }}>
            <div className="eyebrow" style={{ marginBottom: 12 }}>Detalle de ventas en período · {stylistSales.length} servicios</div>
            <div className="table-wrap">
              <table className="tbl">
                <thead><tr><th>Fecha</th><th>Folio</th><th>Servicio</th><th style={{ textAlign: 'right' }}>Total</th><th>%</th><th style={{ textAlign: 'right' }}>Comisión</th></tr></thead>
                <tbody>
                  {stylistSales.slice(0, 8).map(s => (
                    <tr key={s.id}>
                      <td>{fmtDate(s.date)}</td>
                      <td className="mono" style={{ fontSize: 11 }}>{s.id}</td>
                      <td>{s.items[0]?.name}</td>
                      <td className="tnum" style={{ textAlign: 'right' }}>{COP(s.total)}</td>
                      <td>{s.pct}%</td>
                      <td className="tnum" style={{ textAlign: 'right', color: 'var(--accent-deep)', fontWeight: 500 }}>{COP(s.partStylist)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card" style={{ padding: 24, marginTop: 16 }}>
            <div className="eyebrow" style={{ marginBottom: 12 }}>Liquidaciones anteriores</div>
            <div className="table-wrap">
              <table className="tbl">
                <thead><tr><th>ID</th><th>Período</th><th>Servicios</th><th style={{ textAlign: 'right' }}>Comisión</th><th style={{ textAlign: 'right' }}>Neto</th><th>Estado</th></tr></thead>
                <tbody>
                  {LIQUIDATIONS.filter(l => l.stylistId === selectedStylist).map(l => (
                    <tr key={l.id}>
                      <td className="mono" style={{ fontSize: 11 }}>{l.id}</td>
                      <td>{l.period}</td>
                      <td>{l.services}</td>
                      <td className="tnum" style={{ textAlign: 'right' }}>{COP(l.commission)}</td>
                      <td className="tnum" style={{ textAlign: 'right', fontWeight: 500 }}>{COP(l.net)}</td>
                      <td><StatusPill status={l.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============== MI RESUMEN (Stylist) ==============
const MyDashboard = ({ stylistId = 'p1' }) => {
  const me = STYLISTS.find(s => s.id === stylistId);
  const myToday = SALES.filter(s => s.stylistId === stylistId && s.status !== 'Anulada' && s.date.slice(0, 10) === TODAY_KEY);
  const myWeek = SALES.filter(s => {
    if (s.stylistId !== stylistId || s.status === 'Anulada') return false;
    const diff = (NOW_DATE - new Date(s.date)) / (1000 * 60 * 60 * 24);
    return diff <= 7;
  });
  const myMonth = SALES.filter(s => s.stylistId === stylistId && s.status !== 'Anulada');
  const todayCommission = myToday.reduce((s, x) => s + x.partStylist, 0);
  const weekCommission = myWeek.reduce((s, x) => s + x.partStylist, 0);
  const monthCommission = myMonth.reduce((s, x) => s + x.partStylist, 0);

  // Daily by-day for current month
  const monthByDay = {};
  myMonth.forEach(s => { const k = s.date.slice(0, 10); monthByDay[k] = (monthByDay[k] || 0) + s.partStylist; });
  const monthData = Object.entries(monthByDay).sort((a, b) => a[0].localeCompare(b[0])).map(([k, v]) => ({ label: fmtDate(k), value: v }));

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
        <Avatar name={me.name} tone={me.tone} size="xl" />
        <div>
          <div className="eyebrow">Mi resumen · {fmtDate(NOW_DATE.toISOString())}</div>
          <h1 className="serif" style={{ fontSize: 44, fontWeight: 300, margin: '4px 0 4px', letterSpacing: '-0.025em' }}>
            <span>Hola,</span> <span className="serif-italic" style={{ color: 'var(--accent)' }}>{me.name.split(' ')[0]}</span>
          </h1>
          <div style={{ color: 'var(--ink-3)', fontSize: 13 }}>{me.role} · comisión {me.pct}% · desde {me.since}</div>
        </div>
      </div>

      <div className="card" style={{ padding: 32, background: 'var(--ink)', color: 'var(--bone)', marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
        <div className="eyebrow" style={{ color: 'var(--ink-5)' }}>Acumulado quincena · 16 abr — hoy</div>
        <div className="ticker" style={{ fontSize: 96, fontWeight: 200, margin: '8px 0 4px', lineHeight: 1 }}>{COP(weekCommission * 2)}</div>
        <div style={{ fontSize: 13, color: 'var(--ink-5)' }}>{myMonth.length} servicios prestados · próxima liquidación 30 abr</div>
        <div style={{ position: 'absolute', right: 32, top: 32, opacity: 0.4 }}>
          <Sparkline values={Object.values(monthByDay)} color="var(--accent)" height={80} fill />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
        <KPI label="Hoy" value={todayCommission} delta={8.4} sub={myToday.length + ' servicios'} plain />
        <KPI label="Esta semana" value={weekCommission} delta={11.2} sub={myWeek.length + ' servicios'} plain />
        <KPI label="Este mes" value={monthCommission} delta={5.6} sub={myMonth.length + ' servicios'} plain />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16 }}>
        <div className="card" style={{ padding: 24 }}>
          <div className="eyebrow" style={{ marginBottom: 4 }}>Rendimiento mensual</div>
          <h3 className="serif" style={{ margin: '4px 0 18px', fontSize: 22, fontWeight: 400 }}>Comisión por día</h3>
          <Bars data={monthData} accentIdx={monthData.length - 1} />
        </div>

        <div className="card" style={{ padding: 24 }}>
          <div className="eyebrow" style={{ marginBottom: 4 }}>Hoy</div>
          <h3 className="serif" style={{ margin: '4px 0 14px', fontSize: 22, fontWeight: 400 }}>Servicios prestados</h3>
          {myToday.length === 0 ? (
            <div style={{ color: 'var(--ink-4)', fontSize: 13 }}>Aún no hay servicios registrados hoy</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {myToday.slice(0, 6).map(s => (
                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed var(--hair-2)' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{s.items[0]?.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>{fmtTime(s.date)} · {s.method}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="serif tnum" style={{ fontSize: 16, color: 'var(--accent-deep)' }}>{COPshort(s.partStylist)}</div>
                    <div style={{ fontSize: 10, color: 'var(--ink-4)' }}>{s.pct}% de {COPshort(s.total)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: 24, marginTop: 16 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>Mis liquidaciones pagadas</div>
        <table className="tbl">
          <thead><tr><th>Período</th><th>Servicios</th><th style={{ textAlign: 'right' }}>Facturado</th><th style={{ textAlign: 'right' }}>Neto cobrado</th><th>Estado</th></tr></thead>
          <tbody>
            {LIQUIDATIONS.filter(l => l.stylistId === stylistId).map(l => (
              <tr key={l.id}>
                <td>{l.period}</td><td>{l.services}</td>
                <td className="tnum" style={{ textAlign: 'right' }}>{COP(l.billed)}</td>
                <td className="tnum" style={{ textAlign: 'right', fontWeight: 500 }}>{COP(l.net)}</td>
                <td><StatusPill status={l.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ============== CAJA ==============
const CajaView = () => {
  const [openShift, setOpenShift] = React.useState(true);
  const todaySales = SALES_TODAY.filter(s => s.status !== 'Anulada');
  const total = todaySales.reduce((s, x) => s + x.total, 0);
  const byMethod = {};
  todaySales.forEach(s => { byMethod[s.method] = (byMethod[s.method] || 0) + s.total; });
  const expectedCash = (byMethod['Efectivo'] || 0) + SHIFT.opening_amount;
  const [declared, setDeclared] = React.useState(expectedCash);
  const diff = declared - expectedCash;

  return (
    <div className="page">
      <PageHead eyebrow="Caja" title={<span><span className="serif">Apertura y</span> <span className="serif-italic">cierre</span></span>} deck={openShift ? `Turno abierto · ${fmtTime(SHIFT.opened_at)}` : 'No hay turno activo'} />

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
        <div>
          <div className="card" style={{ padding: 28, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 className="serif" style={{ margin: 0, fontSize: 24, fontWeight: 400 }}>Resumen del turno</h3>
              <Pill kind={openShift ? 'success' : 'default'}><span className="pill-dot" />{openShift ? 'Abierto' : 'Cerrado'}</Pill>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
              <div style={{ padding: 14, background: 'var(--bone)', borderRadius: 6 }}>
                <div className="eyebrow">Apertura</div>
                <div className="serif tnum" style={{ fontSize: 22, marginTop: 4 }}>{COP(SHIFT.opening_amount)}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>{fmtTime(SHIFT.opened_at)}</div>
              </div>
              <div style={{ padding: 14, background: 'var(--bone)', borderRadius: 6 }}>
                <div className="eyebrow">Ventas</div>
                <div className="serif tnum" style={{ fontSize: 22, marginTop: 4 }}>{COP(total)}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>{todaySales.length} transacciones</div>
              </div>
              <div style={{ padding: 14, background: 'var(--ink)', color: 'var(--bone)', borderRadius: 6 }}>
                <div className="eyebrow" style={{ color: 'var(--ink-5)' }}>Esperado en caja</div>
                <div className="serif tnum" style={{ fontSize: 22, marginTop: 4 }}>{COP(expectedCash)}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-5)' }}>Efectivo + apertura</div>
              </div>
            </div>

            <div className="eyebrow" style={{ marginBottom: 10 }}>Desglose por método</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Object.entries(byMethod).map(([method, value]) => (
                <div key={method} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bone)', borderRadius: 6 }}>
                  <span style={{ fontSize: 13 }}>{method}</span>
                  <span className="tnum serif" style={{ fontSize: 16 }}>{COP(value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 28, position: 'sticky', top: 28, alignSelf: 'flex-start' }}>
          <div className="eyebrow">Cierre de caja</div>
          <h3 className="serif" style={{ margin: '4px 0 18px', fontSize: 22, fontWeight: 400 }}>Declarar efectivo</h3>

          <label className="field" style={{ marginBottom: 14 }}>
            <span className="label">Efectivo contado</span>
            <input className="input mono" type="number" value={declared} onChange={e => setDeclared(Number(e.target.value))} style={{ fontSize: 18 }} />
          </label>

          <div style={{ padding: 14, background: 'var(--bone)', borderRadius: 6, marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--ink-3)' }}>Esperado</span>
              <span className="tnum">{COP(expectedCash)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginTop: 4 }}>
              <span style={{ color: 'var(--ink-3)' }}>Declarado</span>
              <span className="tnum">{COP(declared)}</span>
            </div>
            <hr className="hr-dotted" style={{ margin: '8px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: diff === 0 ? 'var(--success)' : diff > 0 ? 'var(--accent-deep)' : 'var(--danger)' }}>
              <span>{diff > 0 ? 'Sobrante' : diff < 0 ? 'Faltante' : 'Cuadrado'}</span>
              <span className="tnum">{COP(Math.abs(diff))}</span>
            </div>
          </div>

          <button className="btn btn-accent btn-lg" style={{ width: '100%' }} onClick={() => setOpenShift(false)}><Icon name="check" size={14} /> Cerrar turno</button>
        </div>
      </div>
    </div>
  );
};

// ============== REPORTES ==============
const ReportsView = () => {
  return (
    <div className="page">
      <PageHead eyebrow="Análisis" title={<span><span className="serif">Reportes y</span> <span className="serif-italic">métricas</span></span>} deck="Comparativos · tendencias · clientes" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 16 }}>
        <div className="card" style={{ padding: 24 }}>
          <div className="eyebrow">Ingresos por peluquero · este mes</div>
          <h3 className="serif" style={{ margin: '4px 0 18px', fontSize: 22, fontWeight: 400 }}>Comparativo</h3>
          {STYLIST_RANK.map(p => {
            const max = STYLIST_RANK[0].total;
            return (
              <div key={p.id} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</span>
                  <span className="tnum" style={{ fontSize: 13 }}>{COP(p.total)}</span>
                </div>
                <div className="bar"><div className="bar-fill" style={{ width: `${(p.total / max) * 100}%`, background: p.tone }} /></div>
              </div>
            );
          })}
        </div>

        <div className="card" style={{ padding: 24 }}>
          <div className="eyebrow">Mes actual vs mes anterior</div>
          <h3 className="serif" style={{ margin: '4px 0 18px', fontSize: 22, fontWeight: 400 }}>Comparativo</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div style={{ padding: 14, background: 'var(--bone)', borderRadius: 6 }}>
              <div className="eyebrow">Mes actual</div>
              <div className="serif tnum" style={{ fontSize: 26, marginTop: 4 }}>{COPshort(kpiMonth)}</div>
            </div>
            <div style={{ padding: 14, background: 'var(--bone)', borderRadius: 6 }}>
              <div className="eyebrow">Mes anterior</div>
              <div className="serif tnum" style={{ fontSize: 26, marginTop: 4, color: 'var(--ink-3)' }}>{COPshort(kpiMonth * 0.92)}</div>
            </div>
          </div>
          <Sparkline values={DAILY_REVENUE.map(d => d.value)} color="var(--accent)" fill height={80} />
          <div style={{ fontSize: 12, color: 'var(--success)', marginTop: 8 }}>↑ 8.1% vs abril</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
        <div className="card" style={{ padding: 24 }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Servicios más vendidos</div>
          {TOP_SERVICES.slice(0, 5).map((s, i) => (
            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed var(--hair-2)' }}>
              <span style={{ fontSize: 13 }}>{i + 1}. {s.name}</span>
              <span className="tnum" style={{ fontSize: 13 }}>{s.count}×</span>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: 24 }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Productos · venta vs consumo</div>
          {PRODUCTS.map(p => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed var(--hair-2)' }}>
              <span style={{ fontSize: 13, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
              <span style={{ fontSize: 11 }}>{p.internal ? <Pill>Consumo</Pill> : <Pill kind="accent">Venta</Pill>}</span>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: 24 }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Horarios pico</div>
          <div className="bars" style={{ height: 100 }}>
            {[2, 4, 8, 14, 18, 22, 24, 20, 16, 19, 24, 18, 12, 6].map((v, i) => (
              <div key={i} className="b" style={{ height: `${(v / 24) * 100}%`, background: i === 6 || i === 10 ? 'var(--accent)' : 'var(--ink)' }} />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--ink-4)', marginTop: 8 }}>
            <span>9am</span><span>1pm</span><span>5pm</span><span>9pm</span>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 24 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>Clientes frecuentes</div>
        <table className="tbl">
          <thead><tr><th>Cliente</th><th>Visitas</th><th>Servicio favorito</th><th style={{ textAlign: 'right' }}>Gastado</th><th>Última visita</th></tr></thead>
          <tbody>
            {[
              ['María José Cárdenas', 8, 'Mechas', 960000, '28 abr'],
              ['Juliana Restrepo', 6, 'Tintura', 520000, '24 abr'],
              ['Felipe Ortiz', 5, 'Corte + Barba', 185000, '30 abr'],
              ['Camila Henao', 4, 'Alisado', 600000, '15 abr'],
            ].map(([name, visits, fav, spent, last]) => (
              <tr key={name}>
                <td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Avatar name={name} size="sm" tone="oklch(0.55 0.05 50)" />{name}</div></td>
                <td>{visits}</td>
                <td style={{ color: 'var(--ink-3)' }}>{fav}</td>
                <td className="tnum" style={{ textAlign: 'right', fontWeight: 500 }}>{COP(spent)}</td>
                <td style={{ color: 'var(--ink-3)' }}>{last}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ============== CONFIGURACIÓN ==============
const SettingsView = () => {
  const [tab, setTab] = React.useState('salon');
  return (
    <div className="page">
      <PageHead eyebrow="Sistema" title={<span><span className="serif">Configuración del</span> <span className="serif-italic">salón</span></span>} deck="Datos · usuarios · políticas" />

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 24 }}>
        <div>
          {[['salon', 'Datos del salón', 'building'], ['users', 'Usuarios', 'user'], ['commissions', 'Comisiones', 'sliders'], ['policies', 'Políticas', 'gear'], ['payments', 'Métodos de pago', 'card']].map(([k, lbl, icon]) => (
            <div key={k} className={'nav-item' + (tab === k ? ' active' : '')} onClick={() => setTab(k)}>
              <Icon name={icon} size={14} /><span>{lbl}</span>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: 32 }}>
          {tab === 'salon' && <SettingsSalon />}
          {tab === 'users' && <SettingsUsers />}
          {tab === 'commissions' && <SettingsCommissions />}
          {tab === 'policies' && <SettingsPolicies />}
          {tab === 'payments' && <SettingsPayments />}
        </div>
      </div>
    </div>
  );
};

const SettingsSalon = () => (
  <>
    <div className="eyebrow">Datos del salón</div>
    <h3 className="serif" style={{ margin: '4px 0 24px', fontSize: 26, fontWeight: 400 }}>Información general</h3>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
      <label className="field"><span className="label">Nombre comercial</span><input className="input" defaultValue="Studio 54 Hair & Beauty" /></label>
      <label className="field"><span className="label">Razón social</span><input className="input" defaultValue="Estudio 54 SAS" /></label>
      <label className="field"><span className="label">Dirección</span><input className="input" defaultValue="Cra. 11 #93-07, Chapinero" /></label>
      <label className="field"><span className="label">Ciudad</span><input className="input" defaultValue="Bogotá" /></label>
      <label className="field"><span className="label">Teléfono</span><input className="input" defaultValue="+57 320 555 0154" /></label>
      <label className="field"><span className="label">NIT</span><input className="input" defaultValue="900.123.456-7" /></label>
    </div>
    <hr className="hr" style={{ margin: '24px 0' }} />
    <div className="eyebrow" style={{ marginBottom: 12 }}>Logo</div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ width: 80, height: 80, background: 'var(--ink)', color: 'var(--bone)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Fraunces', fontSize: 24, fontWeight: 300 }}>S<span style={{ color: 'var(--accent)' }}>54</span></div>
      <button className="btn btn-ghost"><Icon name="download" size={14} /> Cambiar logo</button>
    </div>
  </>
);

const SettingsUsers = () => (
  <>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18 }}>
      <div>
        <div className="eyebrow">Equipo</div>
        <h3 className="serif" style={{ margin: '4px 0 0', fontSize: 26, fontWeight: 400 }}>Usuarios y accesos</h3>
      </div>
      <button className="btn btn-primary"><Icon name="plus" size={14} /> Invitar usuario</button>
    </div>
    <table className="tbl">
      <thead><tr><th>Nombre</th><th>Rol</th><th>Comisión</th><th>Estado</th><th></th></tr></thead>
      <tbody>
        <tr><td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Avatar name="Sofía Mejía" tone="oklch(0.45 0.10 30)" />Sofía Mejía</div></td><td>Dueña</td><td>—</td><td><Pill kind="success"><span className="pill-dot" />Activa</Pill></td><td><button className="btn btn-icon btn-ghost"><Icon name="edit" size={14} /></button></td></tr>
        <tr><td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Avatar name="María Fernández" tone="oklch(0.55 0.07 25)" />María Fernández</div></td><td>Cajera</td><td>—</td><td><Pill kind="success"><span className="pill-dot" />Activa</Pill></td><td><button className="btn btn-icon btn-ghost"><Icon name="edit" size={14} /></button></td></tr>
        {STYLISTS.map(s => (
          <tr key={s.id}><td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Avatar name={s.name} tone={s.tone} />{s.name}</div></td><td>{s.role}</td><td className="tnum">{s.pct}%</td><td><Pill kind="success"><span className="pill-dot" />Activa</Pill></td><td><button className="btn btn-icon btn-ghost"><Icon name="edit" size={14} /></button></td></tr>
        ))}
      </tbody>
    </table>
  </>
);

const SettingsCommissions = () => (
  <>
    <div className="eyebrow">Reglas</div>
    <h3 className="serif" style={{ margin: '4px 0 24px', fontSize: 26, fontWeight: 400 }}>Comisiones</h3>
    <div style={{ padding: 16, background: 'var(--bone)', borderRadius: 6, marginBottom: 18 }}>
      <div className="eyebrow" style={{ marginBottom: 8 }}>Por defecto</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, marginBottom: 4 }}>Salón / Peluquero</div>
          <div className="bar" style={{ height: 28, borderRadius: 4 }}>
            <div className="bar-fill" style={{ width: '60%', background: 'var(--ink)' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 11 }}><span>60% Salón</span><span>40% Peluquero</span></div>
        </div>
      </div>
    </div>
    <div className="eyebrow" style={{ marginBottom: 12 }}>Excepciones por peluquero</div>
    {STYLISTS.map(s => (
      <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 14px', borderBottom: '1px dashed var(--hair-2)' }}>
        <Avatar name={s.name} tone={s.tone} size="sm" />
        <div style={{ flex: 1, fontSize: 13 }}>{s.name}</div>
        <input className="input mono" style={{ width: 80 }} defaultValue={s.pct} />
        <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>%</span>
      </div>
    ))}
  </>
);

const SettingsPolicies = () => {
  const [internalDeduct, setInternalDeduct] = React.useState(true);
  const [requireClient, setRequireClient] = React.useState(false);
  return (
    <>
      <div className="eyebrow">Reglas operativas</div>
      <h3 className="serif" style={{ margin: '4px 0 24px', fontSize: 26, fontWeight: 400 }}>Políticas</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <SettingRow label="Descontar consumo interno en liquidación" desc="Restar el costo de los productos aplicados por el peluquero al calcular su comisión" on={internalDeduct} setOn={setInternalDeduct} />
        <SettingRow label="Cliente obligatorio en cada venta" desc="Forzar registro de nombre o teléfono del cliente al cerrar la venta" on={requireClient} setOn={setRequireClient} />
        <SettingRow label="Permitir editar precio de servicios en el POS" desc="El cajero puede ajustar el precio precargado del servicio en cada venta" on={true} setOn={() => {}} />
        <SettingRow label="Imprimir recibo automáticamente" desc="Al confirmar una venta, enviar a la impresora térmica" on={false} setOn={() => {}} />
      </div>
    </>
  );
};
const SettingRow = ({ label, desc, on, setOn }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16, background: 'var(--bone)', borderRadius: 6 }}>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{desc}</div>
    </div>
    <div className={'toggle ' + (on ? 'on' : '')} onClick={() => setOn(!on)} />
  </div>
);

const SettingsPayments = () => (
  <>
    <div className="eyebrow">Métodos habilitados</div>
    <h3 className="serif" style={{ margin: '4px 0 24px', fontSize: 26, fontWeight: 400 }}>Pagos aceptados</h3>
    {PAYMENT_METHODS.map(m => (
      <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, borderBottom: '1px dashed var(--hair-2)' }}>
        <div style={{ width: 36, height: 36, background: 'var(--bone)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={m.icon} size={16} /></div>
        <div style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{m.label}</div>
        <div className="toggle on" />
      </div>
    ))}
  </>
);

Object.assign(window, { SalesHistory, ServicesView, InventoryView, LiquidationsView, MyDashboard, CajaView, ReportsView, SettingsView });
