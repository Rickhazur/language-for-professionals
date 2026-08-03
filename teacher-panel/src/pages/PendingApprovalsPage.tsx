import { useEffect, useState } from 'react';
import { AppLayout } from '../components/AppLayout';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../config/supabase';
import { Profile } from '../types/database';

const ROLE_LABELS: Record<string, string> = { student: 'Estudiante', teacher: 'Profesor' };

export function PendingApprovalsPage() {
  const { session } = useAuth();
  const [pending, setPending] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const loadPending = async () => {
    setLoading(true);
    const { data, error: queryError } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_approved', false)
      .order('created_at', { ascending: true });

    if (queryError) {
      setError(queryError.message);
      setLoading(false);
      return;
    }

    setPending(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (!session) return;
    loadPending();
  }, [session]);

  const handleApprove = async (profileId: string) => {
    setApprovingId(profileId);
    setError(null);

    const { data, error: fnError } = await supabase.functions.invoke('approve-account', {
      body: { profileId },
    });

    setApprovingId(null);

    if (fnError || !data?.profile) {
      let message = fnError instanceof Error ? fnError.message : 'No se pudo aprobar la cuenta.';
      try {
        const body = await (fnError as { context?: Response })?.context?.json();
        if (body?.error) message = body.error;
      } catch {
        // se queda con message
      }
      setError(message);
      return;
    }

    if (data.emailWarning) {
      setError(data.emailWarning);
    }

    setPending((prev) => prev.filter((p) => p.id !== profileId));
  };

  return (
    <AppLayout>
      <h1 className="page-title">Solicitudes pendientes</h1>

      {loading && <p>Cargando…</p>}
      {error && <div className="alert alert-error">{error}</div>}

      {!loading && pending.length === 0 && !error && (
        <p className="empty-state">No hay cuentas esperando aprobación.</p>
      )}

      {pending.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Correo</th>
                <th>Nombre</th>
                <th>Rol</th>
                <th>Registrado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pending.map((p) => (
                <tr key={p.id}>
                  <td data-label="Correo">{p.email}</td>
                  <td data-label="Nombre">{p.full_name || '—'}</td>
                  <td data-label="Rol">{ROLE_LABELS[p.role] ?? p.role}</td>
                  <td data-label="Registrado">{new Date(p.created_at).toLocaleDateString('es')}</td>
                  <td>
                    <button
                      className="button button-primary"
                      onClick={() => handleApprove(p.id)}
                      disabled={approvingId === p.id}
                    >
                      {approvingId === p.id ? 'Aprobando…' : 'Aprobar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppLayout>
  );
}
