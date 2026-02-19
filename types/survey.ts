// ============================================================
// TellSafe v1.3 — Survey Type Definitions
// ============================================================

// --- Question Types ---
export type QuestionType = "rating" | "multiple_choice" | "yes_no" | "free_text";

export interface QuestionBase {
  id: string;
  type: QuestionType;
  text: string;
  required: boolean;
  order: number;
}

export interface RatingQuestion extends QuestionBase {
  type: "rating";
  maxRating: number; // typically 5
  lowLabel?: string; // e.g. "Poor"
  highLabel?: string; // e.g. "Excellent"
}

export interface MultipleChoiceQuestion extends QuestionBase {
  type: "multiple_choice";
  options: string[];
  allowMultiple: boolean; // checkboxes vs radio
  allowOther: boolean; // "Other: ___" option
}

export interface YesNoQuestion extends QuestionBase {
  type: "yes_no";
  followUpOnYes?: string; // optional free text prompt on Yes
  followUpOnNo?: string; // optional free text prompt on No
}

export interface FreeTextQuestion extends QuestionBase {
  type: "free_text";
  placeholder?: string;
  maxLength?: number;
}

export type SurveyQuestion =
  | RatingQuestion
  | MultipleChoiceQuestion
  | YesNoQuestion
  | FreeTextQuestion;

// --- Survey ---
export type SurveyStatus = "draft" | "active" | "closed" | "archived";

export interface Survey {
  id: string;
  orgId: string;
  title: string;
  description: string;
  questions: SurveyQuestion[];
  status: SurveyStatus;
  responseCount: number;
  // Privacy
  allowIdentified: boolean; // let respondents optionally identify
  // Scheduling
  opensAt: string | null; // ISO date, null = immediately
  closesAt: string | null; // ISO date, null = manual close
  // Metadata
  templateId: string | null; // if created from a template
  createdBy: string; // admin uid
  createdAt: string;
  updatedAt: string;
}

// --- Survey Response ---
export interface SurveyResponseAnswer {
  questionId: string;
  value: string | number | string[] | boolean; // depends on question type
  followUpText?: string; // for yes/no follow-up
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  orgId: string;
  answers: SurveyResponseAnswer[];
  // Optional identification
  respondentName: string | null;
  respondentEmail: string | null;
  // Metadata
  submittedAt: string;
}

// --- Survey Templates ---
export interface SurveyTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "post_event" | "safety" | "community" | "custom";
  questions: Omit<SurveyQuestion, "id">[];
}

