import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuthUser } from "@/lib/auth-session";
import { useDeptSession } from "@/lib/dept-session";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Hospital Admin | ALERT Quality Management System" },
      {
        name: "description",
        content: "Hospital Administrator Department Overview and Clinical Monitoring at ALERT Hospital.",
      },
      { property: "og:title", content: "Hospital Admin | ALERT Quality Management System" },
      {
        property: "og:description",
        content: "Hospital Administrator Department Overview and Clinical Monitoring at ALERT Hospital.",
      },
    ],
  }),
  component: AdminRoutePage,
});

function AdminRoutePage() {
  const navigate = useNavigate();
  const { user, ready } = useAuthUser();
  const { session } = useDeptSession();
  const targetDept = session?.slug || user?.departmentSlug || "emergency-corridor";

  useEffect(() => {
    if (ready) {
      if (!user) {
        navigate({ to: "/login" });
      } else {
        navigate({
          to: "/departments/$slug",
          params: { slug: targetDept },
        });
      }
    }
  }, [ready, user, targetDept, navigate]);

  return null;
}
