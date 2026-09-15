import { useEffect, useState } from "react";

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
  createdAt: string;
  updatedAt: string;
  questions: FormQuestion[];
}

export interface FormResponse {
  id: string;
  formId: string;
  submittedAt: string;
  answers: Record<string, string | string[] | number>;
}

const FORMS_STORAGE_KEY = "alert_hospital_forms";
const RESPONSES_STORAGE_KEY = "alert_hospital_form_responses";

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

const DEPT_LABELS_MAP: Record<string, string> = {
  "emergency-corridor": "Emergency Corridor",
  "inpatient": "Inpatient",
  "mch": "MCH",
  "surgical-service": "Surgical Service",
  "or-cancellation": "OR Cancellation",
  "preoperative-preparation": "Preoperative Preparation",
  "chart-completeness": "Chart Completeness",
  "or-time-stamp": "OR Time-Stamp",
  "opd": "OPD",
  "postoperative-care": "Postoperative Care",
};

export function generateQuestionsForType(
  title: string,
  type: string,
  notes?: string,
): FormQuestion[] {
  const normalizedType = (type || "").toLowerCase();
  const normalizedTitle = (title || "").toLowerCase();

  if (normalizedType.includes("consent") || normalizedTitle.includes("consent")) {
    return [
      {
        id: "q-patient-name",
        title: "Patient Full Legal Name",
        type: "text",
        required: true,
        options: [],
        placeholder: "e.g. Abebech Tadesse",
      },
      {
        id: "q-patient-mrn",
        title: "Medical Record Number (MRN / Patient ID)",
        type: "text",
        required: true,
        options: [],
        placeholder: "e.g. MRN-2026-9912",
      },
      {
        id: "q-age-gender",
        title: "Patient Age & Gender",
        type: "text",
        required: true,
        options: [],
        placeholder: "e.g. 42, Female",
      },
      {
        id: "q-procedure",
        title: "Specific Clinical Procedure / Intervention",
        type: "text",
        required: true,
        options: [],
        placeholder: "e.g. Bedside minor surgical debridement / Central venous catheterization",
      },
      {
        id: "q-clinician",
        title: "Attending / Performing Clinician Name",
        type: "text",
        required: true,
        options: [],
        placeholder: "e.g. Dr. Yonas G.",
      },
      {
        id: "q-affirmations",
        title: "Informed Consent Affirmations",
        type: "checkboxes",
        required: true,
        options: [
          "The proposed treatment/procedure risks, benefits, and reasonable alternatives were clearly explained",
          "The patient or authorized surrogate had the opportunity to ask questions and all were answered",
          "Potential anesthesia requirements and possible complications have been reviewed",
          "Consent is granted voluntarily without coercion",
        ],
      },
      {
        id: "q-consenting-party",
        title: "Consenting Party",
        type: "multiple_choice",
        required: true,
        options: [
          "Patient (Self)",
          "Parent / Legal Guardian",
          "Designated Next of Kin / Health Proxy",
          "Emergency Doctrine (Two-Doctor Emergency Concurrence)",
        ],
      },
      {
        id: "q-signatory-name",
        title: "Consenting Individual Full Legal Name",
        type: "text",
        required: true,
        options: [],
        placeholder: "Full name of person providing consent",
      },
      {
        id: "q-consent-notes",
        title: "Special Directives / Patient Preferences",
        type: "paragraph",
        required: false,
        options: [],
        placeholder: notes || "Any specific limitations, blood product preferences, or patient requests...",
      },
    ];
  }

  if (normalizedType.includes("report") || normalizedTitle.includes("incident")) {
    return [
      {
        id: "q-reporter",
        title: "Reporting Staff Full Name & Designation",
        type: "text",
        required: true,
        options: [],
        placeholder: "e.g. Nurse Sara M. - Senior Staff Nurse",
      },
      {
        id: "q-date-time",
        title: "Incident Date & Approximate Time",
        type: "text",
        required: true,
        options: [],
        placeholder: "e.g. Sep 15, 2026 at 14:30",
      },
      {
        id: "q-mrn",
        title: "Affected Patient Name / MRN (if applicable)",
        type: "text",
        required: false,
        options: [],
        placeholder: "e.g. Patient #P-0897 / Ward Bed 4B",
      },
      {
        id: "q-category",
        title: "Incident Category",
        type: "dropdown",
        required: true,
        options: [
          "Medication Administration Error / Omission",
          "Patient Slip / Fall / Physical Injury",
          "Equipment Malfunction / Power Failure",
          "Delay in Critical Consultation / Transfer",
          "Adverse Drug / Transfusion Reaction",
          "Clinical Documentation / Identification Discrepancy",
          "Infection Control / Sterile Barrier Breach",
          "Security / Staff Workplace Safety Incident",
        ],
      },
      {
        id: "q-severity",
        title: "Incident Severity Level (1 = Near Miss, 5 = Severe Harm)",
        type: "rating",
        required: true,
        options: [],
      },
      {
        id: "q-desc",
        title: "Detailed Chronological Description of Incident",
        type: "paragraph",
        required: true,
        options: [],
        placeholder: "Detail what happened, circumstances, personnel present, and sequence of events...",
      },
      {
        id: "q-action-taken",
        title: "Immediate Clinical & Remedial Actions Taken",
        type: "paragraph",
        required: true,
        options: [],
        placeholder: notes || "Immediate care provided to patient, vital signs reassessed, attending notified...",
      },
      {
        id: "q-follow-up",
        title: "Corrective & Preventative Actions Required",
        type: "checkboxes",
        required: false,
        options: [
          "Department head / Consultant debrief",
          "Biomedical engineering equipment inspection",
          "Pharmacy review and root-cause analysis",
          "Clinical Governance & QA committee review",
          "Unit staff protocol review session",
        ],
      },
    ];
  }

  if (normalizedType.includes("survey") || normalizedTitle.includes("survey")) {
    return [
      {
        id: "q-respondent",
        title: "Respondent Name & Professional Role",
        type: "text",
        required: true,
        options: [],
        placeholder: "e.g. Dr. Alem T. / Attending Physician",
      },
      {
        id: "q-shift",
        title: "Duty Shift Assessed",
        type: "multiple_choice",
        required: true,
        options: ["Morning Shift (08:00 - 16:00)", "Evening Shift (16:00 - 22:00)", "Night Shift (22:00 - 08:00)"],
      },
      {
        id: "q-workflow-score",
        title: "Department Workflow Efficiency Rating (1 = Poor, 5 = Excellent)",
        type: "rating",
        required: true,
        options: [],
      },
      {
        id: "q-resource-score",
        title: "Clinical Supply & Medication Availability (1 = Deficient, 5 = Full)",
        type: "rating",
        required: true,
        options: [],
      },
      {
        id: "q-challenges",
        title: "Key Operational Challenges Encountered",
        type: "checkboxes",
        required: false,
        options: [
          "High patient turnaround / overcrowding",
          "Bed availability / delayed transfer to wards",
          "Laboratory / radiology turnaround delay",
          "Medical supply / PPE shortage",
          "Specialist consultation response delay",
        ],
      },
      {
        id: "q-suggestions",
        title: "Recommendations & Suggestions for Improvement",
        type: "paragraph",
        required: false,
        options: [],
        placeholder: notes || "Please suggest specific actions to optimize patient safety and workflow...",
      },
    ];
  }

  if (normalizedType.includes("assessment") || normalizedTitle.includes("assessment")) {
    return [
      {
        id: "q-assessor",
        title: "Assessing Clinician Name & Title",
        type: "text",
        required: true,
        options: [],
        placeholder: "e.g. Dr. Daniel M. - Resident",
      },
      {
        id: "q-patient-name",
        title: "Patient Full Name",
        type: "text",
        required: true,
        options: [],
        placeholder: "e.g. Abebe Kebede",
      },
      {
        id: "q-mrn",
        title: "Medical Record Number (MRN)",
        type: "text",
        required: true,
        options: [],
        placeholder: "e.g. EC-2026-0814",
      },
      {
        id: "q-triage",
        title: "Clinical Urgency Category",
        type: "multiple_choice",
        required: true,
        options: [
          "Red - Resuscitation / Immediate",
          "Orange - Emergent (Within 15 mins)",
          "Yellow - Urgent (Within 60 mins)",
          "Green - Non-Urgent",
        ],
      },
      {
        id: "q-vitals",
        title: "Vital Signs Summary (BP, Pulse, RR, SpO2, Temp)",
        type: "paragraph",
        required: true,
        options: [],
        placeholder: "e.g. BP: 120/80 mmHg | HR: 78 bpm | SpO2: 98% | Temp: 36.8 C",
      },
      {
        id: "q-urgency",
        title: "Overall Clinical Acuity Rating (1 = Stable, 5 = Critical)",
        type: "rating",
        required: true,
        options: [],
      },
      {
        id: "q-plan",
        title: "Clinical Assessment & Management Plan",
        type: "paragraph",
        required: true,
        options: [],
        placeholder: notes || "Describe clinical evaluation, differential diagnosis, and management steps...",
      },
    ];
  }

  // Default Checklist type (e.g. "Daily audit checklist", "Safety checklist", etc.)
  return [
    {
      id: "q-auditor",
      title: "Auditor / Clinician Name",
      type: "text",
      required: true,
      options: [],
      placeholder: "e.g. Dr. Alem T. / Nurse Betel A.",
    },
    {
      id: "q-shift",
      title: "Duty Shift",
      type: "multiple_choice",
      required: true,
      options: ["Day shift", "Evening shift", "Night shift"],
    },
    {
      id: "q-date",
      title: "Audit / Check Date",
      type: "date",
      required: true,
      options: [],
    },
    {
      id: "q-station",
      title: "Clinical Station / Room Inspected",
      type: "dropdown",
      required: true,
      options: [
        "Triage & Assessment Area",
        "Clinical Treatment Bay 1",
        "Clinical Treatment Bay 2",
        "Resuscitation & Trauma Suite",
        "Medication Preparation & Storage",
        "Clean Supply & Instrument Room",
      ],
    },
    {
      id: "q-checklist",
      title: "Core Safety & Operational Verification Items",
      type: "checkboxes",
      required: true,
      options: [
        "Emergency crash cart inspected, calibrated, and seal intact",
        "Central oxygen lines, cylinders & regulators functional",
        "Hand hygiene dispensers and sanitizer supplies replenished",
        "Patient wristband identification confirmed on all beds",
        "High-alert and restricted medications locked and accounted for",
        "Sharps disposal containers verified below 3/4 fill line",
        "Sterilization and equipment hygiene logs signed and up-to-date",
      ],
    },
    {
      id: "q-cleanliness",
      title: "Overall Area Readiness & Cleanliness (1 = Poor, 5 = Excellent)",
      type: "rating",
      required: true,
      options: [],
    },
    {
      id: "q-observations",
      title: "Observations, Non-Compliances & Corrective Notes",
      type: "paragraph",
      required: false,
      options: [],
      placeholder: notes || "Record any observed deficiencies, equipment defects, or immediate actions taken...",
    },
  ];
}

