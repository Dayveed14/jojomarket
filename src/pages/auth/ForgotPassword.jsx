import { useState } from 'react';
import { Link } from 'react-router-dom';
import Seo from '../../components/Seo';
import { Alert, Button, TextInput } from '../../components/ui';
import { useForm } from '../../hooks/useForm';
import { authApi } from '../../services/api';

export default function ForgotPassword() {
  const [sent, setSent] = useState('');
  const { bind, errors, formError, submitting, submit } = useForm({ email: '' });

  const onSubmit = submit(async ({ email }) => {
    const res = await authApi.forgotPassword(email);
    setSent(res.message);
  });

  return (
    <>
      <Seo title="Reset your password" noindex />
      <h1 className="auth__title">Forgot your password?</h1>
      <p className="auth__sub">Enter your email and we’ll send you a link to choose a new one.</p>

      {sent ? (
        <>
          <Alert tone="success" title="Check your inbox">{sent} The link expires in 30 minutes.</Alert>
          <p className="auth__switch"><Link to="/login">Back to sign in</Link></p>
        </>
      ) : (
        <>
          {formError && <Alert tone="error">{formError}</Alert>}
          <form onSubmit={onSubmit} noValidate className="form">
            <TextInput label="Email address" type="email" autoComplete="email" required autoFocus {...bind('email')} error={errors.email} />
            <Button type="submit" loading={submitting} className="btn--block btn--lg">Send reset link</Button>
          </form>
          <p className="auth__switch">Remembered it? <Link to="/login">Sign in</Link></p>
        </>
      )}
    </>
  );
}
