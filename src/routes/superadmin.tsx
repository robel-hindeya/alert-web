import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { saveAuthUser, useAuthUser } from "@/lib/auth-session";
import { Dashboard } from "./index";

export const Route = createFileRoute("/superadmin")({
  head: () => ({
    meta: [
      { title: "Superadmin Overview | ALERT Quality Management System" },
      {
        name: "description",
        content: "Super Administrator Console and Hospital Analytics at ALERT Hospital.",
      },
      { property: "og:title", content: "Superadmin Overview | ALERT Quality Management System" },
      {
        property: "og:description",
        content: "Super Administrator Console and Hospital Analytics at ALERT Hospital.",
      },
    ],
  }),
  component: SuperadminRoutePage,
});

function SuperadminRoutePage() {
  const navigate = useNavigate();
  const { user, ready } = useAuthUser();

  useEffect(() => {
    if (ready && !user) {
      navigate({ to: "/login" });
    }
  }, [ready, user, navigate]);

  if (!ready || !user) {
    return null;
  }

  return <Dashboard />;
}
