// SalonPro - Dashboard (Owner)

const Dashboard = () => {
  const dailyValues = DAILY_REVENUE.map(d => d.value);
  const yesterdayDelta = ((kpiToday - kpiYesterday) / Math.max(kpiYesterday, 1)) * 100;
  const lowStock = PRODUCTS.filter(p => p.stock <= p.min);
  const pendingClosures = 1;

  return (
    <div className="page">
      <PageHead
        eyebrow="Hoy · jueves 2 de mayo"
        title={<><span className="serif">Buenos días,</span> <span className="serif-italic">Sofía</span></>}
        deck="Studio 54 Hair & Beauty · Chapinero"
        right={<>
          <button className="btn btn-ghost"><Icon name="download" size={14} /> Exportar</button>
          <button className="btn btn-primary"><Icon name="plus" size={14} /> Nueva venta</button>
        </>}
      />

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        <KPI label="Ingresos hoy" value={kpiToday} delta={yesterdayDelta} sub="vs ayer" series={dailyValues.slice(-14)} />
        <KPI label="Esta semana" value={kpiWeek} delta={12.4} sub="vs sem. anterior" series={dailyValues.slice(-7)} />
        <KPI label="Este mes" value={kpiMonth} delta={8.1} sub="vs abril" series={dailyValues} />
        <KPI label="Ticket promedio" value={Math.round(kpiMonth / SALES.filter(s => s.status !== 'Anulada').length)} delta={3.2} sub="vs mes anterior" plain />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Revenue chart */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 4 }}>Últimos 30 días</div>
              <h3 className="serif" style={{ margin: 0, fontSize: 22, fontWeight: 400 }}>Ingresos diarios</h3>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-sm btn-ghost">30D</button>
              <button className="btn btn-sm">90D</button>
              <button className="btn btn-sm">YTD</button>
            </div>
          </div>
          <RevenueChart data={DAILY_REVENUE} />
        </div>

        {/* Top stylists */}
        <div className="card" style={{ padding: 24 }}>
          <div className="eyebrow" style={{ marginBottom: 4 }}>Ranking del mes</div>
          <h3 className="serif" style={{ margin: '0 0 18px', fontSize: 22, fontWeight: 400 }}>Equipo</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {STYLIST_RANK.map((p, i) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="serif tnum" style={{ width: 18, fontSize: 16, color: 'var(--ink-3)' }}>{i + 1}</span>
                <Avatar name={p.name} tone={p.tone} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>{p.services} servicios</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="serif tnum" style={{ fontSize: 16 }}>{COPshort(p.total)}</div>
                  <div style={{ fontSize: 10, color: 'var(--ink-4)' }}>com. {COPshort(p.commission)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Top services */}
        <div className="card" style={{ padding: 24 }}>
          <div className="eyebrow" style={{ marginBottom: 4 }}>Más solicitados</div>
          <h3 className="serif" style={{ margin: '0 0 18px', fontSize: 20, fontWeight: 400 }}>Servicios</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {TOP_SERVICES.slice(0, 5).map((s, i) => {
              const max = TOP_SERVICES[0].count;
              return (
                <div key={s.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span>{s.name}</span>
                    <span className="tnum" style={{ color: 'var(--ink-3)' }}>{s.count}</span>
                  </div>
                  <div className="bar"><div className="bar-fill" style={{ width: `${(s.count / max) * 100}%`, background: i === 0 ? 'var(--accent)' : 'var(--ink-3)' }} /></div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment distribution */}
        <div className="card" style={{ padding: 24 }}>
          <div className="eyebrow" style={{ marginBottom: 4 }}>Distribución</div>
          <h3 className="serif" style={{ margin: '0 0 18px', fontSize: 20, fontWeight: 400 }}>Métodos de pago</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <Donut data={PAYMENT_DIST} colors={['oklch(0.62 0.13 40)', 'oklch(0.45 0.04 60)', 'oklch(0.70 0.10 70)', 'oklch(0.55 0.10 145)', 'oklch(0.50 0.16 250)']} />
            <div style={{ flex: 1, fontSize: 12 }}>
              {PAYMENT_DIST.map((p, i) => {
                const colors = ['oklch(0.62 0.13 40)', 'oklch(0.45 0.04 60)', 'oklch(0.70 0.10 70)', 'oklch(0.55 0.10 145)', 'oklch(0.50 0.16 250)'];
                return (
                  <div key={p.method} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: colors[i] }} />
                      {p.method}
                    </span>
                    <span className="tnum">{(p.pct * 100).toFixed(0)}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="card" style={{ padding: 24 }}>
          <div className="eyebrow" style={{ marginBottom: 4, color: 'var(--accent-deep)' }}>Atención</div>
          <h3 className="serif" style={{ margin: '0 0 14px', fontSize: 20, fontWeight: 400 }}>Alertas</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {lowStock.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'var(--warn-soft)', borderRadius: 6 }}>
                <Icon name="alert" size={14} />
                <div style={{ fontSize: 12, flex: 1 }}>
                  <div style={{ fontWeight: 500 }}>{p.name}</div>
                  <div style={{ color: 'var(--ink-3)', fontSize: 11 }}>Stock {p.stock} · mínimo {p.min}</div>
                </div>
              </div>
            ))}
            {pendingClosures > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'var(--accent-soft)', borderRadius: 6 }}>
                <Icon name="cash" size={14} />
                <div style={{ fontSize: 12, flex: 1 }}>
                  <div style={{ fontWeight: 500 }}>Caja sin cerrar</div>
                  <div style={{ color: 'var(--ink-3)', fontSize: 11 }}>Turno de María · abierta hace 10h</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const KPI = ({ label, value, delta, sub, series, plain }) => {
  const up = delta >= 0;
  return (
    <div className="kpi">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value tnum">{COP(value)}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div className={'kpi-delta ' + (up ? 'up' : 'down')}>
          {up ? '↑' : '↓'} {Math.abs(delta).toFixed(1)}% <span style={{ color: 'var(--ink-4)' }}>{sub}</span>
        </div>
        {!plain && series && <div style={{ width: 80 }}><Sparkline values={series} color="var(--accent)" fill height={24} /></div>}
      </div>
    </div>
  );
};

const RevenueChart = ({ data }) => {
  const max = Math.max(...data.map(d => d.value));
  const min = Math.min(...data.map(d => d.value));
  const w = 800, h = 220;
  const px = (i) => (i / (data.length - 1)) * w;
  const py = (v) => h - ((v - min) / (max - min)) * (h - 30) - 15;
  const path = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${px(i)},${py(d.value)}`).join(' ');
  const area = path + ` L${w},${h} L0,${h} Z`;
  const todayIdx = data.length - 1;
  return (
    <svg viewBox={`0 0 ${w} ${h + 30}`} style={{ width: '100%', height: 260, display: 'block' }}>
      <defs>
        <linearGradient id="rev-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.20" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* gridlines */}
      {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
        <line key={i} x1="0" y1={15 + p * (h - 30)} x2={w} y2={15 + p * (h - 30)} stroke="var(--hair-2)" strokeDasharray="2 4" />
      ))}
      <path d={area} fill="url(#rev-grad)" />
      <path d={path} stroke="var(--accent)" strokeWidth="1.6" fill="none" />
      {/* points */}
      {data.map((d, i) => i % 5 === 0 ? <circle key={i} cx={px(i)} cy={py(d.value)} r="2" fill="var(--accent)" /> : null)}
      <circle cx={px(todayIdx)} cy={py(data[todayIdx].value)} r="4" fill="var(--ink)" />
      <circle cx={px(todayIdx)} cy={py(data[todayIdx].value)} r="8" fill="none" stroke="var(--ink)" strokeOpacity="0.2" />
      {/* x-axis labels */}
      {[0, 7, 14, 21, 29].map(i => (
        <text key={i} x={px(i)} y={h + 18} fill="var(--ink-4)" fontSize="10" textAnchor="middle" fontFamily="JetBrains Mono">
          {fmtDate(data[i].date)}
        </text>
      ))}
    </svg>
  );
};

window.Dashboard = Dashboard;
