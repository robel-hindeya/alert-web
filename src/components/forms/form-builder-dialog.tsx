import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  GripVertical,
  ArrowUp,
  ArrowDown,
  Type,
  AlignLeft,
  CircleDot,
  CheckSquare,
  ListFilter,
  Hash,
  Calendar,
  Clock,
  Star,
  Sparkles,
  X,
  FileCheck2,
} from "lucide-react";
import {
  CustomForm,
  FormQuestion,
  QuestionType,
  QUESTION_TYPE_LABELS,
  saveForm,
} from "@/lib/form-store";
import { useNavigate } from "@tanstack/react-router";

interface FormBuilderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  departmentSlug: string;
  departmentLabel: string;
  initialForm?: CustomForm | null;
  onSaved?: (form: CustomForm) => void;
}

const TYPE_ICONS: Record<QuestionType, React.ElementType> = {
  text: Type,
  paragraph: AlignLeft,
  multiple_choice: CircleDot,
  checkboxes: CheckSquare,
  dropdown: ListFilter,
  number: Hash,
  date: Calendar,
  time: Clock,
  rating: Star,
};

export function FormBuilderDialog({
  open,
  onOpenChange,
  departmentSlug,
  departmentLabel,
  initialForm,
  onSaved,
}: FormBuilderDialogProps) {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<FormQuestion[]>([]);
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (initialForm) {
        setTitle(initialForm.title);
        setDescription(initialForm.description);
        setQuestions(JSON.parse(JSON.stringify(initialForm.questions)));
        setActiveQuestionId(initialForm.questions[0]?.id || null);
      } else {
        const newQ: FormQuestion = {
          id: `q-${Date.now()}-1`,
          title: "Untitled Question",
          type: "text",
          required: false,
          options: ["Option 1"],
          placeholder: "",
        };
        setTitle(`New ${departmentLabel} Form`);
        setDescription("Please fill out this form with accurate information.");
        setQuestions([newQ]);
        setActiveQuestionId(newQ.id);
      }
    }
  }, [open, initialForm, departmentLabel]);

  const addQuestion = (type: QuestionType = "text") => {
    const newId = `q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newQ: FormQuestion = {
      id: newId,
      title: "",
      type,
      required: false,
      options:
        type === "multiple_choice" || type === "checkboxes" || type === "dropdown"
          ? ["Option 1", "Option 2"]
          : [],
      placeholder: "",
    };
    setQuestions((prev) => [...prev, newQ]);
    setActiveQuestionId(newId);
  };

  const updateQuestion = (id: string, updates: Partial<FormQuestion>) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== id) return q;
        const updated = { ...q, ...updates };

        // Ensure default options if changing to choice-based types
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
      }),
    );
  };

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
  };

  const deleteQuestion = (id: string) => {
    if (questions.length <= 1) {
      alert("A form must have at least one question.");
      return;
    }
    const updated = questions.filter((q) => q.id !== id);
    setQuestions(updated);
    if (activeQuestionId === id) {
      setActiveQuestionId(updated[0]?.id || null);
    }
  };

  const moveQuestion = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= questions.length) return;
    const currentQ = questions[index];
    const targetQ = questions[newIndex];
    if (!currentQ || !targetQ) return;
    const updated = [...questions];
    updated[index] = targetQ;
    updated[newIndex] = currentQ;
    setQuestions(updated);
  };

  const addOption = (questionId: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q;
        const currentOptions = q.options || [];
        return {
          ...q,
          options: [...currentOptions, `Option ${currentOptions.length + 1}`],
        };
      }),
    );
  };

  const updateOption = (questionId: string, optIndex: number, val: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q;
        const opts = [...(q.options || [])];
        opts[optIndex] = val;
        return { ...q, options: opts };
      }),
    );
  };

  const removeOption = (questionId: string, optIndex: number) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q;
        const opts = (q.options || []).filter((_, i) => i !== optIndex);
        return { ...q, options: opts.length > 0 ? opts : ["Option 1"] };
      }),
    );
  };

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
      createdAt: initialForm?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      questions: questions.map((q, idx) => ({
        ...q,
        title: q.title.trim() || `Question ${idx + 1}`,
      })),
    };
  };

  const handleSave = () => {
    const form = buildFormObject();
    saveForm(form);
    if (onSaved) onSaved(form);
    onOpenChange(false);
  };

  const handleSaveAndView = () => {
    const form = buildFormObject();
    saveForm(form);
    if (onSaved) onSaved(form);
    onOpenChange(false);
    navigate({
      to: "/forms/$formId",
      params: { formId: form.id },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-hidden p-0 flex flex-col sm:rounded-2xl border-border bg-background shadow-2xl">
        {/* Google Forms Top Color Bar */}
        <div className="h-2.5 w-full bg-gradient-to-r from-primary via-primary/80 to-primary/60 shrink-0" />

        {/* Modal Header */}
        <div className="border-b border-border px-6 py-4 flex items-center justify-between gap-4 shrink-0 bg-card/50">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                {departmentLabel}
              </span>
              <span className="text-xs text-muted-foreground">Google Form Builder</span>
            </div>
            <h2 className="text-lg font-bold text-foreground truncate mt-1">
              {initialForm ? "Edit Department Form" : "Create New Custom Form"}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSaveAndView}
              className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
              title="Save and view standalone form"
            >
              <Eye className="size-4" />
              <span className="hidden sm:inline">Save & View Form</span>
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              className="gap-1.5 font-semibold shadow-sm"
            >
              <FileCheck2 className="size-4" />
              Save Form
            </Button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 bg-muted/20">
          {/* Form Header Card */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="form-title" className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                Form Title
              </Label>
              <Input
                id="form-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Emergency Corridor Triage & Assessment Form"
                className="text-lg font-bold h-11 border-border focus-visible:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="form-desc" className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                Form Description / Instructions
              </Label>
              <Textarea
                id="form-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the purpose of this form, clinical guidelines, or instructions for staff..."
                rows={2}
                className="resize-none border-border focus-visible:ring-primary text-sm"
              />
            </div>
          </div>

          {/* Question Cards List */}
          <div className="space-y-4">
            {questions.map((q, index) => {
              const isActive = activeQuestionId === q.id;
              const TypeIcon = TYPE_ICONS[q.type] || Type;

              return (
                <div
                  key={q.id}
                  onClick={() => setActiveQuestionId(q.id)}
                  className={`relative rounded-xl border transition-all duration-200 bg-card p-5 shadow-sm ${
                    isActive
                      ? "border-primary ring-2 ring-primary/20 shadow-md"
                      : "border-border hover:border-border/80"
                  }`}
                >
                  {/* Left accent indicator for active question */}
                  {isActive && (
                    <div className="absolute left-0 top-3 bottom-3 w-1.5 bg-primary rounded-r-full" />
                  )}

                  {/* Top Question Row: Title + Datatype Selector */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="flex items-center gap-2 flex-1 w-full">
                      <span className="grid size-6 place-items-center rounded-md bg-muted text-xs font-bold text-muted-foreground shrink-0">
                        {index + 1}
                      </span>
                      <Input
                        value={q.title}
                        onChange={(e) => updateQuestion(q.id, { title: e.target.value })}
                        placeholder="Question title (e.g. Patient Blood Pressure, Chief Complaint, Urgency Category)"
                        className="font-medium text-foreground h-10 border-border focus-visible:ring-primary flex-1"
                      />
                    </div>

                    {/* Datatype Select */}
                    <div className="w-full sm:w-56 shrink-0">
                      <Select
                        value={q.type}
                        onValueChange={(val: QuestionType) => updateQuestion(q.id, { type: val })}
                      >
                        <SelectTrigger className="h-10 border-border bg-background">
                          <div className="flex items-center gap-2 truncate">
                            <TypeIcon className="size-4 text-primary shrink-0" />
                            <SelectValue placeholder="Choose datatype" />
                          </div>
                        </SelectTrigger>
                        <SelectContent className="max-h-80">
                          {Object.entries(QUESTION_TYPE_LABELS).map(([key, item]) => {
                            const IconComp = TYPE_ICONS[key as QuestionType] || Type;
                            return (
                              <SelectItem key={key} value={key} className="cursor-pointer py-2">
                                <div className="flex items-center gap-2">
                                  <IconComp className="size-4 text-primary shrink-0" />
                                  <div>
                                    <p className="text-sm font-medium">{item.label}</p>
                                    <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                                  </div>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Question Content based on Datatype */}
                  <div className="mt-4 pt-3 border-t border-border/60">
                    {/* Short text preview */}
                    {q.type === "text" && (
                      <div className="w-full sm:w-2/3">
                        <Input
                          disabled
                          placeholder="Short-answer text field preview"
                          className="bg-muted/40 border-dashed text-muted-foreground text-sm cursor-not-allowed"
                        />
                      </div>
                    )}

                    {/* Paragraph preview */}
                    {q.type === "paragraph" && (
                      <div className="w-full">
                        <Textarea
                          disabled
                          placeholder="Long-answer multi-line paragraph text preview"
                          rows={2}
                          className="bg-muted/40 border-dashed text-muted-foreground text-sm cursor-not-allowed resize-none"
                        />
                      </div>
                    )}

                    {/* Multiple choice options */}
                    {q.type === "multiple_choice" && (
                      <div className="space-y-2.5">
                        <p className="text-xs font-medium text-muted-foreground">
                          Radio options (Single answer selection):
                        </p>
                        {q.options?.map((opt, optIdx) => (
                          <div key={optIdx} className="flex items-center gap-2.5">
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
                                title="Remove option"
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

                    {/* Checkboxes options */}
                    {q.type === "checkboxes" && (
                      <div className="space-y-2.5">
                        <p className="text-xs font-medium text-muted-foreground">
                          Checkboxes (Multiple answers selection):
                        </p>
                        {q.options?.map((opt, optIdx) => (
                          <div key={optIdx} className="flex items-center gap-2.5">
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
                                title="Remove option"
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

                    {/* Dropdown options */}
                    {q.type === "dropdown" && (
                      <div className="space-y-2.5">
                        <p className="text-xs font-medium text-muted-foreground">
                          Dropdown choices (List menu):
                        </p>
                        {q.options?.map((opt, optIdx) => (
                          <div key={optIdx} className="flex items-center gap-2.5">
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
                                title="Remove option"
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

                    {/* Number preview */}
                    {q.type === "number" && (
                      <div className="w-48">
                        <Input
                          disabled
                          type="number"
                          placeholder="00"
                          className="bg-muted/40 border-dashed text-muted-foreground text-sm cursor-not-allowed"
                        />
                      </div>
                    )}

                    {/* Date preview */}
                    {q.type === "date" && (
                      <div className="w-56">
                        <Input
                          disabled
                          type="date"
                          className="bg-muted/40 border-dashed text-muted-foreground text-sm cursor-not-allowed"
                        />
                      </div>
                    )}

                    {/* Time preview */}
                    {q.type === "time" && (
                      <div className="w-48">
                        <Input
                          disabled
                          type="time"
                          className="bg-muted/40 border-dashed text-muted-foreground text-sm cursor-not-allowed"
                        />
                      </div>
                    )}

                    {/* Rating preview */}
                    {q.type === "rating" && (
                      <div className="flex items-center gap-2 py-1">
                        {[1, 2, 3, 4, 5].map((num) => (
                          <div
                            key={num}
                            className="size-9 rounded-lg border border-border bg-muted/40 grid place-items-center text-xs font-semibold text-muted-foreground"
                          >
                            {num}
                          </div>
                        ))}
                        <span className="text-xs text-muted-foreground ml-2">Scale (1 to 5)</span>
                      </div>
                    )}
                  </div>

                  {/* Question Footer Actions (Google Forms style) */}
                  <div className="mt-4 pt-3 border-t border-border flex flex-wrap items-center justify-between gap-3">
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
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Required Toggle */}
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`req-${q.id}`} className="text-xs font-medium cursor-pointer">
                          Required
                        </Label>
                        <Switch
                          id={`req-${q.id}`}
                          checked={q.required}
                          onCheckedChange={(checked) => updateQuestion(q.id, { required: checked })}
                        />
                      </div>

                      <div className="h-4 w-px bg-border" />

                      {/* Duplicate */}
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

                      {/* Delete */}
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

          {/* Add Question Floating / Centered Button */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => addQuestion("text")}
              className="gap-2 border-dashed border-primary/40 bg-card hover:bg-primary/5 text-primary font-medium shadow-sm"
            >
              <Plus className="size-4" />
              Add Question
            </Button>

            {/* Quick datatype add buttons */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => addQuestion("multiple_choice")}
              className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
            >
              <CircleDot className="size-3.5 text-primary" />
              + Multiple choice
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => addQuestion("checkboxes")}
              className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
            >
              <CheckSquare className="size-3.5 text-primary" />
              + Checkboxes
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => addQuestion("paragraph")}
              className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
            >
              <AlignLeft className="size-3.5 text-primary" />
              + Paragraph
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => addQuestion("rating")}
              className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
            >
              <Star className="size-3.5 text-primary" />
              + Rating scale
            </Button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-border px-6 py-3.5 flex items-center justify-between gap-3 shrink-0 bg-card">
          <p className="text-xs text-muted-foreground">
            {questions.length} {questions.length === 1 ? "question" : "questions"} configured
          </p>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-muted-foreground"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleSaveAndView}
              className="gap-1.5 text-primary border-primary/30 hover:bg-primary/10"
            >
              <Eye className="size-4" />
              View Form
            </Button>
            <Button type="button" onClick={handleSave} className="gap-1.5 font-semibold">
              <FileCheck2 className="size-4" />
              Save Form
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
