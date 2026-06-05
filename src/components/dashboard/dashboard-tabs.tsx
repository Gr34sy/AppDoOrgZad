import Link from "next/link";

export function DashboardTabs() {
  return (
    <nav style={{ display: "flex", gap: "12px" }}>
      <Link href="/dashboard/notes">notes</Link>
      <Link href="/dashboard/checklists">checklists</Link>
      <Link href="/dashboard/tasks">tasks</Link>
      <Link href="/dashboard/projects">projects</Link>
    </nav>
  );
}
