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
  Calendar,
  Layers,
  Sparkles,
  ClipboardCheck,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useDepartmentForms,
  CustomForm,
  deleteForm,
} from "@/lib/form-store";
import { FormBuilderDialog } from "./form-builder-dialog";

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
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleOpenCreate = () => {
    setEditingForm(null);
    setBuilderOpen(true);
  };

  const handleOpenEdit = (form: CustomForm) => {
    setEditingForm(form);
    setBuilderOpen(true);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this form?")) {
      deleteForm(id);
      refresh();
    }
  };

  const handleCopyLink = (formId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/forms/${formId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(formId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <section className="card-soft min-w-0 p-5 space-y-4">
      {/* Box Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-4">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-primary/12 text-primary">
            <ClipboardCheck className="size-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-foreground">
                Department Forms & Checklists
              </h2>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                Google Form Style
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Build custom intake forms, triage surveys, and audit sheets with custom datatypes
            </p>
          </div>
        </div>

        <Button
          type="button"
          onClick={handleOpenCreate}
          size="sm"
          className="gap-1.5 font-semibold shadow-sm"
        >
          <Plus className="size-4" />
          Create Form
        </Button>
      </div>

      {/* Forms Grid */}
      {forms.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-10 px-4 text-center">
          <p className="text-sm font-medium text-foreground">No forms created yet</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Click &quot;Create Form&quot; to build your first Google Forms-style questionnaire with custom questions and datatypes.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleOpenCreate}
            className="mt-4 gap-1.5"
          >
            <Plus className="size-4" />
            Add First Form
          </Button>
        </div>
      ) : (
        <div className="grid gap-3.5 sm:grid-cols-2">
          {forms.map((form) => {
            const isCopied = copiedId === form.id;

            return (
              <div
                key={form.id}
                className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:border-primary/50 hover:shadow-md"
              >
                {/* Top card banner */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
                        <FileText className="size-4" />
                      </span>
                      <span className="rounded-md bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
                        {form.questions.length} {form.questions.length === 1 ? "question" : "questions"}
                      </span>
                    </div>

                    {/* Action buttons (View Icon, Edit, Share, Delete) */}
                    <div className="flex items-center gap-1">
                      {/* VIEW ICON (Navigates to dedicated page showing ONLY form) */}
                      <Link
                        to="/forms/$formId"
                        params={{ formId: form.id }}
                        className="flex size-8 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-150"
                        title="View standalone form (opens page with only the form)"
                      >
                        <Eye className="size-4" />
                      </Link>

                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(form)}
                        className="grid size-8 place-items-center rounded-lg border border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
                        title="Edit form questions"
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
                    {form.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {form.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Bottom metadata + View Form link */}
                <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="truncate">
                    Updated {new Date(form.updatedAt).toLocaleDateString()}
                  </span>

                  <Link
                    to="/forms/$formId"
                    params={{ formId: form.id }}
                    className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                  >
                    <Eye className="size-3.5" />
                    Open Form
                    <ArrowRight className="size-3" />
                  </Link>
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
    </section>
  );
}
