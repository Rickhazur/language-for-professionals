// Supabase Edge Function: aprueba una cuenta pendiente (estudiante o
// profesor) y le envía un correo de notificación. Solo puede llamarla un
// profesor ya aprobado — se verifica a mano porque usa la service role key,
// que salta RLS.

import { createClient } from 'npm:@supabase/supabase-js@2';
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';

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

const ROLE_LABELS: Record<string, string> = { student: 'estudiante', teacher: 'profesor' };

function buildEmail(fullName: string | null, role: string): { subject: string; text: string; html: string } {
  const name = fullName ?? 'hola';
  const roleLabel = ROLE_LABELS[role] ?? role;
  const subject = '¡Tu cuenta de LinguaPro fue aprobada!';
  const text = `${name},\n\nTu cuenta de ${roleLabel} en LinguaPro ya fue aprobada. Ya puedes iniciar sesión y ${
    role === 'teacher' ? 'entrar al panel del profesor.' : 'comenzar tu curso.'
  }\n\n— El equipo de LinguaPro`;
  const html = `<p>${name},</p><p>Tu cuenta de <strong>${roleLabel}</strong> en LinguaPro ya fue aprobada. Ya puedes iniciar sesión y ${
    role === 'teacher' ? 'entrar al panel del profesor.' : 'comenzar tu curso.'
  }</p><p>— El equipo de LinguaPro</p>`;
  return { subject, text, html };
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
    const gmailUser = Deno.env.get('GMAIL_USER');
    const gmailAppPassword = Deno.env.get('GMAIL_APP_PASSWORD');

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
    const profileId = typeof body?.profileId === 'string' ? body.profileId : '';
    if (!profileId) {
      return jsonResponse({ error: 'Falta "profileId".' }, 400);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);

    const { data: caller } = await admin
      .from('profiles')
      .select('role, is_approved')
      .eq('id', user.id)
      .maybeSingle();

    if (!caller || caller.role !== 'teacher' || !caller.is_approved) {
      return jsonResponse({ error: 'Solo un profesor ya aprobado puede aprobar cuentas.' }, 403);
    }

    const { data: target } = await admin
      .from('profiles')
      .select('id, email, full_name, role, is_approved')
      .eq('id', profileId)
      .maybeSingle();

    if (!target) {
      return jsonResponse({ error: 'Cuenta no encontrada.' }, 404);
    }

    if (target.is_approved) {
      return jsonResponse({ profile: target });
    }

    const { data: updated, error: updateError } = await admin
      .from('profiles')
      .update({ is_approved: true, approved_at: new Date().toISOString() })
      .eq('id', profileId)
      .select()
      .single();

    if (updateError || !updated) {
      return jsonResponse({ error: updateError?.message ?? 'No se pudo aprobar la cuenta.' }, 500);
    }

    let emailWarning: string | null = null;

    if (gmailUser && gmailAppPassword) {
      try {
        const { subject, text, html } = buildEmail(target.full_name, target.role);
        const client = new SMTPClient({
          connection: {
            hostname: 'smtp.gmail.com',
            port: 465,
            tls: true,
            auth: { username: gmailUser, password: gmailAppPassword },
          },
        });
        await client.send({ from: gmailUser, to: target.email, subject, content: text, html });
        await client.close();
      } catch (emailError) {
        console.error('approval email failed:', emailError);
        emailWarning = 'La cuenta se aprobó, pero no se pudo enviar el correo de notificación.';
      }
    } else {
      emailWarning = 'La cuenta se aprobó, pero el envío de correo no está configurado.';
    }

    return jsonResponse({ profile: updated, emailWarning });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : 'Error inesperado.' }, 500);
  }
});
