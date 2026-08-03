// Diccionario de texto de la INTERFAZ de la app (botones, menús, alertas) —
// no confundir con target_language/native_language, que solo controlan el
// idioma del contenido de las lecciones generado por IA. Claves con punto
// como namespace (pantalla.campo) para evitar choques y ubicar fácil dónde
// extender esto en el resto de las pantallas.

export const translations = {
  es: {
    // Compartido entre varias pantallas
    'common.emailPlaceholder': 'Correo electrónico',
    'common.passwordPlaceholder': 'Contraseña',
    'common.missingDataTitle': 'Faltan datos',
    'common.missingCredentialsMessage': 'Ingresa tu correo y contraseña.',
    'common.greeting': '¡Hola! 👋',
    'common.langEnglish': 'Inglés',
    'common.langSpanish': 'Español',

    // WelcomeScreen
    'welcome.tagline': 'Tu compañero de inglés y español con IA — practica para tu profesión, no para un examen.',
    'welcome.centerLabel': 'Inglés ⇄ Español',
    'welcome.centerSub': 'con IA',
    'welcome.feature.shadowing': 'Shadowing con IA',
    'welcome.feature.roleplay': 'Roleplay profesional',
    'welcome.feature.sounds': 'Sonidos precisos',
    'welcome.feature.badges': 'Rachas e insignias',
    'welcome.cta': 'Comenzar  →',
    'welcome.haveAccount': '¿Ya tienes cuenta? ',
    'welcome.login': 'Inicia sesión',

    // LoginScreen
    'login.title': '¡Hola de nuevo!',
    'login.subtitle': 'Inicia sesión para seguir practicando',
    'login.submitButton': 'Entrar',
    'login.forgotLink': 'Olvidé mi contraseña',
    'login.noAccount': '¿No tienes cuenta?',
    'login.registerLink': 'Regístrate',
    'login.alertErrorTitle': 'Error al iniciar sesión',

    // RegisterScreen
    'register.title': 'Crea tu cuenta',
    'register.subtitle': 'Empieza a practicar en minutos',
    'register.roleLabel': 'Soy...',
    'register.roleStudent': 'Estudiante',
    'register.roleTeacher': 'Profesor',
    'register.submitButton': 'Registrarme',
    'register.haveAccount': '¿Ya tienes cuenta?',
    'register.loginLink': 'Inicia sesión',
    'register.alertErrorTitle': 'Error al registrarse',
    'register.alertCreatedTitle': 'Cuenta creada',
    'register.alertCreatedMessage': 'Revisa tu correo para confirmar tu cuenta.',

    // ForgotPasswordScreen
    'forgotPassword.title': 'Recuperar contraseña',
    'forgotPassword.subtitle': 'Te enviaremos un enlace a tu correo',
    'forgotPassword.sendButton': 'Enviar enlace',
    'forgotPassword.backLink': '← Volver',
    'forgotPassword.alertMissingTitle': 'Falta el correo',
    'forgotPassword.alertMissingMessage': 'Ingresa tu correo electrónico.',
    'forgotPassword.alertSentTitle': 'Correo enviado',
    'forgotPassword.alertSentMessage': 'Revisa tu bandeja para restablecer tu contraseña.',

    // Tab bar (MainTabs)
    'tabs.home': 'Inicio',
    'tabs.practice': 'Práctica',
    'tabs.progress': 'Progreso',
    'tabs.profile': 'Perfil',

    // HomeScreen
    'home.subtitle': '¿Qué quieres practicar hoy?',
    'home.streakLabel': 'Racha (días)',
    'home.pointsLabel': 'Puntos',
    'home.quick.shadowing': 'Shadowing',
    'home.quick.roleplay': 'Roleplay',
    'home.quick.progress': 'Mi progreso',
    'home.quick.assessment': 'Evaluación',
    'home.quick.bookClass': 'Agendar clase',
    'home.featuredTitle': 'Funciones destacadas',
    'home.coursePlanTitle': 'Plan de curso',
    'home.coursePlanSubtitle': 'Módulos y vocabulario',
    'home.badgesTitle': 'Insignias',
    'home.badgesSubtitle': 'Tus logros',
    'home.currentLevelLabel': 'Tu nivel actual',
    'home.retakeAssessment': 'Repetir evaluación de nivel',
    'home.noAssessmentLabel': 'Aún no has tomado tu evaluación de nivel',
    'home.startAssessment': 'Comenzar evaluación',

    // PracticeScreen
    'practice.title': 'Práctica',
    'practice.subtitle': 'Elige un tipo de práctica.',
    'practice.shadowingTitle': 'Shadowing',
    'practice.shadowingText':
      'Escucha una frase con pronunciación nativa, repítela y compara tu grabación con el audio original.',
    'practice.shadowingButton': 'Practicar shadowing',
    'practice.roleplayTitle': 'Roleplay conversacional',
    'practice.roleplayText':
      'Conversa con la IA en un escenario relacionado a tu profesión y recibe feedback al final.',
    'practice.roleplayButton': 'Practicar roleplay',

    // ProfileScreen
    'profile.title': 'Mi perfil',
    'profile.badgesTitle': 'Insignias',
    'profile.emptyBadges': 'Todavía no ganaste ninguna insignia — sigue practicando.',
    'profile.signOut': 'Cerrar sesión',
    'profile.languageLabel': 'Idioma de la app',

    // Onboarding
    'onboarding.targetQuestion': '¿Qué idioma quieres aprender?',
    'onboarding.nativeQuestion': '¿Cuál es tu idioma nativo?',
    'onboarding.continueButton': 'Continuar',
    'onboarding.occupationQuestion': '¿A qué te dedicas?',
    'onboarding.occupationPlaceholder': 'Ej. Gerente de ventas',
    'onboarding.industryQuestion': '¿En qué industria trabajas?',
    'onboarding.objectivesQuestion': '¿Para qué quieres usar el idioma? (elige una o más)',
    'onboarding.finishButton': 'Terminar',
    'onboarding.alertMissingMessage': 'Completa tu ocupación, industria y al menos un objetivo.',
    'onboarding.industry.tech': 'Tecnología',
    'onboarding.industry.finance': 'Finanzas',
    'onboarding.industry.health': 'Salud',
    'onboarding.industry.education': 'Educación',
    'onboarding.industry.manufacturing': 'Manufactura',
    'onboarding.industry.sales': 'Ventas y comercio',
    'onboarding.industry.tourism': 'Turismo y hospitalidad',
    'onboarding.industry.legal': 'Legal',
    'onboarding.industry.other': 'Otra',
    'onboarding.objective.meetings': 'Reuniones',
    'onboarding.objective.emails': 'Correos',
    'onboarding.objective.negotiation': 'Negociación',
    'onboarding.objective.presentations': 'Presentaciones',
    'onboarding.objective.customerService': 'Atención a clientes',
    'onboarding.objective.travel': 'Viajes',

    // AssessmentResultScreen — oferta post-examen
    'assessmentOffer.title': '🤖 + 👩‍🏫 La combinación que realmente funciona',
    'assessmentOffer.body':
      'La IA te da práctica ilimitada, retroalimentación al instante y cero pena de equivocarte — disponible cuando tú quieras. Pero ningún algoritmo reemplaza a un profesor real: alguien que corrige lo que la IA no capta, te empuja a seguir cuando te estancas, y te ayuda a sonar como un profesional de verdad, no solo alguien que aprobó un examen.',
    'assessmentOffer.offerTitle': '🎁 Tu clase de bienvenida es gratis',
    'assessmentOffer.offerBody':
      'Empieza el programa completo con tu primera clase en vivo sin costo — así conoces a tu profesor y armamos juntos tu plan antes de que decidas cualquier cosa.',
    'assessmentOffer.ctaButton': '💬 Quiero mi clase gratis',
    'assessmentOffer.whatsappMessage':
      '¡Hola! Acabo de terminar mi examen de nivelación en LinguaPro. Mi nivel es {level} en {language}. Quiero mi primera clase gratis 🎉',
  },
  en: {
    'common.emailPlaceholder': 'Email',
    'common.passwordPlaceholder': 'Password',
    'common.missingDataTitle': 'Missing information',
    'common.missingCredentialsMessage': 'Enter your email and password.',
    'common.greeting': 'Hi! 👋',
    'common.langEnglish': 'English',
    'common.langSpanish': 'Spanish',

    'welcome.tagline': 'Your AI-powered English and Spanish companion — practice for your job, not for a test.',
    'welcome.centerLabel': 'English ⇄ Spanish',
    'welcome.centerSub': 'with AI',
    'welcome.feature.shadowing': 'AI Shadowing',
    'welcome.feature.roleplay': 'Professional Roleplay',
    'welcome.feature.sounds': 'Precise Sounds',
    'welcome.feature.badges': 'Streaks & Badges',
    'welcome.cta': 'Get Started  →',
    'welcome.haveAccount': 'Already have an account? ',
    'welcome.login': 'Log in',

    'login.title': 'Welcome back!',
    'login.subtitle': 'Log in to keep practicing',
    'login.submitButton': 'Log in',
    'login.forgotLink': 'Forgot my password',
    'login.noAccount': "Don't have an account?",
    'login.registerLink': 'Sign up',
    'login.alertErrorTitle': 'Login error',

    'register.title': 'Create your account',
    'register.subtitle': 'Start practicing in minutes',
    'register.roleLabel': 'I am a...',
    'register.roleStudent': 'Student',
    'register.roleTeacher': 'Teacher',
    'register.submitButton': 'Sign up',
    'register.haveAccount': 'Already have an account?',
    'register.loginLink': 'Log in',
    'register.alertErrorTitle': 'Sign up error',
    'register.alertCreatedTitle': 'Account created',
    'register.alertCreatedMessage': 'Check your email to confirm your account.',

    'forgotPassword.title': 'Reset password',
    'forgotPassword.subtitle': "We'll send a link to your email",
    'forgotPassword.sendButton': 'Send link',
    'forgotPassword.backLink': '← Back',
    'forgotPassword.alertMissingTitle': 'Email required',
    'forgotPassword.alertMissingMessage': 'Enter your email address.',
    'forgotPassword.alertSentTitle': 'Email sent',
    'forgotPassword.alertSentMessage': 'Check your inbox to reset your password.',

    'tabs.home': 'Home',
    'tabs.practice': 'Practice',
    'tabs.progress': 'Progress',
    'tabs.profile': 'Profile',

    'home.subtitle': 'What do you want to practice today?',
    'home.streakLabel': 'Streak (days)',
    'home.pointsLabel': 'Points',
    'home.quick.shadowing': 'Shadowing',
    'home.quick.roleplay': 'Roleplay',
    'home.quick.progress': 'My progress',
    'home.quick.assessment': 'Assessment',
    'home.quick.bookClass': 'Book a class',
    'home.featuredTitle': 'Featured',
    'home.coursePlanTitle': 'Course plan',
    'home.coursePlanSubtitle': 'Modules and vocabulary',
    'home.badgesTitle': 'Badges',
    'home.badgesSubtitle': 'Your achievements',
    'home.currentLevelLabel': 'Your current level',
    'home.retakeAssessment': 'Retake level assessment',
    'home.noAssessmentLabel': "You haven't taken your level assessment yet",
    'home.startAssessment': 'Start assessment',

    'practice.title': 'Practice',
    'practice.subtitle': 'Choose a type of practice.',
    'practice.shadowingTitle': 'Shadowing',
    'practice.shadowingText':
      'Listen to a phrase with native pronunciation, repeat it, and compare your recording with the original audio.',
    'practice.shadowingButton': 'Practice shadowing',
    'practice.roleplayTitle': 'Conversational roleplay',
    'practice.roleplayText':
      'Talk with the AI in a scenario related to your profession and get feedback at the end.',
    'practice.roleplayButton': 'Practice roleplay',

    'profile.title': 'My profile',
    'profile.badgesTitle': 'Badges',
    'profile.emptyBadges': "You haven't earned any badges yet — keep practicing.",
    'profile.signOut': 'Log out',
    'profile.languageLabel': 'App language',

    'onboarding.targetQuestion': 'Which language do you want to learn?',
    'onboarding.nativeQuestion': 'What is your native language?',
    'onboarding.continueButton': 'Continue',
    'onboarding.occupationQuestion': 'What do you do for work?',
    'onboarding.occupationPlaceholder': 'E.g. Sales Manager',
    'onboarding.industryQuestion': 'What industry do you work in?',
    'onboarding.objectivesQuestion': 'What do you want to use the language for? (choose one or more)',
    'onboarding.finishButton': 'Finish',
    'onboarding.alertMissingMessage': 'Complete your occupation, industry, and at least one goal.',
    'onboarding.industry.tech': 'Technology',
    'onboarding.industry.finance': 'Finance',
    'onboarding.industry.health': 'Healthcare',
    'onboarding.industry.education': 'Education',
    'onboarding.industry.manufacturing': 'Manufacturing',
    'onboarding.industry.sales': 'Sales & Commerce',
    'onboarding.industry.tourism': 'Tourism & Hospitality',
    'onboarding.industry.legal': 'Legal',
    'onboarding.industry.other': 'Other',
    'onboarding.objective.meetings': 'Meetings',
    'onboarding.objective.emails': 'Emails',
    'onboarding.objective.negotiation': 'Negotiation',
    'onboarding.objective.presentations': 'Presentations',
    'onboarding.objective.customerService': 'Customer service',
    'onboarding.objective.travel': 'Travel',

    // AssessmentResultScreen — post-test offer
    'assessmentOffer.title': '🤖 + 👩‍🏫 The combination that actually works',
    'assessmentOffer.body':
      "AI gives you unlimited practice, instant feedback, and zero fear of getting it wrong — available whenever you want. But no algorithm replaces a real teacher: someone who catches what AI misses, pushes you forward when you get stuck, and helps you sound like a real professional, not just someone who passed a test.",
    'assessmentOffer.offerTitle': '🎁 Your welcome class is free',
    'assessmentOffer.offerBody':
      "Start the full program with your first live class at no cost — meet your teacher and build your plan together before you decide anything.",
    'assessmentOffer.ctaButton': '💬 I want my free class',
    'assessmentOffer.whatsappMessage':
      "Hi! I just finished my placement test on LinguaPro. My level is {level} in {language}. I'd like my free first class 🎉",
  },
} as const;

export type TranslationKey = keyof typeof translations.es;
