// ============================================================
// TellSafe — Form Translations
// ============================================================
// Static translations for the public feedback form.
// Supported: English, Spanish, French, German, Portuguese, Korean
//
// ⚠️  These are static — if you change an English string,
//     manually update the other languages to match.

export type Locale = "en" | "es" | "fr" | "de" | "pt" | "ko";

export interface FormTranslations {
  // Form header
  shareYour: string;
  feedback: string;
  // Categories
  whatsThisAbout: string;
  // Fields
  yourName: string;
  yourEmail: string;
  yourFeedback: string;
  namePlaceholder: string;
  emailPlaceholder: string;
  feedbackPlaceholder: string;
  forAnonymousReplies: string;
  encryptedNotice: string;
  // Validation
  pleaseEnterName: string;
  pleaseEnterEmail: string;
  pleaseEnterValidEmail: string;
  // Submit
  sending: string;
  // Privacy options
  identified: string;
  identifiedDesc: string;
  anonymous: string;
  anonymousDesc: string;
  relay: string;
  relayDesc: string;
  relayLocked: string;
  // Button text
  sendIdentified: string;
  sendAnonymous: string;
  sendRelay: string;
  // Success
  feedbackSent: string;
  submitMore: string;
  successAnonymous: string;
  successIdentified: string;
  successRelay: string;
  seeUpdates: string;
  // Footer
  encrypted: string;
  noTracking: string;
  poweredBy: string;
  // Kiosk
  kioskResetting: string;
  // Language
  language: string;
}

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  pt: "Português",
  ko: "한국어",
};