export function createDefaultFormForId(id: string, deptSlug?: string): CustomForm {
  const slug = deptSlug || "emergency-corridor";
  const label = DEPT_LABELS_MAP[slug] || "Hospital Department";

  let title = "Daily audit checklist";
  let type = "Checklist";
  let desc = `Daily routine operational and clinical audit checklist for ${label} at ALERT Comprehensive Specialized Hospital.`;

  if (id.endsWith("2") || id.toLowerCase().includes("incident") || id.toLowerCase().includes("report")) {
    title = "Incident report";
    type = "Report";
    desc = `Official incident and clinical adverse event reporting record for ${label} at ALERT Comprehensive Specialized Hospital.`;
  } else if (id.endsWith("3") || id.toLowerCase().includes("consent")) {
    title = "Patient consent";
    type = "Consent";
    desc = `Informed clinical procedure and treatment consent authorization for ${label} at ALERT Comprehensive Specialized Hospital.`;
  } else if (id.toLowerCase().includes("survey")) {
    title = "Department Quality Survey";
    type = "Survey";
    desc = `Quality assurance and clinical operational survey for ${label} at ALERT Comprehensive Specialized Hospital.`;
  }

  const questions = generateQuestionsForType(title, type);

  return {
    id,
    departmentSlug: slug,
    departmentLabel: label,
    title,
    description: desc,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    questions,
  };
}

