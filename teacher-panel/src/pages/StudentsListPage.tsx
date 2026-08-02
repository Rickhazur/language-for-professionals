import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../config/supabase';
import { summarizePlanUsage, formatPlanTag } from '../lib/planStatus';
import { Plan, StudentPlan } from '../types/database';

interface StudentRow {
  studentId: string;
  email: string;
  fullName: string | null;
  occupation: string | null;
  industry: string | null;
  targetLanguage: string;
  level: string;
  planTag: string | null;
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

      const [studentPlansRes, plansRes] = await Promise.all([
        supabase.from('student_plans').select('*').eq('is_active', true),
        supabase.from('plans').select('*'),
      ]);
      const studentPlans = (studentPlansRes.data ?? []) as StudentPlan[];
      const planById = new Map(((plansRes.data ?? []) as Plan[]).map((p) => [p.id, p]));

      let usageByStudentPlanId = new Map<string, string[]>();
      if (studentPlans.length > 0) {
        const { data: usageRows } = await supabase
          .from('app_usage_log')
          .select('student_plan_id, created_at')
          .in('student_plan_id', studentPlans.map((sp) => sp.id));
        usageByStudentPlanId = (usageRows ?? []).reduce((map, r) => {
          const list = map.get(r.student_plan_id) ?? [];
          list.push(r.created_at);
          map.set(r.student_plan_id, list);
          return map;
        }, new Map<string, string[]>());
      }
      const studentPlanByStudentId = new Map(studentPlans.map((sp) => [sp.student_id, sp]));

      const rows: StudentRow[] = (data ?? []).map((row) => {
        const sp = Array.isArray(row.student_profiles) ? row.student_profiles[0] : row.student_profiles;
        const p = Array.isArray(sp.profiles) ? sp.profiles[0] : sp.profiles;

        const studentPlan = studentPlanByStudentId.get(row.student_id);
        const plan = studentPlan ? planById.get(studentPlan.plan_id) : undefined;
        const planTag =
          studentPlan && plan
            ? formatPlanTag(plan.name, summarizePlanUsage(studentPlan, plan, usageByStudentPlanId.get(studentPlan.id) ?? []))
            : null;

        return {
          studentId: row.student_id,
          email: p.email,
          fullName: p.full_name,
          occupation: sp.occupation,
          industry: sp.industry,
          targetLanguage: sp.target_language,
          level: sp.proficiency_level,
          planTag,
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
                {s.planTag && <span className="tag">{s.planTag}</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
