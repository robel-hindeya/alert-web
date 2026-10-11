import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CoordinatorPortal } from "@/components/coordinators/coordinator-portal";
import { useAuthUser } from "@/lib/auth-session";

export const Route = createFileRoute("/coordinators")({
  head: () => ({
    meta: [
      { title: "Coordinators Portal | ALERT Quality Management System" },
      {
        name: "description",
        content:
          "Department audit coordinators portal at ALERT Comprehensive Specialized Hospital: department forms, submit history, and coordinator profile.",
      },
      { property: "og:title", content: "Coordinators Portal | ALERT Quality Management System" },
      {
        property: "og:description",
        content: "Manage department forms, track submit history, and view coordinator credentials.",
      },
    ],
  }),
  component: CoordinatorsRoutePage,
});

function CoordinatorsRoutePage() {
  const navigate = useNavigate();
  const { user, ready } = useAuthUser();

  useEffect(() => {
    if (ready) {
      if (!user) {
        navigate({ to: "/login" });
      } else if (user.role === "admin") {
        const myDept = user.departmentSlug || "emergency-corridor";
        navigate({ to: "/departments/$slug", params: { slug: myDept } });
      }
    }
  }, [ready, user, navigate]);

  if (!ready || !user || user.role === "admin") {
    return null;
  }

  return <CoordinatorPortal />;
}
