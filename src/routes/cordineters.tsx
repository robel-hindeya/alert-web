import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/cordineters")({
  head: () => ({
    meta: [
      { title: "Coordinators Portal | ALERT Quality Management System" },
      {
        name: "description",
        content: "Department audit coordinators portal at ALERT Comprehensive Specialized Hospital.",
      },
    ],
  }),
  component: () => <Navigate to="/coordinators" />,
});
