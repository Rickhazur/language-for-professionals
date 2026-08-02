import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../config/supabase';
import { scoreBackground, scoreColor } from '../lib/scoreColor';
import { statusForBox, statusBackground, statusColor, STATUS_LABELS } from '../lib/vocabularyStatus';
import {
  Profile,
  StudentProfile,
  StudentWeakness,
  ShadowingAttempt,
  StudentAiSummary,
  TeacherNote,
  CoursePlanVocabularyTerm,
  StudentVocabularyProgress,
} from '../types/database';

const LANGUAGE_LABELS: Record<string, string> = { en: 'Inglés', es: 'Español' };
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

interface WeeklyProgress {
  sessionsCount: number;
  totalMinutes: number;
  attemptsCount: number;
  avgAccuracy: number | null;
}

function ScoreChip({ label, score }: { label: string; score: number | null }) {
  return (
    <div className="score-chip" style={{ backgroundColor: scoreBackground(score) }}>
      <span className="score-chip-value" style={{ color: scoreColor(score) }}>
        {score !== null ? Math.round(score) : '—'}
      </span>
      <span className="score-chip-label">{label}</span>
    </div>
  );
}

export function StudentDetailPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const { session } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [weaknesses, setWeaknesses] = useState<StudentWeakness[]>([]);
  const [attempts, setAttempts] = useState<ShadowingAttempt[]>([]);
  const [weekly, setWeekly] = useState<WeeklyProgress | null>(null);
  const [summary, setSummary] = useState<StudentAiSummary | null>(null);
  const [notes, setNotes] = useState<TeacherNote[]>([]);
  const [vocabulary, setVocabulary] = useState<CoursePlanVocabularyTerm[]>([]);
  const [vocabularyProgress, setVocabularyProgress] = useState<StudentVocabularyProgress[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [savingNote, setSavingNote] = useState(false);

  const loadData = useCallback(async () => {
    if (!studentId || !session) return;
    setLoading(true);
    setError(null);

    const sinceIso = new Date(Date.now() - SEVEN_DAYS_MS).toISOString();

    const [
      profileRes,
      studentProfileRes,
      weaknessesRes,
      attemptsRes,
      recentAttemptsRes,
      sessionsRes,
      summaryRes,
      notesRes,
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', studentId).single(),
      supabase.from('student_profiles').select('*').eq('id', studentId).single(),
      supabase.from('student_weaknesses').select('*').eq('student_id', studentId).eq('is_active', true),
      supabase
        .from('shadowing_attempts')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase.from('shadowing_attempts').select('accuracy_score').eq('student_id', studentId).gte('created_at', sinceIso),
      supabase
        .from('practice_sessions')
        .select('duration_minutes')
        .eq('student_id', studentId)
        .gte('started_at', sinceIso),
      supabase
        .from('student_ai_summaries')
        .select('*')
        .eq('student_id', studentId)
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('teacher_notes')
        .select('*')
        .eq('student_id', studentId)
        .eq('teacher_id', session.user.id)
        .order('created_at', { ascending: false }),
    ]);

    if (profileRes.error || studentProfileRes.error) {
      setError('No se pudo cargar este estudiante (¿sigue asignado a ti?).');
      setLoading(false);
      return;
    }

    setProfile(profileRes.data);
    setStudentProfile(studentProfileRes.data);
    setWeaknesses(weaknessesRes.data ?? []);
    setAttempts(attemptsRes.data ?? []);
    setSummary(summaryRes.data ?? null);
    setNotes(notesRes.data ?? []);

    const weekAttemptScores = (recentAttemptsRes.data ?? [])
      .map((a) => a.accuracy_score)
      .filter((s): s is number => typeof s === 'number');

    setWeekly({
      sessionsCount: sessionsRes.data?.length ?? 0,
      totalMinutes: (sessionsRes.data ?? []).reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0),
      attemptsCount: recentAttemptsRes.data?.length ?? 0,
      avgAccuracy:
        weekAttemptScores.length > 0
          ? Math.round((weekAttemptScores.reduce((a, b) => a + b, 0) / weekAttemptScores.length) * 10) / 10
          : null,
    });

    const { data: activePlan } = await supabase
      .from('course_plans')
      .select('id')
      .eq('student_id', studentId)
      .eq('status', 'active')
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (activePlan) {
      const [vocabRes, progressRes] = await Promise.all([
        supabase.from('course_plan_vocabulary').select('*').eq('course_plan_id', activePlan.id),
        supabase.from('student_vocabulary_progress').select('*').eq('student_id', studentId),
      ]);
      setVocabulary(vocabRes.data ?? []);
      setVocabularyProgress(progressRes.data ?? []);
    } else {
      setVocabulary([]);
      setVocabularyProgress([]);
    }

    setLoading(false);
  }, [studentId, session]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleGenerateSummary = async () => {
    if (!studentId) return;
    setGeneratingSummary(true);
    const { data, error: fnError } = await supabase.functions.invoke('generate-student-summary', {
      body: { studentId },
    });
    setGeneratingSummary(false);

    if (fnError || !data?.summary) {
      let message = fnError instanceof Error ? fnError.message : 'No se pudo generar el resumen.';
      try {
        const body = await (fnError as { context?: Response })?.context?.json();
        if (body?.error) message = body.error;
      } catch {
        // se queda con message
      }
      setError(message);
      return;
    }

    setSummary(data.summary);
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !session || !newNote.trim()) return;

    setSavingNote(true);
    const { data, error: insertError } = await supabase
      .from('teacher_notes')
      .insert({ teacher_id: session.user.id, student_id: studentId, note: newNote.trim() })
      .select()
      .single();
    setSavingNote(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setNotes((prev) => [data, ...prev]);
    setNewNote('');
  };

  if (loading) {
    return (
      <AppLayout>
        <p>Cargando…</p>
      </AppLayout>
    );
  }

  if (error && !profile) {
    return (
      <AppLayout>
        <Link to="/" className="back-link">
          ← Volver a mis estudiantes
        </Link>
        <div className="alert alert-error">{error}</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Link to="/" className="back-link">
        ← Volver a mis estudiantes
      </Link>

      <div className="student-header">
        <h1 className="page-title">{profile?.full_name || profile?.email}</h1>
        <div className="student-card-tags">
          <span className="tag">{LANGUAGE_LABELS[studentProfile?.target_language ?? ''] ?? '—'}</span>
          <span className="tag">{studentProfile?.proficiency_level}</span>
          {studentProfile?.occupation && <span className="tag">{studentProfile.occupation}</span>}
          {studentProfile?.industry && <span className="tag">{studentProfile.industry}</span>}
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <section className="panel">
        <h2 className="panel-title">Progreso de la semana</h2>
        <div className="stat-row">
          <div className="stat-box">
            <div className="stat-value">{weekly?.sessionsCount ?? 0}</div>
            <div className="stat-label">Sesiones</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{weekly?.totalMinutes ?? 0}</div>
            <div className="stat-label">Minutos</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{weekly?.attemptsCount ?? 0}</div>
            <div className="stat-label">Intentos de shadowing</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{weekly?.avgAccuracy ?? '—'}</div>
            <div className="stat-label">Precisión promedio</div>
          </div>
        </div>
      </section>

      <section className="panel">
        <h2 className="panel-title">Debilidades activas</h2>
        {weaknesses.length === 0 ? (
          <p className="empty-state">Sin debilidades activas detectadas por el momento.</p>
        ) : (
          <div className="weakness-list">
            {weaknesses.map((w) => (
              <div key={w.id} className="weakness-chip" style={{ backgroundColor: scoreBackground(w.average_score) }}>
                <span style={{ color: scoreColor(w.average_score), fontWeight: 700 }}>/{w.target}/</span>
                <span className="weakness-chip-meta">
                  {w.average_score}% en sus últimos {w.sample_count} intentos
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <h2 className="panel-title">Vocabulario</h2>
        {vocabulary.length === 0 ? (
          <p className="empty-state">Este estudiante todavía no tiene un plan de curso con vocabulario generado.</p>
        ) : (
          <>
            {(() => {
              const progressByTermId = new Map(vocabularyProgress.map((p) => [p.vocabulary_id, p]));
              const mastered = vocabulary.filter((t) => {
                const p = progressByTermId.get(t.id);
                return p && statusForBox(p.box, true) === 'mastered';
              }).length;
              return (
                <p className="panel-note">
                  {mastered} de {vocabulary.length} términos dominados.
                </p>
              );
            })()}
            <table className="table">
              <thead>
                <tr>
                  <th>Término</th>
                  <th>Traducción</th>
                  <th>Estado</th>
                  <th>Aciertos/Errores</th>
                  <th>Último repaso</th>
                </tr>
              </thead>
              <tbody>
                {vocabulary.map((term) => {
                  const progress = vocabularyProgress.find((p) => p.vocabulary_id === term.id);
                  const status = statusForBox(progress?.box ?? 1, progress !== undefined);
                  return (
                    <tr key={term.id}>
                      <td>{term.term}</td>
                      <td>{term.translation}</td>
                      <td>
                        <span
                          className="score-chip"
                          style={{ backgroundColor: statusBackground(status), color: statusColor(status) }}
                        >
                          {STATUS_LABELS[status]}
                        </span>
                      </td>
                      <td>
                        {progress ? `${progress.correct_count} / ${progress.incorrect_count}` : '—'}
                      </td>
                      <td>
                        {progress?.last_reviewed_at ? new Date(progress.last_reviewed_at).toLocaleDateString('es') : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}
      </section>

      <section className="panel">
        <div className="panel-header-row">
          <h2 className="panel-title">Resumen de IA</h2>
          <button className="button button-secondary" onClick={handleGenerateSummary} disabled={generatingSummary}>
            {generatingSummary ? 'Generando…' : summary ? 'Regenerar' : 'Generar resumen'}
          </button>
        </div>
        {summary ? (
          <>
            <p className="ai-summary-text">{summary.summary}</p>
            <p className="ai-summary-date">Generado: {new Date(summary.generated_at).toLocaleString('es')}</p>
          </>
        ) : (
          <p className="empty-state">Todavía no se ha generado un resumen para este estudiante.</p>
        )}
      </section>

      <section className="panel">
        <h2 className="panel-title">Historial de intentos de shadowing</h2>
        <p className="panel-note">
          Por privacidad, no se conserva el audio grabado — solo el texto reconocido y los puntajes de cada intento.
        </p>
        {attempts.length === 0 ? (
          <p className="empty-state">Sin intentos registrados todavía.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Frase</th>
                <th>Precisión</th>
                <th>Fluidez</th>
                <th>Entonación</th>
                <th>General</th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((a) => (
                <tr key={a.id}>
                  <td>{new Date(a.created_at).toLocaleDateString('es')}</td>
                  <td>{a.reference_text}</td>
                  <td>
                    <ScoreChip label="" score={a.accuracy_score} />
                  </td>
                  <td>
                    <ScoreChip label="" score={a.fluency_score} />
                  </td>
                  <td>
                    <ScoreChip label="" score={a.prosody_score} />
                  </td>
                  <td>
                    <ScoreChip label="" score={a.pron_score} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="panel">
        <h2 className="panel-title">Notas de clase</h2>
        <form onSubmit={handleAddNote} className="note-form">
          <textarea
            className="textarea"
            placeholder="Escribe una nota después de la clase…"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={3}
          />
          <button className="button button-primary" type="submit" disabled={savingNote || !newNote.trim()}>
            {savingNote ? 'Guardando…' : 'Guardar nota'}
          </button>
        </form>

        {notes.length === 0 ? (
          <p className="empty-state">Todavía no has dejado notas para este estudiante.</p>
        ) : (
          <ul className="note-list">
            {notes.map((n) => (
              <li key={n.id} className="note-item">
                <p className="note-text">{n.note}</p>
                <p className="note-date">{new Date(n.created_at).toLocaleString('es')}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppLayout>
  );
}
