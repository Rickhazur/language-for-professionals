import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../config/supabase';

interface StudentRow {
  studentId: string;
  email: string;
  fullName: string | null;
  occupation: string | null;
  industry: string | null;
  targetLanguage: string;
  level: string;
}

const LANGUAGE_LABELS: Record<string, string> = { en: 'Inglés', es: 'Español' };

export function StudentsListPage() {
  const { session } = useAuth();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;

    (async () => {
      setLoading(true);
      const { data, error: queryError } = await supabase
        .from('student_teacher_assignments')
        .select(
          `student_id,
           student_profiles!inner (
             id,
             occupation,
             industry,
             target_language,
             proficiency_level,
             profiles!inner ( id, email, full_name )
           )`
        )
        .eq('teacher_id', session.user.id);

      if (queryError) {
        setError(queryError.message);
        setLoading(false);
        return;
      }

      const rows: StudentRow[] = (data ?? []).map((row) => {
        const sp = Array.isArray(row.student_profiles) ? row.student_profiles[0] : row.student_profiles;
        const p = Array.isArray(sp.profiles) ? sp.profiles[0] : sp.profiles;
        return {
          studentId: row.student_id,
          email: p.email,
          fullName: p.full_name,
          occupation: sp.occupation,
          industry: sp.industry,
          targetLanguage: sp.target_language,
          level: sp.proficiency_level,
        };
      });

      setStudents(rows);
      setLoading(false);
    })();
  }, [session]);

  return (
    <AppLayout>
      <h1 className="page-title">Mis estudiantes</h1>

      {loading && <p>Cargando…</p>}
      {error && <div className="alert alert-error">{error}</div>}

      {!loading && !error && students.length === 0 && (
        <p className="empty-state">Todavía no tienes estudiantes asignados.</p>
      )}

      {students.length > 0 && (
        <div className="card-grid">
          {students.map((s) => (
            <Link key={s.studentId} to={`/students/${s.studentId}`} className="student-card">
              <div className="student-card-name">{s.fullName || s.email}</div>
              <div className="student-card-meta">{s.email}</div>
              <div className="student-card-tags">
                <span className="tag">{LANGUAGE_LABELS[s.targetLanguage] ?? s.targetLanguage}</span>
                <span className="tag">{s.level}</span>
                {s.occupation && <span className="tag">{s.occupation}</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
