// SalonPro - Login + Salon picker

const Login = ({ onComplete }) => {
  const [step, setStep] = React.useState('login'); // login | salon

  if (step === 'login') {
    return (
      <div className="login-canvas fade-in">
        <div className="login-art">
          <div>
            <div className="brand-mark" style={{ color: 'var(--bone)', fontSize: 28 }}>Salon<em>Pro</em></div>
            <div style={{ fontSize: 11, color: 'var(--ink-5)', textTransform: 'uppercase', letterSpacing: '0.18em', marginTop: 6 }}>Hair · Beauty · Lifestyle</div>
          </div>
          <div>
            <div className="serif" style={{ fontSize: 80, fontWeight: 200, lineHeight: 0.95, letterSpacing: '-0.03em' }}>
              El salón,<br/>
              <span className="serif-italic" style={{ color: 'var(--accent)' }}>en orden.</span>
            </div>
            <div style={{ marginTop: 24, fontSize: 14, color: 'var(--ink-5)', maxWidth: 380, lineHeight: 1.5 }}>
              Punto de venta, comisiones, inventario y reportes. Una sola herramienta para correr tu salón.
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink-5)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>
            <span>v 2.4 · Bogotá</span>
            <span>—</span>
            <span>2026</span>
          </div>
        </div>
        <div className="login-form-side">
          <div style={{ width: '100%', maxWidth: 360 }}>
            <div className="eyebrow">Acceso</div>
            <h1 className="serif" style={{ fontSize: 44, fontWeight: 300, margin: '4px 0 28px', letterSpacing: '-0.02em' }}>Inicia <span className="serif-italic">sesión</span></h1>
            <label className="field" style={{ marginBottom: 14 }}>
              <span className="label">Correo</span>
              <input className="input" defaultValue="sofia@studio54.co" />
            </label>
            <label className="field" style={{ marginBottom: 18 }}>
              <span className="label">Contraseña</span>
              <input className="input" type="password" defaultValue="········" />
            </label>
            <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={() => setStep('salon')}>Continuar <Icon name="arrow-right" size={14} /></button>
            <div style={{ marginTop: 24, fontSize: 12, color: 'var(--ink-3)', textAlign: 'center' }}>¿Olvidaste tu contraseña?</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-canvas fade-in" style={{ gridTemplateColumns: '1fr', background: 'var(--bone)' }}>
      <div className="login-form-side" style={{ flexDirection: 'column' }}>
        <div className="eyebrow">Bienvenida, Sofía</div>
        <h1 className="serif" style={{ fontSize: 44, fontWeight: 300, margin: '4px 0 32px', letterSpacing: '-0.02em', textAlign: 'center' }}>Selecciona <span className="serif-italic">tu salón</span></h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 320px)', gap: 16 }}>
          {SALONS.map(s => (
            <button key={s.id} className="tile" onClick={onComplete} style={{ padding: 24, textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ width: 56, height: 56, background: 'var(--ink)', color: 'var(--bone)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Fraunces', fontSize: 18, fontWeight: 300, flex: '0 0 56px' }}>S<span style={{ color: 'var(--accent)' }}>54</span></div>
                <div style={{ flex: 1 }}>
                  <div className="serif" style={{ fontSize: 20, fontWeight: 400, lineHeight: 1.1 }}>{s.name}</div>
                  <div className="tile-meta" style={{ marginTop: 6, fontSize: 11 }}>{s.address}</div>
                  <div className="tile-meta" style={{ marginTop: 2, fontSize: 11 }}>{s.phone}</div>
                </div>
                <Icon name="arrow-right" size={14} />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

window.Login = Login;
