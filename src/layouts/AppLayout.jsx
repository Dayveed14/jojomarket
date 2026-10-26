import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { Avatar } from '../components/ui';
import { useAuth } from '../context/AuthContext';

const CUSTOMER_NAV = [
  { to: '/app', label: 'Overview', icon: '◎', end: true, tab: true },
  { to: '/app/bookings', label: 'Bookings', icon: '🧺', tab: true },
  { to: '/app/lists', label: 'Saved lists', short: 'Lists', icon: '📝', tab: true },
  { to: '/app/restocking', label: 'Restocking', short: 'Restock', icon: '📦', tab: true },
  { to: '/app/purchases', label: 'Purchases & payments', short: 'Receipts', icon: '🧾' },
  { to: '/app/addresses', label: 'Addresses', icon: '📍' },
  { to: '/app/settings', label: 'Profile & security', short: 'Account', icon: '⚙', tab: true },
];

const ADMIN_NAV = [
  { to: '/admin', label: 'Operations', icon: '◎', end: true, tab: true },
  { to: '/admin/bookings', label: 'Booking queue', short: 'Queue', icon: '🧺', tab: true },
  { to: '/admin/calendar', label: 'Calendar', icon: '📅', tab: true },
  { to: '/admin/payments', label: 'Payments', icon: '₦', tab: true },
  { to: '/admin/customers', label: 'Customers', icon: '👥', tab: true },
  { to: '/admin/catalog', label: 'Catalogue & prices', icon: '🏷' },
  { to: '/admin/markets', label: 'Markets', icon: '🏪' },
  { to: '/admin/settings/service', label: 'Service settings', icon: '🛠' },
  { to: '/admin/audit-log', label: 'Audit log', icon: '📜' },
  { to: '/admin/settings', label: 'My account', short: 'Account', icon: '⚙', end: true },
];

export default function AppLayout({ variant = 'customer' }) {
  const admin = variant === 'admin';
  const nav = admin ? ADMIN_NAV : CUSTOMER_NAV;
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => setMenuOpen(false), [pathname]);
  useEffect(() => {
    const close = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate(admin ? '/admin/login' : '/login', { replace: true });
  };

  return (
    <div className={`shell${admin ? ' shell--admin' : ''}`}>
      <a href="#main" className="skip-link">Skip to content</a>
      <aside className="shell__side">
        <div className="shell__brand">
          <Logo to={admin ? '/admin' : '/app'} size="sm" inverse={admin} />
          {admin && <span className="badge badge--gold">Operator</span>}
        </div>
        <nav className="shell__nav" aria-label={admin ? 'Operator' : 'Account'}>
          {nav.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className="shell__link">
              <span className="shell__icon" aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
              {item.soon && <span className="shell__soon">Soon</span>}
            </NavLink>
          ))}
        </nav>
        {!admin && (
          <div className="shell__cta">
            <p>Need foodstuff this week?</p>
            <Link to="/app/bookings/new" className="btn btn--accent btn--sm btn--block">New booking</Link>
          </div>
        )}
      </aside>

      <div className="shell__body">
        <header className="shell__top">
          <div className="shell__top-logo"><Logo to={admin ? '/admin' : '/app'} size="xs" /></div>
          <div className="user-menu" ref={menuRef}>
            <button className="user-menu__btn" aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((o) => !o)}>
              <Avatar user={user} size={34} />
              <span className="user-menu__name">{user?.displayName}</span>
              <span aria-hidden="true">▾</span>
            </button>
            {menuOpen && (
              <div className="user-menu__pop" role="menu">
                <div className="user-menu__who">
                  <strong>{user?.displayName}</strong>
                  <span>{user?.email}</span>
                </div>
                <div className="user-menu__nav">
                  {nav.filter((n) => !n.tab).map((n) => <Link key={n.to} role="menuitem" to={n.to}>{n.icon} {n.label}</Link>)}
                </div>
                <Link role="menuitem" to={admin ? '/admin/settings' : '/app/settings'}>Profile &amp; security</Link>
                {!admin && <Link role="menuitem" to="/">Jojo Market home</Link>}
                <button role="menuitem" onClick={handleLogout}>Sign out</button>
              </div>
            )}
          </div>
        </header>
        <main id="main" className="shell__main">
          <Outlet />
        </main>
        <nav className="shell__tabbar" aria-label="Quick navigation">
          {nav.filter((n) => n.tab).slice(0, 5).map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className="shell__tab">
              <span aria-hidden="true">{item.icon}</span>
              <span>{item.short || item.label.split(' ')[0]}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
