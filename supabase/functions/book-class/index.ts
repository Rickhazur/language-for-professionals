// Supabase Edge Function: reserva una clase en vivo. El estudiante manda una
// fecha y hora de reloj de pared ("15:00 del 10 de agosto"), no un timestamp
// con zona horaria — esta función es el único lugar que sabe que esa hora es
// hora de Colombia (America/Bogotá, UTC-5 fijo, sin horario de verano) y hace
// la conversión ella misma. El cliente nunca ve el horario completo del
// profesor: solo recibe un sí (reservado) o un no (por qué no) por intento.

import { createClient } from 'npm:@supabase/supabase-js@2';

const BOGOTA_UTC_OFFSET_HOURS = 5; // Bogotá = UTC-5, sin DST

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Falta el encabezado Authorization.' }, 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return jsonResponse({ error: 'No se pudo verificar el usuario.' }, 401);
    }

    const body = await req.json().catch(() => null);
    const date = typeof body?.date === 'string' ? body.date : ''; // 'YYYY-MM-DD'
    const hour = typeof body?.hour === 'number' ? body.hour : null; // 0-23, hora Colombia

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || hour === null || hour < 0 || hour > 23) {
      return jsonResponse({ error: 'Falta o es inválida "date" (YYYY-MM-DD) o "hour" (0-23).' }, 400);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);

    const { data: caller } = await admin
      .from('profiles')
      .select('role, is_approved')
      .eq('id', user.id)
      .maybeSingle();

    if (!caller || caller.role !== 'student' || !caller.is_approved) {
      return jsonResponse({ error: 'Solo un estudiante ya aprobado puede reservar clases.' }, 403);
    }

    const { data: assignment } = await admin
      .from('student_teacher_assignments')
      .select('teacher_id')
      .eq('student_id', user.id)
      .maybeSingle();

    if (!assignment) {
      return jsonResponse({ error: 'Todavía no tienes un profesor asignado.' }, 404);
    }

    const [year, month, day] = date.split('-').map(Number);
    const scheduledAt = new Date(Date.UTC(year, month - 1, day, hour + BOGOTA_UTC_OFFSET_HOURS, 0, 0));

    if (Number.isNaN(scheduledAt.getTime())) {
      return jsonResponse({ error: 'Fecha inválida.' }, 400);
    }
    if (scheduledAt.getTime() <= Date.now()) {
      return jsonResponse({ error: 'Elige una fecha y hora futura.' }, 400);
    }

    // Día de la semana en hora de Colombia (no en UTC) — se calcula sobre el
    // valor de reloj de pared que mandó el cliente, así no hay que
    // "des-convertir" el timestamp UTC de vuelta a hora local.
    const dayOfWeek = new Date(Date.UTC(year, month - 1, day)).getUTCDay();

    const { data: availability } = await admin
      .from('teacher_availability')
      .select('start_time, end_time')
      .eq('teacher_id', assignment.teacher_id)
      .eq('day_of_week', dayOfWeek)
      .maybeSingle();

    const hourStr = `${String(hour).padStart(2, '0')}:00:00`;
    const withinWindow = availability && hourStr >= availability.start_time && hourStr < availability.end_time;

    if (!withinWindow) {
      return jsonResponse(
        { error: 'Esa hora está fuera del horario disponible (lunes a sábado, 8am–8pm).' },
        403
      );
    }

    const { data: booking, error: insertError } = await admin
      .from('class_bookings')
      .insert({ student_id: user.id, teacher_id: assignment.teacher_id, scheduled_at: scheduledAt.toISOString() })
      .select()
      .single();

    if (insertError) {
      if ((insertError as { code?: string }).code === '23505') {
        return jsonResponse({ error: 'Esa hora ya está reservada. Elige otra.' }, 409);
      }
      return jsonResponse({ error: insertError.message ?? 'No se pudo reservar la clase.' }, 500);
    }

    return jsonResponse({ booking });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : 'Error inesperado.' }, 500);
  }
});
