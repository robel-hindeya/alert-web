import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  FileText,
  Plus,
  Eye,
  Pencil,
  Trash2,
  Share2,
  Check,
  ClipboardCheck,
  ArrowRight,
  Sparkles,
  BarChart3,
  Inbox,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useDepartmentForms,
  CustomForm,
  deleteForm,
} from "@/lib/form-store";
import { FormBuilderDialog } from "./form-builder-dialog";
import { FormResponsesDialog } from "./form-responses-dialog";
import { toast } from "sonner";

interface DepartmentFormBoxProps {
  departmentSlug: string;
  departmentLabel: string;
}

export function DepartmentFormBox({
  departmentSlug,
  departmentLabel,
}: DepartmentFormBoxProps) {
  const { forms, refresh } = useDepartmentForms(departmentSlug);

  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingForm, setEditingForm] = useState<CustomForm | null>(null);
  const [responsesForm, setResponsesForm] = useState<CustomForm | null>(null);
  const [responsesOpen, setResponsesOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleOpenCreate = () => {
    setEditingForm(null);
    setBuilderOpen(true);
  };

  const handleOpenEdit = (form: CustomForm) => {
    setEditingForm(form);
    setBuilderOpen(true);
  };

  const handleOpenResponses = (form: CustomForm, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setResponsesForm(form);
    setResponsesOpen(true);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this form and all its responses?")) {
      deleteForm(id);
      refresh();
      toast.success("Form deleted");
    }
  };

  const handleCopyLink = (formId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/forms/${formId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(formId);
    toast.success("Public form link copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <section className="card-soft min-w-0 p-3.5 sm:p-5 space-y-4">
      {/* Box Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-4">
        <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
          <span className="grid size-10 place-items-center rounded-xl bg-primary/12 text-primary shrink-0">
            <ClipboardCheck className="size-5" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-foreground">
                Department Forms & Checklists
              </h2>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary inline-flex items-center gap-1">
                <Sparkles className="size-3" /> Google Form Style
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Build custom intake forms, triage surveys, and audit sheets with custom questions and datatypes
            </p>
          </div>
        </div>

        {/* "Add Form" button */}
        <Button
          type="button"
          onClick={handleOpenCreate}
          size="sm"
          className="gap-1.5 font-semibold shadow-sm bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
        >
          <Plus className="size-4" />
          Add Form
        </Button>
      </div>

      {/* Forms Grid */}
      {forms.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-10 px-4 text-center">
          <p className="text-sm font-medium text-foreground">No forms created yet</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Click &quot;Add Form&quot; to design your first Google Forms-style questionnaire with custom questions and datatypes.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleOpenCreate}
            className="mt-4 gap-1.5 font-medium"
          >
            <Plus className="size-4" />
            Add Form
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {forms.map((form) => {
            const isCopied = copiedId === form.id;

            return (
              <div
                key={form.id}
                className="group relative flex flex-col justify-between rounded-xl border border-border bg-card overflow-hidden transition-all duration-200 hover:border-primary/50 hover:shadow-md"
              >
                {/* Banner accent line / image */}
                {form.bannerUrl ? (
                  <div
                    className="h-14 w-full bg-cover bg-center border-b border-border/40 relative"
                    style={{
                      background: form.bannerUrl.startsWith("data:") || form.bannerUrl.startsWith("http")
                        ? `url("${form.bannerUrl}") center/cover no-repeat`
                        : form.bannerUrl,
                    }}
                  >
                    <div className="absolute inset-0 bg-black/15" />
                  </div>
                ) : (
                  <div className="h-1.5 w-full bg-gradient-to-r from-primary to-teal-500" />
                )}

                {/* Card content */}
                <div className="p-3.5 sm:p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary shrink-0">
                        <FileText className="size-4" />
                      </span>
                      <span className="rounded-md bg-secondary px-2 py-0.5 text-[11px] font-semibold text-secondary-foreground">
                        {form.questions.length} {form.questions.length === 1 ? "question" : "questions"}
                      </span>
                    </div>

                    {/* Action buttons (Responses Button, View Icon, Edit, Share, Delete) */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* RESPONSES BUTTON (Google Forms Style) */}
                      <button
                        type="button"
                        onClick={(e) => handleOpenResponses(form, e)}
                        className="flex h-8 items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-2.5 text-xs font-semibold text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-150 shadow-xs"
                        title="View Google Forms responses dashboard"
                      >
                        <BarChart3 className="size-3.5" />
                        <span>Responses</span>
                      </button>

                      {/* VIEW ICON (Navigates to dedicated page showing ONLY form) */}
                      <Link
                        to="/forms/$formId"
                        params={{ formId: form.id }}
                        className="flex size-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground transition-all duration-150"
                        title="View public form"
                      >
                        <Eye className="size-4" />
                      </Link>

                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(form)}
                        className="grid size-8 place-items-center rounded-lg border border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
                        title="Edit questions in Google Forms builder"
                      >
                        <Pencil className="size-3.5" />
                      </button>

                      {/* Copy Link Button */}
                      <button
                        type="button"
                        onClick={(e) => handleCopyLink(form.id, e)}
                        className="grid size-8 place-items-center rounded-lg border border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
                        title="Copy direct form URL"
                      >
                        {isCopied ? (
                          <Check className="size-3.5 text-success" />
                        ) : (
                          <Share2 className="size-3.5" />
                        )}
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={(e) => handleDelete(form.id, e)}
                        className="grid size-8 place-items-center rounded-lg border border-border bg-background text-muted-foreground hover:border-destructive/40 hover:text-destructive transition-colors"
                        title="Delete form"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-foreground text-sm line-clamp-1 group-hover:text-primary transition-colors">
                      {form.title}
                    </h3>
                    {form.description ? (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {form.description}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground/60 italic mt-1">
                        No description provided
                      </p>
                    )}
                  </div>
                </div>

                {/* Bottom metadata + Action links */}
                <div className="px-3.5 py-2.5 sm:px-4 sm:py-3 bg-muted/20 border-t border-border/60 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span className="truncate text-[11px]">
                    Updated {new Date(form.updatedAt).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleOpenResponses(form)}
                      className="inline-flex items-center gap-1 font-semibold text-primary hover:underline transition-colors text-xs"
                    >
                      <BarChart3 className="size-3" />
                      Responses
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(form)}
                      className="inline-flex items-center gap-1 font-medium text-foreground hover:text-primary transition-colors text-xs"
                    >
                      <Pencil className="size-3" />
                      Edit Questions
                    </button>

                    <Link
                      to="/forms/$formId"
                      params={{ formId: form.id }}
                      className="inline-flex items-center gap-1 font-semibold text-primary hover:underline text-xs"
                    >
                      <Eye className="size-3.5" />
                      Open Form
                      <ArrowRight className="size-3" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form Builder Dialog */}
      <FormBuilderDialog
        open={builderOpen}
        onOpenChange={setBuilderOpen}
        departmentSlug={departmentSlug}
        departmentLabel={departmentLabel}
        initialForm={editingForm}
        onSaved={() => refresh()}
      />

      {/* Form Responses Dashboard Dialog */}
      {responsesForm && (
        <FormResponsesDialog
          open={responsesOpen}
          onOpenChange={(open) => {
            setResponsesOpen(open);
            if (!open) setResponsesForm(null);
          }}
          form={responsesForm}
        />
      )}
    </section>
  );
}
