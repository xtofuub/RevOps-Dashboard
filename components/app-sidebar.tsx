"use client";

import * as React from "react";
import { type LucideIcon } from "lucide-react";
import {
  ChartBarIcon,
  CommandIcon,
  DatabaseIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  ListIcon,
  LogOutIcon,
  ShieldCheckIcon,
  TriangleAlertIcon,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { ADMIN_VIEW_ID, type WorkspaceView } from "@/lib/dashboard-navigation";
import {
  DASHBOARD_TABS,
  type DashboardData,
  type DashboardTab,
} from "@/lib/kpi-dashboard";
import { logout } from "@/app/login/actions";

const tabIcons: Record<DashboardTab, LucideIcon> = {
  overview: LayoutDashboardIcon,
  "revenue-engine": ChartBarIcon,
  "product-market-signal": ListIcon,
  "delivery-stability": DatabaseIcon,
  "weekly-update": FileTextIcon,
};

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  activeView: WorkspaceView;
  dashboard: DashboardData;
  onViewChange: (view: WorkspaceView) => void;
  user: { username: string; role: string };
};

export function AppSidebar({
  activeView,
  dashboard,
  onViewChange,
  user,
  ...props
}: AppSidebarProps) {
  return (
    <Sidebar collapsible="offcanvas" variant="sidebar" {...props}>
      <SidebarHeader className="border-b border-sidebar-border/70 px-3 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-sidebar-accent text-sidebar-accent-foreground">
            <CommandIcon className="size-3.5" />
          </div>
          <span className="text-sm font-medium text-sidebar-foreground">Fitsec</span>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-2">
        <SidebarGroup className="px-0 py-0">
          <SidebarGroupLabel className="mb-1 h-6 px-2 text-[11px] font-medium uppercase tracking-[0.12em] text-sidebar-foreground/45">
            Views
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {DASHBOARD_TABS.map((tab) => {
                const Icon = tabIcons[tab.id];
                return (
                  <SidebarMenuItem key={tab.id}>
                    <SidebarMenuButton
                      isActive={tab.id === activeView}
                      onClick={() => onViewChange(tab.id)}
                      tooltip={tab.label}
                      className="h-7 gap-2 px-2 text-sidebar-foreground/62 data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground"
                    >
                      <Icon className="size-3.5 shrink-0" />
                      <span className="text-xs font-medium">{tab.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {user.role === "admin" ? (
          <>
            <SidebarSeparator className="my-2" />
            <SidebarGroup className="px-0 py-0">
              <SidebarGroupLabel className="mb-1 h-6 px-2 text-[11px] font-medium uppercase tracking-[0.12em] text-sidebar-foreground/45">
                Admin
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={activeView === ADMIN_VIEW_ID}
                      onClick={() => onViewChange(ADMIN_VIEW_ID)}
                      tooltip="Admin Panel"
                      className="h-7 gap-2 px-2 text-sidebar-foreground/62 data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground"
                    >
                      <ShieldCheckIcon className="size-3.5 shrink-0" />
                      <span className="text-xs font-medium">Admin Panel</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        ) : null}

        {dashboard.healthAlerts.length ? (
          <>
            <SidebarSeparator className="my-2" />
            <SidebarGroup className="px-0 py-0">
              <SidebarGroupLabel className="mb-1 h-6 px-2 text-[11px] font-medium uppercase tracking-[0.12em] text-sidebar-foreground/45">
                Watch list
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="flex flex-col gap-1.5 px-1">
                  {dashboard.healthAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="rounded-md px-2 py-1.5 text-sidebar-foreground/70"
                    >
                      <div className="flex items-center gap-1.5 text-xs">
                        <TriangleAlertIcon className="size-3 shrink-0 text-amber-500" />
                        <span>{alert.title}</span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-sidebar-foreground/45">{alert.description}</p>
                    </div>
                  ))}
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        ) : null}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/70 px-2 py-2.5">
        <div className="flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-sidebar-accent">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-xs font-medium text-sidebar-accent-foreground">
            {user.username[0].toUpperCase()}
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-xs font-medium text-sidebar-foreground">{user.username}</span>
            <span className="truncate text-[11px] capitalize text-sidebar-foreground/45">{user.role}</span>
          </div>
          <form action={logout} className="ml-auto shrink-0">
            <button
              type="submit"
              title="Sign out"
              className="flex size-6 items-center justify-center rounded text-sidebar-foreground/45 transition-colors hover:text-sidebar-foreground"
            >
              <LogOutIcon className="size-3.5" />
            </button>
          </form>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
