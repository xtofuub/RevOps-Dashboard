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
  activeTab: DashboardTab;
  dashboard: DashboardData;
  onTabChange: (tab: DashboardTab) => void;
  user: { username: string; role: string };
};

export function AppSidebar({
  activeTab,
  dashboard,
  onTabChange,
  user,
  ...props
}: AppSidebarProps) {

  return (
    <Sidebar collapsible="offcanvas" variant="sidebar" {...props}>
      <SidebarHeader className="px-4 py-3 border-b border-border/40">
        <div className="flex items-center gap-2.5">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10">
            <CommandIcon className="size-3.5 text-primary" />
          </div>
          <span className="text-sm font-medium text-foreground">Fitsec</span>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-2">
        <SidebarGroup className="px-0 py-0">
          <SidebarGroupLabel className="px-2 text-xs text-muted-foreground/50 font-normal mb-1">
            Views
          </SidebarGroupLabel>
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
                      className="gap-2.5 px-2 text-muted-foreground data-active:text-foreground data-active:bg-accent"
                    >
                      <Icon className="size-4 shrink-0" />
                      <span className="text-sm font-normal">{tab.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {dashboard.healthAlerts.length ? (
          <>
            <SidebarSeparator className="my-2" />
            <SidebarGroup className="px-0 py-0">
              <SidebarGroupLabel className="px-2 text-xs text-muted-foreground/50 font-normal mb-1">
                Watch list
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="flex flex-col gap-1.5 px-1">
                  {dashboard.healthAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="rounded-md border border-border/40 bg-muted/30 px-3 py-2"
                    >
                      <div className="flex items-center gap-1.5 text-xs text-foreground">
                        <TriangleAlertIcon className="size-3 text-amber-500 shrink-0" />
                        <span>{alert.title}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{alert.description}</p>
                    </div>
                  ))}
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        ) : null}
      </SidebarContent>

      <SidebarFooter className="px-3 py-3 border-t border-border/40">
        <div className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-accent transition-colors">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-foreground text-xs font-medium">
            {user.username[0].toUpperCase()}
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-xs font-medium text-foreground">{user.username}</span>
            <span className="truncate text-xs text-muted-foreground capitalize">{user.role}</span>
          </div>
          <form action={logout} className="ml-auto shrink-0">
            <button
              type="submit"
              title="Sign out"
              className="flex size-6 items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOutIcon className="size-3.5" />
            </button>
          </form>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
