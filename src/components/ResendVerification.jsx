import { useState } from 'react';
import { authApi } from '../services/api';

/** "Resend link" button with its own state. Used on the dashboard, checklist and settings. */
export default function ResendVerification({ label = 'Resend confirmation email' }) {
  const [state, setState] = useState({ busy: false, msg: '' });
  const send = async () => {
    setState({ busy: true, msg: '' });
    try {
      const r = await authApi.resendVerification();
      setState({ busy: false, msg: r.message });
    } catch (e) {
      setState({ busy: false, msg: e.message });
    }
  };
  if (state.msg) return <span className="small">{state.msg}</span>;
  return (
    <button type="button" className="link-btn" onClick={send} disabled={state.busy}>
      {state.busy ? 'Sending…' : label}
    </button>
  );
}
