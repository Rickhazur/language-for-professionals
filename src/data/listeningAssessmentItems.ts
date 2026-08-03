import { CefrLevel, LanguageCode } from '../types/database';

export interface ListeningItem {
  id: string;
  level: CefrLevel;
  // Texto que se reproduce con voz sintetizada (expo-speech) — el estudiante
  // solo escucha esto, nunca lo ve escrito.
  script: string;
  question: string;
  options: string[];
  answerIndex: number;
}

// Dos ítems por nivel CEFR, en orden de dificultad creciente — igual
// filosofía que ORAL_SENTENCES (lista fija, no adaptativa), pero con una
// pregunta de comprensión en vez de "repite la frase".
export const LISTENING_ITEMS: Record<LanguageCode, ListeningItem[]> = {
  en: [
    {
      id: 'en-a1-1',
      level: 'A1',
      script: 'My name is Laura and I work in an office.',
      question: 'Where does Laura work?',
      options: ['In an office', 'In a hospital', 'In a school', 'At home'],
      answerIndex: 0,
    },
    {
      id: 'en-a1-2',
      level: 'A1',
      script: 'The meeting starts at three o’clock.',
      question: 'What time does the meeting start?',
      options: ['One o’clock', 'Two o’clock', 'Three o’clock', 'Four o’clock'],
      answerIndex: 2,
    },
    {
      id: 'en-a2-1',
      level: 'A2',
      script: 'I usually take the bus to work, but yesterday I drove my car because it was raining.',
      question: 'Why did the speaker drive their car yesterday?',
      options: ['The bus was late', 'It was raining', 'The car was new', 'They had a meeting'],
      answerIndex: 1,
    },
    {
      id: 'en-a2-2',
      level: 'A2',
      script: 'Please send me the invoice by email before Friday afternoon.',
      question: 'What does the speaker want by Friday afternoon?',
      options: ['A phone call', 'The invoice by email', 'A meeting', 'A new laptop'],
      answerIndex: 1,
    },
    {
      id: 'en-b1-1',
      level: 'B1',
      script: 'We had planned to launch the product in June, but we had to postpone it because of a delay with the supplier.',
      question: 'Why was the product launch postponed?',
      options: [
        'The team was on vacation',
        'A delay with the supplier',
        'The budget was too small',
        'The client cancelled the order',
      ],
      answerIndex: 1,
    },
    {
      id: 'en-b1-2',
      level: 'B1',
      script: 'If the client agrees to the new terms, we can sign the contract by the end of the week.',
      question: 'When could the contract be signed?',
      options: ['Tomorrow morning', 'By the end of the week', 'Next month', 'It already was signed'],
      answerIndex: 1,
    },
    {
      id: 'en-b2-1',
      level: 'B2',
      script:
        'Although the quarterly results were slightly below target, management remains confident that the new strategy will pay off in the long run.',
      question: 'How does management feel about the quarterly results?',
      options: [
        'Confident despite falling short of target',
        'Extremely worried',
        'Certain the strategy failed',
        'Indifferent to the results',
      ],
      answerIndex: 0,
    },
    {
      id: 'en-b2-2',
      level: 'B2',
      script:
        'Before we proceed, I’d like to flag a potential conflict of interest that the committee should be aware of.',
      question: 'What does the speaker want to do before proceeding?',
      options: [
        'Cancel the meeting',
        'Point out a possible conflict of interest',
        'Ask for a raise',
        'Change the meeting date',
      ],
      answerIndex: 1,
    },
    {
      id: 'en-c1-1',
      level: 'C1',
      script:
        'Given the constraints we’re working under, I think it’s worth revisiting our assumptions rather than pressing ahead with the original timeline.',
      question: 'What is the speaker suggesting?',
      options: [
        'Reviewing the assumptions instead of keeping the original timeline',
        'Hiring more staff immediately',
        'Cancelling the project entirely',
        'Extending everyone’s vacation',
      ],
      answerIndex: 0,
    },
    {
      id: 'en-c1-2',
      level: 'C1',
      script:
        'It’s not that the proposal lacks merit — it’s more that the timing couldn’t be worse, given everything else on the board’s plate right now.',
      question: 'What is the main concern about the proposal?',
      options: ['The timing', 'The cost', 'The quality', 'The location'],
      answerIndex: 0,
    },
    {
      id: 'en-c2-1',
      level: 'C2',
      script:
        'While I appreciate the enthusiasm behind the pitch, I’d be doing the team a disservice if I didn’t push back on some of the underlying assumptions before we commit any further resources.',
      question: 'What is the speaker planning to do?',
      options: [
        'Challenge some assumptions before committing more resources',
        'Approve the pitch immediately',
        'Reject the pitch without discussion',
        'Assign the pitch to another team',
      ],
      answerIndex: 0,
    },
    {
      id: 'en-c2-2',
      level: 'C2',
      script:
        'The board’s reluctance to greenlight the acquisition stems less from the valuation itself than from lingering concerns over cultural fit post-merger.',
      question: 'What is the board mainly worried about?',
      options: [
        'Cultural fit after the merger',
        'The valuation being too low',
        'Legal paperwork delays',
        'The acquisition being too fast',
      ],
      answerIndex: 0,
    },
  ],
  es: [
    {
      id: 'es-a1-1',
      level: 'A1',
      script: 'Me llamo Laura y trabajo en una oficina.',
      question: '¿Dónde trabaja Laura?',
      options: ['En una oficina', 'En un hospital', 'En una escuela', 'En casa'],
      answerIndex: 0,
    },
    {
      id: 'es-a1-2',
      level: 'A1',
      script: 'La reunión empieza a las tres.',
      question: '¿A qué hora empieza la reunión?',
      options: ['A la una', 'A las dos', 'A las tres', 'A las cuatro'],
      answerIndex: 2,
    },
    {
      id: 'es-a2-1',
      level: 'A2',
      script: 'Normalmente tomo el bus para ir al trabajo, pero ayer manejé mi carro porque estaba lloviendo.',
      question: '¿Por qué manejó su carro ayer?',
      options: ['El bus llegó tarde', 'Estaba lloviendo', 'El carro era nuevo', 'Tenía una reunión'],
      answerIndex: 1,
    },
    {
      id: 'es-a2-2',
      level: 'A2',
      script: 'Por favor envíame la factura por correo antes del viernes en la tarde.',
      question: '¿Qué pide la persona antes del viernes en la tarde?',
      options: ['Una llamada', 'La factura por correo', 'Una reunión', 'Un computador nuevo'],
      answerIndex: 1,
    },
    {
      id: 'es-b1-1',
      level: 'B1',
      script:
        'Habíamos planeado lanzar el producto en junio, pero tuvimos que posponerlo por un retraso con el proveedor.',
      question: '¿Por qué se pospuso el lanzamiento del producto?',
      options: [
        'El equipo estaba de vacaciones',
        'Un retraso con el proveedor',
        'El presupuesto era muy pequeño',
        'El cliente canceló el pedido',
      ],
      answerIndex: 1,
    },
    {
      id: 'es-b1-2',
      level: 'B1',
      script: 'Si el cliente acepta los nuevos términos, podemos firmar el contrato antes del fin de semana.',
      question: '¿Cuándo podría firmarse el contrato?',
      options: ['Mañana en la mañana', 'Antes del fin de semana', 'El próximo mes', 'Ya se firmó'],
      answerIndex: 1,
    },
    {
      id: 'es-b2-1',
      level: 'B2',
      script:
        'Aunque los resultados del trimestre quedaron un poco por debajo de la meta, la gerencia sigue confiando en que la nueva estrategia dará resultados a largo plazo.',
      question: '¿Cómo se siente la gerencia sobre los resultados del trimestre?',
      options: [
        'Confiada, a pesar de no llegar a la meta',
        'Muy preocupada',
        'Segura de que la estrategia falló',
        'Indiferente a los resultados',
      ],
      answerIndex: 0,
    },
    {
      id: 'es-b2-2',
      level: 'B2',
      script: 'Antes de continuar, quiero señalar un posible conflicto de intereses que el comité debería conocer.',
      question: '¿Qué quiere hacer la persona antes de continuar?',
      options: [
        'Cancelar la reunión',
        'Señalar un posible conflicto de intereses',
        'Pedir un aumento',
        'Cambiar la fecha de la reunión',
      ],
      answerIndex: 1,
    },
    {
      id: 'es-c1-1',
      level: 'C1',
      script:
        'Dadas las limitaciones con las que estamos trabajando, creo que vale la pena revisar nuestros supuestos en vez de seguir adelante con el cronograma original.',
      question: '¿Qué está sugiriendo la persona?',
      options: [
        'Revisar los supuestos en vez de mantener el cronograma original',
        'Contratar más personal de inmediato',
        'Cancelar el proyecto por completo',
        'Extender las vacaciones de todos',
      ],
      answerIndex: 0,
    },
    {
      id: 'es-c1-2',
      level: 'C1',
      script:
        'No es que la propuesta carezca de mérito, sino que el momento no podría ser peor, dado todo lo que la junta directiva tiene entre manos ahora mismo.',
      question: '¿Cuál es la principal preocupación sobre la propuesta?',
      options: ['El momento en que se presenta', 'El costo', 'La calidad', 'La ubicación'],
      answerIndex: 0,
    },
    {
      id: 'es-c2-1',
      level: 'C2',
      script:
        'Aunque valoro el entusiasmo detrás de la propuesta, le haría un flaco favor al equipo si no cuestionara algunos de los supuestos de fondo antes de comprometer más recursos.',
      question: '¿Qué planea hacer la persona?',
      options: [
        'Cuestionar algunos supuestos antes de comprometer más recursos',
        'Aprobar la propuesta de inmediato',
        'Rechazar la propuesta sin discutirla',
        'Asignar la propuesta a otro equipo',
      ],
      answerIndex: 0,
    },
    {
      id: 'es-c2-2',
      level: 'C2',
      script:
        'La renuencia de la junta a aprobar la adquisición no se debe tanto a la valoración en sí, sino a preocupaciones persistentes sobre el encaje cultural después de la fusión.',
      question: '¿Qué le preocupa principalmente a la junta directiva?',
      options: [
        'El encaje cultural después de la fusión',
        'Que la valoración sea muy baja',
        'Retrasos en el papeleo legal',
        'Que la adquisición sea muy rápida',
      ],
      answerIndex: 0,
    },
  ],
};
