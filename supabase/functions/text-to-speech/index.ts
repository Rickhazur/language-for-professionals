// Supabase Edge Function: genera (o reutiliza del cache) el audio de
// referencia de una frase usando Azure Speech (Cognitive Services), voces
// neurales en inglés americano y español latino, lo sube a Storage y
// devuelve una URL pública reproducible.
//
// Secrets requeridos (supabase secrets set ...):
//   AZURE_SPEECH_KEY    - subscription key del recurso "Speech" en Azure
//                         (Azure Portal → tu recurso Speech → Keys and Endpoint).
//   AZURE_SPEECH_REGION - región del recurso, ej. "eastus" (misma pantalla).
// SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY los inyecta
// automáticamente el runtime de Edge Functions.

import { createClient } from 'npm:@supabase/supabase-js@2';

const MAX_TEXT_LENGTH = 300;

// Voces neurales: inglés americano y español latino (México), como pediste.
const VOICES: Record<string, { locale: string; name: string; gender: string }> = {
  en: { locale: 'en-US', name: 'en-US-JennyNeural', gender: 'Female' },
  es: { locale: 'es-MX', name: 'es-MX-DaliaNeural', gender: 'Female' },
};

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

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function escapeSsml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
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
    const azureKey = Deno.env.get('AZURE_SPEECH_KEY');
    const azureRegion = Deno.env.get('AZURE_SPEECH_REGION');

    if (!azureKey || !azureRegion) {
      return jsonResponse(
        { error: 'AZURE_SPEECH_KEY / AZURE_SPEECH_REGION no están configuradas en los secrets de la función.' },
        500
      );
    }

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
    const text = typeof body?.text === 'string' ? body.text.trim() : '';
    const language = body?.language;

    if (!text) {
      return jsonResponse({ error: 'Falta "text".' }, 400);
    }
    if (text.length > MAX_TEXT_LENGTH) {
      return jsonResponse({ error: `"text" supera el máximo de ${MAX_TEXT_LENGTH} caracteres.` }, 400);
    }
    const voice = VOICES[language];
    if (!voice) {
      return jsonResponse({ error: `Idioma no soportado: ${language}` }, 400);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const textHash = await sha256Hex(text);

    const { data: cached } = await admin
      .from('tts_audio_cache')
      .select('audio_url')
      .eq('text_hash', textHash)
      .eq('language', language)
      .maybeSingle();

    if (cached) {
      return jsonResponse({ audioUrl: cached.audio_url, cached: true });
    }

    const ssml = `<speak version='1.0' xml:lang='${voice.locale}'><voice xml:lang='${voice.locale}' xml:gender='${voice.gender}' name='${voice.name}'>${escapeSsml(text)}</voice></speak>`;

    const azureResponse = await fetch(
      `https://${azureRegion}.tts.speech.microsoft.com/cognitiveservices/v1`,
      {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': azureKey,
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': 'audio-16khz-64kbitrate-mono-mp3',
          'User-Agent': 'linguapro-shadowing',
        },
        body: ssml,
      }
    );

    if (!azureResponse.ok) {
      const errorBody = await azureResponse.text();
      return jsonResponse(
        { error: `Error de Azure Speech (${azureResponse.status}): ${errorBody.slice(0, 500)}` },
        502
      );
    }

    const audioBuffer = await azureResponse.arrayBuffer();
    const audioBytes = new Uint8Array(audioBuffer);
    const path = `${language}/${textHash}.mp3`;

    const { error: uploadError } = await admin.storage
      .from('reference-audio')
      .upload(path, audioBytes, { contentType: 'audio/mpeg', upsert: true });

    if (uploadError) {
      return jsonResponse({ error: `No se pudo guardar el audio: ${uploadError.message}` }, 500);
    }

    const { data: publicUrlData } = admin.storage.from('reference-audio').getPublicUrl(path);
    const audioUrl = publicUrlData.publicUrl;

    await admin
      .from('tts_audio_cache')
      .upsert({ text_hash: textHash, text, language, audio_url: audioUrl }, { onConflict: 'text_hash,language' });

    return jsonResponse({ audioUrl, cached: false });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : 'Error inesperado.' }, 500);
  }
});
