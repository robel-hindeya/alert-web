import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Trash2,
  Copy,
  Eye,
  ArrowUp,
  ArrowDown,
  Type,
  AlignLeft,
  CircleDot,
  CheckSquare,
  ListFilter,
  X,
  FileCheck2,
  Image as ImageIcon,
  Upload,
  Palette,
  Sparkles,
} from "lucide-react";
import {
  CustomForm,
  FormQuestion,
  QuestionType,
  saveForm,
} from "@/lib/form-store";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

interface FormBuilderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  departmentSlug: string;
  departmentLabel: string;
  initialForm?: CustomForm | null;
  onSaved?: (form: CustomForm) => void;
}

const SUPPORTED_QUESTION_TYPES: Array<{
  type: QuestionType;
  label: string;
  desc: string;
  icon: React.ElementType;
}> = [
  {
    type: "text",
    label: "Short Answer",
    desc: "Single line response for patient name, MRN, phone, vitals",
    icon: Type,
  },
  {
    type: "paragraph",
    label: "Paragraph",
    desc: "Multi-line text for clinical notes, history, observations",
    icon: AlignLeft,
  },
  {
    type: "multiple_choice",
    label: "Multiple Choice",
    desc: "Radio options for selecting exactly one choice",
    icon: CircleDot,
  },
  {
    type: "checkboxes",
    label: "Checkboxes",
    desc: "Square checkboxes for selecting multiple options or symptoms",
    icon: CheckSquare,
  },
  {
    type: "dropdown",
    label: "Dropdown",
    desc: "Select dropdown menu for lists, bays, transfer wards",
    icon: ListFilter,
  },
];

const BANNER_PRESETS = [
  {
    id: "teal-clinical",
    label: "Emergency Teal",
    gradient: "linear-gradient(135deg, #0f766e 0%, #14b8a6 50%, #0d9488 100%)",
  },
  {
    id: "ambulance-red",
    label: "Corridor Urgent",
    gradient: "linear-gradient(135deg, #991b1b 0%, #ef4444 60%, #b91c1c 100%)",
  },
  {
    id: "indigo-care",
    label: "ALERT Clinical",
    gradient: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 60%, #2563eb 100%)",
  },
  {
    id: "amber-triage",
    label: "Rapid Triage",
    gradient: "linear-gradient(135deg, #78350f 0%, #f59e0b 60%, #d97706 100%)",
  },
];

