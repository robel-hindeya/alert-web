import { createFileRoute, redirect, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/qmt-officers")({
  beforeLoad: () => {
    throw redirect({ to: "/qmt-officer" });
  },
  component: () => <Navigate to="/qmt-officer" />,
});
