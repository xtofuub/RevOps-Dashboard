"use client";

import * as React from "react";
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import {
  ActivityIcon,
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  CalendarRangeIcon,
  ChartBarIcon,
  DatabaseIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  ListIcon,
  ShieldCheckIcon,
  TriangleAlertIcon,
} from "lucide-react";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { WeeklyUpdateForm } from "@/components/weekly-update-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Progress, ProgressLabel } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  aggregateTextItems,
  DASHBOARD_TABS,
  formatMetricByKey,
  formatMetricValue,
  formatWeekLabelWithYear,
  metricFieldMap,
  parseWeekOf,
  type RankedTextItem,
  type DashboardData,
  type DashboardTab,
  type MetricFieldDefinition,
  type NumericMetricKey,
  type WeeklySnapshot,
} from "@/lib/kpi-dashboard";
import { cn } from "@/lib/utils";

type DashboardWorkspaceProps = {
  snapshots: WeeklySnapshot[];
  dashboard: DashboardData;
};

const tabIconMap: Record<DashboardTab, React.ComponentType> = {
  overview: LayoutDashboardIcon,
  "revenue-engine": ChartBarIcon,
  "product-market-signal": ListIcon,
  "delivery-stability": DatabaseIcon,
  "weekly-update": FileTextIcon,
};

const summaryMetricIcons: Partial<
  Record<NumericMetricKey, React.ComponentType>
> = {
  pipelineValue: ChartBarIcon,
  pipelineVelocity: ActivityIcon,
  closeRatePct: ActivityIcon,
  netRevenueRetentionPct: ShieldCheckIcon,
  feedSlaQualityScore: DatabaseIcon,
  newCustomersPerMonth: LayoutDashboardIcon,
  pipelineCoverageRatio: ActivityIcon,
  averageDealSize: ChartBarIcon,
  customerAcquisitionCost: TriangleAlertIcon,
  marketingSourcedPipelineCount: LayoutDashboardIcon,
  feedRetentionPct: ShieldCheckIcon,
  grossRevenueRetentionPct: ShieldCheckIcon,
  proposalsSent: FileTextIcon,
  ordersWon: ActivityIcon,
  incidentCount: TriangleAlertIcon,
};

