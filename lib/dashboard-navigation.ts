import {
  DASHBOARD_TABS,
  type DashboardTab,
} from "@/lib/kpi-dashboard";

export const ADMIN_VIEW_ID = "admin";

export type WorkspaceView = DashboardTab | typeof ADMIN_VIEW_ID;

export const ADMIN_VIEW = {
  id: ADMIN_VIEW_ID,
  label: "Admin Panel",
  description: "Manage users, roles, passwords, and dashboard access.",
} as const;

export function getWorkspaceViewMeta(view: WorkspaceView) {
  return view === ADMIN_VIEW_ID
    ? ADMIN_VIEW
    : DASHBOARD_TABS.find((tab) => tab.id === view) ?? DASHBOARD_TABS[0];
}
