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
  placeholder?: string;
  description?: string;
}

export interface CustomForm {
  id: string;
  departmentSlug: string;
  departmentLabel: string;
  title: string;
  description: string;
  bannerUrl?: string;
  createdAt: string;
  updatedAt: string;
  questions: FormQuestion[];
}

export interface FormResponse {
  id: string;
  formId: string;
  submittedAt: string;
  answers: Record<string, any>;
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

export const INITIAL_DEFAULT_FORMS: CustomForm[] = [
  {
    id: "emergency-triage-assessment",
    departmentSlug: "emergency-corridor",
    departmentLabel: "Emergency Corridor",
    title: "Emergency Corridor Triage & Assessment Form",
    description:
      "Official rapid clinical triage, vitals screening, and priority category assignment at ALERT Comprehensive Specialized Hospital.",
    bannerUrl: "linear-gradient(135deg, #0f766e 0%, #14b8a6 50%, #0d9488 100%)",
    createdAt: "2026-09-10T08:30:00.000Z",
    updatedAt: "2026-09-14T11:00:00.000Z",
    questions: [
      {
        id: "q-name",
        title: "Patient Full Name",
        type: "text",
        required: true,
        options: [],
        placeholder: "e.g. Abebe Kebede",
      },
      {
        id: "q-mrn",
        title: "Medical Record Number (MRN / ID)",
        type: "text",
        required: true,
        options: [],
        placeholder: "e.g. EC-2026-0482",
      },
      {
        id: "q-age-gender",
        title: "Age & Gender",
        type: "text",
        required: true,
        options: [],
        placeholder: "e.g. 38, Male",
      },
      {
        id: "q-triage-cat",
        title: "Triage Urgency Category",
        type: "multiple_choice",
        required: true,
        options: [
          "Red - Resuscitation (Immediate life-threat)",
          "Orange - Very Urgent (Within 10 mins)",
          "Yellow - Urgent (Within 60 mins)",
          "Green - Standard / Non-Urgent (Within 120 mins)",
        ],
      },
      {
        id: "q-vitals",
        title: "Current Vital Signs (BP, HR, RR, SpO2, Temp)",
        type: "paragraph",
        required: true,
        options: [],
        placeholder: "BP: 125/82 mmHg | Pulse: 86 bpm | SpO2: 97% | Temp: 37.0°C | RR: 16/min",
      },
      {
        id: "q-symptoms",
        title: "Presenting Red-Flag Symptoms & Alerts",
        type: "checkboxes",
        required: false,
        options: [
          "Severe chest pain / suspected acute coronary",
          "High-energy trauma / severe open fracture",
          "Acute respiratory distress / stridor",
          "Sudden neurological deficit / FAST+ stroke signs",
          "Active massive hemorrhage",
          "Severe altered mental status (GCS < 13)",
        ],
      },
      {
        id: "q-bay",
        title: "Assigned Emergency Corridor Bay",
        type: "dropdown",
        required: true,
        options: [
          "Resuscitation Bay 1",
          "Resuscitation Bay 2",
          "Acute Corridor Bay A",
          "Acute Corridor Bay B",
          "Rapid Triage Holding",
          "Observation Lounge",
        ],
      },
      {
        id: "q-urgency-score",
        title: "Clinical Urgency Rating (1 = Low, 5 = Critical)",
        type: "rating",
        required: true,
        options: [],
      },
    ],
  },
  {
    id: "corridor-handover-checklist",
    departmentSlug: "emergency-corridor",
    departmentLabel: "Emergency Corridor",
    title: "Corridor Bed Handover & Safety Checklist",
    description:
      "Nurse and resident handover checklist for patient status and pending orders in the emergency corridor.",
    bannerUrl: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 60%, #2563eb 100%)",
    createdAt: "2026-09-12T14:15:00.000Z",
    updatedAt: "2026-09-15T09:20:00.000Z",
    questions: [
      {
        id: "q-handover-staff",
        title: "Handover Clinician / Nurse",
        type: "text",
        required: true,
        options: [],
        placeholder: "Staff name and credential",
      },
      {
        id: "q-dest-ward",
        title: "Designated Transfer Destination",
        type: "dropdown",
        required: true,
        options: [
          "Surgical Inpatient Ward",
          "Medical Inpatient Ward",
          "Intensive Care Unit (ICU)",
          "Trauma Operating Room",
          "Discharged with Prescription",
        ],
      },
      {
        id: "q-pending-orders",
        title: "Pending Diagnostic Tests / Actions",
        type: "checkboxes",
        required: false,
        options: [
          "Cross-match & blood unit reservation",
          "Stat CT Scan abdomen / chest",
          "Electrolyte & arterial blood gas panel",
          "Emergency orthopedic consult",
        ],
      },
      {
        id: "q-notes",
        title: "Handover Clinical Notes & Precautions",
        type: "paragraph",
        required: true,
        options: [],
        placeholder: "Detail patient stability, IV access, medications administered...",
      },
    ],
  },
];
