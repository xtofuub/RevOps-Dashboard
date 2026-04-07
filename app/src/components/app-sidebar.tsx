"use client"

import * as React from "react"
import {
  IconChartBar,
  IconCirclePlusFilled,
  IconDashboard,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconMessageQuestion,
  IconSearch,
  IconSettings,
  IconTable,
  IconUsers,
} from "@tabler/icons-react"

import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/animate-ui/components/radix/sidebar"

export type TabId =
  | "overview"
  | "revenue"
  | "signals"
  | "delivery"
  | "enter-data"
  | "questions"
  | "table"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
}

const navItems: { id: TabId; title: string; icon: React.ElementType }[] = [
  { id: "overview", title: "Overview", icon: IconDashboard },
  { id: "revenue", title: "Revenue Engine", icon: IconChartBar },
  { id: "signals", title: "Product Signals", icon: IconListDetails },
  { id: "delivery", title: "Delivery Stability", icon: IconFolder },
  { id: "table", title: "Data Table", icon: IconTable },
  { id: "questions", title: "OKR Questions", icon: IconMessageQuestion },
  { id: "enter-data", title: "Enter Data", icon: IconCirclePlusFilled },
]

const navSecondary = [
  { title: "Settings", url: "#", icon: IconSettings },
  { title: "Get Help", url: "#", icon: IconHelp },
  { title: "Search", url: "#", icon: IconSearch },
]

const user = {
  name: "RevOps Team",
  email: "revops@fitsec.com",
  avatar: "/avatars/revops.jpg",
}

export function AppSidebar({ activeTab, onTabChange, ...props }: AppSidebarProps) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="data-[slot=sidebar-menu-button]:p-2! h-12">
              <IconInnerShadowTop className="size-6! text-sidebar-foreground" />
              <span className="text-lg font-bold tracking-tight">RevOps</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="px-2 pt-3 gap-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id
            return (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                  isActive={isActive}
                  onClick={() => onTabChange(item.id)}
                  tooltip={item.title}
                  className="cursor-pointer h-11 text-[0.9375rem] font-medium gap-3 transition-all duration-200 ease-out hover:translate-x-0.5"
                >
                  <item.icon className="size-5 shrink-0" />
                  <span>{item.title}</span>
                  {isActive && (
                    <span className="ml-auto size-1.5 rounded-full bg-sidebar-foreground/60 animate-pulse" />
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}