export const TRANSLATIONS: Record<Locale, FormTranslations> = {
  en: {
    shareYour: "Share Your",
    feedback: "Feedback",
    whatsThisAbout: "What's this about?",
    yourName: "Your Name",
    yourEmail: "Your Email",
    yourFeedback: "Your Feedback",
    namePlaceholder: "Jamie Rivera",
    emailPlaceholder: "jamie@example.com",
    feedbackPlaceholder: "What's on your mind? The more detail, the better we can respond...",
    forAnonymousReplies: "(for anonymous replies)",
    encryptedNotice: "Encrypted — organizers will never see this",
    pleaseEnterName: "Please enter your name.",
    pleaseEnterEmail: "Please enter your email.",
    pleaseEnterValidEmail: "Please enter a valid email address.",
    sending: "Sending...",
    identified: "Identified",
    identifiedDesc: "Share openly with your name",
    anonymous: "Anonymous",
    anonymousDesc: "Completely private — no reply possible",
    relay: "Anonymous Relay",
    relayDesc: "Stay anonymous but receive replies",
    relayLocked: "Available on Community plan",
    sendIdentified: "Send Identified Feedback",
    sendAnonymous: "Send Anonymous Feedback",
    sendRelay: "Send via Relay",
    feedbackSent: "Feedback Sent!",
    submitMore: "Submit More Feedback",
    successAnonymous: "Your anonymous feedback has been delivered. No identifying information was stored.",
    successIdentified: "Thanks for sharing openly! The organizers can reach out to you directly.",
    successRelay: "Sent via anonymous relay. You'll receive replies at your email without revealing your identity.",
    seeUpdates: "See recent updates",
    encrypted: "Encrypted",
    noTracking: "No tracking",
    poweredBy: "Powered by TellSafe",
    kioskResetting: "Resetting in",
    language: "Language",
  },
  es: {
    shareYour: "Comparte Tu",
    feedback: "Opinión",
    whatsThisAbout: "¿De qué se trata?",
    yourName: "Tu Nombre",
    yourEmail: "Tu Correo",
    yourFeedback: "Tu Opinión",
    namePlaceholder: "María García",
    emailPlaceholder: "maria@ejemplo.com",
    feedbackPlaceholder: "¿Qué tienes en mente? Cuanto más detalle, mejor podremos responder...",
    forAnonymousReplies: "(para respuestas anónimas)",
    encryptedNotice: "Encriptado — los organizadores nunca verán esto",
    pleaseEnterName: "Por favor ingresa tu nombre.",
    pleaseEnterEmail: "Por favor ingresa tu correo.",
    pleaseEnterValidEmail: "Por favor ingresa un correo válido.",
    sending: "Enviando...",
    identified: "Identificado",
    identifiedDesc: "Comparte abiertamente con tu nombre",
    anonymous: "Anónimo",
    anonymousDesc: "Completamente privado — sin respuesta posible",
    relay: "Relay Anónimo",
    relayDesc: "Mantente anónimo pero recibe respuestas",
    relayLocked: "Disponible en el plan Community",
    sendIdentified: "Enviar Opinión Identificada",
    sendAnonymous: "Enviar Opinión Anónima",
    sendRelay: "Enviar por Relay",
    feedbackSent: "¡Opinión Enviada!",
    submitMore: "Enviar Más Opiniones",
    successAnonymous: "Tu opinión anónima ha sido entregada. No se almacenó información identificativa.",
    successIdentified: "¡Gracias por compartir abiertamente! Los organizadores pueden contactarte directamente.",
    successRelay: "Enviado por relay anónimo. Recibirás respuestas en tu correo sin revelar tu identidad.",
    seeUpdates: "Ver actualizaciones recientes",
    encrypted: "Encriptado",
    noTracking: "Sin rastreo",
    poweredBy: "Impulsado por TellSafe",
    kioskResetting: "Reiniciando en",
    language: "Idioma",
  },
  fr: {
    shareYour: "Partagez Votre",
    feedback: "Avis",
    whatsThisAbout: "De quoi s'agit-il ?",
    yourName: "Votre Nom",
    yourEmail: "Votre Email",
    yourFeedback: "Votre Avis",
    namePlaceholder: "Marie Dupont",
    emailPlaceholder: "marie@exemple.com",
    feedbackPlaceholder: "Qu'avez-vous en tête ? Plus vous donnez de détails, mieux nous pourrons répondre...",
    forAnonymousReplies: "(pour réponses anonymes)",
    encryptedNotice: "Chiffré — les organisateurs ne verront jamais ceci",
    pleaseEnterName: "Veuillez entrer votre nom.",
    pleaseEnterEmail: "Veuillez entrer votre email.",
    pleaseEnterValidEmail: "Veuillez entrer une adresse email valide.",
    sending: "Envoi en cours...",
    identified: "Identifié",
    identifiedDesc: "Partagez ouvertement avec votre nom",
    anonymous: "Anonyme",
    anonymousDesc: "Complètement privé — aucune réponse possible",
    relay: "Relais Anonyme",
    relayDesc: "Restez anonyme mais recevez des réponses",
    relayLocked: "Disponible avec le plan Community",
    sendIdentified: "Envoyer un Avis Identifié",
    sendAnonymous: "Envoyer un Avis Anonyme",
    sendRelay: "Envoyer par Relais",
    feedbackSent: "Avis Envoyé !",
    submitMore: "Envoyer un Autre Avis",
    successAnonymous: "Votre avis anonyme a été transmis. Aucune information d'identification n'a été enregistrée.",
    successIdentified: "Merci de partager ouvertement ! Les organisateurs peuvent vous contacter directement.",
    successRelay: "Envoyé par relais anonyme. Vous recevrez des réponses par email sans révéler votre identité.",
    seeUpdates: "Voir les mises à jour récentes",
    encrypted: "Chiffré",
    noTracking: "Aucun suivi",
    poweredBy: "Propulsé par TellSafe",
    kioskResetting: "Réinitialisation dans",
    language: "Langue",
  },
  de: {
    shareYour: "Teilen Sie Ihr",
    feedback: "Feedback",
    whatsThisAbout: "Worum geht es?",
    yourName: "Ihr Name",
    yourEmail: "Ihre E-Mail",
    yourFeedback: "Ihr Feedback",
    namePlaceholder: "Max Müller",
    emailPlaceholder: "max@beispiel.de",
    feedbackPlaceholder: "Was liegt Ihnen auf dem Herzen? Je mehr Details, desto besser können wir reagieren...",
    forAnonymousReplies: "(für anonyme Antworten)",
    encryptedNotice: "Verschlüsselt — die Organisatoren werden dies nie sehen",
    pleaseEnterName: "Bitte geben Sie Ihren Namen ein.",
    pleaseEnterEmail: "Bitte geben Sie Ihre E-Mail ein.",
    pleaseEnterValidEmail: "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
    sending: "Wird gesendet...",
    identified: "Identifiziert",
    identifiedDesc: "Offen mit Ihrem Namen teilen",
    anonymous: "Anonym",
    anonymousDesc: "Vollständig privat — keine Antwort möglich",
    relay: "Anonymes Relay",
    relayDesc: "Bleiben Sie anonym, erhalten aber Antworten",
    relayLocked: "Verfügbar im Community-Plan",
    sendIdentified: "Identifiziertes Feedback senden",
    sendAnonymous: "Anonymes Feedback senden",
    sendRelay: "Per Relay senden",
    feedbackSent: "Feedback Gesendet!",
    submitMore: "Weiteres Feedback senden",
    successAnonymous: "Ihr anonymes Feedback wurde übermittelt. Es wurden keine identifizierenden Informationen gespeichert.",
    successIdentified: "Danke fürs offene Teilen! Die Organisatoren können Sie direkt kontaktieren.",
    successRelay: "Per anonymem Relay gesendet. Sie erhalten Antworten per E-Mail, ohne Ihre Identität preiszugeben.",
    seeUpdates: "Aktuelle Updates ansehen",
    encrypted: "Verschlüsselt",
    noTracking: "Kein Tracking",
    poweredBy: "Bereitgestellt von TellSafe",
    kioskResetting: "Zurücksetzung in",
    language: "Sprache",
  },
  pt: {
    shareYour: "Compartilhe Seu",
    feedback: "Feedback",
    whatsThisAbout: "Sobre o que é isso?",
    yourName: "Seu Nome",
    yourEmail: "Seu Email",
    yourFeedback: "Seu Feedback",
    namePlaceholder: "João Silva",
    emailPlaceholder: "joao@exemplo.com",
    feedbackPlaceholder: "O que está em sua mente? Quanto mais detalhes, melhor podemos responder...",
    forAnonymousReplies: "(para respostas anônimas)",
    encryptedNotice: "Criptografado — os organizadores nunca verão isso",
    pleaseEnterName: "Por favor, insira seu nome.",
    pleaseEnterEmail: "Por favor, insira seu email.",
    pleaseEnterValidEmail: "Por favor, insira um email válido.",
    sending: "Enviando...",
    identified: "Identificado",
    identifiedDesc: "Compartilhe abertamente com seu nome",
    anonymous: "Anônimo",
    anonymousDesc: "Completamente privado — sem resposta possível",
    relay: "Relay Anônimo",
    relayDesc: "Fique anônimo mas receba respostas",
    relayLocked: "Disponível no plano Community",
    sendIdentified: "Enviar Feedback Identificado",
    sendAnonymous: "Enviar Feedback Anônimo",
    sendRelay: "Enviar por Relay",
    feedbackSent: "Feedback Enviado!",
    submitMore: "Enviar Mais Feedback",
    successAnonymous: "Seu feedback anônimo foi entregue. Nenhuma informação identificadora foi armazenada.",
    successIdentified: "Obrigado por compartilhar abertamente! Os organizadores podem entrar em contato diretamente.",
    successRelay: "Enviado por relay anônimo. Você receberá respostas no seu email sem revelar sua identidade.",
    seeUpdates: "Ver atualizações recentes",
    encrypted: "Criptografado",
    noTracking: "Sem rastreamento",
    poweredBy: "Desenvolvido por TellSafe",
    kioskResetting: "Reiniciando em",
    language: "Idioma",
  },
  ko: {
    shareYour: "당신의",
    feedback: "피드백을 공유하세요",
    whatsThisAbout: "무엇에 관한 건가요?",
    yourName: "이름",
    yourEmail: "이메일",
    yourFeedback: "피드백",
    namePlaceholder: "홍길동",
    emailPlaceholder: "hong@example.com",
    feedbackPlaceholder: "무엇이 궁금하신가요? 자세할수록 더 잘 대응할 수 있습니다...",
    forAnonymousReplies: "(익명 답변용)",
    encryptedNotice: "암호화됨 — 주최자는 이것을 볼 수 없습니다",
    pleaseEnterName: "이름을 입력해 주세요.",
    pleaseEnterEmail: "이메일을 입력해 주세요.",
    pleaseEnterValidEmail: "유효한 이메일 주소를 입력해 주세요.",
    sending: "보내는 중...",
    identified: "신원 공개",
    identifiedDesc: "이름을 밝히고 공유하기",
    anonymous: "익명",
    anonymousDesc: "완전히 비공개 — 답변 불가",
    relay: "익명 릴레이",
    relayDesc: "익명을 유지하면서 답변 받기",
    relayLocked: "커뮤니티 플랜에서 사용 가능",
    sendIdentified: "신원 공개 피드백 보내기",
    sendAnonymous: "익명 피드백 보내기",
    sendRelay: "릴레이로 보내기",
    feedbackSent: "피드백이 전송되었습니다!",
    submitMore: "더 많은 피드백 보내기",
    successAnonymous: "익명 피드백이 전달되었습니다. 신원 정보는 저장되지 않았습니다.",
    successIdentified: "공유해 주셔서 감사합니다! 주최자가 직접 연락할 수 있습니다.",
    successRelay: "익명 릴레이로 전송되었습니다. 신원을 밝히지 않고 이메일로 답변을 받으실 수 있습니다.",
    seeUpdates: "최근 업데이트 보기",
    encrypted: "암호화",
    noTracking: "추적 없음",
    poweredBy: "TellSafe 제공",
    kioskResetting: "초 후 재설정",
    language: "언어",
  },
};