const pipelineMomentumConfig = {
  pipelineValue: {
    label: "Pipeline value",
    color: "var(--chart-1)",
  },
  pipelineVelocity: {
    label: "Pipeline velocity",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

const conversionConfig = {
  marketingSourcedPipelinePct: {
    label: "Marketing-sourced pipeline",
    color: "var(--chart-1)",
  },
  marketingSourcedPipelineCount: {
    label: "Marketing-sourced #",
    color: "var(--chart-1)",
  },
  leadToOpportunityConversionPct: {
    label: "Lead to opportunity",
    color: "var(--chart-2)",
  },
  closeRatePct: {
    label: "Close rate",
    color: "var(--chart-3)",
  },
  pipelineCoverageRatio: {
    label: "Coverage ratio",
    color: "var(--chart-4)",
  },
  averageDealSize: {
    label: "Avg deal size",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

const retentionConfig = {
  feedRetentionPct: {
    label: "Feed retention",
    color: "var(--chart-1)",
  },
  netRevenueRetentionPct: {
    label: "NRR",
    color: "var(--chart-2)",
  },
  grossRevenueRetentionPct: {
    label: "GRR",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

const retentionTooltipOrder = {
  netRevenueRetentionPct: 0,
  feedRetentionPct: 1,
  grossRevenueRetentionPct: 2,
} as const;

const deliveryVolumeConfig = {
  proposalsSent: {
    label: "Proposals sent",
    color: "var(--chart-1)",
  },
  ordersWon: {
    label: "Orders won",
    color: "var(--chart-2)",
  },
  proposalWinRatePct: {
    label: "Proposal win rate",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

const deliveryReliabilityConfig = {
  feedSlaQualityScore: {
    label: "Feed SLA",
    color: "var(--chart-1)",
  },
  incidentCount: {
    label: "Incident count",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

const overviewMetricKeys: NumericMetricKey[] = [
  "pipelineValue",
  "closeRatePct",
  "netRevenueRetentionPct",
  "feedSlaQualityScore",
];

const revenueMetricKeys: NumericMetricKey[] = [
  "closeRatePct",
  "pipelineCoverageRatio",
  "pipelineVelocity",
  "marketingSourcedPipelineCount",
  "averageDealSize",
];

const productMetricKeys: NumericMetricKey[] = [
  "feedRetentionPct",
  "netRevenueRetentionPct",
  "grossRevenueRetentionPct",
];

const deliveryMetricKeys: NumericMetricKey[] = [
  "proposalsSent",
  "ordersWon",
  "feedSlaQualityScore",
  "incidentCount",
];

type TrendWindowMode = "7d" | "30d" | "weeks";

const defaultWeekRangeCount = 8;

function getDefaultWeekRange(timeline: DashboardData["timeline"]) {
  if (!timeline.length) {
    return { from: null, to: null };
  }

  const resolvedTimeline = timeline.slice(-defaultWeekRangeCount);

  return {
    from: resolvedTimeline[0]?.weekOf ?? timeline[0]?.weekOf ?? null,
    to:
      resolvedTimeline.at(-1)?.weekOf ?? timeline.at(-1)?.weekOf ?? null,
  };
}

const chartFrameClassName =
  "rounded-xl border border-border/70 bg-muted/20 px-2 pb-2 pt-3 sm:px-3";

const defaultChartMargin = {
  top: 8,
  right: 12,
  left: 4,
  bottom: 0,
} as const;

type ChartStatItem = {
  label: string;
  value: string;
  comparison?: {
    shortText: string;
    longText: string;
    tone: "positive" | "negative" | "neutral";
    direction: "up" | "down" | "flat";
  };
};

type ChartViewOption<T extends string> = {
  value: T;
  label: string;
};

type ShortRangeSeries<TPoint> = {
  key: string;
  label: string;
  color: string;
  valueAccessor: (point: TPoint) => number;
  valueFormatter: (value: number) => string;
};

const comparisonPercentFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

function getComparisonTone(
  betterDirection: MetricFieldDefinition["betterDirection"],
  delta: number,
) {
  if (delta === 0 || betterDirection === "neutral") {
    return "neutral" as const;
  }

  const isPositiveOutcome =
    (betterDirection === "up" && delta > 0) ||
    (betterDirection === "down" && delta < 0);

  return isPositiveOutcome ? ("positive" as const) : ("negative" as const);
}

function formatComparisonPercent(value: number) {
  const prefix = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${prefix}${comparisonPercentFormatter.format(Math.abs(value))}%`;
}

function getRangeComparison(
  betterDirection: MetricFieldDefinition["betterDirection"],
  currentValue: number,
  baselineValue?: number | null,
) {
  if (baselineValue === null || baselineValue === undefined) {
    return {
      shortText: "Baseline",
      longText: "Baseline point in selected range",
      tone: "neutral" as const,
      direction: "flat" as const,
    };
  }

  const delta = currentValue - baselineValue;
  const tone = getComparisonTone(betterDirection, delta);
  const direction =
    delta === 0 ? ("flat" as const) : delta > 0 ? ("up" as const) : ("down" as const);

  if (delta === 0) {
    return {
      shortText: "0%",
      longText: "0% vs range start",
      tone,
      direction,
    };
  }

  if (baselineValue === 0) {
    return {
      shortText: delta > 0 ? "New" : "Reset",
      longText: `${delta > 0 ? "New" : "Reset"} vs range start`,
      tone,
      direction,
    };
  }

  const deltaPct = (delta / Math.abs(baselineValue)) * 100;
  const comparisonLabel = formatComparisonPercent(deltaPct);

  return {
    shortText: comparisonLabel,
    longText: `${comparisonLabel} vs range start`,
    tone,
    direction,
  };
}

function getMetricRangeComparison(
  metricKey: NumericMetricKey,
  currentValue: number,
  baselineValue?: number | null,
) {
  return getRangeComparison(
    metricFieldMap[metricKey].betterDirection,
    currentValue,
    baselineValue,
  );
}

function createChartStatItem(
  metricKey: NumericMetricKey,
  label: string,
  currentValue: number,
  baselineValue?: number | null,
): ChartStatItem {
  return {
    label,
    value: formatMetricByKey(metricKey, currentValue),
    comparison: getMetricRangeComparison(metricKey, currentValue, baselineValue),
  };
}

function getAdaptiveTickGap(timeline: DashboardData["timeline"]) {
  if (timeline.length <= 2) {
    return 6;
  }

  if (timeline.length <= 4) {
    return 12;
  }

  return 24;
}

function isShortRangeTimeline(timeline: DashboardData["timeline"]) {
  return timeline.length <= 2;
}

function getAdaptiveXAxisPadding(timeline: DashboardData["timeline"]) {
  if (timeline.length <= 2) {
    return { left: 0, right: 0 };
  }

  if (timeline.length <= 4) {
    return { left: 12, right: 12 };
  }

  return { left: 8, right: 8 };
}

function getAdaptiveCurveType(timeline: DashboardData["timeline"]) {
  return timeline.length <= 2 ? "linear" : "monotone";
}

function getAdaptiveLineStrokeWidth(
  timeline: DashboardData["timeline"],
  defaultWidth: number,
) {
  if (timeline.length <= 2) {
    return defaultWidth + 0.45;
  }

  if (timeline.length <= 4) {
    return defaultWidth + 0.15;
  }

  return defaultWidth;
}

function getAdaptiveBarSize(
  timeline: DashboardData["timeline"],
  defaultSize: number,
) {
  if (timeline.length <= 2) {
    return defaultSize + 20;
  }

  if (timeline.length <= 4) {
    return defaultSize + 8;
  }

  return defaultSize;
}

function getAdaptiveMinPointSize(timeline: DashboardData["timeline"]) {
  if (timeline.length <= 2) {
    return 10;
  }

  if (timeline.length <= 4) {
    return 8;
  }

  return 6;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getAdaptiveBarCategoryGap(timeline: DashboardData["timeline"]) {
  if (timeline.length <= 2) {
    return "6%";
  }

  if (timeline.length <= 4) {
    return "20%";
  }

  return "32%";
}

function getAdaptiveLineDot(color: string, timeline: DashboardData["timeline"]) {
  if (timeline.length > 4) {
    return false;
  }

  return {
    r: timeline.length <= 2 ? 4 : 3,
    fill: color,
    stroke: "var(--background)",
    strokeWidth: 2,
  };
}

function renderBarValueLabel(
  props: unknown,
  formatter: (value: number) => string,
  color: string,
  offset = 10,
) {
  const point = props as {
    x?: number | string;
    y?: number | string;
    width?: number | string;
    value?: number | string | null;
  };

  if (point.value == null) {
    return null;
  }

  const x =
    typeof point.x === "number" ? point.x : point.x != null ? Number(point.x) : NaN;
  const y =
    typeof point.y === "number" ? point.y : point.y != null ? Number(point.y) : NaN;
  const width =
    typeof point.width === "number"
      ? point.width
      : point.width != null
        ? Number(point.width)
        : NaN;
  const numericValue =
    typeof point.value === "number" ? point.value : Number(point.value);

  if ([x, y, width, numericValue].some((value) => Number.isNaN(value))) {
    return null;
  }

  return (
    <text
      x={x + width / 2}
      y={y - offset}
      textAnchor="middle"
      fill={color}
      fontSize={11}
      fontWeight={600}
    >
      {formatter(numericValue)}
    </text>
  );
}

function getSeriesAnimationProps(index: number) {
  return {
    isAnimationActive: true,
    animationDuration: 820,
    animationBegin: Math.min(index * 36, 108),
    animationEasing: "ease-out" as const,
  };
}

function getTimelineAnimationKey(
  timeline: DashboardData["timeline"],
  suffix?: string,
) {
  const first = timeline[0]?.weekOf ?? "empty";
  const last = timeline.at(-1)?.weekOf ?? "empty";
  return [suffix, timeline.length, first, last].filter(Boolean).join(":");
}

function getMetricUpperBound(
  timeline: DashboardData["timeline"],
  keys: NumericMetricKey[],
  options: {
    minimum: number;
    maximum?: number;
    padding: number;
    roundTo: number;
  },
) {
  const maxValue = timeline.reduce((currentMax, point) => {
    const pointMax = keys.reduce(
      (metricMax, key) => Math.max(metricMax, Number(point[key])),
      0,
    );

    return Math.max(currentMax, pointMax);
  }, 0);
  const paddedMax = Math.ceil((maxValue + options.padding) / options.roundTo) * options.roundTo;

  return Math.min(
    options.maximum ?? Number.POSITIVE_INFINITY,
    Math.max(options.minimum, paddedMax),
  );
}

export function DashboardWorkspace({
  snapshots,
  dashboard,
}: DashboardWorkspaceProps) {
  const [activeTab, setActiveTab] = React.useState<DashboardTab>("overview");
  const [trendWindowMode, setTrendWindowMode] =
    React.useState<TrendWindowMode>("weeks");
  const [selectedWeekFrom, setSelectedWeekFrom] = React.useState<string | null>(
    null,
  );
  const [selectedWeekTo, setSelectedWeekTo] = React.useState<string | null>(null);
  const activeTabMeta =
    DASHBOARD_TABS.find((tab) => tab.id === activeTab) ?? DASHBOARD_TABS[0];
  const latestSnapshot = dashboard.latestSnapshot;
  const hasData = Boolean(latestSnapshot);
  const weekOptions = React.useMemo(
    () =>
      [...dashboard.timeline]
        .reverse()
        .map((point) => ({
          value: point.weekOf,
          label: formatWeekLabelWithYear(point.weekOf),
        })),
    [dashboard.timeline],
  );
  const weekLabelMap = React.useMemo(
    () => new Map(weekOptions.map((option) => [option.value, option.label] as const)),
    [weekOptions],
  );
  const weekIndexMap = React.useMemo(
    () =>
      new Map(
        dashboard.timeline.map((point, index) => [point.weekOf, index] as const),
      ),
    [dashboard.timeline],
  );
  const fromWeekOptions = React.useMemo(() => {
    const selectedToIndex =
      selectedWeekTo !== null ? weekIndexMap.get(selectedWeekTo) : undefined;

    return weekOptions.filter((option) => {
      if (selectedToIndex === undefined) {
        return true;
      }

      const optionIndex = weekIndexMap.get(option.value);
      return optionIndex !== undefined && optionIndex < selectedToIndex;
    });
  }, [selectedWeekTo, weekIndexMap, weekOptions]);
  const toWeekOptions = React.useMemo(() => {
    const selectedFromIndex =
      selectedWeekFrom !== null ? weekIndexMap.get(selectedWeekFrom) : undefined;

    return weekOptions.filter((option) => {
      if (selectedFromIndex === undefined) {
        return true;
      }

      const optionIndex = weekIndexMap.get(option.value);
      return optionIndex !== undefined && optionIndex > selectedFromIndex;
    });
  }, [selectedWeekFrom, weekIndexMap, weekOptions]);

  React.useEffect(() => {
    if (!dashboard.timeline.length) {
      return;
    }

    const isCurrentFromValid =
      selectedWeekFrom !== null && weekIndexMap.has(selectedWeekFrom);
    const isCurrentToValid =
      selectedWeekTo !== null && weekIndexMap.has(selectedWeekTo);

    if (
      isCurrentFromValid &&
      isCurrentToValid &&
      selectedWeekFrom === selectedWeekTo &&
      dashboard.timeline.length > 1
    ) {
      const currentIndex = weekIndexMap.get(selectedWeekFrom!);

      if (currentIndex !== undefined) {
        const nextToWeek =
          dashboard.timeline[Math.min(currentIndex + 1, dashboard.timeline.length - 1)]
            ?.weekOf ?? null;

        if (nextToWeek && nextToWeek !== selectedWeekFrom) {
          setSelectedWeekTo(nextToWeek);
          return;
        }
      }
    }

    if (isCurrentFromValid && isCurrentToValid) {
      return;
    }

    const defaultRange = getDefaultWeekRange(dashboard.timeline);
    setSelectedWeekFrom(defaultRange.from);
    setSelectedWeekTo(defaultRange.to);
  }, [
    dashboard.timeline,
    selectedWeekFrom,
    selectedWeekTo,
    weekIndexMap,
  ]);

  const filteredTimeline = React.useMemo(() => {
    if (dashboard.timeline.length <= 1) {
      return dashboard.timeline;
    }

    if (trendWindowMode === "weeks") {
      const fromIndex =
        selectedWeekFrom !== null ? weekIndexMap.get(selectedWeekFrom) : undefined;
      const toIndex =
        selectedWeekTo !== null ? weekIndexMap.get(selectedWeekTo) : undefined;

      if (fromIndex !== undefined && toIndex !== undefined) {
        const rangeStart = Math.min(fromIndex, toIndex);
        const rangeEnd = Math.max(fromIndex, toIndex);

        return dashboard.timeline.slice(rangeStart, rangeEnd + 1);
      }

      return dashboard.timeline.slice(-defaultWeekRangeCount);
    }

    const latestWeek = dashboard.timeline.at(-1);

    if (!latestWeek) {
      return dashboard.timeline;
    }

    const cutoffDate = parseWeekOf(latestWeek.weekOf);
    cutoffDate.setUTCDate(
      cutoffDate.getUTCDate() - (trendWindowMode === "7d" ? 7 : 30),
    );

    return dashboard.timeline.filter(
      (point) => parseWeekOf(point.weekOf) >= cutoffDate,
    );
  }, [
    dashboard.timeline,
    selectedWeekFrom,
    selectedWeekTo,
    trendWindowMode,
    weekIndexMap,
  ]);
  const filteredLossReasonCounts = React.useMemo(
    () =>
      aggregateTextItems(filteredTimeline, (snapshot) => snapshot.lossReasonsTop3, 5),
    [filteredTimeline],
  );
  const filteredRepeatedRequestCounts = React.useMemo(
    () =>
      aggregateTextItems(filteredTimeline, (snapshot) => snapshot.repeatedRequests, 6),
    [filteredTimeline],
  );
  const visibleLatestSnapshot = filteredTimeline.at(-1) ?? latestSnapshot ?? null;
  const rangeStartSnapshot =
    filteredTimeline.length > 1 ? filteredTimeline[0] ?? null : null;

  const summarySentence = latestSnapshot
    ? `Week ending ${formatWeekLabelWithYear(
        latestSnapshot.weekOf,
      )} closed at ${formatMetricByKey(
        "closeRatePct",
        latestSnapshot.closeRatePct,
      )}, ${formatMetricByKey(
        "pipelineCoverageRatio",
        latestSnapshot.pipelineCoverageRatio,
      )} coverage, and ${formatMetricByKey(
        "feedRetentionPct",
        latestSnapshot.feedRetentionPct,
      )} feed retention.`
    : "No weekly snapshots have been saved yet.";

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "18rem",
          "--header-height": "4.25rem",
        } as React.CSSProperties
      }
      className="min-h-svh bg-transparent"
    >
      <AppSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        dashboard={dashboard}
      />
      <SidebarInset className="min-h-svh overflow-hidden border border-border bg-background">
        <SiteHeader
          activeTab={activeTab}
          onTabChange={setActiveTab}
          lastUpdatedLabel={dashboard.lastUpdatedLabel}
          totalWeeks={dashboard.totalWeeks}
        />

        <Tabs
          value={activeTab}
          onValueChange={(value) => {
            if (value !== null) {
              setActiveTab(value as DashboardTab);
            }
          }}
          className="@container/main flex flex-1 flex-col gap-0"
        >
          <div className="sticky top-0 z-20 border-b border-border bg-background px-4 py-4 lg:px-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex max-w-2xl flex-col gap-1">
                <h2 className="font-heading text-xl font-semibold tracking-tight">
                  {activeTabMeta.label}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {activeTabMeta.description}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  {dashboard.totalWeeks} weekly snapshots
                </Badge>
                {dashboard.lastUpdatedLabel ? (
                  <Badge variant="outline">
                    Updated {dashboard.lastUpdatedLabel}
                  </Badge>
                ) : null}
              </div>
            </div>
            <div className="mt-4 overflow-x-auto">
              <TabsList variant="line" className="gap-3 bg-transparent p-0">
                {DASHBOARD_TABS.map((tab) => {
                  const Icon = tabIconMap[tab.id];

                  return (
                    <TabsTrigger key={tab.id} value={tab.id}>
                      <Icon data-icon="inline-start" />
                      {tab.label}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>
            {hasData && activeTab !== "weekly-update" ? (
              <div className="mt-3 border-t border-border pt-3">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                    <div className="flex max-w-xl flex-col gap-1">
                      <div className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                        Trend range
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Applies to the charts and ranked signal tables in this
                        workspace.
                      </p>
                    </div>

                    <ToggleGroup
                      multiple={false}
                      value={[trendWindowMode]}
                      onValueChange={(values) => {
                        const nextValue = values[0];

                        if (
                          nextValue === "7d" ||
                          nextValue === "30d" ||
                          nextValue === "weeks"
                        ) {
                          setTrendWindowMode(nextValue);
                        }
                      }}
                      variant="outline"
                      size="default"
                      className="rounded-xl self-start"
                    >
                      <ToggleGroupItem
                        value="7d"
                        className="min-w-[8.75rem] justify-center px-4"
                      >
                        Last 7 days
                      </ToggleGroupItem>
                      <ToggleGroupItem
                        value="30d"
                        className="min-w-[8.75rem] justify-center px-4"
                      >
                        Last 30 days
                      </ToggleGroupItem>
                      <ToggleGroupItem
                        value="weeks"
                        className="min-w-[8.75rem] justify-center px-4"
                      >
                        Week range
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>

                  {trendWindowMode === "weeks" ? (
                    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border/70 bg-muted/30 px-3 py-2.5">
                      <div className="flex min-w-[12rem] items-start gap-2 pr-1">
                        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-background">
                          <CalendarRangeIcon className="size-4" />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-medium text-foreground">
                            Week ending range
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Choose the first and last weekly snapshot to include.
                          </span>
                        </div>
                      </div>

                      <div className="flex min-w-[12rem] flex-col gap-1">
                        <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                          Start week
                        </span>
                        <Select
                          value={selectedWeekFrom ?? undefined}
                          onValueChange={(value) => {
                            if (value !== null) {
                              const nextFromIndex = weekIndexMap.get(value);
                              const currentToIndex =
                                selectedWeekTo !== null
                                  ? weekIndexMap.get(selectedWeekTo)
                                  : undefined;

                              setSelectedWeekFrom(value);

                              if (
                                nextFromIndex !== undefined &&
                                currentToIndex !== undefined &&
                                nextFromIndex >= currentToIndex
                              ) {
                                const nextToWeek =
                                  dashboard.timeline[
                                    Math.min(nextFromIndex + 1, dashboard.timeline.length - 1)
                                  ]?.weekOf ?? null;

                                if (nextToWeek) {
                                  setSelectedWeekTo(nextToWeek);
                                }
                              }
                            }
                          }}
                        >
                          <SelectTrigger
                            className="w-full min-w-[12rem] bg-background"
                            aria-label="Select start week ending date"
                          >
                            <SelectValue>
                              {selectedWeekFrom
                                ? weekLabelMap.get(selectedWeekFrom)
                                : "Start week ending"}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Start week ending</SelectLabel>
                              {fromWeekOptions.map((option) => (
                                <SelectItem key={`from-${option.value}`} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex min-w-[12rem] flex-col gap-1">
                        <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                          End week
                        </span>
                        <Select
                          value={selectedWeekTo ?? undefined}
                          onValueChange={(value) => {
                            if (value !== null) {
                              const nextToIndex = weekIndexMap.get(value);
                              const currentFromIndex =
                                selectedWeekFrom !== null
                                  ? weekIndexMap.get(selectedWeekFrom)
                                  : undefined;

                              setSelectedWeekTo(value);

                              if (
                                nextToIndex !== undefined &&
                                currentFromIndex !== undefined &&
                                nextToIndex <= currentFromIndex
                              ) {
                                const nextFromWeek =
                                  dashboard.timeline[Math.max(nextToIndex - 1, 0)]?.weekOf ??
                                  null;

                                if (nextFromWeek) {
                                  setSelectedWeekFrom(nextFromWeek);
                                }
                              }
                            }
                          }}
                        >
                          <SelectTrigger
                            className="w-full min-w-[12rem] bg-background"
                            aria-label="Select end week ending date"
                          >
                            <SelectValue>
                              {selectedWeekTo
                                ? weekLabelMap.get(selectedWeekTo)
                                : "End week ending"}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>End week ending</SelectLabel>
                              {toWeekOptions.map((option) => (
                                <SelectItem key={`to-${option.value}`} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex flex-1 flex-col overflow-y-auto px-4 py-5 lg:px-6 lg:py-6">
            <TabsContent value="overview" className="flex flex-col gap-6">
              {hasData ? (
                <>
                  <Card className="border-border bg-card shadow-none">
                    <CardHeader className="gap-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex flex-col gap-1">
                          <CardTitle>Operating signal</CardTitle>
                          <CardDescription>{summarySentence}</CardDescription>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Week ending {formatWeekLabelWithYear(latestSnapshot!.weekOf)}
                        </div>
                      </div>
                    </CardHeader>
                  </Card>

                  <OverviewSection dashboard={dashboard} timeline={filteredTimeline} />

                  <MetricCardGrid
                    metricKeys={overviewMetricKeys}
                    latestSnapshot={visibleLatestSnapshot!}
                    comparisonSnapshot={rangeStartSnapshot}
                  />
                </>
              ) : (
                <EmptyDashboardState onOpenWeeklyUpdate={() => setActiveTab("weekly-update")} />
              )}
            </TabsContent>

            <TabsContent value="revenue-engine" className="flex flex-col gap-6">
              {hasData ? (
                <>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                    {revenueMetricKeys.map((key) => (
                      <MetricCard
                        key={key}
                        metricKey={key}
                        latestSnapshot={visibleLatestSnapshot!}
                        comparisonSnapshot={rangeStartSnapshot}
                      />
                    ))}
                  </div>
                  <RevenueSection dashboard={dashboard} timeline={filteredTimeline} />
                </>
              ) : (
                <EmptyDashboardState onOpenWeeklyUpdate={() => setActiveTab("weekly-update")} />
              )}
            </TabsContent>

            <TabsContent
              value="product-market-signal"
              className="flex flex-col gap-6"
            >
              {hasData ? (
                <>
                  <MetricCardGrid
                    metricKeys={productMetricKeys}
                    latestSnapshot={visibleLatestSnapshot!}
                    comparisonSnapshot={rangeStartSnapshot}
                  />
                  <ProductSignalSection
                    timeline={filteredTimeline}
                    lossReasonCounts={filteredLossReasonCounts}
                    repeatedRequestCounts={filteredRepeatedRequestCounts}
                  />
                </>
              ) : (
                <EmptyDashboardState onOpenWeeklyUpdate={() => setActiveTab("weekly-update")} />
              )}
            </TabsContent>

            <TabsContent value="delivery-stability" className="flex flex-col gap-6">
              {hasData ? (
                <>
                  <MetricCardGrid
                    metricKeys={deliveryMetricKeys}
                    latestSnapshot={visibleLatestSnapshot!}
                    comparisonSnapshot={rangeStartSnapshot}
                  />
                    <DeliverySection timeline={filteredTimeline} />
                </>
              ) : (
                <EmptyDashboardState onOpenWeeklyUpdate={() => setActiveTab("weekly-update")} />
              )}
            </TabsContent>

            <TabsContent value="weekly-update" className="flex flex-col gap-6">
              <WeeklyUpdateSection dashboard={dashboard} snapshots={snapshots} />
            </TabsContent>
          </div>
        </Tabs>
      </SidebarInset>
    </SidebarProvider>
  );
}

function EmptyDashboardState({
  onOpenWeeklyUpdate,
}: {
  onOpenWeeklyUpdate: () => void;
}) {
  return (
    <Card className="border-border bg-card shadow-none">
      <CardContent className="p-6">
        <Empty className="min-h-[22rem] border border-dashed border-border bg-background">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <LayoutDashboardIcon />
            </EmptyMedia>
            <EmptyTitle>No weekly history yet</EmptyTitle>
            <EmptyDescription>
              Save the first weekly snapshot to unlock trends, ranked signals,
              and delivery monitoring.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <button
              type="button"
              className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-3 text-sm font-medium shadow-sm transition-colors hover:bg-muted"
              onClick={onOpenWeeklyUpdate}
            >
              Open weekly update
            </button>
          </EmptyContent>
        </Empty>
      </CardContent>
    </Card>
  );
}

function MetricCardGrid({
  metricKeys,
  latestSnapshot,
  comparisonSnapshot,
}: {
  metricKeys: NumericMetricKey[];
  latestSnapshot: WeeklySnapshot;
  comparisonSnapshot: WeeklySnapshot | null;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {metricKeys.map((key) => (
        <MetricCard
          key={key}
          metricKey={key}
          latestSnapshot={latestSnapshot}
          comparisonSnapshot={comparisonSnapshot}
        />
      ))}
    </div>
  );
}

function MetricCard({
  metricKey,
  latestSnapshot,
  comparisonSnapshot,
}: {
  metricKey: NumericMetricKey;
  latestSnapshot: WeeklySnapshot;
  comparisonSnapshot: WeeklySnapshot | null;
}) {
  const field = metricFieldMap[metricKey];
  const Icon = summaryMetricIcons[metricKey] ?? ActivityIcon;
  const latestValue = latestSnapshot[metricKey];
  const previousValue = comparisonSnapshot?.[metricKey] ?? null;
  const comparison = getMetricRangeComparison(metricKey, latestValue, previousValue);
  const DeltaIcon =
    comparison.direction === "flat"
      ? null
      : comparison.direction === "up"
        ? ArrowUpRightIcon
        : ArrowDownRightIcon;

  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader className="gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted">
              <Icon />
            </div>
            <div className="min-w-0">
              <CardDescription>{field.shortLabel}</CardDescription>
              <CardTitle className="mt-1 text-xl">
                {formatMetricByKey(metricKey, latestValue)}
              </CardTitle>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">{field.description}</p>
          <div
            className={cn(
              "flex items-center gap-2 text-sm",
              comparison.tone === "positive" &&
                "text-emerald-600 dark:text-emerald-400",
              comparison.tone === "negative" && "text-rose-600 dark:text-rose-400",
              comparison.tone === "neutral" && "text-muted-foreground",
            )}
          >
            {DeltaIcon ? <DeltaIcon className="size-4" /> : null}
            <span>{comparison.longText}</span>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}

function OverviewSection({
  dashboard,
  timeline,
}: {
  dashboard: DashboardData;
  timeline: DashboardData["timeline"];
}) {
  const hasAlerts = dashboard.healthAlerts.length > 0;

  return (
    <div
      className={
        hasAlerts
          ? "grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(18rem,0.95fr)]"
          : "grid gap-4"
      }
    >
      <PipelineMomentumCard timeline={timeline} compact />
      {hasAlerts ? (
        <div className="flex flex-col gap-3">
          {dashboard.healthAlerts.map((alert) => (
            <Alert key={alert.id} variant={alert.variant}>
              <TriangleAlertIcon />
              <AlertTitle>{alert.title}</AlertTitle>
              <AlertDescription>{alert.description}</AlertDescription>
            </Alert>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function RevenueSection({
  dashboard,
  timeline,
}: {
  dashboard: DashboardData;
  timeline: DashboardData["timeline"];
}) {
  return (
    <>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <PipelineMomentumCard timeline={timeline} />
        <RevenueConversionCard timeline={timeline} />
      </div>
      <StageFlowCard stageMetrics={dashboard.latestStageMetrics} />
    </>
  );
}

function ProductSignalSection({
  timeline,
  lossReasonCounts,
  repeatedRequestCounts,
}: {
  timeline: DashboardData["timeline"];
  lossReasonCounts: RankedTextItem[];
  repeatedRequestCounts: RankedTextItem[];
}) {
  return (
    <>
      <RetentionSignalCard timeline={timeline} />
      <div className="grid gap-4 xl:grid-cols-2">
        <RankedSignalsCard
          title="Why deals are lost"
          description="Aggregated top reasons from the selected trend range."
          items={lossReasonCounts}
        />
        <RankedSignalsCard
          title="What customers repeatedly ask for"
          description="Recurring asks normalized across the selected trend range."
          items={repeatedRequestCounts}
        />
      </div>
    </>
  );
}

function DeliverySection({
  timeline,
}: {
  timeline: DashboardData["timeline"];
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <DeliveryVolumeCard timeline={timeline} />
      <DeliveryReliabilityCard timeline={timeline} />
    </div>
  );
}

function WeeklyUpdateSection({
  dashboard,
  snapshots,
}: {
  dashboard: DashboardData;
  snapshots: WeeklySnapshot[];
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_22rem]">
      <WeeklyUpdateForm
        latestSnapshot={dashboard.latestSnapshot}
        snapshots={snapshots}
        suggestedWeekOf={dashboard.suggestedWeekOf}
      />

      <div className="flex flex-col gap-4">
        <Card className="border-border bg-card shadow-none">
          <CardHeader className="gap-1.5">
            <CardTitle className="text-base">Update rules</CardTitle>
            <CardDescription>
              Keep manual entry consistent from week to week.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
            <p>Use one full snapshot per Friday week-ending date.</p>
            <p>
              Re-saving the same week replaces the existing record instead of
              creating duplicates.
            </p>
            <p>
              Keep lost reasons tight and specific, and add recurring requests
              one request per line.
            </p>
          </CardContent>
        </Card>

        <RecentSnapshotsCard snapshots={snapshots} />
      </div>
    </div>
  );
}

function ChartStatRow({ items }: { items: ChartStatItem[] }) {
  if (!items.length) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Badge
          key={item.label}
          variant="secondary"
          className="gap-2 px-3 py-1.5 text-[13px]"
        >
          <span>
            {item.label}: {item.value}
          </span>
          {item.comparison ? (
            <span
              className={cn(
                "text-[11px] font-medium",
                item.comparison.tone === "positive" &&
                  "text-emerald-600 dark:text-emerald-400",
                item.comparison.tone === "negative" &&
                  "text-rose-600 dark:text-rose-400",
                item.comparison.tone === "neutral" && "text-muted-foreground",
              )}
            >
              {item.comparison.shortText}
            </span>
          ) : null}
        </Badge>
      ))}
    </div>
  );
}

function ChartViewToggle<T extends string>({
  label,
  options,
  value,
  onValueChange,
}: {
  label: string;
  options: readonly ChartViewOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </span>
      <ToggleGroup
        multiple={false}
        value={[value]}
        onValueChange={(values) => {
          const nextValue = values[0];

          if (
            typeof nextValue === "string" &&
            options.some((option) => option.value === nextValue)
          ) {
            onValueChange(nextValue as T);
          }
        }}
        variant="outline"
        size="sm"
      >
        {options.map((option) => (
          <ToggleGroupItem key={option.value} value={option.value}>
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}

function formatShortRangeDelta(
  value: number,
  previousValue: number,
  formatter: (value: number) => string,
) {
  const delta = value - previousValue;

  if (delta === 0) {
    return "No change";
  }

  return `${delta > 0 ? "+" : "−"}${formatter(Math.abs(delta))}`;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ShortRangeComparisonChart<TPoint extends { weekOf: string }>({
  timeline,
  series,
}: {
  timeline: TPoint[];
  series: ShortRangeSeries<TPoint>[];
}) {
  const comparePoints = timeline.slice(-2);

  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-[minmax(0,1fr)_repeat(2,minmax(0,1fr))] gap-3">
        <div />
        {comparePoints.map((point) => (
          <div
            key={point.weekOf}
            className="rounded-lg border border-border/70 bg-background/80 px-3 py-2 text-center"
          >
            <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Week ending
            </div>
            <div className="mt-1 text-sm font-semibold text-foreground">
              {formatWeekLabelWithYear(point.weekOf)}
            </div>
          </div>
        ))}
      </div>

      {series.map((seriesItem) => {
        const values = comparePoints.map((point) =>
          Math.max(0, seriesItem.valueAccessor(point)),
        );
        const maxValue = Math.max(...values, 1);

        return (
          <div
            key={seriesItem.key}
            className="grid grid-cols-[minmax(0,1fr)_repeat(2,minmax(0,1fr))] gap-3"
          >
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: seriesItem.color }}
              />
              <span>{seriesItem.label}</span>
            </div>

            {comparePoints.map((point, index) => {
              const value = values[index];
              const previousValue = values[Math.max(0, index - 1)];
              const width = Math.max(14, Math.min(100, (value / maxValue) * 100));

              return (
                <div
                  key={`${seriesItem.key}-${point.weekOf}`}
                  className="rounded-lg border border-border/70 bg-background/70 px-3 py-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold tabular-nums text-foreground">
                      {seriesItem.valueFormatter(value)}
                    </span>
                    {index === 1 ? (
                      <span className="text-[11px] font-medium text-muted-foreground">
                        {formatShortRangeDelta(
                          value,
                          previousValue,
                          seriesItem.valueFormatter,
                        )}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted/80">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${width}%`,
                        backgroundColor: seriesItem.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function PipelineMomentumCard({
  timeline,
  compact = false,
}: {
  timeline: DashboardData["timeline"];
  compact?: boolean;
}) {
  const [view, setView] = React.useState<"combined" | "value" | "velocity">(
    "combined",
  );
  const latestPoint = timeline.at(-1);
  const baselinePoint = timeline.length > 1 ? timeline[0] ?? null : null;
  const tickGap = getAdaptiveTickGap(timeline);
  const xAxisPadding = getAdaptiveXAxisPadding(timeline);
  const curveType = getAdaptiveCurveType(timeline);
  const pipelineValueDot = getAdaptiveLineDot(
    "var(--color-pipelineValue)",
    timeline,
  );
  const pipelineVelocityDot = getAdaptiveLineDot(
    "var(--color-pipelineVelocity)",
    timeline,
  );
  const isShortRange = isShortRangeTimeline(timeline);
  const showValue = view !== "velocity";
  const showVelocity = view !== "value";
  const chartAnimationKey = getTimelineAnimationKey(timeline, view);

  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader className="gap-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <CardTitle>Pipeline momentum</CardTitle>
            <CardDescription>
              Pipeline value and pipeline velocity across the selected trend
              range.
            </CardDescription>
          </div>
          <ChartViewToggle
            label="Chart"
            options={[
              { value: "combined", label: "Combined" },
              { value: "value", label: "Value" },
              { value: "velocity", label: "Velocity" },
            ]}
            value={view}
            onValueChange={setView}
          />
        </div>
        {latestPoint ? (
          <ChartStatRow
            items={[
              createChartStatItem(
                "pipelineValue",
                "Pipeline value",
                latestPoint.pipelineValue,
                baselinePoint?.pipelineValue,
              ),
              createChartStatItem(
                "pipelineVelocity",
                "Velocity",
                latestPoint.pipelineVelocity,
                baselinePoint?.pipelineVelocity,
              ),
            ]}
          />
        ) : null}
      </CardHeader>
      <CardContent className="pt-0">
        <div className={chartFrameClassName}>
          <ChartContainer
            key={chartAnimationKey}
            config={pipelineMomentumConfig}
            className={cn(
              compact ? "h-[272px] w-full" : "h-[332px] w-full",
              "animate-chart-load",
            )}
          >
            <ComposedChart accessibilityLayer data={timeline} margin={defaultChartMargin}>
              <defs>
                <linearGradient id="pipelineValueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-pipelineValue)" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="var(--color-pipelineValue)" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="4 6" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                minTickGap={tickGap}
                padding={xAxisPadding}
                scale={isShortRange ? "point" : undefined}
              />
              {showValue ? (
                <YAxis
                  yAxisId="left"
                  tickLine={false}
                  axisLine={false}
                  width={72}
                  tickFormatter={formatCurrencyTick}
                />
              ) : null}
              {showVelocity ? (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                  width={64}
                  tickFormatter={formatCurrencyTick}
                />
              ) : null}
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(label) => `Week ending ${label}`}
                    formatter={(value, name) => (
                      <div className="flex flex-1 items-center justify-between gap-3">
                        <span className="text-muted-foreground">
                          {
                            pipelineMomentumConfig[
                              String(name) as keyof typeof pipelineMomentumConfig
                            ]?.label
                          }
                        </span>
                        <span className="font-mono font-medium text-foreground">
                          {formatMetricByKey(
                            String(name) as NumericMetricKey,
                            Number(value),
                          )}
                        </span>
                      </div>
                    )}
                    indicator="dot"
                  />
                }
              />
              <ChartLegend
                verticalAlign="top"
                content={<ChartLegendContent className="justify-start" />}
              />
              {showValue ? (
                <Area
                  yAxisId="left"
                  type={curveType}
                  dataKey="pipelineValue"
                  stroke="var(--color-pipelineValue)"
                  fill="url(#pipelineValueFill)"
                  strokeWidth={getAdaptiveLineStrokeWidth(timeline, 2.5)}
                  dot={pipelineValueDot}
                  activeDot={{
                    r: 4,
                    fill: "var(--color-pipelineValue)",
                    stroke: "var(--background)",
                    strokeWidth: 2,
                  }}
                  {...getSeriesAnimationProps(0)}
                />
              ) : null}
              {showVelocity ? (
                <Line
                  yAxisId="right"
                  type={curveType}
                  dataKey="pipelineVelocity"
                  stroke="var(--color-pipelineVelocity)"
                  strokeWidth={getAdaptiveLineStrokeWidth(timeline, 2.75)}
                  dot={pipelineVelocityDot}
                  activeDot={{
                    r: 4,
                    fill: "var(--color-pipelineVelocity)",
                    stroke: "var(--background)",
                    strokeWidth: 2,
                  }}
                  {...getSeriesAnimationProps(1)}
                />
              ) : null}
            </ComposedChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function RevenueConversionCard({
  timeline,
}: {
  timeline: DashboardData["timeline"];
}) {
  const latestPoint = timeline.at(-1);
  const baselinePoint = timeline.length > 1 ? timeline[0] ?? null : null;
  const tickGap = getAdaptiveTickGap(timeline);
  const isShortRange = isShortRangeTimeline(timeline);
  const xAxisPadding = getAdaptiveXAxisPadding(timeline);
  const curveType = getAdaptiveCurveType(timeline);
  const yAxisMax = getMetricUpperBound(
    timeline,
    [
      "marketingSourcedPipelinePct",
      "leadToOpportunityConversionPct",
      "closeRatePct",
    ],
    { minimum: 40, maximum: 100, padding: 8, roundTo: 5 },
  );
  const closeRateDot = getAdaptiveLineDot("var(--color-closeRatePct)", timeline);
  const leadToOpportunityDot = getAdaptiveLineDot(
    "var(--color-leadToOpportunityConversionPct)",
    timeline,
  );
  const coverageDot = getAdaptiveLineDot(
    "var(--color-pipelineCoverageRatio)",
    timeline,
  );
  const marketingSourcedDot = getAdaptiveLineDot(
    "var(--color-marketingSourcedPipelinePct)",
    timeline,
  );
  const coverageAxisMax = getMetricUpperBound(
    timeline,
    ["pipelineCoverageRatio"],
    { minimum: 3, padding: 0.5, roundTo: 0.5 },
  );
  const chartAnimationKey = getTimelineAnimationKey(timeline, "revenue");

  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader className="gap-3">
        <div className="space-y-1">
          <CardTitle>Revenue engine</CardTitle>
          <CardDescription>
            One operating view for sourced demand, conversion quality, and
            pipeline coverage.
          </CardDescription>
        </div>
        {latestPoint ? (
          <ChartStatRow
            items={[
              createChartStatItem(
                "pipelineCoverageRatio",
                "Coverage ratio",
                latestPoint.pipelineCoverageRatio,
                baselinePoint?.pipelineCoverageRatio,
              ),
              createChartStatItem(
                "marketingSourcedPipelinePct",
                "Marketing sourced",
                latestPoint.marketingSourcedPipelinePct,
                baselinePoint?.marketingSourcedPipelinePct,
              ),
              createChartStatItem(
                "leadToOpportunityConversionPct",
                "Lead to opp",
                latestPoint.leadToOpportunityConversionPct,
                baselinePoint?.leadToOpportunityConversionPct,
              ),
              createChartStatItem(
                "closeRatePct",
                "Close rate",
                latestPoint.closeRatePct,
                baselinePoint?.closeRatePct,
              ),
            ]}
          />
        ) : null}
      </CardHeader>
      <CardContent className="pt-0">
        <div className={chartFrameClassName}>
          <ChartContainer
            key={chartAnimationKey}
            config={conversionConfig}
            className="h-[332px] w-full animate-chart-load"
          >
            <ComposedChart accessibilityLayer data={timeline} margin={defaultChartMargin}>
              <defs>
                <linearGradient id="marketingSourcedFill" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-marketingSourcedPipelinePct)"
                    stopOpacity={0.24}
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--color-marketingSourcedPipelinePct)"
                    stopOpacity={0.03}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="4 6" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                minTickGap={tickGap}
                padding={xAxisPadding}
                scale={isShortRange ? "point" : undefined}
              />
              <YAxis
                yAxisId="left"
                tickLine={false}
                axisLine={false}
                width={56}
                domain={[0, yAxisMax]}
                tickFormatter={(value) => `${value}%`}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickLine={false}
                axisLine={false}
                width={48}
                domain={[0, coverageAxisMax]}
                tickFormatter={(value) => `${value}x`}
              />
              <ReferenceLine yAxisId="left" y={25} stroke="var(--border)" strokeDasharray="4 6" />
              <ReferenceLine
                yAxisId="right"
                y={3}
                stroke="var(--border)"
                strokeDasharray="4 6"
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(label) => `Week ending ${label}`}
                    formatter={(value, name) => {
                      const key = String(name);

                      const labelMap: Record<string, string> = {
                        marketingSourcedPipelinePct: "Marketing-sourced pipeline",
                        leadToOpportunityConversionPct: "Lead to opportunity",
                        closeRatePct: "Close rate",
                        pipelineCoverageRatio: "Coverage ratio",
                      };

                      const formattedValue =
                        key === "pipelineCoverageRatio"
                          ? `${Number(value).toFixed(1)}x`
                          : formatMetricByKey(key as NumericMetricKey, Number(value));

                      return (
                        <div className="flex flex-1 items-center justify-between gap-3">
                          <span className="text-muted-foreground">{labelMap[key]}</span>
                          <span className="font-mono font-medium text-foreground">
                            {formattedValue}
                          </span>
                        </div>
                      );
                    }}
                  />
                }
              />
              <ChartLegend
                verticalAlign="top"
                content={<ChartLegendContent className="justify-start" />}
              />
              <Area
                yAxisId="left"
                dataKey="marketingSourcedPipelinePct"
                type={curveType}
                stroke="var(--color-marketingSourcedPipelinePct)"
                fill="url(#marketingSourcedFill)"
                strokeWidth={getAdaptiveLineStrokeWidth(timeline, 2.5)}
                dot={marketingSourcedDot}
                activeDot={{
                  r: 4,
                  fill: "var(--color-marketingSourcedPipelinePct)",
                  stroke: "var(--background)",
                  strokeWidth: 2,
                }}
                {...getSeriesAnimationProps(0)}
              />
              <Line
                yAxisId="left"
                dataKey="leadToOpportunityConversionPct"
                type={curveType}
                stroke="var(--color-leadToOpportunityConversionPct)"
                strokeWidth={getAdaptiveLineStrokeWidth(timeline, 2.5)}
                strokeDasharray="6 4"
                dot={leadToOpportunityDot}
                activeDot={{
                  r: 4,
                  fill: "var(--color-leadToOpportunityConversionPct)",
                  stroke: "var(--background)",
                  strokeWidth: 2,
                }}
                {...getSeriesAnimationProps(1)}
              />
              <Line
                yAxisId="left"
                dataKey="closeRatePct"
                type={curveType}
                stroke="var(--color-closeRatePct)"
                strokeWidth={getAdaptiveLineStrokeWidth(timeline, 2.85)}
                dot={closeRateDot}
                activeDot={{
                  r: 4,
                  fill: "var(--color-closeRatePct)",
                  stroke: "var(--background)",
                  strokeWidth: 2,
                }}
                {...getSeriesAnimationProps(2)}
              />
              <Line
                yAxisId="right"
                dataKey="pipelineCoverageRatio"
                type={curveType}
                stroke="var(--color-pipelineCoverageRatio)"
                strokeWidth={getAdaptiveLineStrokeWidth(timeline, 2.35)}
                strokeDasharray="4 4"
                dot={coverageDot}
                activeDot={{
                  r: 4,
                  fill: "var(--color-pipelineCoverageRatio)",
                  stroke: "var(--background)",
                  strokeWidth: 2,
                }}
                {...getSeriesAnimationProps(3)}
              />
            </ComposedChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function StageFlowCard({
  stageMetrics,
}: {
  stageMetrics: DashboardData["latestStageMetrics"];
}) {
  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader className="gap-1.5">
        <CardTitle>Stage flow</CardTitle>
        <CardDescription>
          Current-stage conversion and average time in stage for the latest
          snapshot.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Stage</TableHead>
              <TableHead>Conversion</TableHead>
              <TableHead>Time in stage</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stageMetrics.map((metric) => (
              <TableRow key={metric.stage}>
                <TableCell className="font-medium">{metric.stage}</TableCell>
                <TableCell className="w-[45%] min-w-[14rem] whitespace-normal">
                  <Progress value={metric.conversionPct} className="w-full">
                    <ProgressLabel>{formatMetricValue(metric.conversionPct, "percent")}</ProgressLabel>
                    <span className="ml-auto text-sm text-muted-foreground tabular-nums">
                      {formatMetricValue(metric.conversionPct, "percent")}
                    </span>
                  </Progress>
                </TableCell>
                <TableCell>{formatMetricValue(metric.avgDaysInStage, "days")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function RetentionSignalCard({
  timeline,
}: {
  timeline: DashboardData["timeline"];
}) {
  const [view, setView] = React.useState<"all" | "customer" | "revenue">(
    "all",
  );
  const latestPoint = timeline.at(-1);
  const baselinePoint = timeline.length > 1 ? timeline[0] ?? null : null;
  const tickGap = getAdaptiveTickGap(timeline);
  const isShortRange = isShortRangeTimeline(timeline);
  const xAxisPadding = getAdaptiveXAxisPadding(timeline);
  const curveType = getAdaptiveCurveType(timeline);
  const feedRetentionDot = getAdaptiveLineDot(
    "var(--color-feedRetentionPct)",
    timeline,
  );
  const netRevenueDot = getAdaptiveLineDot(
    "var(--color-netRevenueRetentionPct)",
    timeline,
  );
  const grossRevenueDot = getAdaptiveLineDot(
    "var(--color-grossRevenueRetentionPct)",
    timeline,
  );
  const showFeed = view !== "revenue";
  const showGrossRevenue = view !== "customer";
  const chartAnimationKey = getTimelineAnimationKey(timeline, view);

  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader className="gap-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <CardTitle>Retention signal</CardTitle>
            <CardDescription>
              Compare customer stickiness and revenue retention without crowding
              the chart.
            </CardDescription>
          </div>
          <ChartViewToggle
            label="Chart"
            options={[
              { value: "all", label: "All" },
              { value: "customer", label: "Customer" },
              { value: "revenue", label: "Revenue" },
            ]}
            value={view}
            onValueChange={setView}
          />
        </div>
        {latestPoint ? (
          <ChartStatRow
            items={[
              createChartStatItem(
                "feedRetentionPct",
                "Feed retention",
                latestPoint.feedRetentionPct,
                baselinePoint?.feedRetentionPct,
              ),
              createChartStatItem(
                "netRevenueRetentionPct",
                "NRR",
                latestPoint.netRevenueRetentionPct,
                baselinePoint?.netRevenueRetentionPct,
              ),
              createChartStatItem(
                "grossRevenueRetentionPct",
                "GRR",
                latestPoint.grossRevenueRetentionPct,
                baselinePoint?.grossRevenueRetentionPct,
              ),
            ]}
          />
        ) : null}
      </CardHeader>
      <CardContent className="pt-0">
        <div className={chartFrameClassName}>
          <ChartContainer
            key={chartAnimationKey}
            config={retentionConfig}
            className="h-[332px] w-full animate-chart-load"
          >
            <ComposedChart accessibilityLayer data={timeline} margin={defaultChartMargin}>
              <defs>
                <linearGradient id="feedRetentionFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-feedRetentionPct)" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="var(--color-feedRetentionPct)" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="netRevenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-netRevenueRetentionPct)" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="var(--color-netRevenueRetentionPct)" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="4 6" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                minTickGap={tickGap}
                padding={xAxisPadding}
                scale={isShortRange ? "point" : undefined}
              />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={56}
              domain={[
                (dataMin: number) => Math.max(0, Math.floor(dataMin - 4)),
                (dataMax: number) => Math.min(150, Math.ceil(dataMax + 4)),
              ]}
              allowDecimals={false}
              tickFormatter={(value) => `${value}%`}
            />
            <ReferenceLine y={100} stroke="var(--border)" strokeDasharray="4 6" />
            <ChartTooltip
              itemSorter={(item) => {
                const dataKey = String(item.dataKey);

                return (
                  retentionTooltipOrder[
                    dataKey as keyof typeof retentionTooltipOrder
                  ] ?? 99
                );
              }}
              content={
                <ChartTooltipContent
                  labelFormatter={(label) => `Week ending ${label}`}
                  formatter={(value, name) => (
                    <div className="flex flex-1 items-center justify-between gap-3">
                      <span className="text-muted-foreground">
                        {retentionConfig[String(name) as keyof typeof retentionConfig]?.label}
                      </span>
                      <span className="font-mono font-medium text-foreground">
                        {formatMetricByKey(
                          String(name) as NumericMetricKey,
                          Number(value),
                        )}
                      </span>
                    </div>
                  )}
                />
              }
            />
              <ChartLegend
                verticalAlign="top"
                content={<ChartLegendContent className="justify-start" />}
              />
              {showFeed ? (
                <Area
                  dataKey="feedRetentionPct"
                  type={curveType}
                  stroke="var(--color-feedRetentionPct)"
                  fill="url(#feedRetentionFill)"
                  strokeWidth={getAdaptiveLineStrokeWidth(timeline, 2.5)}
                  dot={feedRetentionDot}
                  activeDot={{
                    r: 4,
                    fill: "var(--color-feedRetentionPct)",
                    stroke: "var(--background)",
                    strokeWidth: 2,
                  }}
                  {...getSeriesAnimationProps(0)}
                />
              ) : null}
              <Area
                dataKey="netRevenueRetentionPct"
                type={curveType}
                stroke="var(--color-netRevenueRetentionPct)"
                fill="url(#netRevenueFill)"
                strokeWidth={getAdaptiveLineStrokeWidth(timeline, 2.5)}
                dot={netRevenueDot}
                activeDot={{
                  r: 4,
                  fill: "var(--color-netRevenueRetentionPct)",
                  stroke: "var(--background)",
                  strokeWidth: 2,
                }}
                {...getSeriesAnimationProps(1)}
              />
              {showGrossRevenue ? (
                <Line
                  dataKey="grossRevenueRetentionPct"
                  type={curveType}
                  stroke="var(--color-grossRevenueRetentionPct)"
                  strokeWidth={getAdaptiveLineStrokeWidth(timeline, 2.5)}
                  dot={grossRevenueDot}
                  activeDot={{
                    r: 4,
                    fill: "var(--color-grossRevenueRetentionPct)",
                    stroke: "var(--background)",
                    strokeWidth: 2,
                  }}
                  {...getSeriesAnimationProps(2)}
                />
              ) : null}
            </ComposedChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function RankedSignalsCard({
  description,
  items,
  title,
}: {
  title: string;
  description: string;
  items: RankedTextItem[];
}) {
  return (
    <Card className="border-border/60 bg-card/90 shadow-sm">
      <CardHeader className="gap-1.5">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Signal</TableHead>
                <TableHead>Count</TableHead>
                <TableHead>Last seen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.label}>
                  <TableCell className="max-w-0 whitespace-normal font-medium">
                    {item.label}
                  </TableCell>
                  <TableCell>{item.count}</TableCell>
                  <TableCell>{item.lastSeenLabel}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Empty className="min-h-[14rem] border border-dashed border-border bg-background">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ListIcon />
              </EmptyMedia>
              <EmptyTitle>No ranked signals yet</EmptyTitle>
              <EmptyDescription>
                Repeated requests and loss reasons will appear here after the
                first weekly snapshot is saved.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </CardContent>
    </Card>
  );
}

function DeliveryVolumeCard({
  timeline,
}: {
  timeline: DashboardData["timeline"];
}) {
  const [view, setView] = React.useState<"throughput" | "win-rate">(
    "throughput",
  );
  const volumeTimeline = React.useMemo(
    () =>
      timeline.map((point, index) => ({
        ...point,
        rangePosition:
          timeline.length > 1 ? index / (timeline.length - 1) : 0,
        proposalWinRatePct:
          point.proposalsSent > 0 ? (point.ordersWon / point.proposalsSent) * 100 : 0,
      })),
    [timeline],
  );
  const latestPoint = timeline.at(-1);
  const baselinePoint = timeline.length > 1 ? timeline[0] ?? null : null;
  const tickGap = getAdaptiveTickGap(timeline);
  const isShortRange = isShortRangeTimeline(timeline);
  const xAxisPadding = getAdaptiveXAxisPadding(timeline);
  const throughputXAxisPadding =
    view === "throughput" && isShortRange ? { left: 20, right: 20 } : xAxisPadding;
  const throughputXAxisScale = view === "throughput" ? undefined : isShortRange ? "point" : undefined;
  const throughputTrendXAxisId = isShortRange ? "edge" : "bars";
  const useTwoPointThroughputBars = isShortRange && view === "throughput";
  const curveType = getAdaptiveCurveType(timeline);
  const proposalWinRateDot = getAdaptiveLineDot(
    "var(--color-proposalWinRatePct)",
    volumeTimeline,
  );
  const latestVolumePoint = volumeTimeline.at(-1);
  const baselineVolumePoint = volumeTimeline.length > 1 ? volumeTimeline[0] ?? null : null;
  const proposalsAxisMax = getMetricUpperBound(
    timeline,
    ["proposalsSent"],
    { minimum: 16, padding: 2, roundTo: 2 },
  );
  const winRateAxisMax = React.useMemo(() => {
    const maxRate = volumeTimeline.reduce(
      (currentMax, point) => Math.max(currentMax, point.proposalWinRatePct),
      0,
    );

    return Math.min(60, Math.max(30, Math.ceil((maxRate + 4) / 5) * 5));
  }, [volumeTimeline]);
  const deliveryTooltipLabelMap: Record<string, string> = {
    proposalsSent: "Proposals sent",
    ordersWon: "Orders won",
    proposalWinRatePct: "Proposal win rate",
  };
  const chartAnimationKey = getTimelineAnimationKey(
    volumeTimeline,
    `${view}-${useTwoPointThroughputBars ? "bars" : "mixed"}`,
  );

  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader className="gap-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <CardTitle>Proposal throughput</CardTitle>
            <CardDescription>
              Track proposal load, wins, and conversion efficiency in the
              selected range.
            </CardDescription>
          </div>
          <ChartViewToggle
            label="Chart"
            options={[
              { value: "throughput", label: "Throughput" },
              { value: "win-rate", label: "Win rate" },
            ]}
            value={view}
            onValueChange={setView}
          />
        </div>
        {latestPoint && latestVolumePoint ? (
          <ChartStatRow
            items={[
              {
                ...createChartStatItem(
                  "proposalsSent",
                  "Proposals",
                  latestPoint.proposalsSent,
                  baselinePoint?.proposalsSent,
                ),
              },
              {
                ...createChartStatItem(
                  "ordersWon",
                  "Orders won",
                  latestPoint.ordersWon,
                  baselinePoint?.ordersWon,
                ),
              },
              {
                label: "Win rate",
                value: formatMetricValue(latestVolumePoint.proposalWinRatePct, "percent"),
                comparison: getRangeComparison(
                  "up",
                  latestVolumePoint.proposalWinRatePct,
                  baselineVolumePoint?.proposalWinRatePct,
                ),
              },
            ]}
          />
        ) : null}
      </CardHeader>
      <CardContent className="pt-0">
        <div className={chartFrameClassName}>
          <ChartContainer
            key={chartAnimationKey}
            config={deliveryVolumeConfig}
            className="h-[312px] w-full animate-chart-load"
          >
            <ComposedChart
              accessibilityLayer
              data={volumeTimeline}
              margin={defaultChartMargin}
              barCategoryGap={
                view === "throughput"
                  ? isShortRange
                    ? "12%"
                    : "8%"
                  : isShortRange
                    ? "8%"
                    : "18%"
              }
              barGap={view === "throughput" ? (isShortRange ? 8 : 4) : 0}
            >
              <defs>
                <linearGradient id="proposalsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-proposalsSent)" stopOpacity={0.82} />
                  <stop offset="100%" stopColor="var(--color-proposalsSent)" stopOpacity={0.16} />
                </linearGradient>
                <linearGradient id="ordersFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-ordersWon)" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="var(--color-ordersWon)" stopOpacity={0.24} />
                </linearGradient>
                <linearGradient id="winRateFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-proposalWinRatePct)" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="var(--color-proposalWinRatePct)" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="4 6" />
              <XAxis
                xAxisId="bars"
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                minTickGap={tickGap}
                padding={throughputXAxisPadding}
                scale={throughputXAxisScale}
              />
              {isShortRange ? (
                <XAxis
                  xAxisId="edge"
                  dataKey="rangePosition"
                  type="number"
                  domain={[0, 1]}
                  hide
                />
              ) : null}
              {view === "throughput" ? (
                <>
                  <YAxis
                    yAxisId="left"
                    tickLine={false}
                    axisLine={false}
                    width={48}
                    domain={[0, proposalsAxisMax]}
                    allowDecimals={false}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tickLine={false}
                    axisLine={false}
                    width={52}
                    domain={[0, winRateAxisMax]}
                    tickFormatter={(value) => `${value}%`}
                    hide={useTwoPointThroughputBars}
                  />
                </>
              ) : view === "win-rate" ? (
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={52}
                  domain={[0, winRateAxisMax]}
                  tickFormatter={(value) => `${value}%`}
                />
              ) : (
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={48}
                  domain={[0, proposalsAxisMax]}
                  allowDecimals={false}
                />
              )}
              {view === "win-rate" || (view === "throughput" && !useTwoPointThroughputBars) ? (
                <ReferenceLine y={25} stroke="var(--border)" strokeDasharray="4 6" />
              ) : null}
              <ChartTooltip
                content={({ active, label, payload }) => {
                  if (!active || !payload?.length) {
                    return null;
                  }

                  return (
                    <ChartTooltipContent
                      active={active}
                      itemSorter={(item) => {
                        const order = {
                          proposalsSent: 0,
                          ordersWon: 1,
                          proposalWinRatePct: 2,
                        } as const;

                        return order[String(item.dataKey) as keyof typeof order] ?? 99;
                      }}
                      label={payload[0]?.payload?.label ?? label}
                      payload={payload}
                      labelFormatter={(tooltipLabel) => `Week ending ${tooltipLabel}`}
                      formatter={(value, name) => {
                        const key = String(name);

                        return (
                          <div className="flex flex-1 items-center justify-between gap-3">
                            <span className="text-muted-foreground">
                              {deliveryTooltipLabelMap[key]}
                            </span>
                            <span className="font-mono font-medium text-foreground">
                              {key === "proposalWinRatePct"
                                ? formatMetricValue(Number(value), "percent")
                                : formatMetricByKey(key as NumericMetricKey, Number(value))}
                            </span>
                          </div>
                        );
                      }}
                    />
                  );
                }}
              />
              <ChartLegend
                verticalAlign="top"
                content={<ChartLegendContent className="justify-start" />}
              />
              {view === "throughput" ? (
                <>
                  <Bar
                    xAxisId="bars"
                    yAxisId="left"
                    dataKey="proposalsSent"
                    fill="url(#proposalsFill)"
                    radius={isShortRange ? [12, 12, 0, 0] : [10, 10, 0, 0]}
                    maxBarSize={getAdaptiveBarSize(timeline, 30)}
                    minPointSize={getAdaptiveMinPointSize(timeline)}
                    label={
                      useTwoPointThroughputBars
                        ? (props) =>
                            renderBarValueLabel(
                              props,
                              (value) => formatMetricByKey("proposalsSent", value),
                              "var(--color-proposalsSent)",
                            )
                        : false
                    }
                    {...getSeriesAnimationProps(0)}
                  />
                  <Bar
                    xAxisId="bars"
                    yAxisId="left"
                    dataKey="ordersWon"
                    fill="url(#ordersFill)"
                    radius={isShortRange ? [12, 12, 0, 0] : [10, 10, 0, 0]}
                    maxBarSize={getAdaptiveBarSize(timeline, 22)}
                    minPointSize={getAdaptiveMinPointSize(timeline)}
                    label={
                      useTwoPointThroughputBars
                        ? (props) =>
                            renderBarValueLabel(
                              props,
                              (value) => formatMetricByKey("ordersWon", value),
                              "var(--color-ordersWon)",
                            )
                        : false
                    }
                    {...getSeriesAnimationProps(1)}
                  />
                  {useTwoPointThroughputBars ? (
                    <Bar
                      xAxisId="bars"
                      yAxisId="right"
                      dataKey="proposalWinRatePct"
                      fill="url(#winRateFill)"
                      radius={isShortRange ? [12, 12, 0, 0] : [10, 10, 0, 0]}
                      maxBarSize={getAdaptiveBarSize(timeline, 16)}
                      minPointSize={getAdaptiveMinPointSize(timeline)}
                      label={(props) =>
                        renderBarValueLabel(
                          props,
                          (value) => formatMetricValue(value, "percent"),
                          "var(--color-proposalWinRatePct)",
                        )
                      }
                      {...getSeriesAnimationProps(2)}
                    />
                  ) : (
                    <Line
                      xAxisId={throughputTrendXAxisId}
                      yAxisId="right"
                      dataKey="proposalWinRatePct"
                      type={curveType}
                      stroke="var(--color-proposalWinRatePct)"
                      strokeWidth={getAdaptiveLineStrokeWidth(timeline, 3)}
                      dot={proposalWinRateDot}
                      activeDot={{
                        r: 4.5,
                        fill: "var(--color-proposalWinRatePct)",
                        stroke: "var(--background)",
                        strokeWidth: 2,
                      }}
                      {...getSeriesAnimationProps(2)}
                    />
                  )}
                </>
              ) : null}
              {view === "win-rate" ? (
                <Area
                  xAxisId={throughputTrendXAxisId}
                  dataKey="proposalWinRatePct"
                  type={curveType}
                  stroke="var(--color-proposalWinRatePct)"
                  fill="url(#winRateFill)"
                  strokeWidth={getAdaptiveLineStrokeWidth(timeline, 2.75)}
                  dot={proposalWinRateDot}
                  activeDot={{
                    r: 4,
                    fill: "var(--color-proposalWinRatePct)",
                    stroke: "var(--background)",
                    strokeWidth: 2,
                  }}
                  {...getSeriesAnimationProps(0)}
                />
              ) : null}
            </ComposedChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function DeliveryReliabilityCard({
  timeline,
}: {
  timeline: DashboardData["timeline"];
}) {
  const [view, setView] = React.useState<"combined" | "sla" | "incidents">(
    "combined",
  );
  const reliabilityTimeline = React.useMemo(
    () =>
      timeline.map((point, index) => ({
        ...point,
        rangePosition:
          timeline.length > 1 ? index / (timeline.length - 1) : 0,
      })),
    [timeline],
  );
  const latestPoint = timeline.at(-1);
  const baselinePoint = timeline.length > 1 ? timeline[0] ?? null : null;
  const tickGap = getAdaptiveTickGap(timeline);
  const isShortRange = isShortRangeTimeline(timeline);
  const xAxisPadding = getAdaptiveXAxisPadding(timeline);
  const showSla = view !== "incidents";
  const showIncidents = view !== "sla";
  const reliabilityXAxisPadding =
    showIncidents && isShortRange ? { left: 20, right: 20 } : xAxisPadding;
  const reliabilityXAxisScale = showIncidents ? undefined : isShortRange ? "point" : undefined;
  const reliabilityTrendXAxisId = isShortRange ? "edge" : "bars";
  const useTwoPointCombinedBars = isShortRange && view === "combined";
  const curveType = getAdaptiveCurveType(timeline);
  const slaDot = getAdaptiveLineDot(
    "var(--color-feedSlaQualityScore)",
    reliabilityTimeline,
  );
  const incidentAxisMax = getMetricUpperBound(
    timeline,
    ["incidentCount"],
    { minimum: 2, padding: 1, roundTo: 1 },
  );
  const chartAnimationKey = getTimelineAnimationKey(
    reliabilityTimeline,
    `${view}-${useTwoPointCombinedBars ? "bars" : "mixed"}`,
  );

  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader className="gap-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <CardTitle>Reliability watch</CardTitle>
            <CardDescription>
              Switch between the combined reliability view and cleaner single-metric
              views for SLA or incidents.
            </CardDescription>
          </div>
          <ChartViewToggle
            label="Chart"
            options={[
              { value: "combined", label: "Combined" },
              { value: "sla", label: "SLA" },
              { value: "incidents", label: "Incidents" },
            ]}
            value={view}
            onValueChange={setView}
          />
        </div>
        {latestPoint ? (
          <ChartStatRow
            items={[
              createChartStatItem(
                "feedSlaQualityScore",
                "Feed SLA",
                latestPoint.feedSlaQualityScore,
                baselinePoint?.feedSlaQualityScore,
              ),
              createChartStatItem(
                "incidentCount",
                "Incidents",
                latestPoint.incidentCount,
                baselinePoint?.incidentCount,
              ),
            ]}
          />
        ) : null}
      </CardHeader>
      <CardContent className="pt-0">
        <div className={chartFrameClassName}>
          <ChartContainer
            key={chartAnimationKey}
            config={deliveryReliabilityConfig}
            className="h-[312px] w-full animate-chart-load"
          >
            <ComposedChart
              accessibilityLayer
              data={reliabilityTimeline}
              margin={defaultChartMargin}
              barCategoryGap={isShortRange ? "18%" : "24%"}
            >
            <defs>
              <linearGradient id="slaFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-feedSlaQualityScore)" stopOpacity={0.24} />
                <stop offset="100%" stopColor="var(--color-feedSlaQualityScore)" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="incidentFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-incidentCount)" stopOpacity={0.95} />
                <stop offset="100%" stopColor="var(--color-incidentCount)" stopOpacity={0.4} />
              </linearGradient>
            </defs>
              <CartesianGrid vertical={false} strokeDasharray="4 6" />
              <XAxis
                xAxisId="bars"
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                minTickGap={tickGap}
                padding={reliabilityXAxisPadding}
                scale={reliabilityXAxisScale}
              />
              {isShortRange ? (
                <XAxis
                  xAxisId="edge"
                  dataKey="rangePosition"
                  type="number"
                  domain={[0, 1]}
                  hide
                />
              ) : null}
              {showSla ? (
                <YAxis
                  yAxisId="left"
                  tickLine={false}
                  axisLine={false}
                  width={48}
                  domain={[95, 100]}
                  tickFormatter={(value) => `${value}%`}
                  hide={useTwoPointCombinedBars}
                />
              ) : null}
              {showIncidents ? (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                  width={40}
                  domain={[0, incidentAxisMax]}
                  allowDecimals={false}
                  hide={useTwoPointCombinedBars}
                />
              ) : null}
              {showSla && !useTwoPointCombinedBars ? (
                <ReferenceLine
                  yAxisId="left"
                  y={99}
                  stroke="var(--border)"
                  strokeDasharray="4 6"
                />
              ) : null}
            <ChartTooltip
              content={({ active, label, payload }) => {
                if (!active || !payload?.length) {
                  return null;
                }

                return (
                  <ChartTooltipContent
                    active={active}
                    label={payload[0]?.payload?.label ?? label}
                    payload={payload}
                    labelFormatter={(tooltipLabel) => `Week ending ${tooltipLabel}`}
                    formatter={(value, name) => (
                      <div className="flex flex-1 items-center justify-between gap-3">
                        <span className="text-muted-foreground">
                          {deliveryReliabilityConfig[String(name) as keyof typeof deliveryReliabilityConfig]?.label}
                        </span>
                        <span className="font-mono font-medium text-foreground">
                          {formatMetricByKey(
                            String(name) as NumericMetricKey,
                            Number(value),
                          )}
                        </span>
                      </div>
                    )}
                  />
                );
              }}
            />
              <ChartLegend
                verticalAlign="top"
                content={<ChartLegendContent className="justify-start" />}
              />
              {showSla ? (
                useTwoPointCombinedBars ? (
                  <Bar
                    xAxisId="bars"
                    yAxisId="left"
                    dataKey="feedSlaQualityScore"
                    fill="url(#slaFill)"
                    radius={[10, 10, 0, 0]}
                    maxBarSize={getAdaptiveBarSize(timeline, 18)}
                    minPointSize={getAdaptiveMinPointSize(timeline)}
                    label={(props) =>
                      renderBarValueLabel(
                        props,
                        (value) => formatMetricValue(value, "percent"),
                        "var(--color-feedSlaQualityScore)",
                      )
                    }
                    {...getSeriesAnimationProps(0)}
                  />
                ) : (
                  <Area
                    xAxisId={reliabilityTrendXAxisId}
                    yAxisId="left"
                    dataKey="feedSlaQualityScore"
                    type={curveType}
                    stroke="var(--color-feedSlaQualityScore)"
                    fill="url(#slaFill)"
                    strokeWidth={getAdaptiveLineStrokeWidth(timeline, 2.5)}
                    dot={slaDot}
                    activeDot={{
                      r: 4,
                      fill: "var(--color-feedSlaQualityScore)",
                      stroke: "var(--background)",
                      strokeWidth: 2,
                    }}
                    {...getSeriesAnimationProps(0)}
                  />
                )
              ) : null}
              {showIncidents ? (
                <Bar
                  xAxisId="bars"
                  yAxisId="right"
                  dataKey="incidentCount"
                  fill="url(#incidentFill)"
                  radius={isShortRange ? [10, 10, 0, 0] : [8, 8, 0, 0]}
                  maxBarSize={getAdaptiveBarSize(timeline, 26)}
                  minPointSize={getAdaptiveMinPointSize(timeline)}
                  label={
                    useTwoPointCombinedBars
                      ? (props) =>
                          renderBarValueLabel(
                            props,
                            (value) => formatMetricByKey("incidentCount", value),
                            "var(--color-incidentCount)",
                          )
                      : false
                  }
                  {...getSeriesAnimationProps(1)}
                />
              ) : null}
            </ComposedChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function RecentSnapshotsCard({
  snapshots,
}: {
  snapshots: WeeklySnapshot[];
}) {
  const recentSnapshots = [...snapshots]
    .sort((left, right) => right.weekOf.localeCompare(left.weekOf))
    .slice(0, 6);

  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader className="gap-1.5">
        <CardTitle className="text-base">Recent snapshots</CardTitle>
        <CardDescription>
          The latest saved weeks in the local dashboard history.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {recentSnapshots.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Week ending</TableHead>
                <TableHead>Pipeline</TableHead>
                <TableHead>SLA</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentSnapshots.map((snapshot) => (
                <TableRow key={snapshot.weekOf}>
                  <TableCell>{formatWeekLabelWithYear(snapshot.weekOf)}</TableCell>
                  <TableCell>{formatMetricByKey("pipelineValue", snapshot.pipelineValue)}</TableCell>
                  <TableCell>{formatMetricByKey("feedSlaQualityScore", snapshot.feedSlaQualityScore)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Empty className="min-h-[14rem] border border-dashed border-border bg-background">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <DatabaseIcon />
              </EmptyMedia>
              <EmptyTitle>No saved weeks yet</EmptyTitle>
              <EmptyDescription>
                The first weekly snapshot will appear here immediately after it
                is saved.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </CardContent>
    </Card>
  );
}

function formatCurrencyTick(value: number) {
  const absoluteValue = Math.abs(value);

  if (absoluteValue >= 1_000_000) {
    return `€${(value / 1_000_000).toFixed(1)}M`;
  }

  if (absoluteValue >= 1_000) {
    return `€${Math.round(value / 1_000)}k`;
  }

  return `€${value}`;
}
