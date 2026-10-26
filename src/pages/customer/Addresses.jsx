import { useState } from 'react';
import AddressForm from '../../components/AddressForm';
import { Confirm, ErrorState, Modal, useAsync } from '../../components/common';
import Seo from '../../components/Seo';
import { Button, EmptyState, Spinner } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { meApi } from '../../services/api';

export default function Addresses() {
  const { user } = useAuth();
  const { data, error, loading, reload } = useAsync(() => meApi.addresses().then((r) => r.items), []);
  const [editing, setEditing] = useState(null); // null | {} (new) | address
  const [removing, setRemoving] = useState(null);
  const [busy, setBusy] = useState(false);

  return (
    <>
      <Seo title="Delivery addresses" noindex />
      <header className="page-head page-head--row">
        <div><h1>Delivery addresses</h1><p className="muted">Private to you and Jojo. Past bookings keep the address they were delivered to.</p></div>
        <Button className="btn--sm" onClick={() => setEditing({})}>+ Add address</Button>
      </header>
      {error && <ErrorState error={error} onRetry={reload} />}
      {loading && !data ? <Spinner /> : data && (
        data.length ? (
          <div className="addr-grid">
            {data.map((a) => (
              <article key={a.id} className={`card addr-card${a.isDefault ? ' is-default' : ''}`}>
                <header className="card__head"><h2>{a.label}</h2>{a.isDefault && <span className="badge badge--gold">Default</span>}</header>
                <p><strong>{a.areaName}</strong><br />{a.addressLine}{a.landmark && <><br /><span className="muted small">{a.landmark}</span></>}</p>
                <p className="muted small">{a.recipientName} · {a.recipientPhone}</p>
                {a.deliveryInstructions && <p className="muted small">“{a.deliveryInstructions}”</p>}
                <div className="btn-row">
                  <Button variant="secondary" className="btn--sm" onClick={() => setEditing(a)}>Edit</Button>
                  <Button variant="ghost" className="btn--sm" onClick={() => setRemoving(a)}>Remove</Button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="card"><EmptyState icon="📍" title="No addresses yet" action={<Button className="btn--sm" onClick={() => setEditing({})}>Add your first address</Button>}>Add where Jojo should deliver your shopping.</EmptyState></div>
        )
      )}

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={editing?.id ? 'Edit address' : 'Add address'} wide>
        {editing && <AddressForm initial={editing} defaultName={user.displayName} defaultPhone={user.phone} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
      </Modal>
      <Confirm open={Boolean(removing)} title="Remove this address?" confirmLabel="Remove" busy={busy} onClose={() => setRemoving(null)}
        onConfirm={async () => { setBusy(true); try { await meApi.deleteAddress(removing.id); setRemoving(null); reload(); } finally { setBusy(false); } }}>
        <p>“{removing?.label}” will no longer be offered when you book. Past bookings aren’t affected.</p>
      </Confirm>
    </>
  );
}