export function FormBuilderDialog({
  open,
  onOpenChange,
  departmentSlug,
  departmentLabel,
  initialForm,
  onSaved,
}: FormBuilderDialogProps) {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [bannerUrl, setBannerUrl] = useState<string>("");
  const [questions, setQuestions] = useState<FormQuestion[]>([]);
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const [showTypeSelector, setShowTypeSelector] = useState(false);

  // Initialize or reset form on dialog open
  useEffect(() => {
    if (open) {
      if (initialForm) {
        setTitle(initialForm.title);
        setDescription(initialForm.description || "");
        setBannerUrl(initialForm.bannerUrl || "");
        setQuestions(JSON.parse(JSON.stringify(initialForm.questions || [])));
        setActiveQuestionId(initialForm.questions?.[0]?.id || null);
        setShowTypeSelector(false);
      } else {
        // CLEAN INITIAL SCREEN: Empty questions, clear title, banner
        setTitle(`New ${departmentLabel} Form`);
        setDescription("");
        setBannerUrl(BANNER_PRESETS[0]?.gradient || "");
        setQuestions([]); // Empty initial screen as requested
        setActiveQuestionId(null);
        setShowTypeSelector(false);
      }
    }
  }, [open, initialForm, departmentLabel]);

  // Handle banner image upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file (JPG, PNG, WebP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file is too large. Please select an image under 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setBannerUrl(reader.result);
        toast.success("Banner image uploaded!");
      }
    };
    reader.readAsDataURL(file);
  };

  // Add question with chosen type
  const handleAddQuestion = (type: QuestionType) => {
    const newId = `q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const isChoiceType =
      type === "multiple_choice" || type === "checkboxes" || type === "dropdown";

    const newQuestion: FormQuestion = {
      id: newId,
      title: "",
      type,
      required: false,
      options: isChoiceType ? ["Option 1", "Option 2"] : [],
      placeholder: "",
    };

    setQuestions((prev) => [...prev, newQuestion]);
    setActiveQuestionId(newId);
    setShowTypeSelector(false);
    toast.success(`Added ${SUPPORTED_QUESTION_TYPES.find((t) => t.type === type)?.label || "question"}`);
  };

  // Update question
  const updateQuestion = (id: string, updates: Partial<FormQuestion>) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== id) return q;
        const updated = { ...q, ...updates };

        // Ensure default options if changing to choice types
        if (
          updates.type &&
          (updates.type === "multiple_choice" ||
            updates.type === "checkboxes" ||
            updates.type === "dropdown") &&
          (!updated.options || updated.options.length === 0)
        ) {
          updated.options = ["Option 1", "Option 2"];
        }

        return updated;
      })
    );
  };

  // Duplicate question
  const duplicateQuestion = (id: string) => {
    const target = questions.find((q) => q.id === id);
    if (!target) return;
    const clone: FormQuestion = {
      ...JSON.parse(JSON.stringify(target)),
      id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: `${target.title || "Untitled Question"} (Copy)`,
    };
    const index = questions.findIndex((q) => q.id === id);
    const updated = [...questions];
    updated.splice(index + 1, 0, clone);
    setQuestions(updated);
    setActiveQuestionId(clone.id);
    toast.success("Question duplicated");
  };

  // Delete question
  const deleteQuestion = (id: string) => {
    const updated = questions.filter((q) => q.id !== id);
    setQuestions(updated);
    if (activeQuestionId === id) {
      setActiveQuestionId(updated[0]?.id || null);
    }
    toast.info("Question deleted");
  };

  // Reorder question
  const moveQuestion = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= questions.length) return;
    const updated = [...questions];
    const temp = updated[index];
    const target = updated[newIndex];
    if (temp && target) {
      updated[index] = target;
      updated[newIndex] = temp;
      setQuestions(updated);
    }
  };

  // Options handling
  const addOption = (questionId: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q;
        const currentOptions = q.options || [];
        return {
          ...q,
          options: [...currentOptions, `Option ${currentOptions.length + 1}`],
        };
      })
    );
  };

  const updateOption = (questionId: string, optIndex: number, val: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q;
        const opts = [...(q.options || [])];
        opts[optIndex] = val;
        return { ...q, options: opts };
      })
    );
  };

  const removeOption = (questionId: string, optIndex: number) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q;
        const opts = (q.options || []).filter((_, i) => i !== optIndex);
        return { ...q, options: opts.length > 0 ? opts : ["Option 1"] };
      })
    );
  };

  // Build full form object
  const buildFormObject = (): CustomForm => {
    const formId =
      initialForm?.id ||
      `frm-${title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") || "form"}-${Date.now().toString(36)}`;

    return {
      id: formId,
      departmentSlug,
      departmentLabel,
      title: title.trim() || `Untitled ${departmentLabel} Form`,
      description: description.trim(),
      ...(bannerUrl ? { bannerUrl } : {}),
      createdAt: initialForm?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      questions: questions.map((q, idx) => ({
        ...q,
        title: q.title.trim() || `Question ${idx + 1}`,
      })),
    };
  };

  const handleSave = () => {
    if (!title.trim()) {
      toast.error("Please enter a Form Title before saving.");
      return;
    }
    const form = buildFormObject();
    saveForm(form);
    if (onSaved) onSaved(form);
    toast.success("Form saved successfully to database!");
    onOpenChange(false);
  };

  const handleSaveAndView = () => {
    if (!title.trim()) {
      toast.error("Please enter a Form Title before saving.");
      return;
    }
    const form = buildFormObject();
    saveForm(form);
    if (onSaved) onSaved(form);
    toast.success("Form saved! Opening public view...");
    onOpenChange(false);
    navigate({
      to: "/forms/$formId",
      params: { formId: form.id },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[94vh] w-[calc(100vw-1rem)] sm:w-full max-w-4xl overflow-hidden p-0 flex flex-col sm:rounded-2xl border-border bg-background shadow-2xl">
        {/* Top Google Forms Decorative Accent Line */}
        <div className="h-2 w-full bg-gradient-to-r from-primary via-emerald-600 to-teal-500 shrink-0" />

        {/* Builder Top Bar */}
        <div className="border-b border-border px-3.5 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between gap-2 sm:gap-4 shrink-0 bg-card/80 backdrop-blur-sm pr-12 sm:pr-14">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] sm:text-xs font-semibold text-primary truncate max-w-[120px] sm:max-w-none">
                {departmentLabel}
              </span>
              <span className="text-[11px] sm:text-xs text-muted-foreground hidden sm:flex items-center gap-1">
                <Sparkles className="size-3 text-primary" /> Google Forms Builder
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-foreground truncate mt-0.5">
              {initialForm ? `Edit: ${initialForm.title}` : `Create ${departmentLabel} Form`}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSaveAndView}
              className="gap-1 sm:gap-1.5 border-primary/30 text-primary hover:bg-primary/10 font-medium px-2 sm:px-3 text-xs"
              title="Save changes and open public form view"
            >
              <Eye className="size-3.5 sm:size-4" />
              <span className="hidden sm:inline">Save & View</span>
              <span className="sm:hidden">View</span>
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              className="gap-1 sm:gap-1.5 font-semibold shadow-sm bg-primary text-primary-foreground hover:bg-primary/90 px-2.5 sm:px-3 text-xs"
            >
              <FileCheck2 className="size-3.5 sm:size-4" />
              <span className="hidden sm:inline">Save Form</span>
              <span className="sm:hidden">Save</span>
            </Button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6 bg-muted/25">
          {/* ============================================================ */}
          {/* 1. FORM HEADER: BANNER + ONE FORM TITLE BOX */}
          {/* ============================================================ */}
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden transition-all">
            {/* Banner Area */}
            <div className="relative group">
              {bannerUrl ? (
                <div
                  className="h-32 sm:h-40 w-full transition-all bg-cover bg-center flex items-end p-4 relative"
                  style={{
                    background: bannerUrl.startsWith("data:") || bannerUrl.startsWith("http")
                      ? `url("${bannerUrl}") center/cover no-repeat`
                      : bannerUrl,
                  }}
                >
                  <div className="absolute inset-0 bg-black/20" />
                  <div className="relative z-10 flex items-center justify-between w-full">
                    <span className="rounded-md bg-black/50 backdrop-blur-md px-2.5 py-1 text-xs font-semibold text-white">
                      Form Header Banner
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => fileInputRef.current?.click()}
                        className="h-8 gap-1.5 text-xs bg-white/90 text-foreground hover:bg-white shadow-sm"
                      >
                        <Upload className="size-3.5" />
                        Change Image
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => setBannerUrl("")}
                        className="h-8 size-8 p-0"
                        title="Remove banner"
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border-b border-dashed border-border/80 bg-muted/30 p-4 text-center">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-left">
                      <ImageIcon className="size-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs font-semibold text-foreground">Form Banner / Header Image</p>
                        <p className="text-[11px] text-muted-foreground">
                          Add a hospital header image or select a clinical gradient
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="h-8 gap-1.5 text-xs"
                      >
                        <Upload className="size-3.5" />
                        Upload Image
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Banner Preset Selector */}
            <div className="px-6 py-2.5 bg-muted/40 border-b border-border flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="flex items-center gap-1.5 font-medium text-muted-foreground">
                <Palette className="size-3.5 text-primary" /> Header Theme:
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                {BANNER_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setBannerUrl(preset.gradient)}
                    className="group flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-foreground hover:border-primary transition-all shadow-xs"
                  >
                    <span
                      className="size-3 rounded-full shrink-0"
                      style={{ background: preset.gradient }}
                    />
                    <span>{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* FORM TITLE BOX */}
            <div className="p-6 sm:p-7 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="form-title" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Form Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="form-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Emergency Corridor Triage & Assessment Form"
                  className="text-xl sm:text-2xl font-bold h-12 border-b-2 border-t-0 border-x-0 rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary text-foreground"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="form-desc" className="text-xs font-medium text-muted-foreground">
                  Description / Instructions (Optional)
                </Label>
                <Textarea
                  id="form-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain instructions, clinical guidelines, or criteria for this form..."
                  rows={2}
                  className="resize-none border-border focus-visible:ring-primary text-sm"
                />
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* 2. QUESTIONS LIST */}
          {/* ============================================================ */}
          {questions.length === 0 ? (
            /* Clean initial screen state with NO questions */
            <div className="rounded-2xl border-2 border-dashed border-border bg-card/60 p-10 text-center space-y-4">
              <div className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary mx-auto">
                <Plus className="size-7" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="text-base font-bold text-foreground">No questions yet</h3>
                <p className="text-xs text-muted-foreground">
                  Start designing your form. Click the button below to choose a question type and add your first question.
                </p>
              </div>

              <div className="pt-2">
                <Button
                  type="button"
                  size="lg"
                  onClick={() => setShowTypeSelector(true)}
                  className="gap-2 px-6 font-semibold shadow-md bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Plus className="size-5" />
                  Add First Question
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((q, index) => {
                const isActive = activeQuestionId === q.id;
                const typeObj =
                  SUPPORTED_QUESTION_TYPES.find((t) => t.type === q.type) ||
                  SUPPORTED_QUESTION_TYPES[0];
                const TypeIcon = typeObj?.icon || Type;

                return (
                  <div
                    key={q.id}
                    onClick={() => setActiveQuestionId(q.id)}
                    className={`relative rounded-2xl border bg-card p-5 sm:p-6 transition-all duration-200 shadow-sm ${
                      isActive
                        ? "border-primary ring-2 ring-primary/20 shadow-md"
                        : "border-border hover:border-border/80"
                    }`}
                  >
                    {/* Active Question Left Color Indicator (Google Forms Style) */}
                    {isActive && (
                      <div className="absolute left-0 top-4 bottom-4 w-1.5 bg-primary rounded-r-full" />
                    )}

                    {/* Question Header: Title & Question-Type Selector */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <div className="flex items-center gap-2.5 flex-1 w-full">
                        <span className="grid size-7 place-items-center rounded-lg bg-primary/10 text-xs font-bold text-primary shrink-0">
                          {index + 1}
                        </span>
                        <Input
                          value={q.title}
                          onChange={(e) => updateQuestion(q.id, { title: e.target.value })}
                          placeholder="Enter question text (e.g. Patient Blood Pressure, Triage Urgency Category)"
                          className="font-medium text-foreground text-base h-11 border-border focus-visible:ring-primary flex-1"
                        />
                      </div>

                      {/* Question Type Switcher Dropdown */}
                      <div className="w-full sm:w-56 shrink-0">
                        <Select
                          value={q.type}
                          onValueChange={(val: QuestionType) => updateQuestion(q.id, { type: val })}
                        >
                          <SelectTrigger className="h-11 border-border bg-background">
                            <div className="flex items-center gap-2 truncate">
                              <TypeIcon className="size-4 text-primary shrink-0" />
                              <SelectValue />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            {SUPPORTED_QUESTION_TYPES.map((t) => {
                              const ItemIcon = t.icon;
                              return (
                                <SelectItem key={t.type} value={t.type} className="cursor-pointer py-2">
                                  <div className="flex items-center gap-2">
                                    <ItemIcon className="size-4 text-primary shrink-0" />
                                    <div>
                                      <p className="text-sm font-medium">{t.label}</p>
                                    </div>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Question Type Specific Body */}
                    <div className="mt-5 pt-4 border-t border-border/60">
                      {/* Short Answer */}
                      {q.type === "text" && (
                        <div className="w-full sm:w-2/3">
                          <Input
                            disabled
                            placeholder="Short-answer text"
                            className="bg-muted/30 border-b border-t-0 border-x-0 rounded-none px-0 text-muted-foreground text-sm cursor-not-allowed"
                          />
                        </div>
                      )}

                      {/* Paragraph */}
                      {q.type === "paragraph" && (
                        <div className="w-full">
                          <Textarea
                            disabled
                            placeholder="Long-answer multi-line paragraph text"
                            rows={2}
                            className="bg-muted/30 border-dashed text-muted-foreground text-sm cursor-not-allowed resize-none"
                          />
                        </div>
                      )}

                      {/* Multiple Choice (Radio) */}
                      {q.type === "multiple_choice" && (
                        <div className="space-y-2.5">
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Multiple Choice Options (Select one):
                          </p>
                          {q.options?.map((opt, optIdx) => (
                            <div key={optIdx} className="flex items-center gap-3">
                              <CircleDot className="size-4 text-muted-foreground shrink-0" />
                              <Input
                                value={opt}
                                onChange={(e) => updateOption(q.id, optIdx, e.target.value)}
                                placeholder={`Option ${optIdx + 1}`}
                                className="h-9 text-sm max-w-md border-border focus-visible:ring-primary"
                              />
                              {q.options && q.options.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeOption(q.id, optIdx)}
                                  className="text-muted-foreground hover:text-destructive p-1 rounded-md transition-colors"
                                  title="Delete option"
                                >
                                  <X className="size-4" />
                                </button>
                              )}
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => addOption(q.id)}
                            className="text-xs text-primary hover:text-primary hover:bg-primary/10 gap-1.5 mt-1"
                          >
                            <Plus className="size-3.5" />
                            Add option
                          </Button>
                        </div>
                      )}

                      {/* Checkboxes */}
                      {q.type === "checkboxes" && (
                        <div className="space-y-2.5">
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Checkboxes (Select multiple):
                          </p>
                          {q.options?.map((opt, optIdx) => (
                            <div key={optIdx} className="flex items-center gap-3">
                              <CheckSquare className="size-4 text-muted-foreground shrink-0" />
                              <Input
                                value={opt}
                                onChange={(e) => updateOption(q.id, optIdx, e.target.value)}
                                placeholder={`Option ${optIdx + 1}`}
                                className="h-9 text-sm max-w-md border-border focus-visible:ring-primary"
                              />
                              {q.options && q.options.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeOption(q.id, optIdx)}
                                  className="text-muted-foreground hover:text-destructive p-1 rounded-md transition-colors"
                                  title="Delete option"
                                >
                                  <X className="size-4" />
                                </button>
                              )}
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => addOption(q.id)}
                            className="text-xs text-primary hover:text-primary hover:bg-primary/10 gap-1.5 mt-1"
                          >
                            <Plus className="size-3.5" />
                            Add option
                          </Button>
                        </div>
                      )}

                      {/* Dropdown */}
                      {q.type === "dropdown" && (
                        <div className="space-y-2.5">
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Dropdown Choices (List menu):
                          </p>
                          {q.options?.map((opt, optIdx) => (
                            <div key={optIdx} className="flex items-center gap-3">
                              <span className="text-xs font-mono text-muted-foreground w-5 text-right">
                                {optIdx + 1}.
                              </span>
                              <Input
                                value={opt}
                                onChange={(e) => updateOption(q.id, optIdx, e.target.value)}
                                placeholder={`Choice ${optIdx + 1}`}
                                className="h-9 text-sm max-w-md border-border focus-visible:ring-primary"
                              />
                              {q.options && q.options.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeOption(q.id, optIdx)}
                                  className="text-muted-foreground hover:text-destructive p-1 rounded-md transition-colors"
                                  title="Delete choice"
                                >
                                  <X className="size-4" />
                                </button>
                              )}
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => addOption(q.id)}
                            className="text-xs text-primary hover:text-primary hover:bg-primary/10 gap-1.5 mt-1"
                          >
                            <Plus className="size-3.5" />
                            Add choice
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Question Bottom Action Bar (Google Forms Style) */}
                    <div className="mt-5 pt-3.5 border-t border-border flex flex-wrap items-center justify-between gap-3">
                      {/* Move Up / Move Down */}
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveQuestion(index, "up");
                          }}
                          disabled={index === 0}
                          className="size-8 text-muted-foreground hover:text-foreground"
                          title="Move question up"
                        >
                          <ArrowUp className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveQuestion(index, "down");
                          }}
                          disabled={index === questions.length - 1}
                          className="size-8 text-muted-foreground hover:text-foreground"
                          title="Move question down"
                        >
                          <ArrowDown className="size-4" />
                        </Button>
                        <span className="text-xs text-muted-foreground ml-1">
                          Question {index + 1} of {questions.length}
                        </span>
                      </div>

                      {/* Required toggle, Duplicate, Delete */}
                      <div className="flex items-center gap-2.5 sm:gap-4 flex-wrap">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <Label
                            htmlFor={`req-${q.id}`}
                            className="text-xs font-semibold text-foreground cursor-pointer"
                          >
                            Required
                          </Label>
                          <Switch
                            id={`req-${q.id}`}
                            checked={q.required}
                            onCheckedChange={(checked) => updateQuestion(q.id, { required: checked })}
                          />
                        </div>

                        <div className="h-4 w-px bg-border hidden sm:block" />

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            duplicateQuestion(q.id);
                          }}
                          className="size-8 text-muted-foreground hover:text-foreground"
                          title="Duplicate question"
                        >
                          <Copy className="size-4" />
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteQuestion(q.id);
                          }}
                          className="size-8 text-muted-foreground hover:text-destructive"
                          title="Delete question"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ============================================================ */}
          {/* 3. LARGE "+" BUTTON (Always visible for adding more questions) */}
          {/* ============================================================ */}
          <div className="pt-2 pb-6 flex flex-col items-center justify-center gap-3">
            <Button
              type="button"
              size="lg"
              onClick={() => setShowTypeSelector(true)}
              className="gap-2.5 px-6 sm:px-8 py-5 sm:py-6 w-full max-w-xs sm:w-auto rounded-2xl border-2 border-dashed border-primary/50 bg-card hover:bg-primary/5 hover:border-primary text-primary font-bold shadow-sm transition-all text-sm sm:text-base"
            >
              <div className="grid size-6 sm:size-7 place-items-center rounded-full bg-primary text-primary-foreground">
                <Plus className="size-4 sm:size-5" />
              </div>
              Add Question
            </Button>

            {questions.length >= 10 && (
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                ✓ {questions.length} questions configured in this form
              </p>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-border px-3.5 sm:px-6 py-3 sm:py-3.5 flex flex-wrap items-center justify-between gap-2 sm:gap-3 shrink-0 bg-card">
          <p className="text-xs text-muted-foreground">
            {questions.length} {questions.length === 1 ? "question" : "questions"} configured
          </p>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-muted-foreground text-xs"
            >
              Cancel
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSaveAndView}
              className="gap-1 sm:gap-1.5 text-primary border-primary/30 hover:bg-primary/10 font-medium text-xs"
            >
              <Eye className="size-3.5 sm:size-4" />
              <span className="hidden sm:inline">Save & View</span>
              <span className="sm:hidden">View</span>
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              className="gap-1 sm:gap-1.5 font-semibold bg-primary text-primary-foreground hover:bg-primary/90 text-xs"
            >
              <FileCheck2 className="size-3.5 sm:size-4" />
              Save
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* ============================================================ */}
      {/* QUESTION-TYPE SELECTOR DIALOG (Opens when user clicks "+") */}
      {/* ============================================================ */}
      <Dialog open={showTypeSelector} onOpenChange={setShowTypeSelector}>
        <DialogContent className="w-[calc(100vw-1.5rem)] sm:w-full sm:max-w-lg p-0 overflow-hidden sm:rounded-2xl border-border bg-card">
          <div className="p-5 border-b border-border bg-muted/30">
            <h3 className="text-base font-bold text-foreground">Select Question Type</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Choose the question format to add to your form
            </p>
          </div>

          <div className="p-4 grid gap-2.5">
            {SUPPORTED_QUESTION_TYPES.map((item) => {
              const IconComp = item.icon;
              return (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => handleAddQuestion(item.type)}
                  className="flex items-center gap-3.5 rounded-xl border border-border p-3.5 text-left transition-all hover:border-primary hover:bg-primary/5 hover:shadow-sm group"
                >
                  <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                    <IconComp className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                      {item.label}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {item.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="p-3 border-t border-border bg-muted/20 flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowTypeSelector(false)}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
