export type QuestionType =
  | "text"
  | "paragraph"
  | "multiple_choice"
  | "checkboxes"
  | "dropdown"
  | "number"
  | "date"
  | "time"
  | "rating";

export interface FormQuestion {
  id: string;
  title: string;
  type: QuestionType;
  required: boolean;
  options: string[];
  placeholder?: string | undefined;
  description?: string | undefined;
}

export interface CustomForm {
  id: string;
  departmentSlug: string;
  departmentLabel: string;
  title: string;
  description: string;
  bannerUrl?: string | undefined;
  createdAt: string;
  updatedAt: string;
  questions: FormQuestion[];
}

export interface FormResponse {
  id: string;
  formId: string;
  submittedAt: string;
  answers: Record<string, unknown>;
}

export const QUESTION_TYPE_LABELS: Record<QuestionType, { label: string; desc: string }> = {
  text: { label: "Short answer", desc: "Single line text input" },
  paragraph: { label: "Paragraph", desc: "Multi-line text input" },
  multiple_choice: { label: "Multiple choice", desc: "Single selection radio options" },
  checkboxes: { label: "Checkboxes", desc: "Multiple selection checkboxes" },
  dropdown: { label: "Dropdown", desc: "Single selection select dropdown" },
  number: { label: "Number", desc: "Numeric value input" },
  date: { label: "Date", desc: "Calendar date picker" },
  time: { label: "Time", desc: "Time selector" },
  rating: { label: "Rating / Scale (1-5)", desc: "1 to 5 linear score scale" },
};

export const INITIAL_DEFAULT_FORMS: CustomForm[] = [];
