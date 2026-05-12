// SalonPro icons - minimal stroke icons
const Icon = ({ name, size = 16, stroke = 1.5 }) => {
  const props = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'home':       return <svg {...props}><path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h14V10"/></svg>;
    case 'pos':        return <svg {...props}><rect x="3" y="6" width="18" height="13" rx="1.5"/><path d="M3 10h18"/><path d="M8 14h2M14 14h2"/></svg>;
    case 'history':    return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
    case 'scissors':   return <svg {...props}><circle cx="6" cy="7" r="2.5"/><circle cx="6" cy="17" r="2.5"/><path d="M8 9l12 9M8 15l12-9"/></svg>;
    case 'box':        return <svg {...props}><path d="M3 7l9-4 9 4-9 4-9-4z"/><path d="M3 7v10l9 4 9-4V7"/><path d="M12 11v10"/></svg>;
    case 'wallet':     return <svg {...props}><rect x="3" y="6" width="18" height="13" rx="1.5"/><path d="M3 10h18"/><circle cx="16" cy="14.5" r="1"/></svg>;
    case 'user':       return <svg {...props}><circle cx="12" cy="8" r="3.5"/><path d="M5 20c1-4 4-6 7-6s6 2 7 6"/></svg>;
    case 'cash':       return <svg {...props}><rect x="3" y="7" width="18" height="11" rx="1.5"/><circle cx="12" cy="12.5" r="2.5"/></svg>;
    case 'chart':      return <svg {...props}><path d="M4 20V8M10 20v-6M16 20V4M22 20H2"/></svg>;
    case 'gear':       return <svg {...props}><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/></svg>;
    case 'plus':       return <svg {...props}><path d="M12 5v14M5 12h14"/></svg>;
    case 'minus':      return <svg {...props}><path d="M5 12h14"/></svg>;
    case 'check':      return <svg {...props}><path d="M5 12l4 4 10-10"/></svg>;
    case 'x':          return <svg {...props}><path d="M6 6l12 12M18 6L6 18"/></svg>;
    case 'arrow-right':return <svg {...props}><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
    case 'arrow-left': return <svg {...props}><path d="M19 12H5M11 6l-6 6 6 6"/></svg>;
    case 'arrow-up':   return <svg {...props}><path d="M12 19V5M6 11l6-6 6 6"/></svg>;
    case 'arrow-down': return <svg {...props}><path d="M12 5v14M6 13l6 6 6-6"/></svg>;
    case 'search':     return <svg {...props}><circle cx="11" cy="11" r="6"/><path d="M20 20l-4-4"/></svg>;
    case 'bell':       return <svg {...props}><path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6z"/><path d="M10 19a2 2 0 0 0 4 0"/></svg>;
    case 'menu':       return <svg {...props}><path d="M4 6h16M4 12h16M4 18h16"/></svg>;
    case 'logout':     return <svg {...props}><path d="M9 4H4v16h5"/><path d="M16 16l4-4-4-4M20 12H10"/></svg>;
    case 'phone':      return <svg {...props}><rect x="7" y="3" width="10" height="18" rx="2"/><circle cx="12" cy="17.5" r=".5" fill="currentColor"/></svg>;
    case 'card':       return <svg {...props}><rect x="3" y="6" width="18" height="13" rx="1.5"/><path d="M3 10h18M7 15h3"/></svg>;
    case 'bank':       return <svg {...props}><path d="M3 10l9-6 9 6"/><path d="M5 10v8M9 10v8M15 10v8M19 10v8"/><path d="M3 20h18"/></svg>;
    case 'bag':        return <svg {...props}><path d="M5 8h14l-1 12H6L5 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>;
    case 'sparkle':    return <svg {...props}><path d="M12 3v6M12 15v6M3 12h6M15 12h6"/></svg>;
    case 'edit':       return <svg {...props}><path d="M14 4l6 6L10 20H4v-6L14 4z"/></svg>;
    case 'trash':      return <svg {...props}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>;
    case 'eye':        return <svg {...props}><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>;
    case 'building':   return <svg {...props}><rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2"/></svg>;
    case 'calendar':   return <svg {...props}><rect x="3" y="5" width="18" height="16" rx="1.5"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>;
    case 'filter':     return <svg {...props}><path d="M3 5h18l-7 9v6l-4-2v-4L3 5z"/></svg>;
    case 'star':       return <svg {...props}><path d="M12 3l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/></svg>;
    case 'alert':      return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></svg>;
    case 'download':   return <svg {...props}><path d="M12 4v12M6 12l6 6 6-6M4 20h16"/></svg>;
    case 'sliders':    return <svg {...props}><path d="M4 6h10M18 6h2M4 12h6M14 12h6M4 18h12M20 18h0"/><circle cx="14" cy="6" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="18" cy="18" r="1.6"/></svg>;
    case 'flame':      return <svg {...props}><path d="M12 3c2 4 6 5 6 10a6 6 0 1 1-12 0c0-2 1-3 2-4 1 2 2 1 2-1 0-3 1-4 2-5z"/></svg>;
    default: return null;
  }
};

window.Icon = Icon;