export function saveCustomDepartmentForm(data: {
  id: string;
  departmentSlug: string;
  departmentLabel: string;
  title: string;
  type: string;
  description?: string;
  notes?: string;
}): CustomForm {
  const questions = generateQuestionsForType(data.title, data.type, data.notes);
  const form: CustomForm = {
    id: data.id,
    departmentSlug: data.departmentSlug,
    departmentLabel: data.departmentLabel,
    title: data.title,
    description:
      data.description ||
      data.notes ||
      `Official ${data.type.toLowerCase()} form for ${data.departmentLabel} at ALERT Comprehensive Specialized Hospital.`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    questions,
  };
  saveForm(form);
  return form;
}

export function getAllForms(): CustomForm[] {
  if (typeof window === "undefined") return INITIAL_DEFAULT_FORMS;
  try {
    const raw = window.localStorage.getItem(FORMS_STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(FORMS_STORAGE_KEY, JSON.stringify(INITIAL_DEFAULT_FORMS));
      return INITIAL_DEFAULT_FORMS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      window.localStorage.setItem(FORMS_STORAGE_KEY, JSON.stringify(INITIAL_DEFAULT_FORMS));
      return INITIAL_DEFAULT_FORMS;
    }
    return parsed as CustomForm[];
  } catch {
    return INITIAL_DEFAULT_FORMS;
  }
}

