import { useState, useId } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Printer,
  Share2,
  RotateCcw,
  Building2,
  Check,
  Send,
  HeartPulse,
} from "lucide-react";
import logo from "@/assets/alert-logo.png.asset.json";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useForm,
  saveFormResponse,
  FormQuestion,
  CustomForm,
} from "@/lib/form-store";

export const Route = createFileRoute("/forms/$formId")({
  component: StandaloneFormView,
});

function StandaloneFormView() {
  const { formId } = Route.useParams();
  const dept =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("dept") || undefined
      : undefined;
  const { form, ready } = useForm(formId, dept);
  const navigate = useNavigate();

  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!ready) {
    return (
      <div className="min-h-screen grid place-items-center bg-muted/20 p-4">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Loading form...
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-muted/20 p-6 text-center">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm max-w-md w-full space-y-4">
          <div className="grid size-12 place-items-center rounded-2xl bg-destructive/10 text-destructive mx-auto">
            <AlertCircle className="size-6" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Form Not Found</h1>
          <p className="text-sm text-muted-foreground">
            The requested form does not exist or may have been deleted.
          </p>
          <div className="pt-2">
            <Link
              to="/departments"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <ArrowLeft className="size-4" />
              Return to Departments
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleTextChange = (qId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: value }));
    if (errors[qId]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[qId];
        return next;
      });
    }
  };

  const handleCheckboxChange = (qId: string, option: string, checked: boolean) => {
    setAnswers((prev) => {
      const currentList: string[] = Array.isArray(prev[qId]) ? prev[qId] : [];
      const updated = checked
        ? [...currentList, option]
        : currentList.filter((item) => item !== option);
      return { ...prev, [qId]: updated };
    });
    if (errors[qId]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[qId];
        return next;
      });
    }
  };

  const handleRatingChange = (qId: string, rating: number) => {
    setAnswers((prev) => ({ ...prev, [qId]: rating }));
    if (errors[qId]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[qId];
        return next;
      });
    }
  };

  const handleCopyShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleResetForm = () => {
    setAnswers({});
    setErrors({});
    setIsSubmitted(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required questions
    const newErrors: Record<string, string> = {};
    for (const q of form.questions) {
      if (!q.required) continue;
      const ans = answers[q.id];
      if (
        ans === undefined ||
        ans === null ||
        ans === "" ||
        (Array.isArray(ans) && ans.length === 0)
      ) {
        newErrors[q.id] = "This question is required.";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Scroll to first error
      const firstErrorKey = Object.keys(newErrors)[0];
      const element = document.getElementById(`q-box-${firstErrorKey}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    // Save response
    saveFormResponse(form.id, answers);
    setIsSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const returnPath = form?.departmentSlug
    ? `/departments/${form.departmentSlug}`
    : dept
      ? `/departments/${dept}`
      : "/departments";

  return (
    <div className="min-h-screen bg-secondary/40 py-8 px-4 sm:px-6">
      <div className="mx-auto max-w-2xl space-y-4">
        {/* Hospital Branding Header (matching Login page style) */}
        <div className="flex flex-col items-center text-center pt-2 pb-2">
          <img
            src={logo.url}
            alt="ALERT Comprehensive Specialized Hospital logo"
            className="h-16 w-auto object-contain"
          />
          <p className="mt-1 text-xs font-bold tracking-wider uppercase text-muted-foreground">
            ALERT Comprehensive Specialized Hospital
          </p>
        </div>

        {/* Minimalist Top Bar */}
        <header className="flex items-center justify-between pb-2">
          <Link
            to={returnPath}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors shadow-sm"
          >
            <ArrowLeft className="size-3.5 text-primary" />
            Back to {form.departmentLabel || "Department"}
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyShare}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors shadow-sm"
              title="Copy form link"
            >
              {copiedLink ? (
                <>
                  <Check className="size-3.5 text-success" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="size-3.5" />
                  <span>Share</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors shadow-sm"
              title="Print form"
            >
              <Printer className="size-3.5" />
              <span>Print</span>
            </button>
          </div>
        </header>

        {/* Confirmation State after Submit */}
        {isSubmitted ? (
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-md">
            {/* Top Color Accent */}
            <div className="h-3 w-full bg-gradient-to-r from-success via-emerald-500 to-teal-500" />

            <div className="p-8 sm:p-10 text-center space-y-5">
              <div className="grid size-16 place-items-center rounded-2xl bg-success/15 text-success mx-auto">
                <CheckCircle2 className="size-10" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">
                  Response Recorded
                </h2>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Your submission for <strong>{form.title}</strong> has been recorded and safely stored in ALERT Comprehensive Specialized Hospital records.
                </p>
              </div>

              <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
                <Button
                  type="button"
                  onClick={handleResetForm}
                  variant="outline"
                  className="gap-2"
                >
                  <RotateCcw className="size-4" />
                  Submit another response
                </Button>

                <Link
                  to={returnPath}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  <ArrowLeft className="size-4" />
                  Return to {form.departmentLabel}
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* FORM SUBMISSION VIEW (ONLY FORM) */
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Form Title Card (Google Forms Style) */}
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="h-3 w-full bg-gradient-to-r from-primary via-primary/80 to-primary/60" />

              <div className="p-6 sm:p-7 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                    {form.departmentLabel}
                  </span>
                  <span className="text-xs text-muted-foreground">ALERT Hospital</span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  {form.title}
                </h1>

                {form.description && (
                  <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                    {form.description}
                  </p>
                )}

                <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs text-destructive font-medium">
                  <span>* Indicates required question</span>
                  <span className="text-muted-foreground">
                    {form.questions.length} questions
                  </span>
                </div>
              </div>
            </div>

            {/* Questions List */}
            {form.questions.map((q, idx) => {
              const hasError = !!errors[q.id];
              const value = answers[q.id];

              return (
                <div
                  key={q.id}
                  id={`q-box-${q.id}`}
                  className={`rounded-2xl border bg-card p-6 sm:p-7 transition-all duration-200 shadow-sm ${
                    hasError
                      ? "border-destructive ring-1 ring-destructive/30"
                      : "border-border hover:border-border/80"
                  }`}
                >
                  {/* Question Title & Required Star */}
                  <div className="space-y-1 mb-4">
                    <Label className="text-base font-semibold text-foreground leading-snug flex items-baseline gap-1">
                      <span>{q.title}</span>
                      {q.required && (
                        <span className="text-destructive text-sm font-bold">*</span>
                      )}
                    </Label>
                    {q.description && (
                      <p className="text-xs text-muted-foreground">{q.description}</p>
                    )}
                  </div>

                  {/* Render based on Datatype */}
                  <div className="mt-3">
                    {/* Short Answer Text */}
                    {q.type === "text" && (
                      <Input
                        value={value || ""}
                        onChange={(e) => handleTextChange(q.id, e.target.value)}
                        placeholder={q.placeholder || "Your answer"}
                        className="max-w-xl border-b border-t-0 border-x-0 rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary text-base"
                      />
                    )}

                    {/* Paragraph Long Answer */}
                    {q.type === "paragraph" && (
                      <Textarea
                        value={value || ""}
                        onChange={(e) => handleTextChange(q.id, e.target.value)}
                        placeholder={q.placeholder || "Your answer"}
                        rows={3}
                        className="w-full text-base resize-y border-border focus-visible:ring-primary"
                      />
                    )}

                    {/* Multiple Choice (Radio) */}
                    {q.type === "multiple_choice" && (
                      <RadioGroup
                        value={value || ""}
                        onValueChange={(val) => handleTextChange(q.id, val)}
                        className="space-y-3"
                      >
                        {q.options?.map((opt, optIdx) => (
                          <div key={optIdx} className="flex items-center space-x-3">
                            <RadioGroupItem
                              value={opt}
                              id={`${q.id}-opt-${optIdx}`}
                              className="border-muted-foreground text-primary"
                            />
                            <Label
                              htmlFor={`${q.id}-opt-${optIdx}`}
                              className="text-sm font-normal text-foreground cursor-pointer flex-1 py-0.5"
                            >
                              {opt}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    )}

                    {/* Checkboxes */}
                    {q.type === "checkboxes" && (
                      <div className="space-y-3">
                        {q.options?.map((opt, optIdx) => {
                          const checked =
                            Array.isArray(value) && value.includes(opt);
                          return (
                            <div key={optIdx} className="flex items-center space-x-3">
                              <Checkbox
                                id={`${q.id}-chk-${optIdx}`}
                                checked={checked}
                                onCheckedChange={(c) =>
                                  handleCheckboxChange(q.id, opt, Boolean(c))
                                }
                              />
                              <Label
                                htmlFor={`${q.id}-chk-${optIdx}`}
                                className="text-sm font-normal text-foreground cursor-pointer flex-1 py-0.5"
                              >
                                {opt}
                              </Label>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Dropdown Select */}
                    {q.type === "dropdown" && (
                      <div className="max-w-md">
                        <Select
                          value={value || ""}
                          onValueChange={(val) => handleTextChange(q.id, val)}
                        >
                          <SelectTrigger className="h-11 border-border">
                            <SelectValue placeholder="Choose an option" />
                          </SelectTrigger>
                          <SelectContent>
                            {q.options?.map((opt, optIdx) => (
                              <SelectItem key={optIdx} value={opt}>
                                {opt}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Number */}
                    {q.type === "number" && (
                      <Input
                        type="number"
                        value={value || ""}
                        onChange={(e) => handleTextChange(q.id, e.target.value)}
                        placeholder="Enter a number"
                        className="max-w-xs h-11 border-border"
                      />
                    )}

                    {/* Date */}
                    {q.type === "date" && (
                      <Input
                        type="date"
                        value={value || ""}
                        onChange={(e) => handleTextChange(q.id, e.target.value)}
                        className="max-w-xs h-11 border-border"
                      />
                    )}

                    {/* Time */}
                    {q.type === "time" && (
                      <Input
                        type="time"
                        value={value || ""}
                        onChange={(e) => handleTextChange(q.id, e.target.value)}
                        className="max-w-xs h-11 border-border"
                      />
                    )}

                    {/* Rating Scale (1 to 5) */}
                    {q.type === "rating" && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 sm:gap-3 flex-wrap pt-1">
                          {[1, 2, 3, 4, 5].map((score) => {
                            const isSelected = value === score;
                            return (
                              <button
                                key={score}
                                type="button"
                                onClick={() => handleRatingChange(q.id, score)}
                                className={`size-11 sm:size-12 rounded-xl font-bold text-sm transition-all duration-150 border ${
                                  isSelected
                                    ? "border-primary bg-primary text-primary-foreground shadow-md scale-105"
                                    : "border-border bg-card text-foreground hover:border-primary/50 hover:bg-muted"
                                }`}
                              >
                                {score}
                              </button>
                            );
                          })}
                        </div>
                        <div className="flex items-center justify-between max-w-xs text-[11px] text-muted-foreground pt-1">
                          <span>1 - Low / Mild</span>
                          <span>5 - Critical / Urgent</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Error display */}
                  {hasError && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-destructive font-medium">
                      <AlertCircle className="size-3.5" />
                      {errors[q.id]}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Bottom Form Actions */}
            <div className="flex items-center justify-between pt-2">
              <Button
                type="submit"
                size="lg"
                className="gap-2 px-8 font-semibold shadow-md"
              >
                <Send className="size-4" />
                Submit
              </Button>

              <button
                type="button"
                onClick={handleResetForm}
                className="text-xs text-muted-foreground hover:text-foreground underline transition-colors"
              >
                Clear form
              </button>
            </div>
          </form>
        )}

        {/* Back Link (matching Login page style) */}
        <Link
          to={returnPath}
          className="mt-6 flex items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to {form?.departmentLabel || "Department"}
        </Link>

        {/* Footer */}
        <footer className="text-center py-6 text-xs text-muted-foreground space-y-1">
          <p>ALERT Comprehensive Specialized Hospital · Clinical Records & Forms</p>
          <p className="text-[11px] opacity-75">
            This content is created and maintained within the ALERT Hospital Management System.
          </p>
        </footer>
      </div>
    </div>
  );
}
