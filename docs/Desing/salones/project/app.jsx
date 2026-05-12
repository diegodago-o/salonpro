// SalonPro - main app shell

const NAV = {
  dueno: [
    { id: 'dashboard', label: 'Dashboard', icon: 'home' },
    { id: 'pos', label: 'Punto de venta', icon: 'pos' },
    { id: 'sales', label: 'Historial', icon: 'history' },
    { id: 'services', label: 'Servicios', icon: 'scissors' },
    { id: 'inventory', label: 'Inventario', icon: 'box', badge: 'Bajo' },
    { id: 'liquidations', label: 'Liquidaciones', icon: 'wallet' },
    { id: 'caja', label: 'Caja', icon: 'cash' },
    { id: 'reports', label: 'Reportes', icon: 'chart' },
    { id: 'settings', label: 'Configuración', icon: 'gear' },
  ],
  cajero: [
    { id: 'pos', label: 'Punto de venta', icon: 'pos' },
    { id: 'sales', label: 'Historial', icon: 'history' },
    { id: 'inventory', label: 'Inventario', icon: 'box' },
    { id: 'caja', label: 'Caja', icon: 'cash' },
  ],
  peluquero: [
    { id: 'mine', label: 'Mi resumen', icon: 'home' },
  ],
};

const ROLE_LABELS = { dueno: 'Dueña', cajero: 'Cajera', peluquero: 'Peluquero' };
const ROLE_USERS = {
  dueno:    { name: 'Sofía Mejía',     role: 'Dueña',  tone: 'oklch(0.45 0.10 30)' },
  cajero:   { name: 'María Fernández', role: 'Cajera', tone: 'oklch(0.55 0.07 25)' },
  peluquero:{ name: 'Carlos Restrepo', role: 'Estilista', tone: '#C97B5C' },
};

const App = () => {
  const [authed, setAuthed] = React.useState(false);
  const [role, setRole] = React.useState('dueno');
  const [view, setView] = React.useState('dashboard');
  const [salonId, setSalonId] = React.useState('s1');
  const [tweaks, setTweaks] = useTweaks(window.TWEAK_DEFAULTS);

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', tweaks.theme || 'default');
  }, [tweaks.theme]);

  // Switch view if not allowed in current role
  React.useEffect(() => {
    const items = NAV[role];
    if (!items.find(i => i.id === view)) setView(items[0].id);
  }, [role]);

  if (!authed) return <Login onComplete={() => { setAuthed(true); setView(NAV[role][0].id); }} />;

  const user = ROLE_USERS[role];
  const salon = SALONS.find(s => s.id === salonId);
  const navItems = NAV[role];

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark">Salon<em>Pro</em></div>
        </div>

        <div style={{ marginBottom: 14, padding: '0 8px' }}>
          <div className="eyebrow" style={{ fontSize: 9, marginBottom: 6 }}>Salón actual</div>
          <select className="select" value={salonId} onChange={e => setSalonId(e.target.value)} style={{ padding: '7px 8px', fontSize: 12, background: 'var(--paper)' }}>
            {SALONS.map(s => <option key={s.id} value={s.id}>{s.name.replace('Studio 54 ', '').replace('Hair & Beauty', 'Chapinero')}</option>)}
          </select>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navItems.map(item => (
            <div key={item.id} className={'nav-item' + (view === item.id ? ' active' : '')} onClick={() => setView(item.id)}>
              <Icon name={item.icon} size={15} />
              <span className="label">{item.label}</span>
              {item.badge && <span className="badge">{item.badge}</span>}
            </div>
          ))}
        </nav>

        <div style={{ flex: 1 }} />

        <div style={{ padding: 12, borderTop: '1px solid var(--hair-2)', marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar name={user.name} tone={user.tone} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
              <div style={{ fontSize: 10, color: 'var(--ink-4)' }}>{user.role}</div>
            </div>
            <button className="btn btn-icon btn-ghost" onClick={() => setAuthed(false)} title="Cerrar sesión"><Icon name="logout" size={14} /></button>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="eyebrow" style={{ fontSize: 10 }}>{salon.name} · {salon.address.split(',')[1]?.trim()}</div>
          <div style={{ flex: 1 }} />
          <div className="role-switch">
            {Object.entries(ROLE_LABELS).map(([k, lbl]) => (
              <button key={k} className={role === k ? 'active' : ''} onClick={() => setRole(k)}>{lbl}</button>
            ))}
          </div>
          <button className="btn btn-icon btn-ghost"><Icon name="bell" size={15} /></button>
          <button className="btn btn-icon btn-ghost"><Icon name="search" size={15} /></button>
        </header>

        <div className="scroll-area">
          {role === 'dueno' && view === 'dashboard' && <Dashboard />}
          {view === 'pos' && <POS onComplete={() => setView('sales')} />}
          {view === 'sales' && <SalesHistory role={role} />}
          {view === 'services' && <ServicesView />}
          {view === 'inventory' && <InventoryView />}
          {view === 'liquidations' && <LiquidationsView />}
          {view === 'caja' && <CajaView />}
          {view === 'reports' && <ReportsView />}
          {view === 'settings' && <SettingsView />}
          {role === 'peluquero' && view === 'mine' && <MyDashboard stylistId="p1" />}
        </div>
      </main>

      <SalonTweaks tweaks={tweaks} setTweaks={setTweaks} />
    </div>
  );
};

const SalonTweaks = ({ tweaks, setTweaks }) => (
  <TweaksPanel title="Tweaks">
    <TweakSection title="Tema de color">
      <TweakRadio label="Acento"
        value={tweaks.theme || 'default'}
        onChange={v => setTweaks('theme', v)}
        options={[
          { value: 'default', label: 'Terracota' },
          { value: 'rose',    label: 'Rosa' },
          { value: 'olive',   label: 'Olivo' },
          { value: 'cobalt',  label: 'Cobalto' },
          { value: 'ink',     label: 'Tinta (oscuro)' },
        ]}
      />
    </TweakSection>
    <TweakSection title="Notas">
      <div style={{ fontSize: 11, color: 'var(--ink-3)', lineHeight: 1.5 }}>
        Cambia el acento principal de la app. El tema "Tinta" invierte fondo y texto para un modo oscuro editorial.
      </div>
    </TweakSection>
  </TweaksPanel>
);

window.App = App;
