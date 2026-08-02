import { LanguageCode, LearningObjective } from '../types/database';

// Banco de frases fijo (escrito una sola vez, sin IA) para ayudar al
// estudiante cuando no sabe qué decir en un roleplay. "tip" está en el
// idioma nativo del estudiante (el opuesto al de "phrase") con un consejo
// de tono/entrega, no de gramática.
export interface RoleplayPhrase {
  id: string;
  phrase: string;
  translation: string;
  tip: string;
}

type PhraseBank = Record<LearningObjective, RoleplayPhrase[]>;

export const ROLEPLAY_PHRASES: Record<LanguageCode, PhraseBank> = {
  en: {
    meetings: [
      { id: 'en-meet-1', phrase: "Thanks for making time for this today.", translation: 'Gracias por sacar tiempo para esto hoy.', tip: 'Dilo con calidez, como si de verdad lo agradecieras — no de forma mecánica.' },
      { id: 'en-meet-2', phrase: "Let's go around the table — what are your thoughts?", translation: 'Démosle la vuelta a la mesa — ¿qué opinan?', tip: 'Tono abierto e invitador, sube un poco la voz al final, como una pregunta genuina.' },
      { id: 'en-meet-3', phrase: "Sorry to interrupt, could I add something here?", translation: 'Perdón por interrumpir, ¿puedo agregar algo aquí?', tip: 'Dilo rápido y educado — es una frase para "pedir la palabra", no para detener la conversación.' },
      { id: 'en-meet-4', phrase: "I think we're getting off track — can we refocus on the agenda?", translation: 'Creo que nos estamos desviando — ¿podemos volver a la agenda?', tip: 'Tono firme pero amable, no acusador. Baja un poco el volumen para sonar tranquilo, no molesto.' },
      { id: 'en-meet-5', phrase: "Let's park that for now and circle back later.", translation: 'Dejemos eso por ahora y regresemos más tarde.', tip: 'Frase muy común en reuniones en inglés — dila con confianza, como una decisión, no una duda.' },
      { id: 'en-meet-6', phrase: "To summarize, here's what we agreed on.", translation: 'Para resumir, esto es lo que acordamos.', tip: 'Habla más despacio aquí — es el momento de que todos retengan la información clave.' },
    ],
    emails: [
      { id: 'en-email-1', phrase: "I hope this message finds you well.", translation: 'Espero que este mensaje te encuentre bien.', tip: 'Tono cálido y neutral — es un saludo estándar, no lo digas con emoción exagerada.' },
      { id: 'en-email-2', phrase: "I'm following up on our previous conversation.", translation: 'Doy seguimiento a nuestra conversación anterior.', tip: 'Directo y profesional, sin sonar impaciente aunque hayan pasado varios días.' },
      { id: 'en-email-3', phrase: "Please let me know if you have any questions.", translation: 'Avísame si tienes alguna pregunta.', tip: 'Tono servicial y abierto — funciona bien casi al final de cualquier mensaje.' },
      { id: 'en-email-4', phrase: "I wanted to check in on the status of this.", translation: 'Quería preguntar por el estado de esto.', tip: 'Suave, no suena a reclamo — ideal cuando llevas esperando respuesta.' },
      { id: 'en-email-5', phrase: "Attached, please find the document we discussed.", translation: 'Adjunto encontrarás el documento que hablamos.', tip: 'Formal y directo — pronuncia "attached" con claridad, es la palabra clave del mensaje.' },
      { id: 'en-email-6', phrase: "Looking forward to hearing your thoughts.", translation: 'Espero tus comentarios.', tip: 'Tono positivo y ligero — buena forma de cerrar sin sonar cortante.' },
    ],
    negotiation: [
      { id: 'en-neg-1', phrase: "Let's see if we can find a middle ground.", translation: 'Veamos si podemos encontrar un punto medio.', tip: 'Tono colaborador, no defensivo — como si fueran un equipo resolviendo algo juntos.' },
      { id: 'en-neg-2', phrase: "What if we adjusted the timeline instead of the price?", translation: '¿Qué tal si ajustamos el plazo en vez del precio?', tip: 'Preséntalo como una idea, con voz curiosa — no como una exigencia.' },
      { id: 'en-neg-3', phrase: "I understand your position, but here's my concern.", translation: 'Entiendo tu posición, pero esta es mi preocupación.', tip: 'Empieza suave ("entiendo") y baja un poco el tono al decir tu punto — suena respetuoso, no confrontativo.' },
      { id: 'en-neg-4', phrase: "That's a fair point — let me think about how we can make this work.", translation: 'Es un buen punto — déjame pensar cómo podemos lograrlo.', tip: 'Pausa un segundo antes de decir esta frase, como si de verdad lo estuvieras considerando.' },
      { id: 'en-neg-5', phrase: "I'm afraid that doesn't work for us, but here's an alternative.", translation: 'Me temo que eso no nos funciona, pero aquí hay una alternativa.', tip: 'Firme sin sonar duro — "me temo que" suaviza el "no" antes de decirlo.' },
      { id: 'en-neg-6', phrase: "Can we shake on that?", translation: '¿Cerramos el trato?', tip: 'Informal y con confianza — se usa cuando ya casi llegan a un acuerdo, con una sonrisa en la voz.' },
    ],
    presentations: [
      { id: 'en-pres-1', phrase: "Thank you all for being here — let's get started.", translation: 'Gracias a todos por estar aquí — empecemos.', tip: 'Voz clara y un poco más fuerte de lo normal — es tu momento de tomar el control de la sala.' },
      { id: 'en-pres-2', phrase: "Let's move on to the next point.", translation: 'Pasemos al siguiente punto.', tip: 'Frase corta de transición — dila con ritmo, no te detengas mucho en ella.' },
      { id: 'en-pres-3', phrase: "As you can see on this slide...", translation: 'Como pueden ver en esta diapositiva...', tip: 'Acompaña con una pausa breve después, dando tiempo a que miren la pantalla.' },
      { id: 'en-pres-4', phrase: "That's a great question — let me address that.", translation: 'Excelente pregunta — permíteme responder eso.', tip: 'Tono genuino y seguro, incluso si la pregunta te tomó por sorpresa.' },
      { id: 'en-pres-5', phrase: "To wrap up, here are the key takeaways.", translation: 'Para cerrar, estos son los puntos clave.', tip: 'Baja el ritmo y enfatiza cada punto — es lo que la gente va a recordar.' },
      { id: 'en-pres-6', phrase: "I'll now open the floor for questions.", translation: 'Ahora abro espacio para preguntas.', tip: 'Tono relajado y abierto — con una pequeña sonrisa en la voz, invita a que hablen.' },
    ],
    customer_service: [
      { id: 'en-cs-1', phrase: "Thanks for reaching out — how can I help you today?", translation: 'Gracias por contactarnos — ¿cómo puedo ayudarte hoy?', tip: 'Cálido y genuino, no sonar como un guion memorizado.' },
      { id: 'en-cs-2', phrase: "I'm really sorry for the inconvenience this caused.", translation: 'Lamento mucho el inconveniente que esto causó.', tip: 'Baja un poco el ritmo y el tono — que se note que lo sientes de verdad.' },
      { id: 'en-cs-3', phrase: "Let me look into that for you right away.", translation: 'Déjame revisar eso para ti de inmediato.', tip: 'Tono activo y seguro — transmite que ya estás resolviendo el problema.' },
      { id: 'en-cs-4', phrase: "Here's what I can do to fix this for you.", translation: 'Esto es lo que puedo hacer para solucionarlo.', tip: 'Enfócate en la solución, no en el problema — sube un poco la energía aquí.' },
      { id: 'en-cs-5', phrase: "Is there anything else I can help you with?", translation: '¿Hay algo más en lo que pueda ayudarte?', tip: 'Tono relajado y abierto al final de la llamada, sin apurar al cliente.' },
      { id: 'en-cs-6', phrase: "Thank you for your patience while we sorted this out.", translation: 'Gracias por tu paciencia mientras resolvíamos esto.', tip: 'Sincero, no apresurado — es un buen cierre, tómate tu tiempo al decirlo.' },
    ],
    travel: [
      { id: 'en-travel-1', phrase: "Could you point me in the direction of...?", translation: '¿Podrías indicarme cómo llegar a...?', tip: 'Tono amable y algo informal — sube la voz al final, es una pregunta educada.' },
      { id: 'en-travel-2', phrase: "I have a reservation under the name...", translation: 'Tengo una reservación a nombre de...', tip: 'Habla claro y despacio en el nombre — es la parte más importante de la frase.' },
      { id: 'en-travel-3', phrase: "Is there a more direct route to get there?", translation: '¿Hay una ruta más directa para llegar ahí?', tip: 'Tono práctico y curioso, sin prisa.' },
      { id: 'en-travel-4', phrase: "I'm afraid there's been a mix-up with my booking.", translation: 'Me temo que hubo un error con mi reservación.', tip: 'Firme pero tranquilo — "me temo que" ayuda a sonar educado incluso al quejarte.' },
      { id: 'en-travel-5', phrase: "Could I get the check, please?", translation: '¿Me traes la cuenta, por favor?', tip: 'Corto y directo, con una sonrisa — es una frase muy común y natural.' },
      { id: 'en-travel-6', phrase: "Do you have any recommendations nearby?", translation: '¿Tienes alguna recomendación por aquí cerca?', tip: 'Tono relajado y amigable, como si le preguntaras a un conocido.' },
    ],
  },
  es: {
    meetings: [
      { id: 'es-meet-1', phrase: 'Gracias por sacar tiempo para esto hoy.', translation: "Thanks for making time for this today.", tip: 'Say it warmly, like you genuinely mean it — not like a scripted line.' },
      { id: 'es-meet-2', phrase: 'Démosle la vuelta a la mesa — ¿qué opinan?', translation: "Let's go around the table — what are your thoughts?", tip: 'Open, inviting tone, with your voice rising slightly at the end — a genuine question.' },
      { id: 'es-meet-3', phrase: 'Perdón por interrumpir, ¿puedo agregar algo aquí?', translation: "Sorry to interrupt, could I add something here?", tip: 'Say it quickly and politely — it\'s about asking to speak, not stopping the conversation.' },
      { id: 'es-meet-4', phrase: 'Creo que nos estamos desviando — ¿podemos volver a la agenda?', translation: "I think we're getting off track — can we refocus on the agenda?", tip: 'Firm but friendly, not accusatory. Lower your volume slightly to sound calm, not annoyed.' },
      { id: 'es-meet-5', phrase: 'Dejemos eso por ahora y regresemos más tarde.', translation: "Let's park that for now and circle back later.", tip: 'Very common in meetings — say it with confidence, like a decision, not a doubt.' },
      { id: 'es-meet-6', phrase: 'Para resumir, esto es lo que acordamos.', translation: "To summarize, here's what we agreed on.", tip: 'Slow down here — this is the moment everyone needs to retain the key info.' },
    ],
    emails: [
      { id: 'es-email-1', phrase: 'Espero que este mensaje te encuentre bien.', translation: "I hope this message finds you well.", tip: 'Warm, neutral tone — it\'s a standard greeting, no need for exaggerated emotion.' },
      { id: 'es-email-2', phrase: 'Doy seguimiento a nuestra conversación anterior.', translation: "I'm following up on our previous conversation.", tip: 'Direct and professional, without sounding impatient even after several days.' },
      { id: 'es-email-3', phrase: 'Avísame si tienes alguna pregunta.', translation: "Please let me know if you have any questions.", tip: 'Helpful, open tone — works well near the end of almost any message.' },
      { id: 'es-email-4', phrase: 'Quería preguntar por el estado de esto.', translation: "I wanted to check in on the status of this.", tip: "Soft, doesn't sound like a complaint — good when you've been waiting a while." },
      { id: 'es-email-5', phrase: 'Adjunto encontrarás el documento que hablamos.', translation: "Attached, please find the document we discussed.", tip: 'Formal and direct — pronounce "adjunto" clearly, it\'s the key word.' },
      { id: 'es-email-6', phrase: 'Espero tus comentarios.', translation: "Looking forward to hearing your thoughts.", tip: 'Light, positive tone — a good way to close without sounding abrupt.' },
    ],
    negotiation: [
      { id: 'es-neg-1', phrase: 'Veamos si podemos encontrar un punto medio.', translation: "Let's see if we can find a middle ground.", tip: 'Collaborative tone, not defensive — like you\'re a team solving this together.' },
      { id: 'es-neg-2', phrase: '¿Qué tal si ajustamos el plazo en vez del precio?', translation: "What if we adjusted the timeline instead of the price?", tip: 'Present it as an idea, with a curious voice — not a demand.' },
      { id: 'es-neg-3', phrase: 'Entiendo tu posición, pero esta es mi preocupación.', translation: "I understand your position, but here's my concern.", tip: 'Start soft ("entiendo") and lower your tone slightly on your point — respectful, not confrontational.' },
      { id: 'es-neg-4', phrase: 'Es un buen punto — déjame pensar cómo podemos lograrlo.', translation: "That's a fair point — let me think about how we can make this work.", tip: 'Pause a second before saying this, as if you\'re genuinely considering it.' },
      { id: 'es-neg-5', phrase: 'Me temo que eso no nos funciona, pero aquí hay una alternativa.', translation: "I'm afraid that doesn't work for us, but here's an alternative.", tip: 'Firm without being harsh — "me temo que" softens the "no" before you say it.' },
      { id: 'es-neg-6', phrase: '¿Cerramos el trato?', translation: "Can we shake on that?", tip: 'Casual and confident — used when you\'re close to a deal, with a smile in your voice.' },
    ],
    presentations: [
      { id: 'es-pres-1', phrase: 'Gracias a todos por estar aquí — empecemos.', translation: "Thank you all for being here — let's get started.", tip: 'Clear voice, a bit louder than normal — this is your moment to take the room.' },
      { id: 'es-pres-2', phrase: 'Pasemos al siguiente punto.', translation: "Let's move on to the next point.", tip: 'Short transition line — say it with rhythm, don\'t linger on it.' },
      { id: 'es-pres-3', phrase: 'Como pueden ver en esta diapositiva...', translation: "As you can see on this slide...", tip: 'Follow with a brief pause, giving people time to look at the screen.' },
      { id: 'es-pres-4', phrase: 'Excelente pregunta — permíteme responder eso.', translation: "That's a great question — let me address that.", tip: 'Genuine, confident tone, even if the question caught you off guard.' },
      { id: 'es-pres-5', phrase: 'Para cerrar, estos son los puntos clave.', translation: "To wrap up, here are the key takeaways.", tip: 'Slow down and emphasize each point — this is what people will remember.' },
      { id: 'es-pres-6', phrase: 'Ahora abro espacio para preguntas.', translation: "I'll now open the floor for questions.", tip: 'Relaxed, open tone — with a small smile in your voice, invite people to speak.' },
    ],
    customer_service: [
      { id: 'es-cs-1', phrase: 'Gracias por contactarnos — ¿cómo puedo ayudarte hoy?', translation: "Thanks for reaching out — how can I help you today?", tip: "Warm and genuine, doesn't sound like a memorized script." },
      { id: 'es-cs-2', phrase: 'Lamento mucho el inconveniente que esto causó.', translation: "I'm really sorry for the inconvenience this caused.", tip: 'Slow your pace and tone down slightly — make it sound like you really mean it.' },
      { id: 'es-cs-3', phrase: 'Déjame revisar eso para ti de inmediato.', translation: "Let me look into that for you right away.", tip: 'Active, confident tone — conveys that you\'re already solving the problem.' },
      { id: 'es-cs-4', phrase: 'Esto es lo que puedo hacer para solucionarlo.', translation: "Here's what I can do to fix this for you.", tip: 'Focus on the solution, not the problem — bring the energy up a bit here.' },
      { id: 'es-cs-5', phrase: '¿Hay algo más en lo que pueda ayudarte?', translation: "Is there anything else I can help you with?", tip: 'Relaxed, open tone at the end of the call, without rushing the customer.' },
      { id: 'es-cs-6', phrase: 'Gracias por tu paciencia mientras resolvíamos esto.', translation: "Thank you for your patience while we sorted this out.", tip: "Sincere, unhurried — a good closing line, take your time saying it." },
    ],
    travel: [
      { id: 'es-travel-1', phrase: '¿Podrías indicarme cómo llegar a...?', translation: "Could you point me in the direction of...?", tip: 'Friendly, somewhat casual tone — voice rises at the end, it\'s a polite question.' },
      { id: 'es-travel-2', phrase: 'Tengo una reservación a nombre de...', translation: "I have a reservation under the name...", tip: 'Speak clearly and slowly on the name — it\'s the most important part of the sentence.' },
      { id: 'es-travel-3', phrase: '¿Hay una ruta más directa para llegar ahí?', translation: "Is there a more direct route to get there?", tip: 'Practical, curious tone, no rush.' },
      { id: 'es-travel-4', phrase: 'Me temo que hubo un error con mi reservación.', translation: "I'm afraid there's been a mix-up with my booking.", tip: '"Me temo que" helps you sound polite even while complaining.' },
      { id: 'es-travel-5', phrase: '¿Me traes la cuenta, por favor?', translation: "Could I get the check, please?", tip: 'Short and direct, with a smile — a very common, natural phrase.' },
      { id: 'es-travel-6', phrase: '¿Tienes alguna recomendación por aquí cerca?', translation: "Do you have any recommendations nearby?", tip: 'Relaxed, friendly tone, like asking an acquaintance.' },
    ],
  },
};
