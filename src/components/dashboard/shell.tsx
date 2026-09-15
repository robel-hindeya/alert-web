import { Sidebar } from "./sidebar";

export function DashboardShell({
  children,
  bare = false,
}: {
  children: React.ReactNode;
  bare?: boolean;
}) {
  if (bare) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col lg:ml-64">{children}</div>
    </div>
  );
}