// --- Pre-built Templates ---
export const SURVEY_TEMPLATES: SurveyTemplate[] = [
  {
    id: "post-event",
    name: "Post-Event Feedback",
    description: "Quick survey for after events — ratings, highlights, and suggestions.",
    icon: "🎉",
    category: "post_event",
    questions: [
      {
        type: "rating",
        text: "How would you rate tonight's event overall?",
        required: true,
        order: 0,
        maxRating: 5,
        lowLabel: "Poor",
        highLabel: "Amazing",
      },
      {
        type: "rating",
        text: "How was the music?",
        required: true,
        order: 1,
        maxRating: 5,
        lowLabel: "Didn't enjoy",
        highLabel: "Loved it",
      },
      {
        type: "rating",
        text: "How was the venue?",
        required: true,
        order: 2,
        maxRating: 5,
        lowLabel: "Needs work",
        highLabel: "Perfect",
      },
      {
        type: "multiple_choice",
        text: "What was your favorite part of the event?",
        required: false,
        order: 3,
        options: ["Dancing", "Music", "Social atmosphere", "Lesson/Workshop", "Food/Drinks"],
        allowMultiple: true,
        allowOther: true,
      },
      {
        type: "free_text",
        text: "Any suggestions for improvement?",
        required: false,
        order: 4,
        placeholder: "We'd love to hear your thoughts...",
      },
    ],
  },
  {
    id: "safety-climate",
    name: "Safety Climate Check",
    description: "Assess how safe and inclusive your community feels.",
    icon: "🛡️",
    category: "safety",
    questions: [
      {
        type: "rating",
        text: "How safe do you feel at our events?",
        required: true,
        order: 0,
        maxRating: 5,
        lowLabel: "Not safe",
        highLabel: "Very safe",
      },
      {
        type: "yes_no",
        text: "Have you ever felt uncomfortable or unsafe at one of our events?",
        required: true,
        order: 1,
        followUpOnYes: "Can you describe what happened? (Your response is anonymous)",
      },
      {
        type: "yes_no",
        text: "Do you know how to report a safety concern?",
        required: true,
        order: 2,
        followUpOnNo: "What would make it easier for you to report concerns?",
      },
      {
        type: "rating",
        text: "How well do organizers handle safety concerns?",
        required: true,
        order: 3,
        maxRating: 5,
        lowLabel: "Poorly",
        highLabel: "Excellently",
      },
      {
        type: "multiple_choice",
        text: "What would make you feel safer?",
        required: false,
        order: 4,
        options: [
          "Clearer code of conduct",
          "More visible organizers/staff",
          "Anonymous reporting system",
          "Better lighting",
          "Designated safe person",
        ],
        allowMultiple: true,
        allowOther: true,
      },
      {
        type: "free_text",
        text: "Anything else you'd like to share about safety at our events?",
        required: false,
        order: 5,
        placeholder: "Your response is completely anonymous...",
      },
    ],
  },
  {
    id: "new-member",
    name: "New Member Welcome",
    description: "Check in with newcomers about their first experience.",
    icon: "👋",
    category: "community",
    questions: [
      {
        type: "rating",
        text: "How welcome did you feel at your first event?",
        required: true,
        order: 0,
        maxRating: 5,
        lowLabel: "Not welcome",
        highLabel: "Very welcome",
      },
      {
        type: "yes_no",
        text: "Did someone greet you or introduce themselves?",
        required: true,
        order: 1,
      },
      {
        type: "multiple_choice",
        text: "How did you hear about us?",
        required: true,
        order: 2,
        options: ["Friend/Word of mouth", "Social media", "Google search", "Flyer/Poster", "Other event"],
        allowMultiple: false,
        allowOther: true,
      },
      {
        type: "rating",
        text: "How likely are you to come back?",
        required: true,
        order: 3,
        maxRating: 5,
        lowLabel: "Unlikely",
        highLabel: "Definitely",
      },
      {
        type: "free_text",
        text: "What would make your next visit even better?",
        required: false,
        order: 4,
        placeholder: "Tell us what you'd like to see...",
      },
    ],
  },
  {
    id: "instructor-feedback",
    name: "Instructor / Workshop Feedback",
    description: "Gather feedback on classes, workshops, or lessons.",
    icon: "🎓",
    category: "post_event",
    questions: [
      {
        type: "rating",
        text: "How would you rate the instructor?",
        required: true,
        order: 0,
        maxRating: 5,
        lowLabel: "Poor",
        highLabel: "Excellent",
      },
      {
        type: "rating",
        text: "How well was the material explained?",
        required: true,
        order: 1,
        maxRating: 5,
        lowLabel: "Confusing",
        highLabel: "Very clear",
      },
      {
        type: "multiple_choice",
        text: "What was your skill level going in?",
        required: true,
        order: 2,
        options: ["Complete beginner", "Some experience", "Intermediate", "Advanced"],
        allowMultiple: false,
        allowOther: false,
      },
      {
        type: "rating",
        text: "Was the class the right difficulty for you?",
        required: true,
        order: 3,
        maxRating: 5,
        lowLabel: "Too easy",
        highLabel: "Too hard",
      },
      {
        type: "free_text",
        text: "What topics or skills would you like to see in future classes?",
        required: false,
        order: 4,
        placeholder: "Share your ideas...",
      },
    ],
  },
];
