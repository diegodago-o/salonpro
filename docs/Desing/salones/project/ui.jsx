// SalonPro - shared UI bits (avatars, sparklines, donut, etc.)

const Avatar = ({ name = '', initials, tone, size = 'md', className = '' }) => {
  const sz = size === 'lg' ? 'avatar-lg' : size === 'xl' ? 'avatar-xl' : size === 'sm' ? 'avatar-sm' : '';
  const inits = initials || name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  return <span className={'avatar ' + sz + ' ' + className} style={{ background: tone || 'var(--ink-3)' }}>{inits}</span>;
};

const Sparkline = ({ values, color = 'currentColor', height = 36, fill = false }) => {
  if (!values || values.length === 0) return <svg className="spark"></svg>;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = Math.max(max - min, 1);
  const w = 100;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${height - ((v - min) / range) * (height - 4) - 2}`);
  const path = 'M' + pts.join(' L');
  const area = path + ` L${w},${height} L0,${height} Z`;
  return (
    <svg className="spark" viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" style={{ height }}>
      {fill && <path d={area} fill={color} fillOpacity="0.10" />}
      <path d={path} stroke={color} strokeWidth="1.4" fill="none" vectorEffect="non-scaling-stroke" />
    </svg>
  );
};

const Donut = ({ data, size = 120, thickness = 18, colors }) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = (size - thickness) / 2;
  const c = size / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={size} height={size} className="donut">
      <circle cx={c} cy={c} r={r} stroke="var(--hair-2)" strokeWidth={thickness} fill="none" />
      {data.map((d, i) => {
        const len = (d.value / total) * circ;
        const dasharray = `${len} ${circ - len}`;
        const dashoffset = -offset;
        offset += len;
        return (
          <circle key={i} cx={c} cy={c} r={r}
            stroke={colors[i % colors.length]} strokeWidth={thickness} fill="none"
            strokeDasharray={dasharray} strokeDashoffset={dashoffset}
            transform={`rotate(-90 ${c} ${c})`} />
        );
      })}
    </svg>
  );
};

const Bars = ({ data, accentIdx = -1, accent = 'var(--accent)', base = 'var(--ink)' }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="bars">
      {data.map((d, i) => (
        <div key={i} className="b" title={`${d.label}: ${COP(d.value)}`}
          style={{ height: `${(d.value / max) * 100}%`, background: i === accentIdx ? accent : base, opacity: i === accentIdx ? 1 : 0.85 }} />
      ))}
    </div>
  );
};

const Pill = ({ kind = 'default', children }) => {
  const cls = { default: 'pill', accent: 'pill pill-accent', success: 'pill pill-success', warn: 'pill pill-warn', danger: 'pill pill-danger', ink: 'pill pill-ink' }[kind];
  return <span className={cls}>{children}</span>;
};

const StatusPill = ({ status }) => {
  const map = {
    'Activa':   'success',
    'Editada':  'warn',
    'Anulada':  'danger',
    'Borrador': 'default',
    'Aprobada': 'accent',
    'Pagada':   'success',
  };
  return <Pill kind={map[status] || 'default'}><span className="pill-dot" />{status}</Pill>;
};

const Toast = ({ message, onDone }) => {
  React.useEffect(() => {
    const t = setTimeout(onDone, 2400);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="toast">
      <Icon name="check" size={14} />
      {message}
    </div>
  );
};

const Modal = ({ children, onClose }) => (
  <div className="modal-back" onClick={onClose}>
    <div className="modal" onClick={e => e.stopPropagation()}>
      {children}
    </div>
  </div>
);

const PageHead = ({ eyebrow, title, deck, right }) => (
  <div className="page-head">
    <div>
      {eyebrow && <div className="eyebrow" style={{ marginBottom: 8 }}>{eyebrow}</div>}
      <h1>{title}</h1>
      {deck && <div className="deck">{deck}</div>}
    </div>
    {right && <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>{right}</div>}
  </div>
);

const FmtCOP = ({ value, big }) => (
  <span className={'tnum ' + (big ? 'serif' : '')}>{COP(value)}</span>
);

Object.assign(window, { Avatar, Sparkline, Donut, Bars, Pill, StatusPill, Toast, Modal, PageHead, FmtCOP });
