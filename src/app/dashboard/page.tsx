"use client"

import * as React from "react"
import { AppSidebar, type TabId } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { RevOpsProvider } from "@/lib/revops-context"
import { RevOpsKpiCards } from "@/components/revops-kpi-cards"
import { RevOpsCharts } from "@/components/revops-charts"
import { RevOpsWeeklyTable } from "@/components/revops-weekly-table"
import { ProductMarketSignals } from "@/components/product-market-signals"
import { RevOpsWeeklyQuestions } from "@/components/revops-weekly-questions"
import { DataEntryForm } from "@/components/data-entry-form"
import { OverviewChart } from "@/components/overview-chart"
import { RevenueEngineTab } from "@/components/revenue-engine-tab"
import { DeliveryStabilityTab } from "@/components/delivery-stability-tab"
import { SidebarInset, SidebarProvider } from "@/components/animate-ui/components/radix/sidebar"
import { Toaster } from "@/components/ui/sonner"

const TAB_TITLES: Record<TabId, string> = {
  overview: "Overview",
  revenue: "Revenue Engine",
  signals: "Product-Market Signals",
  delivery: "Delivery Stability",
  table: "Data Table",
  questions: "OKR Questions",
  "enter-data": "Enter Weekly Data",
}

export default function Page() {
  const [activeTab, setActiveTab] = React.useState<TabId>("overview")
  const [displayTab, setDisplayTab] = React.useState<TabId>("overview")
  const [visible, setVisible] = React.useState(true)

  function handleTabChange(tab: TabId) {
    if (tab === activeTab) return
    setVisible(false)
    setTimeout(() => {
      setActiveTab(tab)
      setDisplayTab(tab)
      setVisible(true)
    }, 120)
  }

  return (
    <RevOpsProvider>
      <SidebarProvider
        style={{
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties}
      >
        <AppSidebar variant="inset" activeTab={activeTab} onTabChange={handleTabChange} />
        <SidebarInset>
          <SiteHeader title={TAB_TITLES[activeTab]} />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div
                className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 transition-all duration-150 ease-out"
                style={{
                  opacity: visible ? 1 : 0,
                  transform: visible ? "translateY(0)" : "translateY(6px)",
                }}
              >
                {displayTab === "overview" && (
                  <>
                    <RevOpsKpiCards />
                    <div className="px-4 lg:px-6"><OverviewChart /></div>
                  </>
                )}
                {displayTab === "revenue" && <RevenueEngineTab />}
                {displayTab === "signals" && <ProductMarketSignals />}
                {displayTab === "delivery" && <DeliveryStabilityTab />}
                {displayTab === "table" && <RevOpsWeeklyTable />}
                {displayTab === "questions" && <RevOpsWeeklyQuestions />}
                {displayTab === "enter-data" && (
                  <div className="flex justify-center px-4 lg:px-6 py-2">
                    <DataEntryForm />
                  </div>
                )}
              </div>
            </div>
          </div>
        </SidebarInset>
        <Toaster />
      </SidebarProvider>
    </RevOpsProvider>
  )
}
