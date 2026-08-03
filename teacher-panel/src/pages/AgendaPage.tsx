import { useEffect, useState } from 'react';
import { AppLayout } from '../components/AppLayout';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../config/supabase';

interface BookingRow {
  id: string;
  scheduledAt: string;
  durationMinutes: number;
  studentName: string;
}

export function AgendaPage() {
  const { session } = useAuth();
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;

    (async () => {
      setLoading(true);
      const { data, error: queryError } = await supabase
        .from('class_bookings')
        .select(
          `id,
           scheduled_at,
           duration_minutes,
           student:profiles!class_bookings_student_id_fkey ( full_name, email )`
        )
        .eq('teacher_id', session.user.id)
        .eq('status', 'confirmed')
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true });

      if (queryError) {
        setError(queryError.message);
        setLoading(false);
        return;
      }

      const rows: BookingRow[] = (data ?? []).map((row) => {
        const student = Array.isArray(row.student) ? row.student[0] : row.student;
        return {
          id: row.id,
          scheduledAt: row.scheduled_at,
          durationMinutes: row.duration_minutes,
          studentName: student?.full_name || student?.email || 'Estudiante',
        };
      });

      setBookings(rows);
      setLoading(false);
    })();
  }, [session]);

  return (
    <AppLayout>
      <h1 className="page-title">Agenda</h1>

      {loading && <p>Cargando…</p>}
      {error && <div className="alert alert-error">{error}</div>}

      {!loading && !error && bookings.length === 0 && (
        <p className="empty-state">No tienes clases reservadas todavía.</p>
      )}

      {bookings.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Duración</th>
                <th>Estudiante</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => {
                const date = new Date(b.scheduledAt);
                return (
                  <tr key={b.id}>
                    <td data-label="Fecha">
                      {date.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </td>
                    <td data-label="Hora">{date.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' })}</td>
                    <td data-label="Duración">{b.durationMinutes} min</td>
                    <td data-label="Estudiante">{b.studentName}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AppLayout>
  );
}
