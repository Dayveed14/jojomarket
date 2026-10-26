import { useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Seo from '../../components/Seo';
import { Alert, Button, PasswordInput, PasswordStrength } from '../../components/ui';
import { useForm } from '../../hooks/useForm';
import { authApi } from '../../services/api';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const navigate = useNavigate();
  const { bind, values, errors, setErrors, formError, submitting, submit } = useForm({ password: '', confirm: '' });

  // Remove the token from the address bar/history once read.
  useEffect(() => {
    if (token) window.history.replaceState(null, '', '/reset-password');
  }, [token]);

  const onSubmit = submit(async ({ password, confirm }) => {
    if (password !== confirm) {
      setErrors({ confirm: 'Passwords do not match' });
      return;
    }
    const res = await authApi.resetPassword(token, password);
    navigate('/login', { replace: true, state: { notice: res.message } });
  });

  if (!token) {
    return (
      <>
        <Seo title="Reset password" noindex />
        <h1 className="auth__title">Link missing</h1>
        <Alert tone="error">This page needs the reset link from your email.</Alert>
        <p className="auth__switch"><Link to="/forgot-password">Request a new link</Link></p>
      </>
    );
  }

  return (
    <>
      <Seo title="Choose a new password" noindex />
      <h1 className="auth__title">Choose a new password</h1>
      <p className="auth__sub">For your security, this signs you out on all other devices.</p>
      {formError && (
        <Alert tone="error">
          {formError} {formError.includes('expired') && <Link to="/forgot-password">Request a new link</Link>}
        </Alert>
      )}
      <form onSubmit={onSubmit} noValidate className="form">
        <div>
          <PasswordInput label="New password" autoComplete="new-password" required autoFocus {...bind('password')} error={errors.password} />
          {values.password && <PasswordStrength value={values.password} />}
        </div>
        <PasswordInput label="Confirm new password" autoComplete="new-password" required {...bind('confirm')} error={errors.confirm} />
        <Button type="submit" loading={submitting} className="btn--block btn--lg">Update password</Button>
      </form>
    </>
  );
}
