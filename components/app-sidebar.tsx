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
import {
  DASHBOARD_TABS,
  formatWeekLabelWithYear,
  type DashboardData,
  type DashboardTab,
} from "@/lib/kpi-dashboard";
import { Badge } from "@/components/ui/badge";

const tabIcons: Record<DashboardTab, LucideIcon> = {
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
    <Sidebar collapsible="offcanvas" variant="sidebar" {...props}>
      <SidebarHeader className="px-3 py-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => onTabChange("overview")}
              className="h-auto gap-3 px-0 py-1 hover:bg-transparent hover:text-foreground data-active:bg-transparent data-active:text-foreground"
              tooltip="Open overview"
            >
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <CommandIcon className="size-5" />
              </div>
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate text-base font-semibold tracking-tight">Fitsec</span>
                <span className="truncate text-xs text-muted-foreground/70 font-normal">
                  Operating dashboard
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup className="px-0">
          <SidebarGroupLabel className="px-2 mb-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60">
            Views
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {DASHBOARD_TABS.map((tab) => {
                const Icon = tabIcons[tab.id];

                return (
                  <SidebarMenuItem key={tab.id}>
                    <SidebarMenuButton
                      isActive={tab.id === activeTab}
                      onClick={() => onTabChange(tab.id)}
                      tooltip={tab.label}
                      className="h-10 px-3 rounded-lg data-active:bg-primary/10 data-active:text-primary data-active:font-medium"
                    >
                      <span className="flex size-[18px] items-center justify-center text-muted-foreground data-active:text-primary">
                        <Icon className="size-[18px]" />
                      </span>
                      <span className="text-sm">{tab.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {dashboard.healthAlerts.length ? (
          <>
            <SidebarSeparator className="my-3" />

            <SidebarGroup className="px-0">
              <SidebarGroupLabel className="px-2 mb-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60">
                Watch list
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="flex flex-col gap-2 px-1">
                  {dashboard.healthAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="rounded-lg border border-border/50 bg-card/50 p-3 text-xs leading-relaxed text-muted-foreground"
                    >
                      <div className="flex items-center gap-2 font-medium text-foreground">
                        <TriangleAlertIcon className="size-3.5 text-amber-500" />
                        <span className="text-xs">{alert.title}</span>
                      </div>
                      <p className="mt-1.5 text-xs">{alert.description}</p>
                    </div>
                  ))}
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        ) : null}
      </SidebarContent>

      <SidebarFooter className="p-3">
        <div className="flex flex-col gap-3 rounded-lg border border-border/50 bg-card/30 p-3">
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline" className="text-[10px] font-medium px-2 py-0 h-5">
              {dashboard.totalWeeks} weeks
            </Badge>
            {latestSnapshot ? (
              <Badge variant="outline" className="text-[10px] font-medium px-2 py-0 h-5">
                {formatWeekLabelWithYear(latestSnapshot.weekOf)}
              </Badge>
            ) : null}
          </div>
          <div className="text-[11px] leading-relaxed text-muted-foreground/70">
            {dashboard.lastUpdatedLabel
              ? `Updated ${dashboard.lastUpdatedLabel}`
              : "No snapshots saved yet."}
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
