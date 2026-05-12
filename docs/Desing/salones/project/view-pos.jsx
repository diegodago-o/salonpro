// SalonPro - POS wizard (the hero)

const POS = ({ onComplete }) => {
  const [step, setStep] = React.useState(0);
  const [stylist, setStylist] = React.useState(null);
  const [services, setServices] = React.useState([]); // { id, name, price, qty }
  const [products, setProducts] = React.useState([]); // sold to client
  const [internal, setInternal] = React.useState([]); // internal consumption
  const [pct, setPct] = React.useState(40);
  const [client, setClient] = React.useState({ name: '', phone: '' });
  const [payments, setPayments] = React.useState([{ method: 'efectivo', amount: 0 }]);
  const [confirmed, setConfirmed] = React.useState(false);
  const [saleId] = React.useState('V-' + Math.floor(2000 + Math.random() * 999));

  const total = [...services, ...products].reduce((s, x) => s + x.price * x.qty, 0);
  const partStylist = Math.round(total * pct / 100);
  const partSalon = total - partStylist;

  const stepInfo = [
    { key: 'stylist', n: '01', title: 'Peluquero', sub: '¿Quién prestará el servicio?' },
    { key: 'services', n: '02', title: 'Servicios', sub: 'Agrega los servicios a facturar' },
    { key: 'products', n: '03', title: 'Productos', sub: 'Venta a cliente o consumo interno' },
    { key: 'payment', n: '04', title: 'Pago', sub: 'Método y desglose' },
    { key: 'confirm', n: '05', title: 'Confirmar', sub: 'Revisa antes de registrar' },
  ];

  const canNext = () => {
    if (step === 0) return !!stylist;
    if (step === 1) return services.length > 0;
    if (step === 3) return Math.abs(payments.reduce((s, p) => s + (Number(p.amount) || 0), 0) - total) < 0.01;
    return true;
  };

  React.useEffect(() => {
    if (stylist) setPct(stylist.pct);
  }, [stylist]);

  // Auto-fill payment when entering payment step
  React.useEffect(() => {
    if (step === 3 && payments.length === 1 && payments[0].amount === 0) {
      setPayments([{ method: payments[0].method, amount: total }]);
    }
  }, [step]);

  const reset = () => {
    setStep(0); setStylist(null); setServices([]); setProducts([]); setInternal([]); setClient({ name: '', phone: '' }); setPayments([{ method: 'efectivo', amount: 0 }]); setConfirmed(false);
  };

  if (confirmed) {
    return <PosSuccess saleId={saleId} stylist={stylist} services={services} products={products} total={total} partStylist={partStylist} partSalon={partSalon} payments={payments} onNew={reset} onClose={onComplete} />;
  }

  return (
    <div className="pos-stage fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <div className="eyebrow">Punto de venta</div>
          <h1 className="serif" style={{ fontSize: 40, fontWeight: 300, margin: '6px 0 0', letterSpacing: '-0.025em' }}>
            Nueva <span className="serif-italic" style={{ color: 'var(--accent)' }}>venta</span>
          </h1>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="eyebrow">Folio</div>
          <div className="mono" style={{ fontSize: 14, marginTop: 4 }}>{saleId}</div>
        </div>
      </div>

      {/* Step trail */}
      <div className="step-trail" style={{ marginBottom: 28 }}>
        {stepInfo.map((s, i) => (
          <React.Fragment key={s.key}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className={'step-dot ' + (step === i ? 'active' : step > i ? 'done' : '')}>
                {step > i ? <Icon name="check" size={12} /> : s.n}
              </div>
              <div style={{ minWidth: 60 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: step >= i ? 'var(--ink)' : 'var(--ink-4)' }}>{s.title}</div>
              </div>
            </div>
            {i < stepInfo.length - 1 && <div className="step-line" />}
          </React.Fragment>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 28, alignItems: 'start' }}>
        <div className="card-paper" style={{ padding: 32, minHeight: 400 }}>
          <div style={{ marginBottom: 24 }}>
            <div className="eyebrow">Paso {stepInfo[step].n}</div>
            <h2 className="serif" style={{ fontSize: 30, fontWeight: 400, margin: '4px 0 4px', letterSpacing: '-0.02em' }}>{stepInfo[step].title}</h2>
            <div style={{ color: 'var(--ink-3)', fontSize: 13 }}>{stepInfo[step].sub}</div>
          </div>

          {step === 0 && <PosStylistStep stylist={stylist} setStylist={setStylist} />}
          {step === 1 && <PosServicesStep services={services} setServices={setServices} />}
          {step === 2 && <PosProductsStep products={products} setProducts={setProducts} internal={internal} setInternal={setInternal} />}
          {step === 3 && <PosPaymentStep total={total} payments={payments} setPayments={setPayments} client={client} setClient={setClient} />}
          {step === 4 && <PosConfirmStep stylist={stylist} services={services} products={products} internal={internal} payments={payments} client={client} pct={pct} total={total} partStylist={partStylist} partSalon={partSalon} />}

          <hr className="hr" style={{ margin: '32px 0 20px' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button className="btn btn-ghost" disabled={step === 0} onClick={() => setStep(s => Math.max(0, s - 1))}>
              <Icon name="arrow-left" size={14} /> Atrás
            </button>
            {step < 4 ? (
              <button className="btn btn-primary btn-lg" disabled={!canNext()} onClick={() => setStep(s => s + 1)} style={{ opacity: canNext() ? 1 : 0.4 }}>
                Continuar <Icon name="arrow-right" size={14} />
              </button>
            ) : (
              <button className="btn btn-accent btn-lg" onClick={() => setConfirmed(true)}>
                <Icon name="check" size={14} /> Registrar venta
              </button>
            )}
          </div>
        </div>

        {/* Live ticker */}
        <PosTicker stylist={stylist} services={services} products={products} internal={internal} pct={pct} setPct={setPct} total={total} partStylist={partStylist} partSalon={partSalon} />
      </div>
    </div>
  );
};

const PosTicker = ({ stylist, services, products, internal, pct, setPct, total, partStylist, partSalon }) => (
  <div style={{ position: 'sticky', top: 28 }}>
    <div className="card" style={{ padding: 24, background: 'var(--ink)', color: 'var(--bone)', border: 'none' }}>
      <div className="eyebrow" style={{ color: 'var(--ink-5)' }}>Total</div>
      <div className="ticker" style={{ fontSize: 56, lineHeight: 1, margin: '8px 0 4px' }}>{COP(total)}</div>
      <div style={{ fontSize: 11, color: 'var(--ink-5)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
        {services.length + products.length} ítem{(services.length + products.length) !== 1 ? 's' : ''}
      </div>

      <hr style={{ margin: '20px 0', border: 0, borderTop: '1px dashed rgba(245,241,234,0.20)' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 12, color: 'var(--ink-5)' }}>Peluquero</span>
        <span style={{ fontSize: 13 }}>{stylist?.name || '—'}</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontSize: 12, color: 'var(--ink-5)' }}>Porcentaje</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button className="btn btn-icon" style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--bone)', padding: 4 }} onClick={() => setPct(Math.max(10, pct - 5))} disabled={!stylist}><Icon name="minus" size={12} /></button>
          <span className="tnum" style={{ minWidth: 40, textAlign: 'center', fontSize: 14, fontWeight: 500 }}>{pct}%</span>
          <button className="btn btn-icon" style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--bone)', padding: 4 }} onClick={() => setPct(Math.min(90, pct + 5))} disabled={!stylist}><Icon name="plus" size={12} /></button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ background: 'rgba(255,255,255,0.06)', padding: 12, borderRadius: 6 }}>
          <div style={{ fontSize: 10, color: 'var(--ink-5)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Salón</div>
          <div className="serif tnum" style={{ fontSize: 20, marginTop: 2 }}>{COPshort(partSalon)}</div>
        </div>
        <div style={{ background: 'var(--accent)', padding: 12, borderRadius: 6 }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Peluquero</div>
          <div className="serif tnum" style={{ fontSize: 20, marginTop: 2, color: 'white' }}>{COPshort(partStylist)}</div>
        </div>
      </div>
    </div>

    {/* line items */}
    {(services.length > 0 || products.length > 0 || internal.length > 0) && (
      <div className="card" style={{ padding: 20, marginTop: 12 }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>Ítems</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {services.map(i => <LineItem key={'s' + i.id} item={i} kind="service" />)}
          {products.map(i => <LineItem key={'p' + i.id} item={i} kind="product" />)}
          {internal.map(i => <LineItem key={'i' + i.id} item={i} kind="internal" />)}
        </div>
      </div>
    )}
  </div>
);

const LineItem = ({ item, kind }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, alignItems: 'center' }}>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
      <div style={{ color: 'var(--ink-4)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {kind === 'service' ? 'Servicio' : kind === 'product' ? 'Producto' : 'Consumo interno'}
        {item.qty > 1 && ' · ×' + item.qty}
      </div>
    </div>
    <span className="tnum" style={{ color: kind === 'internal' ? 'var(--ink-4)' : 'var(--ink)' }}>
      {kind === 'internal' ? '—' : COP(item.price * item.qty)}
    </span>
  </div>
);

// STEP 1: Stylist
const PosStylistStep = ({ stylist, setStylist }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
    {STYLISTS.map(p => (
      <button key={p.id} className={'tile' + (stylist?.id === p.id ? ' selected' : '')} onClick={() => setStylist(p)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 18 }}>
        <Avatar name={p.name} tone={p.tone} size="lg" />
        <div style={{ flex: 1 }}>
          <div className="serif" style={{ fontSize: 18, lineHeight: 1.1 }}>{p.name}</div>
          <div className="tile-meta" style={{ marginTop: 4 }}>{p.tag} · desde {p.since}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="tile-meta">Comisión</div>
          <div className="serif tnum" style={{ fontSize: 18 }}>{p.pct}%</div>
        </div>
      </button>
    ))}
  </div>
);

// STEP 2: Services
const PosServicesStep = ({ services, setServices }) => {
  const cats = Array.from(new Set(SERVICES.map(s => s.category)));
  const [cat, setCat] = React.useState('all');
  const filtered = cat === 'all' ? SERVICES : SERVICES.filter(s => s.category === cat);
  const toggle = (s) => {
    const existing = services.find(x => x.id === s.id);
    if (existing) {
      setServices(services.filter(x => x.id !== s.id));
    } else {
      setServices([...services, { id: s.id, name: s.name, price: s.price, qty: 1 }]);
    }
  };
  const updatePrice = (id, price) => setServices(services.map(s => s.id === id ? { ...s, price } : s));
  const updateQty = (id, qty) => setServices(services.map(s => s.id === id ? { ...s, qty: Math.max(1, qty) } : s));
  return (
    <>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        <button className={'btn btn-sm ' + (cat === 'all' ? 'btn-primary' : 'btn-ghost')} onClick={() => setCat('all')}>Todos</button>
        {cats.map(c => (
          <button key={c} className={'btn btn-sm ' + (cat === c ? 'btn-primary' : 'btn-ghost')} onClick={() => setCat(c)}>{c}</button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {filtered.map(s => {
          const sel = services.find(x => x.id === s.id);
          return (
            <button key={s.id} className={'tile' + (sel ? ' selected' : '')} onClick={() => toggle(s)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{s.name}</div>
                  <div className="tile-meta" style={{ marginTop: 2 }}>{s.category} · {s.duration}min</div>
                </div>
                <div className="serif tnum" style={{ fontSize: 18 }}>{COPshort(s.price)}</div>
              </div>
            </button>
          );
        })}
      </div>
      {services.length > 0 && (
        <div style={{ marginTop: 20, padding: 16, background: 'var(--bone)', borderRadius: 6 }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Editar precios o cantidades</div>
          {services.map(s => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
              <span style={{ flex: 1, fontSize: 13 }}>{s.name}</span>
              <input className="input" type="number" value={s.qty} onChange={e => updateQty(s.id, Number(e.target.value))} style={{ width: 60, textAlign: 'center' }} />
              <span style={{ color: 'var(--ink-4)', fontSize: 11 }}>×</span>
              <input className="input mono" type="number" value={s.price} onChange={e => updatePrice(s.id, Number(e.target.value))} style={{ width: 110 }} />
              <button className="btn btn-icon btn-ghost" onClick={() => setServices(services.filter(x => x.id !== s.id))}><Icon name="x" size={12} /></button>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

// STEP 3: Products
const PosProductsStep = ({ products, setProducts, internal, setInternal }) => {
  const [tab, setTab] = React.useState('client');
  const sellable = PRODUCTS.filter(p => !p.internal);
  const internalProducts = PRODUCTS.filter(p => p.internal);
  const list = tab === 'client' ? products : internal;
  const setter = tab === 'client' ? setProducts : setInternal;
  const source = tab === 'client' ? sellable : internalProducts;
  const toggle = (p) => {
    const existing = list.find(x => x.id === p.id);
    if (existing) setter(list.filter(x => x.id !== p.id));
    else setter([...list, { id: p.id, name: p.name, price: tab === 'client' ? p.sell : 0, qty: 1 }]);
  };
  return (
    <>
      <div style={{ display: 'flex', gap: 6, marginBottom: 18, padding: 3, background: 'var(--bone)', borderRadius: 7, width: 'fit-content' }}>
        <button className={'btn btn-sm ' + (tab === 'client' ? 'btn-primary' : 'btn-ghost')} onClick={() => setTab('client')}><Icon name="bag" size={12} /> Venta a cliente</button>
        <button className={'btn btn-sm ' + (tab === 'internal' ? 'btn-primary' : 'btn-ghost')} onClick={() => setTab('internal')}><Icon name="sparkle" size={12} /> Consumo interno</button>
      </div>
      <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 14 }}>
        {tab === 'client' ? 'Productos que el cliente se lleva con él.' : 'Productos aplicados por el peluquero durante el servicio.'}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {source.map(p => {
          const sel = list.find(x => x.id === p.id);
          return (
            <button key={p.id} className={'tile' + (sel ? ' selected' : '')} onClick={() => toggle(p)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{p.name}</div>
                  <div className="tile-meta" style={{ marginTop: 2 }}>{p.brand} · stock {p.stock}</div>
                </div>
                {tab === 'client' && <div className="serif tnum" style={{ fontSize: 16 }}>{COPshort(p.sell)}</div>}
              </div>
            </button>
          );
        })}
      </div>
      {tab === 'client' ? (
        products.length === 0 && <div style={{ marginTop: 14, fontSize: 12, color: 'var(--ink-4)' }}>Opcional · ningún producto seleccionado</div>
      ) : (
        internal.length === 0 && <div style={{ marginTop: 14, fontSize: 12, color: 'var(--ink-4)' }}>Opcional · ningún consumo registrado</div>
      )}
    </>
  );
};

// STEP 4: Payment
const PosPaymentStep = ({ total, payments, setPayments, client, setClient }) => {
  const sum = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const remaining = total - sum;
  const isMixed = payments.length > 1;

  const setMethod = (i, method) => {
    setPayments(payments.map((p, idx) => idx === i ? { ...p, method } : p));
  };
  const setAmount = (i, amount) => {
    setPayments(payments.map((p, idx) => idx === i ? { ...p, amount: Number(amount) || 0 } : p));
  };
  const addPayment = () => setPayments([...payments, { method: 'efectivo', amount: Math.max(0, remaining) }]);
  const removePayment = (i) => setPayments(payments.filter((_, idx) => idx !== i));

  return (
    <>
      <div className="eyebrow" style={{ marginBottom: 8 }}>Cliente (opcional)</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
        <input className="input" placeholder="Nombre" value={client.name} onChange={e => setClient({ ...client, name: e.target.value })} />
        <input className="input" placeholder="Teléfono" value={client.phone} onChange={e => setClient({ ...client, phone: e.target.value })} />
      </div>

      <div className="eyebrow" style={{ marginBottom: 8 }}>Método de pago</div>
      {payments.map((p, i) => (
        <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'center' }}>
          <select className="select" value={p.method} onChange={e => setMethod(i, e.target.value)} style={{ flex: 1 }}>
            {PAYMENT_METHODS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
          <input className="input mono" type="number" value={p.amount} onChange={e => setAmount(i, e.target.value)} style={{ width: 160 }} />
          {isMixed && <button className="btn btn-icon btn-ghost" onClick={() => removePayment(i)}><Icon name="x" size={12} /></button>}
        </div>
      ))}
      <button className="btn btn-ghost btn-sm" onClick={addPayment} style={{ marginTop: 4 }}><Icon name="plus" size={12} /> Pago mixto</button>

      <div style={{ marginTop: 24, padding: 16, borderRadius: 6, background: Math.abs(remaining) < 0.01 ? 'var(--success-soft)' : 'var(--warn-soft)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
          <span>Total a cobrar</span>
          <span className="tnum">{COP(total)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginTop: 4 }}>
          <span>Recibido</span>
          <span className="tnum">{COP(sum)}</span>
        </div>
        <hr style={{ margin: '8px 0', border: 0, borderTop: '1px dashed currentColor', opacity: 0.3 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: 14 }}>
          <span>{remaining > 0 ? 'Falta' : remaining < 0 ? 'Cambio' : 'Cuadrado'}</span>
          <span className="tnum">{COP(Math.abs(remaining))}</span>
        </div>
      </div>
    </>
  );
};

// STEP 5: Confirm
const PosConfirmStep = ({ stylist, services, products, internal, payments, client, pct, total, partStylist, partSalon }) => (
  <div className="receipt">
    <div style={{ textAlign: 'center', paddingBottom: 16, borderBottom: '1px dashed var(--hair-3)', marginBottom: 12 }}>
      <div className="serif" style={{ fontSize: 24, fontWeight: 400 }}>Studio 54</div>
      <div className="eyebrow" style={{ marginTop: 4 }}>Hair & Beauty · Bogotá</div>
    </div>
    <div className="row"><span style={{ color: 'var(--ink-3)' }}>Peluquero</span><span>{stylist.name}</span></div>
    <div className="row"><span style={{ color: 'var(--ink-3)' }}>Comisión</span><span className="tnum">{pct}%</span></div>
    {client.name && <div className="row"><span style={{ color: 'var(--ink-3)' }}>Cliente</span><span>{client.name}</span></div>}
    <hr className="hr-dotted" style={{ margin: '8px 0' }} />
    {services.map(s => (
      <div key={s.id} className="row"><span>{s.name}{s.qty > 1 ? ` ×${s.qty}` : ''}</span><span className="tnum">{COP(s.price * s.qty)}</span></div>
    ))}
    {products.map(p => (
      <div key={p.id} className="row"><span>{p.name}</span><span className="tnum">{COP(p.price * p.qty)}</span></div>
    ))}
    {internal.length > 0 && (
      <>
        <hr className="hr-dotted" style={{ margin: '8px 0' }} />
        <div style={{ fontSize: 11, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Consumo interno</div>
        {internal.map(i => (
          <div key={i.id} className="row" style={{ color: 'var(--ink-4)', fontSize: 12 }}><span>{i.name}</span><span>—</span></div>
        ))}
      </>
    )}
    <div className="row total"><span>Total</span><span className="tnum">{COP(total)}</span></div>
    <hr className="hr-dotted" style={{ margin: '8px 0' }} />
    {payments.map((p, i) => (
      <div key={i} className="row" style={{ fontSize: 12, color: 'var(--ink-3)' }}>
        <span>{PAYMENT_METHODS.find(m => m.id === p.method)?.label}</span>
        <span className="tnum">{COP(p.amount)}</span>
      </div>
    ))}
    <hr className="hr-dotted" style={{ margin: '8px 0' }} />
    <div className="row" style={{ fontSize: 12 }}><span style={{ color: 'var(--ink-3)' }}>Parte salón</span><span className="tnum">{COP(partSalon)}</span></div>
    <div className="row" style={{ fontSize: 12 }}><span style={{ color: 'var(--accent-deep)' }}>Parte peluquero</span><span className="tnum" style={{ color: 'var(--accent-deep)', fontWeight: 600 }}>{COP(partStylist)}</span></div>
  </div>
);

const PosSuccess = ({ saleId, stylist, total, partStylist, partSalon, payments, onNew }) => (
  <div className="pos-stage" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
    <div className="card-paper scale-in" style={{ padding: 56, textAlign: 'center', maxWidth: 520 }}>
      <div style={{ width: 72, height: 72, borderRadius: 999, background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
        <Icon name="check" size={32} stroke={2} />
      </div>
      <div className="eyebrow">Venta registrada</div>
      <h2 className="serif" style={{ fontSize: 40, fontWeight: 300, margin: '8px 0 4px', letterSpacing: '-0.025em' }}>
        <span className="ticker">{COP(total)}</span>
      </h2>
      <div style={{ color: 'var(--ink-3)', fontSize: 13 }}>{saleId} · {stylist.name}</div>
      <hr className="hr-dotted" style={{ margin: '24px 0' }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 13 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 4 }}>Salón</div>
          <div className="serif tnum" style={{ fontSize: 22 }}>{COP(partSalon)}</div>
        </div>
        <div>
          <div className="eyebrow" style={{ marginBottom: 4, color: 'var(--accent-deep)' }}>Peluquero</div>
          <div className="serif tnum" style={{ fontSize: 22, color: 'var(--accent-deep)' }}>{COP(partStylist)}</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 28 }}>
        <button className="btn btn-ghost"><Icon name="download" size={14} /> Recibo</button>
        <button className="btn btn-primary" onClick={onNew}><Icon name="plus" size={14} /> Nueva venta</button>
      </div>
    </div>
  </div>
);

window.POS = POS;
