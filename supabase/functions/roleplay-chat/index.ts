// Supabase Edge Function: conversación de roleplay con IA sobre un escenario
// ya generado en course_plan_roleplays (prompt 5/6, personalizado a la
// ocupación del estudiante). Tres acciones en una sola función porque
// comparten la misma autenticación/validación:
//   start  -> crea la conversación y devuelve la primera línea de la IA
//   reply  -> guarda el mensaje del estudiante y devuelve la respuesta
//   finish -> genera feedback de la conversación completa
//
// Usa el mismo proveedor configurable que generate-course-plan
// (AI_API_KEY / AI_BASE_URL / AI_MODEL — hoy OpenAI, cámbialo a DeepSeek
// sin tocar código si quieres, ver el prompt 5).

import { createClient } from 'npm:@supabase/supabase-js@2';
import { recordActivityAndAwardPoints } from '../_shared/gamification.ts';

const MAX_MESSAGE_LENGTH = 1000;
const MAX_TURNS = 8; // pares pregunta/respuesta antes de forzar a terminar
const POINTS_PER_CONVERSATION = 15;

const LANGUAGE_NAMES: Record<string, string> = { en: 'inglés', es: 'español' };

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

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

async function callAi(aiBaseUrl: string, aiApiKey: string, aiModel: string, messages: ChatMessage[]): Promise<string> {
  const response = await fetch(`${aiBaseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${aiApiKey}`,
    },
    body: JSON.stringify({ model: aiModel, messages, temperature: 0.7 }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Error del modelo (${response.status}): ${errorBody.slice(0, 500)}`);
  }

  const completion = await response.json();
  const content = completion.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error('El modelo no devolvió contenido.');
  return content;
}

function buildRoleplaySystemPrompt(args: {
  title: string;
  context: string;
  objective: string;
  difficulty: string;
  targetLanguageName: string;
}): string {
  return `Eres un actor de roleplay para practicar idiomas. Interpretas un personaje
dentro de este escenario para que un estudiante practique ${args.targetLanguageName}:

Escenario: ${args.title}
Contexto: ${args.context}
Objetivo del estudiante: ${args.objective}
Nivel del estudiante (CEFR): ${args.difficulty}

Reglas:
1. Responde ÚNICAMENTE en ${args.targetLanguageName}, en el personaje del escenario.
2. Ajusta la complejidad de tu lenguaje al nivel ${args.difficulty} del estudiante.
3. Mantén cada respuesta breve (2-4 frases), como una conversación real, no un ensayo.
4. No salgas del personaje. No expliques gramática ni corrijas errores durante
   la conversación — eso pasa después, al final.
5. Haz avanzar la conversación de forma natural según lo que el estudiante escriba.
6. Empieza tú la conversación con la primera línea del personaje.`;
}

function buildFeedbackPrompt(args: { transcript: string; targetLanguageName: string; difficulty: string }): string {
  return `Acabas de tener esta conversación de práctica con un estudiante de
${args.targetLanguageName} (nivel CEFR ${args.difficulty}). Transcripción completa:

${args.transcript}

Escribe feedback de 3 a 5 frases en español, evaluando: gramática, vocabulario
usado, qué tan apropiado fue el tono/registro para el escenario, y una
sugerencia concreta de mejora. Tono constructivo, directo. No uses markdown.`;
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
    const aiApiKey = Deno.env.get('AI_API_KEY');
    const aiBaseUrl = Deno.env.get('AI_BASE_URL') ?? 'https://api.openai.com/v1';
    const aiModel = Deno.env.get('AI_MODEL') ?? 'gpt-4o-mini';

    if (!aiApiKey) {
      return jsonResponse({ error: 'AI_API_KEY no está configurada en los secrets de la función.' }, 500);
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
    const action = body?.action;
    const admin = createClient(supabaseUrl, serviceRoleKey);

    // ── start: crea la conversación y devuelve la primera línea de la IA ──
    if (action === 'start') {
      const roleplayId = typeof body?.roleplayId === 'string' ? body.roleplayId : '';
      if (!roleplayId) return jsonResponse({ error: 'Falta "roleplayId".' }, 400);

      const { data: roleplay } = await admin
        .from('course_plan_roleplays')
        .select('*, course_plans!inner(student_id, language)')
        .eq('id', roleplayId)
        .maybeSingle();

      const coursePlan = roleplay?.course_plans;
      if (!roleplay || !coursePlan || coursePlan.student_id !== user.id) {
        return jsonResponse({ error: 'Escenario no encontrado.' }, 404);
      }

      const { data: studentProfile } = await admin
        .from('student_profiles')
        .select('target_language')
        .eq('id', user.id)
        .single();

      const targetLanguage = studentProfile?.target_language ?? coursePlan.language;
      const targetLanguageName = LANGUAGE_NAMES[targetLanguage] ?? targetLanguage;

      const systemPrompt = buildRoleplaySystemPrompt({
        title: roleplay.title,
        context: roleplay.context,
        objective: roleplay.objective,
        difficulty: roleplay.difficulty,
        targetLanguageName,
      });

      const openingLine = await callAi(aiBaseUrl, aiApiKey, aiModel, [{ role: 'system', content: systemPrompt }]);

      const { data: conversation, error: convError } = await admin
        .from('roleplay_conversations')
        .insert({ student_id: user.id, roleplay_id: roleplayId, language: targetLanguage })
        .select()
        .single();

      if (convError || !conversation) {
        return jsonResponse({ error: convError?.message ?? 'No se pudo iniciar la conversación.' }, 500);
      }

      const { data: message, error: msgError } = await admin
        .from('roleplay_messages')
        .insert({ conversation_id: conversation.id, role: 'assistant', content: openingLine, order_index: 0 })
        .select()
        .single();

      if (msgError || !message) {
        return jsonResponse({ error: msgError?.message ?? 'No se pudo guardar el mensaje inicial.' }, 500);
      }

      return jsonResponse({ conversation, messages: [message] });
    }

    // ── reply: guarda el mensaje del estudiante y responde en personaje ──
    if (action === 'reply') {
      const conversationId = typeof body?.conversationId === 'string' ? body.conversationId : '';
      const studentMessage = typeof body?.message === 'string' ? body.message.trim() : '';

      if (!conversationId) return jsonResponse({ error: 'Falta "conversationId".' }, 400);
      if (!studentMessage) return jsonResponse({ error: 'Falta "message".' }, 400);
      if (studentMessage.length > MAX_MESSAGE_LENGTH) {
        return jsonResponse({ error: `El mensaje supera el máximo de ${MAX_MESSAGE_LENGTH} caracteres.` }, 400);
      }

      const { data: conversation } = await admin
        .from('roleplay_conversations')
        .select('*, course_plan_roleplays!inner(title, context, objective, difficulty)')
        .eq('id', conversationId)
        .maybeSingle();

      if (!conversation || conversation.student_id !== user.id) {
        return jsonResponse({ error: 'Conversación no encontrada.' }, 404);
      }
      if (conversation.status !== 'active') {
        return jsonResponse({ error: 'Esta conversación ya terminó.' }, 400);
      }

      const { data: existingMessages } = await admin
        .from('roleplay_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('order_index', { ascending: true });

      const priorMessages = existingMessages ?? [];
      const nextOrderIndex = priorMessages.length;

      const { data: userMessageRow, error: userMsgError } = await admin
        .from('roleplay_messages')
        .insert({ conversation_id: conversationId, role: 'user', content: studentMessage, order_index: nextOrderIndex })
        .select()
        .single();

      if (userMsgError || !userMessageRow) {
        return jsonResponse({ error: userMsgError?.message ?? 'No se pudo guardar tu mensaje.' }, 500);
      }

      const targetLanguageName = LANGUAGE_NAMES[conversation.language] ?? conversation.language;
      const scenario = conversation.course_plan_roleplays;
      const systemPrompt = buildRoleplaySystemPrompt({
        title: scenario.title,
        context: scenario.context,
        objective: scenario.objective,
        difficulty: scenario.difficulty,
        targetLanguageName,
      });

      const chatMessages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...priorMessages.map((m: { role: string; content: string }) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        { role: 'user', content: studentMessage },
      ];

      const aiReply = await callAi(aiBaseUrl, aiApiKey, aiModel, chatMessages);

      const { data: aiMessageRow, error: aiMsgError } = await admin
        .from('roleplay_messages')
        .insert({ conversation_id: conversationId, role: 'assistant', content: aiReply, order_index: nextOrderIndex + 1 })
        .select()
        .single();

      if (aiMsgError || !aiMessageRow) {
        return jsonResponse({ error: aiMsgError?.message ?? 'No se pudo guardar la respuesta.' }, 500);
      }

      const turnsUsed = Math.floor((nextOrderIndex + 2) / 2);

      return jsonResponse({
        messages: [userMessageRow, aiMessageRow],
        shouldFinish: turnsUsed >= MAX_TURNS,
      });
    }

    // ── finish: genera feedback de la conversación completa ──
    if (action === 'finish') {
      const conversationId = typeof body?.conversationId === 'string' ? body.conversationId : '';
      if (!conversationId) return jsonResponse({ error: 'Falta "conversationId".' }, 400);

      const { data: conversation } = await admin
        .from('roleplay_conversations')
        .select('*, course_plan_roleplays!inner(difficulty)')
        .eq('id', conversationId)
        .maybeSingle();

      if (!conversation || conversation.student_id !== user.id) {
        return jsonResponse({ error: 'Conversación no encontrada.' }, 404);
      }

      if (conversation.status === 'completed' && conversation.feedback) {
        return jsonResponse({ conversation });
      }

      const { data: messages } = await admin
        .from('roleplay_messages')
        .select('role, content')
        .eq('conversation_id', conversationId)
        .order('order_index', { ascending: true });

      const transcript = (messages ?? [])
        .map((m) => `${m.role === 'assistant' ? 'Personaje' : 'Estudiante'}: ${m.content}`)
        .join('\n');

      const targetLanguageName = LANGUAGE_NAMES[conversation.language] ?? conversation.language;
      const feedbackPrompt = buildFeedbackPrompt({
        transcript,
        targetLanguageName,
        difficulty: conversation.course_plan_roleplays.difficulty,
      });

      const feedback = await callAi(aiBaseUrl, aiApiKey, aiModel, [{ role: 'system', content: feedbackPrompt }]);

      const { data: updatedConversation, error: updateError } = await admin
        .from('roleplay_conversations')
        .update({ status: 'completed', feedback, completed_at: new Date().toISOString() })
        .eq('id', conversationId)
        .select()
        .single();

      if (updateError || !updatedConversation) {
        return jsonResponse({ error: updateError?.message ?? 'No se pudo guardar el feedback.' }, 500);
      }

      let gamification = null;
      let newBadges: unknown[] = [];
      try {
        const result = await recordActivityAndAwardPoints(admin, user.id, POINTS_PER_CONVERSATION);
        gamification = {
          totalPoints: result.totalPoints,
          currentStreak: result.currentStreak,
          longestStreak: result.longestStreak,
        };
        newBadges = result.newBadges;
      } catch (gamificationError) {
        console.error('gamification update failed:', gamificationError);
      }

      return jsonResponse({ conversation: updatedConversation, gamification, newBadges });
    }

    return jsonResponse({ error: `Acción desconocida: ${action}` }, 400);
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : 'Error inesperado.' }, 500);
  }
});
