import { Link, useNavigate } from 'react-router-dom';
import Seo from '../../components/Seo';
import { Alert, Button, PasswordInput, PasswordStrength, TextInput } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useForm } from '../../hooks/useForm';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const { bind, values, errors, formError, submitting, submit } = useForm({
    displayName: '', email: '', phone: '', password: '', acceptTerms: false,
  });

  // The API validates every field (incl. terms) and returns all errors at once.
  const onSubmit = submit(async (v) => {
    await register(v);
    navigate('/app', { replace: true, state: { welcome: true } });
  });

  return (
    <>
      <Seo title="Create your account" description="Create a free Jojo Market account to book a trusted market shopper." noindex />
      <h1 className="auth__title">Create your account</h1>
      <p className="auth__sub">Free to join. You only pay once you accept a quote.</p>

      {formError && (
        <Alert tone="error">
          {formError}
          {errors && Object.keys(errors).length === 0 && formError.includes('sign in') && (
            <> <Link to="/login">Sign in</Link> · <Link to="/forgot-password">Reset password</Link></>
          )}
        </Alert>
      )}

      <form onSubmit={onSubmit} noValidate className="form">
        <TextInput label="Your name" autoComplete="name" required autoFocus {...bind('displayName')} error={errors.displayName} />
        <TextInput label="Email address" type="email" autoComplete="email" inputMode="email" required {...bind('email')} error={errors.email} />
        <TextInput
          label="Phone number (optional)" type="tel" autoComplete="tel" inputMode="tel" placeholder="0803 123 4567"
          hint="Helps Jojo reach you quickly on shopping day." {...bind('phone')} error={errors.phone}
        />
        <div>
          <PasswordInput autoComplete="new-password" required {...bind('password')} error={errors.password} />
          {values.password && <PasswordStrength value={values.password} />}
        </div>

        <div className={`check${errors.acceptTerms ? ' check--error' : ''}`}>
          <input id="acceptTerms" type="checkbox" {...bind('acceptTerms')} checked={values.acceptTerms} value={undefined} aria-invalid={Boolean(errors.acceptTerms) || undefined} />
          <label htmlFor="acceptTerms">
            I agree to the <Link to="/terms" target="_blank">terms of service</Link> and have read the{' '}
            <Link to="/privacy" target="_blank">privacy notice</Link>.
          </label>
        </div>
        {errors.acceptTerms && <p className="field__error" role="alert">{errors.acceptTerms}</p>}

        <Button type="submit" variant="accent" loading={submitting} className="btn--block btn--lg">Create account</Button>
      </form>

      <p className="auth__switch">Already have an account? <Link to="/login">Sign in</Link></p>
    </>
  );
}
