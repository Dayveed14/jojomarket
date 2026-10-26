import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Seo from '../../components/Seo';
import { Alert, Spinner } from '../../components/ui';
import { bookingApi } from '../../services/api';

/** Paystack redirects here. We re-verify on the server — the redirect alone proves nothing. */
export default function PaymentCallback() {
  const [params] = useSearchParams();
  const [state, setState] = useState({ status: 'checking' });
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const reference = params.get('reference') || params.get('trxref');
    if (!reference) { setState({ status: 'error', message: 'No payment reference found.' }); return; }
    bookingApi.verifyPayment(reference)
      .then((r) => setState({ status: r.status, ref: r.bookingReference }))
      .catch((e) => setState({ status: 'error', message: e.message }));
  }, [params]);

  return (
    <div className="card narrow-card">
      <Seo title="Confirming payment" noindex />
      <h1 className="card__h">Confirming your payment…</h1>
      {state.status === 'checking' && <Spinner label="Checking with Paystack" />}
      {state.status === 'successful' && <Alert tone="success" title="Payment confirmed">Thank you! Your market run is booked.</Alert>}
      {state.status === 'failed' && <Alert tone="error" title="Payment not completed">The payment didn’t go through. You haven’t been charged — you can try again from your booking.</Alert>}
      {state.status === 'error' && <Alert tone="error">{state.message}</Alert>}
      {state.ref && <Link to={`/app/bookings/${state.ref}`} className="btn btn--primary">Back to my booking</Link>}
      {state.status === 'error' && <Link to="/app/bookings" className="btn btn--ghost">My bookings</Link>}
    </div>
  );
}
