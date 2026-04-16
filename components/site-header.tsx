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
    <header className="flex h-(--header-height) shrink-0 items-center border-b border-border bg-background">
      <div className="flex w-full items-center gap-3 px-4 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-1 h-4 data-vertical:self-auto"
        />

        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="truncate text-sm font-medium">{activeTabMeta.label}</div>
          <div className="hidden truncate text-xs text-muted-foreground md:block">
            {activeTabMeta.description}
          </div>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Badge variant="outline">{totalWeeks} weekly snapshots</Badge>
          {lastUpdatedLabel ? (
            <Badge variant="outline">Updated {lastUpdatedLabel}</Badge>
          ) : null}
        </div>

        <ExportWorkbookButton disabled={totalWeeks === 0} />
        <ThemeToggle />

        <Dialog>
          <DialogTrigger render={<Button variant="outline" size="sm" />}>
            <InfoIcon data-icon="inline-start" />
            Metric notes
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Metric notes</DialogTitle>
              <DialogDescription>
                Use the weekly update tab to submit one full operating snapshot
                per week-ending Sunday.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4 text-sm">
              {KPI_FORM_SECTIONS.map((section) => (
                <div key={section.id} className="flex flex-col gap-2">
                  <div className="font-medium">{section.title}</div>
                  <div className="text-muted-foreground">{section.description}</div>
                  <div className="flex flex-wrap gap-2">
                    {section.fields.map((field) => (
                      <Badge key={field.key} variant="outline">
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

        <Button size="sm" onClick={() => onTabChange("weekly-update")}>
          <FileTextIcon data-icon="inline-start" />
          Open weekly update
        </Button>
      </div>
    </header>
  );
}
