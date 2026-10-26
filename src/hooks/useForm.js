import { useState } from 'react';
import { ApiError } from '../services/api';

/** Tiny form helper: values, field errors from the API, and a submit wrapper. */
export function useForm(initial) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const bind = (name) => ({
    name,
    value: values[name] ?? '',
    onChange: (e) => {
      const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      setValues((s) => ({ ...s, [name]: v }));
      if (errors[name]) setErrors((s) => ({ ...s, [name]: undefined }));
    },
  });

  const submit = (fn) => async (e) => {
    e?.preventDefault();
    setFormError('');
    setErrors({});
    setSubmitting(true);
    try {
      await fn(values);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.fields || {});
        setFormError(err.message);
      } else {
        setFormError("We couldn't reach Jojo Market. Check your connection and try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return { values, setValues, errors, setErrors, formError, setFormError, submitting, bind, submit };
}
