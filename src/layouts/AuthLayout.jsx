import { Link, Outlet } from 'react-router-dom';
import Logo from '../components/Logo';

export default function AuthLayout({ variant = 'customer' }) {
  const admin = variant === 'admin';
  return (
    <div className={`auth${admin ? ' auth--admin' : ''}`}>
      <aside className="auth__panel" aria-hidden={admin ? undefined : 'true'}>
        <Link to="/" className="auth__back">← Back to Jojo Market</Link>
        <div className="auth__art">
          <img src="/brand/jojo-market-logo.webp" alt="Jojo Market" width="640" height="640" />
        </div>
        {admin ? (
          <p className="auth__quote">Operator console — bookings, quotes, shopping records and payments.</p>
        ) : (
          <blockquote className="auth__quote">
            “Tell us what you need and how you like it. We’ll handle the market — and show you every naira.”
          </blockquote>
        )}
        <ul className="auth__promises">
          <li>Spending never goes past the limit you set</li>
          <li>Itemised receipts after every shop</li>
          <li>Your address stays private</li>
        </ul>
      </aside>
      <main className="auth__main" id="main">
        <div className="auth__mobile-logo"><Logo size="sm" /></div>
        <div className="auth__card">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
