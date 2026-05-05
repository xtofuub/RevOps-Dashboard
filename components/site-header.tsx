"use client";

import { FileTextIcon, InfoIcon } from "lucide-react";

import { ExportWorkbookButton } from "@/components/export-workbook-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DASHBOARD_TABS,
  KPI_FORM_SECTIONS,
  type DashboardTab,
} from "@/lib/kpi-dashboard";

type SiteHeaderProps = {
  activeTab: DashboardTab;
  lastUpdatedLabel: string | null;
  onTabChange: (tab: DashboardTab) => void;
  totalWeeks: number;
};

export function SiteHeader({
  activeTab,
  lastUpdatedLabel,
  onTabChange,
  totalWeeks,
}: SiteHeaderProps) {
  const activeTabMeta =
    DASHBOARD_TABS.find((tab) => tab.id === activeTab) ?? DASHBOARD_TABS[0];

  return (
    <header className="flex h-(--header-height) shrink-0 items-center border-b border-border/60 bg-background/80 backdrop-blur-sm">
      <div className="flex w-full items-center gap-3 px-4 lg:px-6">
        <SidebarTrigger className="-ml-1 size-8 hover:bg-muted/50" />
        <Separator
          orientation="vertical"
          className="mx-1 h-5 bg-border/60"
        />

        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="truncate text-sm font-semibold tracking-tight">
            {activeTabMeta.label}
          </div>
          <div className="hidden truncate text-xs text-muted-foreground/70 md:block">
            {activeTabMeta.description}
          </div>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Badge variant="outline" className="text-[11px] font-medium px-2.5 py-0.5 h-5">
            {totalWeeks} snapshots
          </Badge>
          {lastUpdatedLabel ? (
            <Badge variant="outline" className="text-[11px] font-medium px-2.5 py-0.5 h-5">
              Updated {lastUpdatedLabel}
            </Badge>
          ) : null}
        </div>

        <ExportWorkbookButton disabled={totalWeeks === 0} />
        <ThemeToggle />

        <Dialog>
          <DialogTrigger render={<Button variant="outline" size="sm" className="h-8 text-xs" />}>
            <InfoIcon data-icon="inline-start" className="size-3.5" />
            Metrics
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Metric definitions</DialogTitle>
              <DialogDescription>
                Submit one full operating snapshot per week using the weekly update form.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4 text-sm">
              {KPI_FORM_SECTIONS.map((section) => (
                <div key={section.id} className="flex flex-col gap-2">
                  <div className="font-medium text-foreground">{section.title}</div>
                  <div className="text-muted-foreground text-xs">{section.description}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {section.fields.map((field) => (
                      <Badge key={field.key} variant="outline" className="text-[10px] px-2 py-0 h-5">
                        {field.shortLabel}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <DialogFooter showCloseButton />
          </DialogContent>
        </Dialog>

        <Button size="sm" onClick={() => onTabChange("weekly-update")} className="h-8 text-xs gap-1.5">
          <FileTextIcon data-icon="inline-start" className="size-3.5" />
          <span className="hidden sm:inline">Weekly update</span>
        </Button>
      </div>
    </header>
  );
}