export function getFormsForDepartment(deptSlug: string): CustomForm[] {
  const all = getAllForms();
  return all.filter((f) => f.departmentSlug === deptSlug);
}

export function getFormById(id: string, deptSlug?: string): CustomForm | undefined {
  const all = getAllForms();
  const existing = all.find((f) => f.id === id);
  if (existing) return existing;

  const inDefault = INITIAL_DEFAULT_FORMS.find((f) => f.id === id);
  if (inDefault) return inDefault;

  // Dynamically synthesize and save the form so it is never missing
  const synthesized = createDefaultFormForId(id, deptSlug);
  saveForm(synthesized);
  return synthesized;
}

export function saveForm(form: CustomForm): void {
  if (typeof window === "undefined") return;
  try {
    const all = getAllForms();
    const existingIndex = all.findIndex((f) => f.id === form.id);
    let updated: CustomForm[];
    if (existingIndex >= 0) {
      updated = [...all];
      updated[existingIndex] = {
        ...form,
        updatedAt: new Date().toISOString(),
      };
    } else {
      updated = [
        {
          ...form,
          createdAt: form.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        ...all,
      ];
    }
    window.localStorage.setItem(FORMS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("alert-forms-updated"));
  } catch (err) {
    console.error("Failed to save form to localStorage", err);
  }
}

export function deleteForm(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const all = getAllForms();
    const updated = all.filter((f) => f.id !== id);
    window.localStorage.setItem(FORMS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("alert-forms-updated"));
  } catch (err) {
    console.error("Failed to delete form from localStorage", err);
  }
}

export function saveFormResponse(
  formId: string,
  answers: Record<string, string | string[] | number>,
): FormResponse {
  const response: FormResponse = {
    id: `RESP-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    formId,
    submittedAt: new Date().toISOString(),
    answers,
  };

  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(RESPONSES_STORAGE_KEY);
      const existing: FormResponse[] = raw ? JSON.parse(raw) : [];
      window.localStorage.setItem(
        RESPONSES_STORAGE_KEY,
        JSON.stringify([response, ...existing]),
      );
      window.dispatchEvent(new Event("alert-form-responses-updated"));
    } catch (err) {
      console.error("Failed to save form response", err);
    }
  }

  return response;
}

export function getFormResponses(formId: string): FormResponse[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RESPONSES_STORAGE_KEY);
    if (!raw) return [];
    const list: FormResponse[] = JSON.parse(raw);
    return list.filter((r) => r.formId === formId);
  } catch {
    return [];
  }
}

export function useDepartmentForms(deptSlug: string) {
  const [forms, setForms] = useState<CustomForm[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => {
      setForms(getFormsForDepartment(deptSlug));
      setReady(true);
    };
    sync();

    window.addEventListener("alert-forms-updated", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("alert-forms-updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, [deptSlug]);

  return {
    forms,
    ready,
    save: saveForm,
    remove: deleteForm,
    refresh: () => setForms(getFormsForDepartment(deptSlug)),
  };
}

export function useForm(formId: string, deptSlug?: string) {
  const [form, setForm] = useState<CustomForm | undefined>(() => getFormById(formId, deptSlug));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => {
      setForm(getFormById(formId, deptSlug));
      setReady(true);
    };
    sync();

    window.addEventListener("alert-forms-updated", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("alert-forms-updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, [formId, deptSlug]);

  return { form, ready, refresh: () => setForm(getFormById(formId, deptSlug)) };
}

