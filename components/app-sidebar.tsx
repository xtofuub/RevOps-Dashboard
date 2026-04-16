"use client";

import * as React from "react";
import {
  ChartBarIcon,
  CommandIcon,
  DatabaseIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  ListIcon,
  TriangleAlertIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
import {
  DASHBOARD_TABS,
  formatWeekLabelWithYear,
  type DashboardData,
  type DashboardTab,
} from "@/lib/kpi-dashboard";

const tabIcons: Record<DashboardTab, React.ComponentType> = {
  overview: LayoutDashboardIcon,
  "revenue-engine": ChartBarIcon,
  "product-market-signal": ListIcon,
  "delivery-stability": DatabaseIcon,
  "weekly-update": FileTextIcon,
};

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  activeTab: DashboardTab;
  dashboard: DashboardData;
  onTabChange: (tab: DashboardTab) => void;
};

export function AppSidebar({
  activeTab,
  dashboard,
  onTabChange,
  ...props
}: AppSidebarProps) {
  const latestSnapshot = dashboard.latestSnapshot;

  return (
    <Sidebar collapsible="offcanvas" variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => onTabChange("overview")}
              className="h-auto gap-3 px-3 py-3"
              tooltip="Open overview"
            >
              <div className="flex size-9 items-center justify-center rounded-md border border-sidebar-border bg-sidebar-primary text-sidebar-primary-foreground">
                <CommandIcon />
              </div>
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate text-sm font-semibold">Fitsec</span>
                <span className="truncate text-xs text-sidebar-foreground/70">
                  Weekly operating dashboard
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Views</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {DASHBOARD_TABS.map((tab) => {
                const Icon = tabIcons[tab.id];

                return (
                  <SidebarMenuItem key={tab.id}>
                    <SidebarMenuButton
                      isActive={tab.id === activeTab}
                      onClick={() => onTabChange(tab.id)}
                      tooltip={tab.label}
                    >
                      <Icon />
                      <span>{tab.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {dashboard.healthAlerts.length ? (
          <>
            <SidebarSeparator />

            <SidebarGroup>
              <SidebarGroupLabel>Watch list</SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="flex flex-col gap-2 px-2">
                  {dashboard.healthAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="rounded-md border border-sidebar-border bg-sidebar-accent p-3 text-xs leading-relaxed text-sidebar-foreground/80"
                    >
                      <div className="flex items-center gap-2 font-medium text-sidebar-foreground">
                        <TriangleAlertIcon />
                        <span>{alert.title}</span>
                      </div>
                      <p className="mt-1">{alert.description}</p>
                    </div>
                  ))}
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        ) : null}
      </SidebarContent>

      <SidebarFooter>
        <div className="flex flex-col gap-3 rounded-md border border-sidebar-border bg-sidebar-accent p-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{dashboard.totalWeeks} weeks</Badge>
            {latestSnapshot ? (
              <Badge variant="outline">
                {formatWeekLabelWithYear(latestSnapshot.weekOf)}
              </Badge>
            ) : null}
          </div>
          <div className="text-xs leading-relaxed text-sidebar-foreground/75">
            {dashboard.lastUpdatedLabel
              ? `Latest save: ${dashboard.lastUpdatedLabel}`
              : "No weekly snapshots saved yet."}
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
