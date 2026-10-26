import { Link, useLocation, useNavigate } from 'react-router-dom';
import Seo from '../../components/Seo';
import { Alert, Button, PasswordInput, TextInput } from '../../components/ui';
import { homeFor, useAuth } from '../../context/AuthContext';
import { useForm } from '../../hooks/useForm';

export default function Login({ portal = 'customer' }) {
  const admin = portal === 'admin';
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { bind, errors, formError, submitting, submit } = useForm({ email: '', password: '' });
  const notice = location.state?.notice;

  const onSubmit = submit(async ({ email, password }) => {
    const user = await login({ email, password, portal });
    const from = location.state?.from;
    const safeFrom = typeof from === 'string' && from.startsWith(user.role === 'operator' ? '/admin' : '/app') ? from : null;
    navigate(safeFrom || homeFor(user), { replace: true });
  });

  return (
    <>
      <Seo title={admin ? 'Operator sign in' : 'Sign in'} noindex />
      <h1 className="auth__title">{admin ? 'Operator sign in' : 'Welcome back'}</h1>
      <p className="auth__sub">
        {admin ? 'Staff access to the Jojo Market console.' : 'Sign in to book a shopper and see your receipts.'}
      </p>

      {notice && <Alert tone="success">{notice}</Alert>}
      {formError && <Alert tone="error">{formError}</Alert>}

      <form onSubmit={onSubmit} noValidate className="form">
        <TextInput label="Email address" type="email" autoComplete="email" inputMode="email" required autoFocus {...bind('email')} error={errors.email} />
        <PasswordInput autoComplete="current-password" required {...bind('password')} error={errors.password} />
        {!admin && (
          <div className="form__row-end">
            <Link to="/forgot-password" className="link-sm">Forgot password?</Link>
          </div>
        )}
        <Button type="submit" loading={submitting} className="btn--block btn--lg">Sign in</Button>
      </form>

      {admin ? (
        <p className="auth__switch"><Link to="/login">Customer sign in</Link></p>
      ) : (
        <p className="auth__switch">New to Jojo Market? <Link to="/register">Create an account</Link></p>
      )}
    </>
  );
}
