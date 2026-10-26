import { Link, useLocation } from 'react-router-dom';
import Seo from '../../components/Seo';
import { SITE } from '../../config/site';
import { EmptyState } from '../../components/ui';

export function NotFound() {
  return (
    <section className="section">
      <Seo title="Page not found" noindex />
      <div className="container narrow center">
        <p className="eyebrow">404</p>
        <h1 className="section__title">We couldn’t find that stall</h1>
        <p className="section__lead">The page you’re looking for has moved or never existed.</p>
        <Link to="/" className="btn btn--primary">Back to Jojo Market</Link>
      </div>
    </section>
  );
}

/** Placeholder until the policy text is finalised (see spec §17). */
export function PolicyPage({ kind }) {
  const title = kind === 'privacy' ? 'Privacy notice' : 'Terms of service';
  return (
    <section className="section">
      <Seo title={title} description={`${SITE.name} ${title.toLowerCase()}.`} />
      <div className="container narrow prose">
        <p className="eyebrow">Policies</p>
        <h1 className="section__title">{title}</h1>
        <div className="alert alert--warning" role="status">
          <strong className="alert__title">Draft</strong>
          <div>This page is being finalised before launch. Questions? Email <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>.</div>
        </div>
        {kind === 'privacy' ? (
          <>
            <h2>What we collect</h2>
            <p>Your name, email, optional phone number, delivery addresses, shopping lists, and the purchase and payment records needed to run your bookings.</p>
            <h2>How we use it</h2>
            <p>Only to provide the service: planning and carrying out your shops, delivering, contacting you about a booking, and keeping accurate financial records. We do not sell your data.</p>
            <h2>Your rights</h2>
            <p>Under the Nigeria Data Protection Act 2023 you can ask to see, correct or delete your personal data. Contact us at the address above.</p>
          </>
        ) : (
          <>
            <h2>The service</h2>
            <p>Jojo Market buys goods from traditional markets on your behalf. Prices shown before shopping are estimates; actual prices are recorded after purchase.</p>
            <h2>Spending</h2>
            <p>We will not spend above the authorised limit you set without your explicit approval.</p>
            <h2>Payments, refunds and cancellations</h2>
            <p>Full terms covering fees, cancellations, sample runs, refunds and disputes will be published here before bookings open.</p>
          </>
        )}
      </div>
    </section>
  );
}

export function ComingSoon() {
  const { pathname } = useLocation();
  const admin = pathname.startsWith('/admin');
  return (
    <>
      <Seo title="Coming soon" noindex />
      <div className="card">
        <EmptyState
          icon="🚧"
          title="This part of Jojo Market is on its way"
          action={<Link to={admin ? '/admin' : '/app'} className="btn btn--primary btn--sm">Back to dashboard</Link>}
        >
          {admin
            ? 'Booking queue, catalogue and payments are the next modules being built.'
            : 'Online booking opens soon. Meanwhile, finish setting up your profile so you’re ready.'}
        </EmptyState>
      </div>
    </>
  );
}
