import { createFileRoute } from "@tanstack/react-router";
import { CoordinatorPortal } from "@/components/coordinators/coordinator-portal";

export const Route = createFileRoute("/cordineters")({
  head: () => ({
    meta: [
      { title: "Coordinators Portal | ALERT Hospital Management System" },
      {
        name: "description",
        content:
          "Department audit coordinators portal at ALERT Comprehensive Specialized Hospital: department forms, submit history, and coordinator profile.",
      },
      { property: "og:title", content: "Coordinators Portal | ALERT Hospital Management System" },
      {
        property: "og:description",
        content:
          "Manage department forms, track submit history, and view coordinator credentials.",
      },
    ],
  }),
  component: CoordinatorPortal,
});
