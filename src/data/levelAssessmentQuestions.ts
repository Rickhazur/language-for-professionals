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
    { id: 'en-a1-v-1', level: 'A1', skill: 'vocabulary', prompt: "The opposite of 'hot' is ___.", options: ['cold', 'warm', 'big', 'small'], answerIndex: 0 },
    { id: 'en-a1-v-2', level: 'A1', skill: 'vocabulary', prompt: "A place where you buy food: ___", options: ['supermarket', 'hospital', 'school', 'airport'], answerIndex: 0 },
    // A2
    { id: 'en-a2-g-1', level: 'A2', skill: 'grammar', prompt: "Yesterday I ___ to the market.", options: ['go', 'went', 'goes', 'going'], answerIndex: 1 },
    { id: 'en-a2-g-2', level: 'A2', skill: 'grammar', prompt: "There ___ many people at the party.", options: ['was', 'were', 'is', 'be'], answerIndex: 1 },
    { id: 'en-a2-v-1', level: 'A2', skill: 'vocabulary', prompt: "A synonym of 'happy' is ___.", options: ['sad', 'glad', 'angry', 'tired'], answerIndex: 1 },
    { id: 'en-a2-v-2', level: 'A2', skill: 'vocabulary', prompt: "Something you use to write: ___", options: ['pen', 'spoon', 'chair', 'window'], answerIndex: 0 },
    // B1
    { id: 'en-b1-g-1', level: 'B1', skill: 'grammar', prompt: "If it rains, I ___ stay home.", options: ['will', 'would', 'was', 'am'], answerIndex: 0 },
    { id: 'en-b1-g-2', level: 'B1', skill: 'grammar', prompt: "She has been working here ___ five years.", options: ['since', 'for', 'at', 'in'], answerIndex: 1 },
    { id: 'en-b1-v-1', level: 'B1', skill: 'vocabulary', prompt: "To 'postpone' a meeting means to ___ it.", options: ['delay', 'cancel', 'start', 'join'], answerIndex: 0 },
    { id: 'en-b1-v-2', level: 'B1', skill: 'vocabulary', prompt: "A 'reliable' person is someone you can ___.", options: ['trust', 'avoid', 'ignore', 'fear'], answerIndex: 0 },
    // B2
    { id: 'en-b2-g-1', level: 'B2', skill: 'grammar', prompt: "By the time we arrived, the meeting ___ already started.", options: ['has', 'had', 'have', 'was'], answerIndex: 1 },
    { id: 'en-b2-g-2', level: 'B2', skill: 'grammar', prompt: "I wish I ___ more time to prepare.", options: ['have', 'had', 'has', 'having'], answerIndex: 1 },
    { id: 'en-b2-v-1', level: 'B2', skill: 'vocabulary', prompt: "'Feasible' means ___.", options: ['possible', 'impossible', 'expensive', 'urgent'], answerIndex: 0 },
    { id: 'en-b2-v-2', level: 'B2', skill: 'vocabulary', prompt: "A 'deadline' is ___.", options: ['a due date', 'a holiday', 'a meeting room', 'a salary'], answerIndex: 0 },
    // C1
    { id: 'en-c1-g-1', level: 'C1', skill: 'grammar', prompt: "Not only ___ she late, but she also forgot the documents.", options: ['was', 'did', 'is', 'does'], answerIndex: 0 },
    { id: 'en-c1-g-2', level: 'C1', skill: 'grammar', prompt: "Had I known about the delay, I ___ differently.", options: ['would act', 'would have acted', 'will act', 'act'], answerIndex: 1 },
    { id: 'en-c1-v-1', level: 'C1', skill: 'vocabulary', prompt: "'Ambiguous' means ___.", options: ['unclear', 'certain', 'simple', 'loud'], answerIndex: 0 },
    { id: 'en-c1-v-2', level: 'C1', skill: 'vocabulary', prompt: "To 'mitigate' a risk means to ___ it.", options: ['reduce', 'increase', 'ignore', 'cause'], answerIndex: 0 },
    // C2
    { id: 'en-c2-g-1', level: 'C2', skill: 'grammar', prompt: "Rarely ___ such an opportunity present itself.", options: ['does', 'has', 'is', 'will'], answerIndex: 0 },
    { id: 'en-c2-g-2', level: 'C2', skill: 'grammar', prompt: "No sooner ___ he arrived than the phone rang.", options: ['had', 'has', 'did', 'was'], answerIndex: 0 },
    { id: 'en-c2-v-1', level: 'C2', skill: 'vocabulary', prompt: "'Ubiquitous' means ___.", options: ['everywhere', 'rare', 'hidden', 'expensive'], answerIndex: 0 },
    { id: 'en-c2-v-2', level: 'C2', skill: 'vocabulary', prompt: "'Meticulous' describes someone who is ___.", options: ['extremely careful', 'very lazy', 'quite rude', 'somewhat late'], answerIndex: 0 },
  ],
  es: [
    // A1
    { id: 'es-a1-g-1', level: 'A1', skill: 'grammar', prompt: "Ella ___ médica.", options: ['es', 'está', 'son', 'soy'], answerIndex: 0 },
    { id: 'es-a1-g-2', level: 'A1', skill: 'grammar', prompt: "Yo ___ dos hermanos.", options: ['tengo', 'tiene', 'soy', 'es'], answerIndex: 0 },
    { id: 'es-a1-v-1', level: 'A1', skill: 'vocabulary', prompt: "Lo opuesto de 'caliente' es ___.", options: ['frío', 'grande', 'pequeño', 'rápido'], answerIndex: 0 },
    { id: 'es-a1-v-2', level: 'A1', skill: 'vocabulary', prompt: "Un lugar donde compras comida: ___", options: ['supermercado', 'hospital', 'escuela', 'aeropuerto'], answerIndex: 0 },
    // A2
    { id: 'es-a2-g-1', level: 'A2', skill: 'grammar', prompt: "Ayer yo ___ al mercado.", options: ['voy', 'fui', 'va', 'iba'], answerIndex: 1 },
    { id: 'es-a2-g-2', level: 'A2', skill: 'grammar', prompt: "___ muchas personas en la fiesta.", options: ['Había', 'Es', 'Son', 'Está'], answerIndex: 0 },
    { id: 'es-a2-v-1', level: 'A2', skill: 'vocabulary', prompt: "Sinónimo de 'feliz': ___", options: ['triste', 'contento', 'enojado', 'cansado'], answerIndex: 1 },
    { id: 'es-a2-v-2', level: 'A2', skill: 'vocabulary', prompt: "Algo que usas para escribir: ___", options: ['bolígrafo', 'cuchara', 'silla', 'ventana'], answerIndex: 0 },
    // B1
    { id: 'es-b1-g-1', level: 'B1', skill: 'grammar', prompt: "Si llueve, ___ en casa.", options: ['me quedaré', 'me quedo', 'me quedaba', 'quedarme'], answerIndex: 0 },
    { id: 'es-b1-g-2', level: 'B1', skill: 'grammar', prompt: "Ella trabaja aquí ___ cinco años.", options: ['desde hace', 'desde', 'hace', 'durante'], answerIndex: 0 },
    { id: 'es-b1-v-1', level: 'B1', skill: 'vocabulary', prompt: "'Posponer' una reunión significa ___ la.", options: ['retrasar', 'cancelar', 'empezar', 'unir'], answerIndex: 0 },
    { id: 'es-b1-v-2', level: 'B1', skill: 'vocabulary', prompt: "Una persona 'confiable' es alguien en quien puedes ___.", options: ['confiar', 'evitar', 'ignorar', 'temer'], answerIndex: 0 },
    // B2
    { id: 'es-b2-g-1', level: 'B2', skill: 'grammar', prompt: "Cuando llegamos, la reunión ya ___ empezado.", options: ['ha', 'había', 'habrá', 'haya'], answerIndex: 1 },
    { id: 'es-b2-g-2', level: 'B2', skill: 'grammar', prompt: "Ojalá ___ más tiempo para prepararme.", options: ['tengo', 'tenga', 'tuviera', 'tendré'], answerIndex: 2 },
    { id: 'es-b2-v-1', level: 'B2', skill: 'vocabulary', prompt: "'Factible' significa ___.", options: ['posible', 'imposible', 'caro', 'urgente'], answerIndex: 0 },
    { id: 'es-b2-v-2', level: 'B2', skill: 'vocabulary', prompt: "Una 'fecha límite' es ___.", options: ['el plazo máximo', 'un día festivo', 'una sala de juntas', 'un salario'], answerIndex: 0 },
    // C1
    { id: 'es-c1-g-1', level: 'C1', skill: 'grammar', prompt: "De haber sabido del retraso, ___ diferente.", options: ['habría actuado', 'actuaría', 'actúo', 'actuar'], answerIndex: 0 },
    { id: 'es-c1-g-2', level: 'C1', skill: 'grammar', prompt: "Apenas llegó, ___ a sonar el teléfono.", options: ['empezó', 'empieza', 'había empezado', 'empezaba'], answerIndex: 0 },
    { id: 'es-c1-v-1', level: 'C1', skill: 'vocabulary', prompt: "'Ambiguo' significa ___.", options: ['poco claro', 'seguro', 'simple', 'ruidoso'], answerIndex: 0 },
    { id: 'es-c1-v-2', level: 'C1', skill: 'vocabulary', prompt: "'Mitigar' un riesgo significa ___ lo.", options: ['reducir', 'aumentar', 'ignorar', 'causar'], answerIndex: 0 },
    // C2
    { id: 'es-c2-g-1', level: 'C2', skill: 'grammar', prompt: "Rara vez ___ una oportunidad así.", options: ['se presenta', 'se presentó', 'presentará', 'presente'], answerIndex: 0 },
    { id: 'es-c2-g-2', level: 'C2', skill: 'grammar', prompt: "Apenas ___ llegado él, sonó el teléfono.", options: ['hubo', 'había', 'ha', 'habrá'], answerIndex: 1 },
    { id: 'es-c2-v-1', level: 'C2', skill: 'vocabulary', prompt: "'Ubicuo' significa ___.", options: ['presente en todas partes', 'raro', 'oculto', 'caro'], answerIndex: 0 },
    { id: 'es-c2-v-2', level: 'C2', skill: 'vocabulary', prompt: "'Meticuloso' describe a alguien ___.", options: ['extremadamente cuidadoso', 'muy perezoso', 'bastante grosero', 'algo tarde'], answerIndex: 0 },
  ],
};
