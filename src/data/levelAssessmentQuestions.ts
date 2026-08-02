import { CefrLevel, LanguageCode } from '../types/database';

export type AssessmentSkill = 'grammar' | 'vocabulary';

export interface AssessmentQuestion {
  id: string;
  level: CefrLevel;
  skill: AssessmentSkill;
  prompt: string;
  options: string[];
  answerIndex: number;
}

export const QUESTION_BANK: Record<LanguageCode, AssessmentQuestion[]> = {
  en: [
    // A1
    { id: 'en-a1-g-1', level: 'A1', skill: 'grammar', prompt: "She ___ a doctor.", options: ['is', 'are', 'am', 'be'], answerIndex: 0 },
    { id: 'en-a1-g-2', level: 'A1', skill: 'grammar', prompt: "I ___ two brothers.", options: ['has', 'have', 'is', 'am'], answerIndex: 1 },
    { id: 'en-a1-g-3', level: 'A1', skill: 'grammar', prompt: "___ you like coffee?", options: ['Do', 'Does', 'Is', 'Are'], answerIndex: 0 },
    { id: 'en-a1-g-4', level: 'A1', skill: 'grammar', prompt: "This is ___ book.", options: ['my', 'I', 'me', 'mine is'], answerIndex: 0 },
    { id: 'en-a1-v-1', level: 'A1', skill: 'vocabulary', prompt: "The opposite of 'hot' is ___.", options: ['cold', 'warm', 'big', 'small'], answerIndex: 0 },
    { id: 'en-a1-v-2', level: 'A1', skill: 'vocabulary', prompt: "A place where you buy food: ___", options: ['supermarket', 'hospital', 'school', 'airport'], answerIndex: 0 },
    { id: 'en-a1-v-3', level: 'A1', skill: 'vocabulary', prompt: "The color of the sky on a clear day is ___.", options: ['blue', 'green', 'brown', 'black'], answerIndex: 0 },
    { id: 'en-a1-v-4', level: 'A1', skill: 'vocabulary', prompt: "You sleep in a ___.", options: ['bed', 'car', 'kitchen', 'street'], answerIndex: 0 },
    // A2
    { id: 'en-a2-g-1', level: 'A2', skill: 'grammar', prompt: "Yesterday I ___ to the market.", options: ['go', 'went', 'goes', 'going'], answerIndex: 1 },
    { id: 'en-a2-g-2', level: 'A2', skill: 'grammar', prompt: "There ___ many people at the party.", options: ['was', 'were', 'is', 'be'], answerIndex: 1 },
    { id: 'en-a2-g-3', level: 'A2', skill: 'grammar', prompt: "She is ___ than her brother.", options: ['tall', 'taller', 'tallest', 'more tall'], answerIndex: 1 },
    { id: 'en-a2-g-4', level: 'A2', skill: 'grammar', prompt: "I ___ finished my homework yet.", options: ["haven't", "don't", "didn't", "isn't"], answerIndex: 0 },
    { id: 'en-a2-v-1', level: 'A2', skill: 'vocabulary', prompt: "A synonym of 'happy' is ___.", options: ['sad', 'glad', 'angry', 'tired'], answerIndex: 1 },
    { id: 'en-a2-v-2', level: 'A2', skill: 'vocabulary', prompt: "Something you use to write: ___", options: ['pen', 'spoon', 'chair', 'window'], answerIndex: 0 },
    { id: 'en-a2-v-3', level: 'A2', skill: 'vocabulary', prompt: "A person who teaches at a school is a ___.", options: ['teacher', 'doctor', 'driver', 'cook'], answerIndex: 0 },
    { id: 'en-a2-v-4', level: 'A2', skill: 'vocabulary', prompt: "If you are 'exhausted', you feel very ___.", options: ['tired', 'happy', 'hungry', 'calm'], answerIndex: 0 },
    // B1
    { id: 'en-b1-g-1', level: 'B1', skill: 'grammar', prompt: "If it rains, I ___ stay home.", options: ['will', 'would', 'was', 'am'], answerIndex: 0 },
    { id: 'en-b1-g-2', level: 'B1', skill: 'grammar', prompt: "She has been working here ___ five years.", options: ['since', 'for', 'at', 'in'], answerIndex: 1 },
    { id: 'en-b1-g-3', level: 'B1', skill: 'grammar', prompt: "The report ___ by the manager every Friday.", options: ['is reviewed', 'reviews', 'reviewing', 'review'], answerIndex: 0 },
    { id: 'en-b1-g-4', level: 'B1', skill: 'grammar', prompt: "By next year, I ___ here for a decade.", options: ['will work', 'will have worked', 'work', 'worked'], answerIndex: 1 },
    { id: 'en-b1-v-1', level: 'B1', skill: 'vocabulary', prompt: "To 'postpone' a meeting means to ___ it.", options: ['delay', 'cancel', 'start', 'join'], answerIndex: 0 },
    { id: 'en-b1-v-2', level: 'B1', skill: 'vocabulary', prompt: "A 'reliable' person is someone you can ___.", options: ['trust', 'avoid', 'ignore', 'fear'], answerIndex: 0 },
    { id: 'en-b1-v-3', level: 'B1', skill: 'vocabulary', prompt: "To 'negotiate' a deal means to ___ its terms.", options: ['discuss', 'sign', 'reject', 'forget'], answerIndex: 0 },
    { id: 'en-b1-v-4', level: 'B1', skill: 'vocabulary', prompt: "An 'agenda' for a meeting lists the ___.", options: ['topics to discuss', 'attendees only', 'meeting room', 'final decision'], answerIndex: 0 },
    // B2
    { id: 'en-b2-g-1', level: 'B2', skill: 'grammar', prompt: "By the time we arrived, the meeting ___ already started.", options: ['has', 'had', 'have', 'was'], answerIndex: 1 },
    { id: 'en-b2-g-2', level: 'B2', skill: 'grammar', prompt: "I wish I ___ more time to prepare.", options: ['have', 'had', 'has', 'having'], answerIndex: 1 },
    { id: 'en-b2-g-3', level: 'B2', skill: 'grammar', prompt: "The proposal, ___ was submitted late, was still approved.", options: ['which', 'who', 'what', 'when'], answerIndex: 0 },
    { id: 'en-b2-g-4', level: 'B2', skill: 'grammar', prompt: "Had we known about the budget cut, we ___ the project differently.", options: ['planned', 'would plan', 'would have planned', 'plan'], answerIndex: 2 },
    { id: 'en-b2-v-1', level: 'B2', skill: 'vocabulary', prompt: "'Feasible' means ___.", options: ['possible', 'impossible', 'expensive', 'urgent'], answerIndex: 0 },
    { id: 'en-b2-v-2', level: 'B2', skill: 'vocabulary', prompt: "A 'deadline' is ___.", options: ['a due date', 'a holiday', 'a meeting room', 'a salary'], answerIndex: 0 },
    { id: 'en-b2-v-3', level: 'B2', skill: 'vocabulary', prompt: "To 'streamline' a process means to make it ___.", options: ['more efficient', 'more complicated', 'slower', 'cheaper only'], answerIndex: 0 },
    { id: 'en-b2-v-4', level: 'B2', skill: 'vocabulary', prompt: "A company's 'stakeholders' are people who ___.", options: ['have an interest in it', 'work night shifts', 'own no shares', 'are customers only'], answerIndex: 0 },
    // C1
    { id: 'en-c1-g-1', level: 'C1', skill: 'grammar', prompt: "Not only ___ she late, but she also forgot the documents.", options: ['was', 'did', 'is', 'does'], answerIndex: 0 },
    { id: 'en-c1-g-2', level: 'C1', skill: 'grammar', prompt: "Had I known about the delay, I ___ differently.", options: ['would act', 'would have acted', 'will act', 'act'], answerIndex: 1 },
    { id: 'en-c1-g-3', level: 'C1', skill: 'grammar', prompt: "Seldom ___ such a strong quarterly result.", options: ['have we seen', 'we have seen', 'we saw', 'did we saw'], answerIndex: 0 },
    { id: 'en-c1-g-4', level: 'C1', skill: 'grammar', prompt: "It is essential that the report ___ before Friday.", options: ['is submitted', 'be submitted', 'was submitted', 'will be submitted'], answerIndex: 1 },
    { id: 'en-c1-v-1', level: 'C1', skill: 'vocabulary', prompt: "'Ambiguous' means ___.", options: ['unclear', 'certain', 'simple', 'loud'], answerIndex: 0 },
    { id: 'en-c1-v-2', level: 'C1', skill: 'vocabulary', prompt: "To 'mitigate' a risk means to ___ it.", options: ['reduce', 'increase', 'ignore', 'cause'], answerIndex: 0 },
    { id: 'en-c1-v-3', level: 'C1', skill: 'vocabulary', prompt: "A 'contingency plan' is a plan for ___.", options: ['unexpected events', 'daily routines', 'annual budgets', 'staff holidays'], answerIndex: 0 },
    { id: 'en-c1-v-4', level: 'C1', skill: 'vocabulary', prompt: "'Candid' feedback is feedback that is ___.", options: ['honest and direct', 'vague and polite', 'delayed', 'written only'], answerIndex: 0 },
    // C2
    { id: 'en-c2-g-1', level: 'C2', skill: 'grammar', prompt: "Rarely ___ such an opportunity present itself.", options: ['does', 'has', 'is', 'will'], answerIndex: 0 },
    { id: 'en-c2-g-2', level: 'C2', skill: 'grammar', prompt: "No sooner ___ he arrived than the phone rang.", options: ['had', 'has', 'did', 'was'], answerIndex: 0 },
    { id: 'en-c2-g-3', level: 'C2', skill: 'grammar', prompt: "Were the board to reject the proposal, ___ be forced to reconsider our strategy.", options: ['we would', 'we will', 'we are', 'we had'], answerIndex: 0 },
    { id: 'en-c2-g-4', level: 'C2', skill: 'grammar', prompt: "So thoroughly ___ the market that no competitor could catch up.", options: ['had they analyzed', 'they had analyzed', 'they analyzed', 'did they analyze'], answerIndex: 0 },
    { id: 'en-c2-v-1', level: 'C2', skill: 'vocabulary', prompt: "'Ubiquitous' means ___.", options: ['everywhere', 'rare', 'hidden', 'expensive'], answerIndex: 0 },
    { id: 'en-c2-v-2', level: 'C2', skill: 'vocabulary', prompt: "'Meticulous' describes someone who is ___.", options: ['extremely careful', 'very lazy', 'quite rude', 'somewhat late'], answerIndex: 0 },
    { id: 'en-c2-v-3', level: 'C2', skill: 'vocabulary', prompt: "A 'watershed moment' is a moment that ___.", options: ['marks a turning point', 'happens near water', 'is forgettable', 'repeats often'], answerIndex: 0 },
    { id: 'en-c2-v-4', level: 'C2', skill: 'vocabulary', prompt: "To 'corroborate' a claim means to ___ it.", options: ['confirm', 'deny', 'ignore', 'invent'], answerIndex: 0 },
  ],
  es: [
    // A1
    { id: 'es-a1-g-1', level: 'A1', skill: 'grammar', prompt: "Ella ___ médica.", options: ['es', 'está', 'son', 'soy'], answerIndex: 0 },
    { id: 'es-a1-g-2', level: 'A1', skill: 'grammar', prompt: "Yo ___ dos hermanos.", options: ['tengo', 'tiene', 'soy', 'es'], answerIndex: 0 },
    { id: 'es-a1-g-3', level: 'A1', skill: 'grammar', prompt: "___ te llamas?", options: ['Cómo', 'Qué', 'Dónde', 'Cuándo'], answerIndex: 0 },
    { id: 'es-a1-g-4', level: 'A1', skill: 'grammar', prompt: "Este es ___ libro.", options: ['mi', 'yo', 'me', 'mío es'], answerIndex: 0 },
    { id: 'es-a1-v-1', level: 'A1', skill: 'vocabulary', prompt: "Lo opuesto de 'caliente' es ___.", options: ['frío', 'grande', 'pequeño', 'rápido'], answerIndex: 0 },
    { id: 'es-a1-v-2', level: 'A1', skill: 'vocabulary', prompt: "Un lugar donde compras comida: ___", options: ['supermercado', 'hospital', 'escuela', 'aeropuerto'], answerIndex: 0 },
    { id: 'es-a1-v-3', level: 'A1', skill: 'vocabulary', prompt: "El color del cielo en un día despejado es ___.", options: ['azul', 'verde', 'café', 'negro'], answerIndex: 0 },
    { id: 'es-a1-v-4', level: 'A1', skill: 'vocabulary', prompt: "Duermes en una ___.", options: ['cama', 'auto', 'cocina', 'calle'], answerIndex: 0 },
    // A2
    { id: 'es-a2-g-1', level: 'A2', skill: 'grammar', prompt: "Ayer yo ___ al mercado.", options: ['voy', 'fui', 'va', 'iba'], answerIndex: 1 },
    { id: 'es-a2-g-2', level: 'A2', skill: 'grammar', prompt: "___ muchas personas en la fiesta.", options: ['Había', 'Es', 'Son', 'Está'], answerIndex: 0 },
    { id: 'es-a2-g-3', level: 'A2', skill: 'grammar', prompt: "Ella es ___ que su hermano.", options: ['alta', 'más alta', 'la más alta', 'tan alta'], answerIndex: 1 },
    { id: 'es-a2-g-4', level: 'A2', skill: 'grammar', prompt: "Todavía no ___ mi tarea.", options: ['he terminado', 'termino', 'terminé', 'terminaba'], answerIndex: 0 },
    { id: 'es-a2-v-1', level: 'A2', skill: 'vocabulary', prompt: "Sinónimo de 'feliz': ___", options: ['triste', 'contento', 'enojado', 'cansado'], answerIndex: 1 },
    { id: 'es-a2-v-2', level: 'A2', skill: 'vocabulary', prompt: "Algo que usas para escribir: ___", options: ['bolígrafo', 'cuchara', 'silla', 'ventana'], answerIndex: 0 },
    { id: 'es-a2-v-3', level: 'A2', skill: 'vocabulary', prompt: "Una persona que enseña en una escuela es un/a ___.", options: ['maestro/a', 'médico/a', 'conductor/a', 'cocinero/a'], answerIndex: 0 },
    { id: 'es-a2-v-4', level: 'A2', skill: 'vocabulary', prompt: "Si estás 'agotado', te sientes muy ___.", options: ['cansado', 'feliz', 'hambriento', 'tranquilo'], answerIndex: 0 },
    // B1
    { id: 'es-b1-g-1', level: 'B1', skill: 'grammar', prompt: "Si llueve, ___ en casa.", options: ['me quedaré', 'me quedo', 'me quedaba', 'quedarme'], answerIndex: 0 },
    { id: 'es-b1-g-2', level: 'B1', skill: 'grammar', prompt: "Ella trabaja aquí ___ cinco años.", options: ['desde hace', 'desde', 'hace', 'durante'], answerIndex: 0 },
    { id: 'es-b1-g-3', level: 'B1', skill: 'grammar', prompt: "El informe ___ por el gerente cada viernes.", options: ['es revisado', 'revisa', 'revisando', 'revisar'], answerIndex: 0 },
    { id: 'es-b1-g-4', level: 'B1', skill: 'grammar', prompt: "Para el próximo año, yo ___ aquí una década.", options: ['trabajaré', 'habré trabajado', 'trabajo', 'trabajé'], answerIndex: 1 },
    { id: 'es-b1-v-1', level: 'B1', skill: 'vocabulary', prompt: "'Posponer' una reunión significa ___ la.", options: ['retrasar', 'cancelar', 'empezar', 'unir'], answerIndex: 0 },
    { id: 'es-b1-v-2', level: 'B1', skill: 'vocabulary', prompt: "Una persona 'confiable' es alguien en quien puedes ___.", options: ['confiar', 'evitar', 'ignorar', 'temer'], answerIndex: 0 },
    { id: 'es-b1-v-3', level: 'B1', skill: 'vocabulary', prompt: "'Negociar' un trato significa ___ sus términos.", options: ['discutir', 'firmar', 'rechazar', 'olvidar'], answerIndex: 0 },
    { id: 'es-b1-v-4', level: 'B1', skill: 'vocabulary', prompt: "Una 'agenda' de reunión enumera ___.", options: ['los temas a tratar', 'solo a los asistentes', 'la sala de juntas', 'la decisión final'], answerIndex: 0 },
    // B2
    { id: 'es-b2-g-1', level: 'B2', skill: 'grammar', prompt: "Cuando llegamos, la reunión ya ___ empezado.", options: ['ha', 'había', 'habrá', 'haya'], answerIndex: 1 },
    { id: 'es-b2-g-2', level: 'B2', skill: 'grammar', prompt: "Ojalá ___ más tiempo para prepararme.", options: ['tengo', 'tenga', 'tuviera', 'tendré'], answerIndex: 2 },
    { id: 'es-b2-g-3', level: 'B2', skill: 'grammar', prompt: "La propuesta, ___ se envió tarde, fue aprobada igual.", options: ['que', 'quien', 'cual', 'cuando'], answerIndex: 0 },
    { id: 'es-b2-g-4', level: 'B2', skill: 'grammar', prompt: "De haber sabido del recorte de presupuesto, ___ el proyecto de otra forma.", options: ['planeamos', 'planearíamos', 'habríamos planeado', 'planeamos'], answerIndex: 2 },
    { id: 'es-b2-v-1', level: 'B2', skill: 'vocabulary', prompt: "'Factible' significa ___.", options: ['posible', 'imposible', 'caro', 'urgente'], answerIndex: 0 },
    { id: 'es-b2-v-2', level: 'B2', skill: 'vocabulary', prompt: "Una 'fecha límite' es ___.", options: ['el plazo máximo', 'un día festivo', 'una sala de juntas', 'un salario'], answerIndex: 0 },
    { id: 'es-b2-v-3', level: 'B2', skill: 'vocabulary', prompt: "'Optimizar' un proceso significa hacerlo ___.", options: ['más eficiente', 'más complicado', 'más lento', 'solo más barato'], answerIndex: 0 },
    { id: 'es-b2-v-4', level: 'B2', skill: 'vocabulary', prompt: "Los 'accionistas' de una empresa son quienes ___.", options: ['tienen interés en ella', 'trabajan de noche', 'no tienen acciones', 'solo son clientes'], answerIndex: 0 },
    // C1
    { id: 'es-c1-g-1', level: 'C1', skill: 'grammar', prompt: "De haber sabido del retraso, ___ diferente.", options: ['habría actuado', 'actuaría', 'actúo', 'actuar'], answerIndex: 0 },
    { id: 'es-c1-g-2', level: 'C1', skill: 'grammar', prompt: "Apenas llegó, ___ a sonar el teléfono.", options: ['empezó', 'empieza', 'había empezado', 'empezaba'], answerIndex: 0 },
    { id: 'es-c1-g-3', level: 'C1', skill: 'grammar', prompt: "Pocas veces ___ un resultado trimestral tan bueno.", options: ['hemos visto', 'veíamos', 'vimos', 'veremos'], answerIndex: 0 },
    { id: 'es-c1-g-4', level: 'C1', skill: 'grammar', prompt: "Es esencial que el informe ___ antes del viernes.", options: ['se entrega', 'se entregue', 'se entregó', 'se entregará'], answerIndex: 1 },
    { id: 'es-c1-v-1', level: 'C1', skill: 'vocabulary', prompt: "'Ambiguo' significa ___.", options: ['poco claro', 'seguro', 'simple', 'ruidoso'], answerIndex: 0 },
    { id: 'es-c1-v-2', level: 'C1', skill: 'vocabulary', prompt: "'Mitigar' un riesgo significa ___ lo.", options: ['reducir', 'aumentar', 'ignorar', 'causar'], answerIndex: 0 },
    { id: 'es-c1-v-3', level: 'C1', skill: 'vocabulary', prompt: "Un 'plan de contingencia' es un plan para ___.", options: ['eventos inesperados', 'rutinas diarias', 'presupuestos anuales', 'vacaciones del personal'], answerIndex: 0 },
    { id: 'es-c1-v-4', level: 'C1', skill: 'vocabulary', prompt: "Un comentario 'franco' es un comentario ___.", options: ['honesto y directo', 'vago y educado', 'tardío', 'solo por escrito'], answerIndex: 0 },
    // C2
    { id: 'es-c2-g-1', level: 'C2', skill: 'grammar', prompt: "Rara vez ___ una oportunidad así.", options: ['se presenta', 'se presentó', 'presentará', 'presente'], answerIndex: 0 },
    { id: 'es-c2-g-2', level: 'C2', skill: 'grammar', prompt: "Apenas ___ llegado él, sonó el teléfono.", options: ['hubo', 'había', 'ha', 'habrá'], answerIndex: 1 },
    { id: 'es-c2-g-3', level: 'C2', skill: 'grammar', prompt: "Si la junta rechazara la propuesta, ___ obligados a replantear la estrategia.", options: ['estaríamos', 'estamos', 'estuvimos', 'estaremos'], answerIndex: 0 },
    { id: 'es-c2-g-4', level: 'C2', skill: 'grammar', prompt: "Tan a fondo ___ el mercado que ningún competidor pudo alcanzarlos.", options: ['habían analizado', 'analizaron', 'analizaban', 'han analizado'], answerIndex: 0 },
    { id: 'es-c2-v-1', level: 'C2', skill: 'vocabulary', prompt: "'Ubicuo' significa ___.", options: ['presente en todas partes', 'raro', 'oculto', 'caro'], answerIndex: 0 },
    { id: 'es-c2-v-2', level: 'C2', skill: 'vocabulary', prompt: "'Meticuloso' describe a alguien ___.", options: ['extremadamente cuidadoso', 'muy perezoso', 'bastante grosero', 'algo tarde'], answerIndex: 0 },
    { id: 'es-c2-v-3', level: 'C2', skill: 'vocabulary', prompt: "Un 'momento decisivo' es un momento que ___.", options: ['marca un punto de inflexión', 'ocurre cerca del agua', 'es olvidable', 'se repite seguido'], answerIndex: 0 },
    { id: 'es-c2-v-4', level: 'C2', skill: 'vocabulary', prompt: "'Corroborar' una afirmación significa ___ la.", options: ['confirmar', 'negar', 'ignorar', 'inventar'], answerIndex: 0 },
  ],
};
