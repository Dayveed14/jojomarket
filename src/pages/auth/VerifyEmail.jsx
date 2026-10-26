import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Seo from '../../components/Seo';
import { Alert, Spinner } from '../../components/ui';
import { homeFor, useAuth } from '../../context/AuthContext';
import { authApi } from '../../services/api';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const { user, setUser } = useAuth();
  const [state, setState] = useState({ status: 'working', message: '' });
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // StrictMode double-invokes effects; tokens are single-use
    ran.current = true;
    const token = params.get('token');
    window.history.replaceState(null, '', '/verify-email');
    if (!token) {
      setState({ status: 'error', message: 'This page needs the confirmation link from your email.' });
      return;
    }
    authApi.verifyEmail(token)
      .then((r) => setState({ status: 'ok', message: r.message }))
      .catch((e) => setState({ status: 'error', message: e.message }));
  }, [params]);

  useEffect(() => {
    if (state.status === 'ok' && user && !user.emailVerified) setUser({ ...user, emailVerified: true });
  }, [state.status, user, setUser]);

  return (
    <>
      <Seo title="Confirm email" noindex />
      <h1 className="auth__title">Email confirmation</h1>
      {state.status === 'working' && <Spinner label="Confirming your email" />}
      {state.status === 'ok' && <Alert tone="success">{state.message}</Alert>}
      {state.status === 'error' && <Alert tone="error">{state.message} You can request a new link from your dashboard.</Alert>}
      {state.status !== 'working' && (
        <p className="auth__switch">
          <Link to={user ? homeFor(user) : '/login'}>{user ? 'Go to my dashboard' : 'Sign in'}</Link>
        </p>
      )}
    </>
  );
}
