import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import Logo from '../components/Logo';
import { homeFor, useAuth } from '../context/AuthContext';
import { SITE } from '../config/site';

export default function PublicLayout() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const { pathname, hash } = useLocation();

  useEffect(() => setOpen(false), [pathname, hash]);

  return (
    <div className="public">
      <a href="#main" className="skip-link">Skip to content</a>
      <header className="site-header">
        <div className="container site-header__inner">
          <Logo size="sm" />
          <button className="nav-toggle" aria-expanded={open} aria-controls="site-nav" onClick={() => setOpen((o) => !o)}>
            <span className="sr-only">Menu</span>
            <span className="nav-toggle__bars" aria-hidden="true" />
          </button>
          <nav id="site-nav" className={`site-nav${open ? ' is-open' : ''}`} aria-label="Main">
            <a href="/#how-it-works">How it works</a>
            <a href="/#services">Services</a>
            <a href="/#what-we-buy">What we buy</a>
            <Link to="/markets">Markets</Link>
            <NavLink to="/kitchen" className="site-nav__kitchen">🍲 Jojo’s Kitchen</NavLink>
            <a href="/#faq">FAQ</a>
            <div className="site-nav__auth">
              {user ? (
                <Link to={homeFor(user)} className="btn btn--primary btn--sm">My dashboard</Link>
              ) : (
                <>
                  <NavLink to="/login" className="btn btn--ghost btn--sm">Sign in</NavLink>
                  <Link to="/register" className="btn btn--accent btn--sm">Book a shopper</Link>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>

      <main id="main"><Outlet /></main>

      <footer className="site-footer">
        <div className="container site-footer__grid">
          <div>
            <Logo size="sm" inverse showMark={false} />
            <p className="site-footer__blurb">
              A trusted personal shopper for {SITE.city}'s traditional markets. We buy what you need, the way you like it,
              and show you exactly what it cost.
            </p>
          </div>
          <div>
            <h2 className="site-footer__h">Service</h2>
            <ul>
              <li><a href="/#how-it-works">How it works</a></li>
              <li><a href="/#services">Full shopping &amp; sample runs</a></li>
              <li><Link to="/markets">Markets we shop</Link></li>
              <li><Link to="/kitchen">Jojo’s Kitchen — cooked food</Link></li>
              <li><a href="/#faq">Questions</a></li>
            </ul>
          </div>
          <div>
            <h2 className="site-footer__h">Account</h2>
            <ul>
              <li><Link to="/register">Create an account</Link></li>
              <li><Link to="/login">Sign in</Link></li>
              <li><Link to="/forgot-password">Forgot password</Link></li>
            </ul>
          </div>
          <div>
            <h2 className="site-footer__h">Policies</h2>
            <ul>
              <li><Link to="/privacy">Privacy notice</Link></li>
              <li><Link to="/terms">Terms of service</Link></li>
              <li><a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a></li>
            </ul>
          </div>
        </div>
        <div className="container site-footer__base">
          <span>© {new Date().getFullYear()} Jojo Market. All prices shown before shopping are estimates.</span>
        </div>
      </footer>
    </div>
  );
}
