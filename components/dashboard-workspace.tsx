"use client";

import * as React from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
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
import { AdminPanel } from "@/app/admin/admin-panel";
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
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { AdminDebugData } from "@/lib/admin-debug-types";
import {
  ADMIN_VIEW_ID,
  type WorkspaceView,
} from "@/lib/dashboard-navigation";
import {
  aggregateTextItems,
  formatMetricByKey,
  formatMetricValue,
  formatWeekLabelWithYear,
  NUMERIC_FIELD_DEFINITIONS,
  metricFieldMap,
  parseWeekOf,
  type RankedTextItem,
  type DashboardData,
  type DashboardTab,
  type MetricFieldDefinition,
  type NumericMetricKey,
  type WeeklySnapshot,
} from "@/lib/kpi-dashboard";
import {
  FORECAST_METRIC_KEYS,
  buildDashboardForecast,
  buildForecastProjectionPoints,
  type DashboardForecast,
  type ForecastProjectionPoint,
} from "@/lib/dashboard-forecast";
import type { PublicUser } from "@/lib/user-store";
import { cn } from "@/lib/utils";

type DashboardWorkspaceProps = {
  snapshots: WeeklySnapshot[];
  dashboard: DashboardData;
  forecast: DashboardForecast | null;
  users: PublicUser[];
  adminDebugData: AdminDebugData | null;
  user: { id: string; username: string; name: string; role: string };
};

type ForesightDataKey = `${NumericMetricKey}Foresight`;
type PredictionMode = "off" | "7d" | "30d";

type ForesightChartPoint = DashboardData["timeline"][number] &
  Partial<Record<ForesightDataKey, number>> & {
    isForesight?: boolean;
    predictionDaysAhead?: number;
    rangePosition?: number;
  };

type DeliveryVolumeChartPoint = ForesightChartPoint & {
  proposalWinRatePct?: number;
  proposalWinRatePctForesight?: number;
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

function isDashboardView(view: WorkspaceView): view is DashboardTab {
  return view !== ADMIN_VIEW_ID;
}

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

function getAdaptiveTickGap(timeline: ReadonlyArray<unknown>) {
  if (timeline.length <= 2) {
    return 6;
  }

  if (timeline.length <= 4) {
    return 12;
  }

  return 24;
}

function isShortRangeTimeline(timeline: ReadonlyArray<unknown>) {
  return timeline.length <= 2;
}

function getAdaptiveXAxisPadding(timeline: ReadonlyArray<unknown>) {
  if (timeline.length <= 2) {
    return { left: 0, right: 0 };
  }

  if (timeline.length <= 4) {
    return { left: 12, right: 12 };
  }

  return { left: 8, right: 8 };
}

function getAdaptiveCurveType(timeline: ReadonlyArray<unknown>) {
  return timeline.length <= 2 ? "linear" : "monotone";
}

function getAdaptiveLineStrokeWidth(timeline: ReadonlyArray<unknown>, defaultWidth: number) {
  if (timeline.length <= 2) {
    return defaultWidth + 0.45;
  }

  if (timeline.length <= 4) {
    return defaultWidth + 0.15;
  }

  return defaultWidth;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getAdaptiveBarCategoryGap(timeline: ReadonlyArray<unknown>) {
  if (timeline.length <= 2) {
    return "6%";
  }

  if (timeline.length <= 4) {
    return "20%";
  }

  return "32%";
}

function getAdaptiveLineDot(color: string, timeline: ReadonlyArray<unknown>) {
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

function getSeriesAnimationProps(index: number) {
  return {
    isAnimationActive: true,
    animationDuration: 820,
    animationBegin: Math.min(index * 36, 108),
    animationEasing: "ease-out" as const,
  };
}

function getTimelineAnimationKey(timeline: Array<{ weekOf: string }>, suffix?: string) {
  const first = timeline[0]?.weekOf ?? "empty";
  const last = timeline.at(-1)?.weekOf ?? "empty";
  return [suffix, timeline.length, first, last].filter(Boolean).join(":");
}

function getForesightDataKey(metricKey: NumericMetricKey) {
  return `${metricKey}Foresight` as ForesightDataKey;
}

function getPredictionAreaDataKey(seriesKey: string) {
  return `${seriesKey}ForesightArea`;
}

function getPredictionHorizons(predictionMode: PredictionMode) {
  if (predictionMode === "7d") {
    return [7] as const;
  }

  if (predictionMode === "30d") {
    return [7, 14, 21, 28] as const;
  }

  return [] as const;
}

function normalizePredictionMetricKey(value: string) {
  return value.endsWith("Foresight")
    ? (value.slice(0, -9) as NumericMetricKey)
    : (value as NumericMetricKey);
}

function normalizePredictionSeriesKey(value: string) {
  return value.endsWith("Foresight") ? value.slice(0, -9) : value;
}

function formatPredictionTooltipLabel(
  label: string | number | undefined,
  payload?: ReadonlyArray<{
    payload?: { isForesight?: boolean; predictionDaysAhead?: number };
  }>,
) {
  const point = payload?.[0]?.payload;
  const predictionDaysAhead = point?.predictionDaysAhead;

  if (point?.isForesight && predictionDaysAhead) {
    return `Prediction +${predictionDaysAhead}d - ${label}`;
  }

  return `Week ending ${label}`;
}

function buildPredictionChartTimeline(
  timeline: DashboardData["timeline"],
  metricKeys: readonly NumericMetricKey[],
  predictionMode: PredictionMode,
) {
  const horizons = getPredictionHorizons(predictionMode);

  if (!timeline.length || !metricKeys.length || !horizons.length) {
    return timeline as ForesightChartPoint[];
  }

  const projections = buildForecastProjectionPoints(timeline, metricKeys, horizons);

  if (!projections.length) {
    return timeline as ForesightChartPoint[];
  }

  const lastActualIndex = timeline.length - 1;
  const blankNumericValues = Object.fromEntries(
    NUMERIC_FIELD_DEFINITIONS.map((field) => [field.key, undefined]),
  ) as Partial<Record<NumericMetricKey, number>>;
  const baseTimeline = timeline.map((point, index) => {
    if (index !== lastActualIndex) {
      return point as ForesightChartPoint;
    }

    return {
      ...point,
      ...Object.fromEntries(
        metricKeys.flatMap((metricKey) => [
          [getForesightDataKey(metricKey), point[metricKey]],
          [getPredictionAreaDataKey(metricKey), point[metricKey]],
        ]),
      ),
    } as ForesightChartPoint;
  });
  const latestPoint = baseTimeline.at(-1);

  if (!latestPoint) {
    return baseTimeline;
  }

  const futurePoints = projections.map((projection, index) => ({
    ...latestPoint,
    ...blankNumericValues,
    ...Object.fromEntries(
      metricKeys.flatMap((metricKey) => [
        [getForesightDataKey(metricKey), projection.values[metricKey]],
        [getPredictionAreaDataKey(metricKey), projection.values[metricKey]],
      ]),
    ),
    weekOf: projection.weekOf,
    label: projection.label,
    isForesight: true,
    predictionDaysAhead: projection.daysAhead,
    rangePosition: 1 + (index + 1) / projections.length,
  })) as ForesightChartPoint[];

  return [...baseTimeline, ...futurePoints];
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

function calculateProposalWinRate(proposalsSent: number, ordersWon: number) {
  return proposalsSent > 0 ? (ordersWon / proposalsSent) * 100 : 0;
}

function buildDeliveryVolumeChartTimeline(
  timeline: DashboardData["timeline"],
  predictionMode: PredictionMode,
) {
  const baseTimeline = timeline.map((point, index) => ({
    ...point,
    rangePosition: timeline.length > 1 ? index / (timeline.length - 1) : 0,
    proposalWinRatePct: calculateProposalWinRate(
      point.proposalsSent,
      point.ordersWon,
    ),
  })) as DeliveryVolumeChartPoint[];

  const horizons = getPredictionHorizons(predictionMode);

  if (!baseTimeline.length || !horizons.length) {
    return baseTimeline;
  }

  const projections = buildForecastProjectionPoints(
    timeline,
    ["proposalsSent", "ordersWon"],
    horizons,
  );

  if (!projections.length) {
    return baseTimeline;
  }

  const lastActualIndex = baseTimeline.length - 1;
  const latestPoint = baseTimeline.at(-1);

  if (!latestPoint) {
    return baseTimeline;
  }

  const blankNumericValues = Object.fromEntries(
    NUMERIC_FIELD_DEFINITIONS.map((field) => [field.key, undefined]),
  ) as Partial<Record<NumericMetricKey, number>>;

  const actualTimeline = baseTimeline.map((point, index) => {
    if (index !== lastActualIndex) {
      return point;
    }

    return {
      ...point,
      proposalsSentForesight: point.proposalsSent,
      [getPredictionAreaDataKey("proposalsSent")]: point.proposalsSent,
      ordersWonForesight: point.ordersWon,
      proposalWinRatePctForesight: point.proposalWinRatePct,
      [getPredictionAreaDataKey("proposalWinRatePct")]: point.proposalWinRatePct,
    } as DeliveryVolumeChartPoint;
  });

  const futurePoints = projections.map((projection, index) => {
    const proposalsSent = Number(
      projection.values.proposalsSent ?? latestPoint.proposalsSent ?? 0,
    );
    const ordersWon = Number(
      projection.values.ordersWon ?? latestPoint.ordersWon ?? 0,
    );

    return {
      ...latestPoint,
      ...blankNumericValues,
      weekOf: projection.weekOf,
      label: projection.label,
      isForesight: true,
      predictionDaysAhead: projection.daysAhead,
      rangePosition: 1 + (index + 1) / projections.length,
      proposalWinRatePct: undefined,
      proposalsSentForesight: proposalsSent,
      [getPredictionAreaDataKey("proposalsSent")]: proposalsSent,
      ordersWonForesight: ordersWon,
      proposalWinRatePctForesight: calculateProposalWinRate(
        proposalsSent,
        ordersWon,
      ),
      [getPredictionAreaDataKey("proposalWinRatePct")]: calculateProposalWinRate(
        proposalsSent,
        ordersWon,
      ),
    } as DeliveryVolumeChartPoint;
  });

  return [...actualTimeline, ...futurePoints];
}

export function DashboardWorkspace({
  snapshots,
  dashboard,
  forecast,
  users,
  adminDebugData,
  user,
}: DashboardWorkspaceProps) {
  const [activeView, setActiveView] = React.useState<WorkspaceView>("overview");
  const [trendWindowMode, setTrendWindowMode] =
    React.useState<TrendWindowMode>("weeks");
  const [predictionMode, setPredictionMode] =
    React.useState<PredictionMode>("off");
  const [selectedWeekFrom, setSelectedWeekFrom] = React.useState<string | null>(
    null,
  );
  const [selectedWeekTo, setSelectedWeekTo] = React.useState<string | null>(null);
  const showAnalysisControls =
    isDashboardView(activeView) &&
    activeView !== "weekly-update";
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
  const visibleForecast = React.useMemo(
    () => buildDashboardForecast(filteredTimeline),
    [filteredTimeline],
  );
  const activeForecast = visibleForecast ?? forecast;
  const predictionProjectionPoints = React.useMemo(() => {
    if (predictionMode === "off") {
      return [] as ForecastProjectionPoint[];
    }

    const sourceTimeline = filteredTimeline.length
      ? filteredTimeline
      : dashboard.timeline;

    return buildForecastProjectionPoints(
      sourceTimeline,
      FORECAST_METRIC_KEYS,
      getPredictionHorizons(predictionMode),
    );
  }, [dashboard.timeline, filteredTimeline, predictionMode]);
  const predictionSummary =
    predictionMode === "7d"
      ? "Charts extend 7 days beyond the latest saved week."
      : predictionMode === "30d"
        ? "Charts extend through the next 4 forecast weeks."
        : null;

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
        activeView={activeView}
        onViewChange={setActiveView}
        dashboard={dashboard}
        user={user}
      />
      <SidebarInset className="min-h-svh overflow-hidden border-l border-border/60 bg-background/50 backdrop-blur-sm">
        <SiteHeader
          activeView={activeView}
          onViewChange={setActiveView}
          lastUpdatedLabel={dashboard.lastUpdatedLabel}
          totalWeeks={dashboard.totalWeeks}
        />

        <Tabs
          value={activeView}
          onValueChange={(value) => {
            if (value !== null) {
              setActiveView(value as WorkspaceView);
            }
          }}
          className="@container/main flex flex-1 flex-col gap-0"
        >
          <div className="sticky top-0 z-20 border-b border-border bg-background px-4 py-4 lg:px-6">
            {hasData && showAnalysisControls ? (
              <div className="mt-3 border-t border-border pt-3">
                <div className="flex flex-col gap-3">
                  <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                    <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
                      <div className="flex max-w-xl flex-col gap-1">
                        <div className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                          Trend range
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Applies to the charts and ranked signal tables in this
                          workspace.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-end gap-3 xl:justify-end">
                        <div className="flex min-w-[19rem] flex-1 flex-col gap-1.5 sm:flex-none">
                          <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                            Window
                          </span>
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
                            className="w-full flex-wrap rounded-xl"
                          >
                            <ToggleGroupItem
                              value="7d"
                              className="min-w-[7.5rem] flex-1 justify-center px-4 sm:flex-none sm:min-w-[8.25rem]"
                            >
                              Last 7 days
                            </ToggleGroupItem>
                            <ToggleGroupItem
                              value="30d"
                              className="min-w-[7.5rem] flex-1 justify-center px-4 sm:flex-none sm:min-w-[8.25rem]"
                            >
                              Last 30 days
                            </ToggleGroupItem>
                            <ToggleGroupItem
                              value="weeks"
                              className="min-w-[7.5rem] flex-1 justify-center px-4 sm:flex-none sm:min-w-[8.25rem]"
                            >
                              Week range
                            </ToggleGroupItem>
                          </ToggleGroup>
                        </div>

                        {activeForecast ? (
                          <div className="flex min-w-[19rem] flex-1 flex-col gap-1.5 sm:flex-none">
                            <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                              Prediction
                            </span>
                            <ToggleGroup
                              multiple={false}
                              value={[predictionMode]}
                              onValueChange={(values) => {
                                const nextValue = values[0];

                                if (
                                  nextValue === "off" ||
                                  nextValue === "7d" ||
                                  nextValue === "30d"
                                ) {
                                  setPredictionMode(nextValue);
                                }
                              }}
                              variant="outline"
                              size="default"
                              className="w-full flex-wrap rounded-xl"
                            >
                              <ToggleGroupItem
                                value="off"
                                className="min-w-[7.5rem] flex-1 justify-center px-4 sm:flex-none sm:min-w-[8.25rem]"
                              >
                                No prediction
                              </ToggleGroupItem>
                              <ToggleGroupItem
                                value="7d"
                                className="min-w-[7.5rem] flex-1 justify-center px-4 sm:flex-none sm:min-w-[8.25rem]"
                              >
                                Predict 7 days
                              </ToggleGroupItem>
                              <ToggleGroupItem
                                value="30d"
                                className="min-w-[7.5rem] flex-1 justify-center px-4 sm:flex-none sm:min-w-[8.25rem]"
                              >
                                Predict 30 days
                              </ToggleGroupItem>
                            </ToggleGroup>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {trendWindowMode === "weeks" ? (
                      <div className="mt-3 grid gap-3 rounded-lg border border-border/70 bg-background/70 p-3 lg:grid-cols-[minmax(0,1fr)_minmax(13rem,14rem)_minmax(13rem,14rem)] lg:items-end">
                        <div className="flex items-start gap-2 pr-1">
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

                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                            Start week
                          </span>
                          <Select
                            value={selectedWeekFrom ?? ""}
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
                              className="w-full bg-background"
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

                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                            End week
                          </span>
                          <Select
                            value={selectedWeekTo ?? ""}
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
                              className="w-full bg-background"
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

                    {activeForecast && predictionSummary ? (
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline">Dashed lines = prediction</Badge>
                        <span>{predictionSummary}</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex flex-1 flex-col overflow-y-auto px-4 py-5 lg:px-6 lg:py-6">
            <TabsContent value="overview" className="flex flex-col gap-6">
              {hasData ? (
                <>
                  {activeForecast && predictionMode !== "off" ? (
                    <ForecastCard
                      forecast={activeForecast}
                      predictionMode={predictionMode}
                      projectionPoints={predictionProjectionPoints}
                    />
                  ) : null}

                  <OverviewSection
                    dashboard={dashboard}
                    timeline={filteredTimeline}
                    predictionMode={predictionMode}
                  />

                  <MetricCardGrid
                    metricKeys={overviewMetricKeys}
                    latestSnapshot={visibleLatestSnapshot!}
                    comparisonSnapshot={rangeStartSnapshot}
                  />
                </>
              ) : (
                <EmptyDashboardState
                  icon={LayoutDashboardIcon}
                  title="No data yet"
                  description="Save your first weekly update to see KPIs, trend charts, and forecasts here."
                  onOpenWeeklyUpdate={() => setActiveView("weekly-update")}
                />
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
                  <RevenueSection
                    dashboard={dashboard}
                    timeline={filteredTimeline}
                    predictionMode={predictionMode}
                  />
                </>
              ) : (
                <EmptyDashboardState
                  icon={ChartBarIcon}
                  title="No revenue history yet"
                  description="Save a weekly update to track pipeline value, close rate, deal size, and revenue trends."
                  onOpenWeeklyUpdate={() => setActiveView("weekly-update")}
                />
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
                    predictionMode={predictionMode}
                  />
                </>
              ) : (
                <EmptyDashboardState
                  icon={ListIcon}
                  title="No customer signals yet"
                  description="Save a weekly update to track retention, customer requests, and top reasons deals are lost."
                  onOpenWeeklyUpdate={() => setActiveView("weekly-update")}
                />
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
                    <DeliverySection
                      timeline={filteredTimeline}
                      predictionMode={predictionMode}
                    />
                </>
              ) : (
                <EmptyDashboardState
                  icon={ShieldCheckIcon}
                  title="No delivery history yet"
                  description="Save a weekly update to track proposals, orders won, service quality, and incidents."
                  onOpenWeeklyUpdate={() => setActiveView("weekly-update")}
                />
              )}
            </TabsContent>

            <TabsContent value="weekly-update" className="flex flex-col gap-6">
              <WeeklyUpdateSection dashboard={dashboard} snapshots={snapshots} />
            </TabsContent>

            {user.role === "admin" ? (
              <TabsContent value={ADMIN_VIEW_ID} className="flex flex-col gap-6">
                <AdminPanel
                  users={users}
                  currentUser={user}
                  debugData={adminDebugData}
                  variant="workspace"
                />
              </TabsContent>
            ) : null}
          </div>
        </Tabs>
      </SidebarInset>
    </SidebarProvider>
  );
}

function EmptyDashboardState({
  description,
  icon: Icon,
  onOpenWeeklyUpdate,
  title,
}: {
  description: string;
  icon: React.ComponentType;
  onOpenWeeklyUpdate: () => void;
  title: string;
}) {
  return (
    <Card className="border-border bg-card shadow-none">
      <CardContent className="p-6">
        <Empty className="min-h-[22rem] border border-dashed border-border bg-background">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Icon />
            </EmptyMedia>
            <EmptyTitle>{title}</EmptyTitle>
            <EmptyDescription>{description}</EmptyDescription>
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
    <Card className="h-full min-h-[10.75rem] border-border bg-card shadow-none">
      <CardHeader className="flex h-full flex-col gap-4 p-5">
        <div className="flex min-h-10 items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted">
              <Icon className="size-5" />
            </div>
            <div className="min-w-0">
              <CardDescription className="truncate text-xs">
                {field.shortLabel}
              </CardDescription>
              <CardTitle className="mt-1 truncate text-xl leading-none">
                {formatMetricByKey(metricKey, latestValue)}
              </CardTitle>
            </div>
          </div>
        </div>
        <div className="mt-auto flex flex-1 flex-col justify-end gap-2">
          <p className="min-h-10 text-sm leading-5 text-muted-foreground">
            {field.description}
          </p>
          <div
            className={cn(
              "flex min-h-5 items-center gap-2 whitespace-nowrap text-sm",
              comparison.tone === "positive" &&
                "text-emerald-600 dark:text-emerald-400",
              comparison.tone === "negative" && "text-rose-600 dark:text-rose-400",
              comparison.tone === "neutral" && "text-muted-foreground",
            )}
          >
            {DeltaIcon ? <DeltaIcon className="size-4 shrink-0" /> : null}
            <span className="truncate">{comparison.longText}</span>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}

function OverviewSection({
  dashboard,
  timeline,
  predictionMode,
}: {
  dashboard: DashboardData;
  timeline: DashboardData["timeline"];
  predictionMode: PredictionMode;
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
      <PipelineMomentumCard timeline={timeline} compact predictionMode={predictionMode} />
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

function ForecastCard({
  forecast,
  predictionMode,
  projectionPoints,
}: {
  forecast: DashboardForecast;
  predictionMode: Exclude<PredictionMode, "off">;
  projectionPoints: ForecastProjectionPoint[];
}) {
  const isSevenDayPrediction = predictionMode === "7d";
  const predictionLabel = isSevenDayPrediction
    ? "+7 day estimate"
    : "4 weekly estimates";
  const visibleProjectionPoints = isSevenDayPrediction
    ? projectionPoints.slice(0, 1)
    : projectionPoints.slice(0, 4);

  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <CardTitle>Prediction</CardTitle>
            <CardDescription>
              {isSevenDayPrediction
                ? "Directional +7 day estimate based on the latest saved weekly history."
                : "Directional 30 day view shown as four weekly prediction checkpoints."}{" "}
              Dashed chart lines use the same projection.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge>{predictionLabel}</Badge>
            <Badge variant="outline">{forecast.generatedFromWeeks} weeks used</Badge>
            <Badge variant="outline">{forecast.confidenceLabel}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Metric</TableHead>
              <TableHead className="text-right">Latest</TableHead>
              {visibleProjectionPoints.length ? (
                visibleProjectionPoints.map((point) => (
                  <TableHead key={point.weekOf} className="text-right">
                    +{point.daysAhead}d
                  </TableHead>
                ))
              ) : (
                <TableHead className="text-right">{predictionLabel}</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {forecast.metrics.map((metric) => (
              <TableRow key={metric.metricKey}>
                <TableCell className="font-medium">{metric.label}</TableCell>
                <TableCell className="text-right">
                  {formatMetricByKey(metric.metricKey, metric.latestValue)}
                </TableCell>
                {visibleProjectionPoints.length ? (
                  visibleProjectionPoints.map((point) => (
                    <TableCell key={point.weekOf} className="text-right">
                      {formatMetricByKey(
                        metric.metricKey,
                        point.values[metric.metricKey] ?? metric.latestValue,
                      )}
                    </TableCell>
                  ))
                ) : (
                  <TableCell className="text-right">
                    {isSevenDayPrediction
                      ? metric.forecast7dLabel
                      : metric.forecast30dLabel}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function RevenueSection({
  dashboard,
  timeline,
  predictionMode,
}: {
  dashboard: DashboardData;
  timeline: DashboardData["timeline"];
  predictionMode: PredictionMode;
}) {
  return (
    <>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <PipelineMomentumCard timeline={timeline} predictionMode={predictionMode} />
        <RevenueConversionCard timeline={timeline} predictionMode={predictionMode} />
      </div>
      <StageFlowCard stageMetrics={dashboard.latestStageMetrics} />
    </>
  );
}

function ProductSignalSection({
  timeline,
  lossReasonCounts,
  repeatedRequestCounts,
  predictionMode,
}: {
  timeline: DashboardData["timeline"];
  lossReasonCounts: RankedTextItem[];
  repeatedRequestCounts: RankedTextItem[];
  predictionMode: PredictionMode;
}) {
  return (
    <>
      <RetentionSignalCard timeline={timeline} predictionMode={predictionMode} />
      <div className="grid gap-4 xl:grid-cols-2">
        <RankedSignalsCard
          title="Why deals are lost"
          description="Top reasons across all weeks in the selected range."
          items={lossReasonCounts}
        />
        <RankedSignalsCard
          title="What customers keep asking for"
          description="Most common requests across all weeks in the selected range."
          items={repeatedRequestCounts}
        />
      </div>
    </>
  );
}

function DeliverySection({
  timeline,
  predictionMode,
}: {
  timeline: DashboardData["timeline"];
  predictionMode: PredictionMode;
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <DeliveryVolumeCard timeline={timeline} predictionMode={predictionMode} />
      <DeliveryReliabilityCard timeline={timeline} predictionMode={predictionMode} />
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
            <p>Use one full snapshot per reporting date.</p>
            <p>
              Re-saving the same week creates a new revision while keeping the
              earlier saved version available in history.
            </p>
            <p>
              Keep lost reasons tight and specific, and add recurring requests
              one request per line.
            </p>
            <p>
              Pipeline velocity is calculated automatically from the saved data
              model, so you do not need to type it manually.
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

function ForesightLine({
  metricKey,
  stroke,
  strokeWidth,
  animationIndex,
  yAxisId,
}: {
  metricKey: NumericMetricKey;
  stroke: string;
  strokeWidth: number;
  animationIndex: number;
  yAxisId?: string;
}) {
  return (
    <PredictionLine
      dataKey={getForesightDataKey(metricKey)}
      name={metricKey}
      stroke={stroke}
      strokeWidth={strokeWidth}
      animationIndex={animationIndex}
      yAxisId={yAxisId}
    />
  );
}

function PredictionLine({
  dataKey,
  name,
  stroke,
  strokeWidth,
  animationIndex,
  yAxisId,
}: {
  dataKey: string;
  name: string;
  stroke: string;
  strokeWidth: number;
  animationIndex: number;
  yAxisId?: string;
}) {
  return (
    <Line
      yAxisId={yAxisId}
      type="monotone"
      dataKey={dataKey}
      name={name}
      legendType="none"
      stroke={stroke}
      strokeOpacity={0.88}
      strokeWidth={strokeWidth}
      strokeDasharray="8 6"
      dot={false}
      activeDot={{
        r: 4,
        fill: stroke,
        stroke: "var(--background)",
        strokeWidth: 2,
      }}
      connectNulls={false}
      {...getSeriesAnimationProps(animationIndex)}
    />
  );
}

function PredictionArea({
  dataKey,
  fill,
  animationIndex,
  fillOpacity = 0.12,
  yAxisId,
}: {
  dataKey: string;
  fill: string;
  animationIndex: number;
  fillOpacity?: number;
  yAxisId?: string;
}) {
  return (
    <Area
      yAxisId={yAxisId}
      type="monotone"
      dataKey={dataKey}
      legendType="none"
      stroke="none"
      fill={fill}
      fillOpacity={fillOpacity}
      activeDot={false}
      connectNulls={false}
      {...getSeriesAnimationProps(animationIndex)}
    />
  );
}

function PredictionRegion({
  timeline,
}: {
  timeline: ReadonlyArray<{
    label?: string | number;
    isForesight?: boolean;
  }>;
}) {
  const latestActualPoint = [...timeline].reverse().find((point) => !point.isForesight);
  const lastPoint = timeline.at(-1);

  if (!latestActualPoint?.label || !lastPoint?.label || !timeline.some((point) => point.isForesight)) {
    return null;
  }

  return (
    <ReferenceArea
      x1={latestActualPoint.label}
      x2={lastPoint.label}
      fill="var(--muted)"
      fillOpacity={0.16}
      strokeOpacity={0}
      ifOverflow="extendDomain"
    />
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
  predictionMode = "off",
}: {
  timeline: DashboardData["timeline"];
  compact?: boolean;
  predictionMode?: PredictionMode;
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
  const chartTimeline = React.useMemo(
    () =>
      predictionMode !== "off"
        ? buildPredictionChartTimeline(timeline, [
            "pipelineValue",
            "pipelineVelocity",
          ], predictionMode)
        : (timeline as ForesightChartPoint[]),
    [predictionMode, timeline],
  );
  const chartAnimationKey = getTimelineAnimationKey(
    chartTimeline,
    `${view}-${predictionMode}`,
  );

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
            <ComposedChart accessibilityLayer data={chartTimeline} margin={defaultChartMargin}>
              <defs>
                <linearGradient id="pipelineValueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-pipelineValue)" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="var(--color-pipelineValue)" stopOpacity={0.03} />
                </linearGradient>
                <linearGradient
                  id="pipelineValueForecastFill"
                  x1="0"
                  y1="0"
                  x2="1"
                  y2="0"
                >
                  <stop offset="0%" stopColor="var(--color-pipelineValue)" stopOpacity={0.015} />
                  <stop offset="35%" stopColor="var(--color-pipelineValue)" stopOpacity={0.045} />
                  <stop offset="100%" stopColor="var(--color-pipelineValue)" stopOpacity={0.095} />
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
              {predictionMode !== "off" && !showValue ? (
                <PredictionRegion timeline={chartTimeline} />
              ) : null}
              {predictionMode !== "off" && latestPoint ? (
                <ReferenceLine
                  x={latestPoint.label}
                  stroke="var(--border)"
                  strokeDasharray="2 6"
                />
              ) : null}
              <ChartTooltip
                content={({ active, label, payload }) => {
                  const filteredPayload = (payload ?? []).filter((item) => {
                    if (item.value == null) {
                      return false;
                    }

                    return typeof item.value !== "number" || Number.isFinite(item.value);
                  });

                  if (!active || !filteredPayload.length) {
                    return null;
                  }

                  return (
                    <ChartTooltipContent
                      active={active}
                      label={filteredPayload[0]?.payload?.label ?? label}
                      payload={filteredPayload}
                      labelFormatter={(tooltipLabel, items) =>
                        formatPredictionTooltipLabel(
                          String(tooltipLabel),
                          items as ReadonlyArray<{
                            payload?: {
                              isForesight?: boolean;
                              predictionDaysAhead?: number;
                            };
                          }>,
                        )
                      }
                      formatter={(value, name, item, _index, point) => {
                        const metricKey = normalizePredictionMetricKey(
                          String(item.dataKey ?? name),
                        );
                        const itemLabel =
                          pipelineMomentumConfig[
                            metricKey as keyof typeof pipelineMomentumConfig
                          ]?.label ?? metricFieldMap[metricKey].shortLabel;
                        const pointData = point as unknown as ForesightChartPoint | undefined;
                        const isPredictionPoint = Boolean(pointData?.isForesight);

                        return (
                          <div className="flex flex-1 items-center justify-between gap-3">
                            <span className="text-muted-foreground">
                              {isPredictionPoint ? `${itemLabel} estimate` : itemLabel}
                            </span>
                            <span className="font-mono font-medium text-foreground">
                              {formatMetricByKey(metricKey, Number(value))}
                            </span>
                          </div>
                        );
                      }}
                      indicator="dot"
                    />
                  );
                }}
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
              {predictionMode !== "off" && showValue ? (
                <PredictionArea
                  dataKey={getPredictionAreaDataKey("pipelineValue")}
                  yAxisId="left"
                  fill="url(#pipelineValueForecastFill)"
                  fillOpacity={1}
                  animationIndex={2}
                />
              ) : null}
              {predictionMode !== "off" && showValue ? (
                <ForesightLine
                  metricKey="pipelineValue"
                  yAxisId="left"
                  stroke="var(--color-pipelineValue)"
                  strokeWidth={getAdaptiveLineStrokeWidth(chartTimeline, 2.35)}
                  animationIndex={3}
                />
              ) : null}
              {predictionMode !== "off" && showVelocity ? (
                <ForesightLine
                  metricKey="pipelineVelocity"
                  yAxisId="right"
                  stroke="var(--color-pipelineVelocity)"
                  strokeWidth={getAdaptiveLineStrokeWidth(chartTimeline, 2.6)}
                  animationIndex={4}
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
  predictionMode = "off",
}: {
  timeline: DashboardData["timeline"];
  predictionMode?: PredictionMode;
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
  const chartTimeline = React.useMemo(
    () =>
      predictionMode !== "off"
        ? buildPredictionChartTimeline(timeline, [
            "marketingSourcedPipelinePct",
            "leadToOpportunityConversionPct",
            "closeRatePct",
            "pipelineCoverageRatio",
          ], predictionMode)
        : (timeline as ForesightChartPoint[]),
    [predictionMode, timeline],
  );
  const chartAnimationKey = getTimelineAnimationKey(
    chartTimeline,
    `revenue-${predictionMode}`,
  );

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
            <ComposedChart accessibilityLayer data={chartTimeline} margin={defaultChartMargin}>
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
              {predictionMode !== "off" ? (
                <PredictionRegion timeline={chartTimeline} />
              ) : null}
              {predictionMode !== "off" && latestPoint ? (
                <ReferenceLine
                  x={latestPoint.label}
                  stroke="var(--border)"
                  strokeDasharray="2 6"
                />
              ) : null}
              <ChartTooltip
                content={({ active, label, payload }) => {
                  const filteredPayload = (payload ?? []).filter((item) => {
                    if (item.value == null) {
                      return false;
                    }

                    return typeof item.value !== "number" || Number.isFinite(item.value);
                  });

                  if (!active || !filteredPayload.length) {
                    return null;
                  }

                  return (
                    <ChartTooltipContent
                      active={active}
                      label={filteredPayload[0]?.payload?.label ?? label}
                      payload={filteredPayload}
                      labelFormatter={(tooltipLabel, items) =>
                        formatPredictionTooltipLabel(
                          String(tooltipLabel),
                          items as ReadonlyArray<{
                            payload?: {
                              isForesight?: boolean;
                              predictionDaysAhead?: number;
                            };
                          }>,
                        )
                      }
                      formatter={(value, name, item, _index, point) => {
                        const metricKey = normalizePredictionMetricKey(
                          String(item.dataKey ?? name),
                        );
                        const labelMap: Record<NumericMetricKey, string> = {
                          marketingSourcedPipelinePct: "Marketing-sourced pipeline",
                          leadToOpportunityConversionPct: "Lead to opportunity",
                          closeRatePct: "Close rate",
                          pipelineCoverageRatio: "Coverage ratio",
                          pipelineValue: "Pipeline value",
                          pipelineVelocity: "Pipeline velocity",
                          newCustomersPerMonth: "New customers",
                          salesCycleDays: "Sales cycle",
                          averageDealSize: "Avg deal size",
                          customerAcquisitionCost: "CAC",
                          netRevenueRetentionPct: "NRR",
                          grossRevenueRetentionPct: "GRR",
                          marketingSourcedPipelineCount: "Marketing-sourced #",
                          cacPaybackMonths: "CAC payback",
                          feedRetentionPct: "Feed retention",
                          proposalsSent: "Proposals sent",
                          ordersWon: "Orders won",
                          feedSlaQualityScore: "Feed SLA",
                          incidentCount: "Incident count",
                        };
                        const formattedValue =
                          metricKey === "pipelineCoverageRatio"
                            ? `${Number(value).toFixed(1)}x`
                            : formatMetricByKey(metricKey, Number(value));
                        const pointData = point as unknown as ForesightChartPoint | undefined;
                        const isPredictionPoint = Boolean(pointData?.isForesight);

                        return (
                          <div className="flex flex-1 items-center justify-between gap-3">
                            <span className="text-muted-foreground">
                              {isPredictionPoint
                                ? `${labelMap[metricKey]} estimate`
                                : labelMap[metricKey]}
                            </span>
                            <span className="font-mono font-medium text-foreground">
                              {formattedValue}
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
              {predictionMode !== "off" ? (
                <>
                  <PredictionArea
                    dataKey={getPredictionAreaDataKey("marketingSourcedPipelinePct")}
                    yAxisId="left"
                    fill="var(--color-marketingSourcedPipelinePct)"
                    fillOpacity={0.11}
                    animationIndex={4}
                  />
                  <ForesightLine
                    metricKey="marketingSourcedPipelinePct"
                    yAxisId="left"
                    stroke="var(--color-marketingSourcedPipelinePct)"
                    strokeWidth={getAdaptiveLineStrokeWidth(chartTimeline, 2.25)}
                    animationIndex={5}
                  />
                  <ForesightLine
                    metricKey="leadToOpportunityConversionPct"
                    yAxisId="left"
                    stroke="var(--color-leadToOpportunityConversionPct)"
                    strokeWidth={getAdaptiveLineStrokeWidth(chartTimeline, 2.2)}
                    animationIndex={6}
                  />
                  <ForesightLine
                    metricKey="closeRatePct"
                    yAxisId="left"
                    stroke="var(--color-closeRatePct)"
                    strokeWidth={getAdaptiveLineStrokeWidth(chartTimeline, 2.5)}
                    animationIndex={7}
                  />
                  <ForesightLine
                    metricKey="pipelineCoverageRatio"
                    yAxisId="right"
                    stroke="var(--color-pipelineCoverageRatio)"
                    strokeWidth={getAdaptiveLineStrokeWidth(chartTimeline, 2.1)}
                    animationIndex={8}
                  />
                </>
              ) : null}
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
          How well deals convert between stages and how long they sit in each
          one (latest week only).
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
  predictionMode = "off",
}: {
  timeline: DashboardData["timeline"];
  predictionMode?: PredictionMode;
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
  const chartTimeline = React.useMemo(
    () =>
      predictionMode !== "off"
        ? buildPredictionChartTimeline(timeline, [
            "feedRetentionPct",
            "netRevenueRetentionPct",
            "grossRevenueRetentionPct",
          ], predictionMode)
        : (timeline as ForesightChartPoint[]),
    [predictionMode, timeline],
  );
  const chartAnimationKey = getTimelineAnimationKey(
    chartTimeline,
    `${view}-${predictionMode}`,
  );

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
            <ComposedChart accessibilityLayer data={chartTimeline} margin={defaultChartMargin}>
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
            {predictionMode !== "off" && latestPoint ? (
              <PredictionRegion timeline={chartTimeline} />
            ) : null}
            {predictionMode !== "off" && latestPoint ? (
              <ReferenceLine
                x={latestPoint.label}
                stroke="var(--border)"
                strokeDasharray="2 6"
              />
            ) : null}
            <ChartTooltip
              itemSorter={(item) => {
                const dataKey = normalizePredictionMetricKey(String(item.dataKey));

                return (
                  retentionTooltipOrder[
                    dataKey as keyof typeof retentionTooltipOrder
                  ] ?? 99
                );
              }}
              content={({ active, label, payload }) => {
                const filteredPayload = (payload ?? []).filter((item) => {
                  if (item.value == null) {
                    return false;
                  }

                  return typeof item.value !== "number" || Number.isFinite(item.value);
                });

                if (!active || !filteredPayload.length) {
                  return null;
                }

                return (
                  <ChartTooltipContent
                    active={active}
                    label={filteredPayload[0]?.payload?.label ?? label}
                    payload={filteredPayload}
                    itemSorter={(item) => {
                      const dataKey = normalizePredictionMetricKey(String(item.dataKey));

                      return (
                        retentionTooltipOrder[
                          dataKey as keyof typeof retentionTooltipOrder
                        ] ?? 99
                      );
                    }}
                    labelFormatter={(tooltipLabel, items) =>
                      formatPredictionTooltipLabel(
                        String(tooltipLabel),
                        items as ReadonlyArray<{
                          payload?: {
                            isForesight?: boolean;
                            predictionDaysAhead?: number;
                          };
                        }>,
                      )
                    }
                    formatter={(value, name, item, _index, point) => {
                      const metricKey = normalizePredictionMetricKey(
                        String(item.dataKey ?? name),
                      );
                      const itemLabel =
                        retentionConfig[metricKey as keyof typeof retentionConfig]?.label ??
                        metricFieldMap[metricKey].shortLabel;
                      const pointData = point as unknown as ForesightChartPoint | undefined;
                      const isPredictionPoint = Boolean(pointData?.isForesight);

                      return (
                        <div className="flex flex-1 items-center justify-between gap-3">
                          <span className="text-muted-foreground">
                            {isPredictionPoint ? `${itemLabel} estimate` : itemLabel}
                          </span>
                          <span className="font-mono font-medium text-foreground">
                            {formatMetricByKey(metricKey, Number(value))}
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
              {predictionMode !== "off" && showFeed ? (
                <PredictionArea
                  dataKey={getPredictionAreaDataKey("feedRetentionPct")}
                  fill="var(--color-feedRetentionPct)"
                  fillOpacity={0.11}
                  animationIndex={3}
                />
              ) : null}
              {predictionMode !== "off" && showFeed ? (
                <ForesightLine
                  metricKey="feedRetentionPct"
                  stroke="var(--color-feedRetentionPct)"
                  strokeWidth={getAdaptiveLineStrokeWidth(chartTimeline, 2.25)}
                  animationIndex={4}
                />
              ) : null}
              {predictionMode !== "off" ? (
                <PredictionArea
                  dataKey={getPredictionAreaDataKey("netRevenueRetentionPct")}
                  fill="var(--color-netRevenueRetentionPct)"
                  fillOpacity={0.1}
                  animationIndex={5}
                />
              ) : null}
              {predictionMode !== "off" ? (
                <ForesightLine
                  metricKey="netRevenueRetentionPct"
                  stroke="var(--color-netRevenueRetentionPct)"
                  strokeWidth={getAdaptiveLineStrokeWidth(chartTimeline, 2.25)}
                  animationIndex={6}
                />
              ) : null}
              {predictionMode !== "off" && showGrossRevenue ? (
                <ForesightLine
                  metricKey="grossRevenueRetentionPct"
                  stroke="var(--color-grossRevenueRetentionPct)"
                  strokeWidth={getAdaptiveLineStrokeWidth(chartTimeline, 2.25)}
                  animationIndex={7}
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
  predictionMode = "off",
}: {
  timeline: DashboardData["timeline"];
  predictionMode?: PredictionMode;
}) {
  const [view, setView] = React.useState<"throughput" | "win-rate">(
    "throughput",
  );
  const chartTimeline = React.useMemo(
    () => buildDeliveryVolumeChartTimeline(timeline, predictionMode),
    [predictionMode, timeline],
  );
  const latestPoint = timeline.at(-1);
  const baselinePoint = timeline.length > 1 ? timeline[0] ?? null : null;
  const latestProposalWinRate = latestPoint
    ? calculateProposalWinRate(latestPoint.proposalsSent, latestPoint.ordersWon)
    : null;
  const baselineProposalWinRate = baselinePoint
    ? calculateProposalWinRate(baselinePoint.proposalsSent, baselinePoint.ordersWon)
    : null;
  const latestActualPoint =
    [...chartTimeline].reverse().find((point) => !point.isForesight) ??
    chartTimeline.at(-1) ??
    null;
  const tickGap = getAdaptiveTickGap(chartTimeline);
  const xAxisPadding = getAdaptiveXAxisPadding(chartTimeline);
  const curveType = getAdaptiveCurveType(chartTimeline);
  const proposalsDot = getAdaptiveLineDot(
    "var(--color-proposalsSent)",
    chartTimeline,
  );
  const ordersDot = getAdaptiveLineDot("var(--color-ordersWon)", chartTimeline);
  const proposalWinRateDot = getAdaptiveLineDot(
    "var(--color-proposalWinRatePct)",
    chartTimeline,
  );
  const proposalsAxisMax = React.useMemo(() => {
    const maxValue = chartTimeline.reduce(
      (currentMax, point) =>
        Math.max(
          currentMax,
          Number(point.proposalsSent ?? 0),
          Number(point.ordersWon ?? 0),
          Number(point.proposalsSentForesight ?? 0),
          Number(point.ordersWonForesight ?? 0),
        ),
      0,
    );

    return Math.max(10, Math.ceil((maxValue + 2) / 2) * 2);
  }, [chartTimeline]);
  const winRateAxisMax = React.useMemo(() => {
    const maxRate = chartTimeline.reduce(
      (currentMax, point) =>
        Math.max(
          currentMax,
          Number(point.proposalWinRatePct ?? 0),
          Number(point.proposalWinRatePctForesight ?? 0),
        ),
      0,
    );

    return Math.min(100, Math.max(30, Math.ceil((maxRate + 5) / 5) * 5));
  }, [chartTimeline]);
  const deliveryTooltipLabelMap: Record<string, string> = {
    proposalsSent: "Proposals sent",
    ordersWon: "Orders won",
    proposalWinRatePct: "Proposal win rate",
  };
  const chartAnimationKey = getTimelineAnimationKey(
    chartTimeline,
    `delivery-volume-${view}-${predictionMode}`,
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
        {latestPoint && latestProposalWinRate !== null ? (
          <ChartStatRow
            items={[
              createChartStatItem(
                "proposalsSent",
                "Proposals",
                latestPoint.proposalsSent,
                baselinePoint?.proposalsSent,
              ),
              createChartStatItem(
                "ordersWon",
                "Orders won",
                latestPoint.ordersWon,
                baselinePoint?.ordersWon,
              ),
              {
                label: "Win rate",
                value: formatMetricValue(latestProposalWinRate, "percent"),
                comparison: getRangeComparison(
                  "up",
                  latestProposalWinRate,
                  baselineProposalWinRate,
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
            <ComposedChart accessibilityLayer data={chartTimeline} margin={defaultChartMargin}>
              <defs>
                <linearGradient id="proposalsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-proposalsSent)" stopOpacity={0.24} />
                  <stop offset="100%" stopColor="var(--color-proposalsSent)" stopOpacity={0.03} />
                </linearGradient>
                <linearGradient id="winRateFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-proposalWinRatePct)" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="var(--color-proposalWinRatePct)" stopOpacity={0.03} />
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
              />
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
              <ReferenceLine
                yAxisId={view === "throughput" ? "right" : undefined}
                y={25}
                stroke="var(--border)"
                strokeDasharray="4 6"
              />
              {predictionMode !== "off" ? (
                <PredictionRegion timeline={chartTimeline} />
              ) : null}
              {predictionMode !== "off" && latestActualPoint ? (
                <ReferenceLine
                  x={latestActualPoint.label}
                  stroke="var(--border)"
                  strokeDasharray="2 6"
                />
              ) : null}
              <ChartTooltip
                content={({ active, label, payload }) => {
                  const filteredPayload = (payload ?? []).filter((item) => {
                    if (item.value == null) {
                      return false;
                    }

                    return typeof item.value !== "number" || Number.isFinite(item.value);
                  });

                  if (!active || !filteredPayload.length) {
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

                        return (
                          order[
                            normalizePredictionSeriesKey(String(item.dataKey)) as keyof typeof order
                          ] ?? 99
                        );
                      }}
                      label={filteredPayload[0]?.payload?.label ?? label}
                      payload={filteredPayload}
                      labelFormatter={(tooltipLabel, items) =>
                        formatPredictionTooltipLabel(
                          String(tooltipLabel),
                          items as ReadonlyArray<{
                            payload?: {
                              isForesight?: boolean;
                              predictionDaysAhead?: number;
                            };
                          }>,
                        )
                      }
                      formatter={(value, name, item, _index, point) => {
                        const key = normalizePredictionSeriesKey(
                          String(item.dataKey ?? name),
                        );
                        const pointData =
                          point as unknown as DeliveryVolumeChartPoint | undefined;
                        const isPredictionPoint = Boolean(pointData?.isForesight);

                        return (
                          <div className="flex flex-1 items-center justify-between gap-3">
                            <span className="text-muted-foreground">
                              {isPredictionPoint
                                ? `${deliveryTooltipLabelMap[key] ?? key} estimate`
                                : deliveryTooltipLabelMap[key] ?? key}
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
                  <Area
                    yAxisId="left"
                    dataKey="proposalsSent"
                    type={curveType}
                    stroke="var(--color-proposalsSent)"
                    fill="url(#proposalsFill)"
                    strokeWidth={getAdaptiveLineStrokeWidth(chartTimeline, 2.35)}
                    dot={proposalsDot}
                    activeDot={{
                      r: 4.5,
                      fill: "var(--color-proposalsSent)",
                      stroke: "var(--background)",
                      strokeWidth: 2,
                    }}
                    {...getSeriesAnimationProps(0)}
                  />
                  <Line
                    yAxisId="left"
                    dataKey="ordersWon"
                    type={curveType}
                    stroke="var(--color-ordersWon)"
                    strokeWidth={getAdaptiveLineStrokeWidth(chartTimeline, 2.75)}
                    dot={ordersDot}
                    activeDot={{
                      r: 4.5,
                      fill: "var(--color-ordersWon)",
                      stroke: "var(--background)",
                      strokeWidth: 2,
                    }}
                    {...getSeriesAnimationProps(1)}
                  />
                  <Line
                    yAxisId="right"
                    dataKey="proposalWinRatePct"
                    type={curveType}
                    stroke="var(--color-proposalWinRatePct)"
                    strokeOpacity={0.82}
                    strokeWidth={getAdaptiveLineStrokeWidth(chartTimeline, 2.4)}
                    dot={proposalWinRateDot}
                    activeDot={{
                      r: 4.5,
                      fill: "var(--color-proposalWinRatePct)",
                      stroke: "var(--background)",
                      strokeWidth: 2,
                    }}
                    {...getSeriesAnimationProps(2)}
                  />
                </>
              ) : null}
              {view === "win-rate" ? (
                <Area
                  dataKey="proposalWinRatePct"
                  type={curveType}
                  stroke="var(--color-proposalWinRatePct)"
                  fill="url(#winRateFill)"
                  strokeWidth={getAdaptiveLineStrokeWidth(chartTimeline, 2.75)}
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
              {predictionMode !== "off" && view === "throughput" ? (
                <>
                  <PredictionArea
                    dataKey={getPredictionAreaDataKey("proposalsSent")}
                    yAxisId="left"
                    fill="var(--color-proposalsSent)"
                    fillOpacity={0.12}
                    animationIndex={3}
                  />
                  <ForesightLine
                    metricKey="proposalsSent"
                    yAxisId="left"
                    stroke="var(--color-proposalsSent)"
                    strokeWidth={getAdaptiveLineStrokeWidth(chartTimeline, 2.2)}
                    animationIndex={4}
                  />
                  <ForesightLine
                    metricKey="ordersWon"
                    yAxisId="left"
                    stroke="var(--color-ordersWon)"
                    strokeWidth={getAdaptiveLineStrokeWidth(chartTimeline, 2.5)}
                    animationIndex={5}
                  />
                  <PredictionArea
                    dataKey={getPredictionAreaDataKey("proposalWinRatePct")}
                    yAxisId="right"
                    fill="var(--color-proposalWinRatePct)"
                    fillOpacity={0.08}
                    animationIndex={6}
                  />
                  <PredictionLine
                    dataKey="proposalWinRatePctForesight"
                    name="proposalWinRatePct"
                    yAxisId="right"
                    stroke="var(--color-proposalWinRatePct)"
                    strokeWidth={getAdaptiveLineStrokeWidth(chartTimeline, 2.2)}
                    animationIndex={7}
                  />
                </>
              ) : null}
              {predictionMode !== "off" && view === "win-rate" ? (
                <PredictionArea
                  dataKey={getPredictionAreaDataKey("proposalWinRatePct")}
                  fill="var(--color-proposalWinRatePct)"
                  fillOpacity={0.1}
                  animationIndex={2}
                />
              ) : null}
              {predictionMode !== "off" && view === "win-rate" ? (
                <PredictionLine
                  dataKey="proposalWinRatePctForesight"
                  name="proposalWinRatePct"
                  stroke="var(--color-proposalWinRatePct)"
                  strokeWidth={getAdaptiveLineStrokeWidth(chartTimeline, 2.35)}
                  animationIndex={3}
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
  predictionMode = "off",
}: {
  timeline: DashboardData["timeline"];
  predictionMode?: PredictionMode;
}) {
  const [view, setView] = React.useState<"combined" | "sla" | "incidents">(
    "combined",
  );
  const chartTimeline = React.useMemo(
    () =>
      predictionMode !== "off"
        ? buildPredictionChartTimeline(
            timeline,
            ["feedSlaQualityScore", "incidentCount"],
            predictionMode,
          )
        : (timeline as ForesightChartPoint[]),
    [predictionMode, timeline],
  );
  const latestPoint = timeline.at(-1);
  const baselinePoint = timeline.length > 1 ? timeline[0] ?? null : null;
  const latestActualPoint =
    [...chartTimeline].reverse().find((point) => !point.isForesight) ??
    chartTimeline.at(-1) ??
    null;
  const tickGap = getAdaptiveTickGap(chartTimeline);
  const xAxisPadding = getAdaptiveXAxisPadding(chartTimeline);
  const showSla = view !== "incidents";
  const showIncidents = view !== "sla";
  const curveType = getAdaptiveCurveType(chartTimeline);
  const slaDot = getAdaptiveLineDot(
    "var(--color-feedSlaQualityScore)",
    chartTimeline,
  );
  const incidentDot = getAdaptiveLineDot(
    "var(--color-incidentCount)",
    chartTimeline,
  );
  const slaAxisDomain = React.useMemo(() => {
    const values = chartTimeline.flatMap((point) => [
      Number(point.feedSlaQualityScore ?? NaN),
      Number(point.feedSlaQualityScoreForesight ?? NaN),
    ]).filter(Number.isFinite);

    if (!values.length) {
      return [95, 100] as const;
    }

    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const upperBound = Math.min(
      100,
      Math.max(98, Math.ceil((maxValue + 0.4) * 2) / 2),
    );
    const lowerBound = Math.max(
      90,
      Math.min(
        99,
        Math.floor((minValue - 0.6) * 2) / 2,
        upperBound - 2,
      ),
    );

    return [lowerBound, upperBound] as const;
  }, [chartTimeline]);
  const incidentAxisMax = React.useMemo(() => {
    const maxValue = chartTimeline.reduce(
      (currentMax, point) =>
        Math.max(
          currentMax,
          Number(point.incidentCount ?? 0),
          Number(point.incidentCountForesight ?? 0),
        ),
      0,
    );

    return Math.max(2, Math.ceil(maxValue + 1));
  }, [chartTimeline]);
  const chartAnimationKey = getTimelineAnimationKey(
    chartTimeline,
    `delivery-reliability-${view}-${predictionMode}`,
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
            <ComposedChart accessibilityLayer data={chartTimeline} margin={defaultChartMargin}>
              <defs>
                <linearGradient id="slaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-feedSlaQualityScore)" stopOpacity={0.24} />
                  <stop offset="100%" stopColor="var(--color-feedSlaQualityScore)" stopOpacity={0.03} />
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
              />
              {showSla ? (
                <YAxis
                  yAxisId="left"
                  tickLine={false}
                  axisLine={false}
                  width={48}
                  domain={slaAxisDomain}
                  tickFormatter={(value) => `${value}%`}
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
                />
              ) : null}
              {showSla ? (
                <ReferenceLine
                  yAxisId="left"
                  y={99}
                  stroke="var(--border)"
                  strokeDasharray="4 6"
                />
              ) : null}
              {predictionMode !== "off" ? (
                <PredictionRegion timeline={chartTimeline} />
              ) : null}
              {predictionMode !== "off" && latestActualPoint ? (
                <ReferenceLine
                  x={latestActualPoint.label}
                  stroke="var(--border)"
                  strokeDasharray="2 6"
                />
              ) : null}
              <ChartTooltip
                content={({ active, label, payload }) => {
                  const filteredPayload = (payload ?? []).filter((item) => {
                    if (item.value == null) {
                      return false;
                    }

                    return typeof item.value !== "number" || Number.isFinite(item.value);
                  });

                  if (!active || !filteredPayload.length) {
                    return null;
                  }

                  return (
                    <ChartTooltipContent
                      active={active}
                      label={filteredPayload[0]?.payload?.label ?? label}
                      payload={filteredPayload}
                      itemSorter={(item) => {
                        const order = {
                          feedSlaQualityScore: 0,
                          incidentCount: 1,
                        } as const;

                        return (
                          order[
                            normalizePredictionMetricKey(
                              String(item.dataKey ?? item.name),
                            ) as keyof typeof order
                          ] ?? 99
                        );
                      }}
                      labelFormatter={(tooltipLabel, items) =>
                        formatPredictionTooltipLabel(
                          String(tooltipLabel),
                          items as ReadonlyArray<{
                            payload?: {
                              isForesight?: boolean;
                              predictionDaysAhead?: number;
                            };
                          }>,
                        )
                      }
                      formatter={(value, name, item, _index, point) => {
                        const metricKey = normalizePredictionMetricKey(
                          String(item.dataKey ?? name),
                        );
                        const pointData =
                          point as unknown as ForesightChartPoint | undefined;
                        const isPredictionPoint = Boolean(pointData?.isForesight);
                        const labelMap: Record<NumericMetricKey, string> = {
                          feedSlaQualityScore: "Feed SLA",
                          incidentCount: "Incident count",
                          proposalsSent: "Proposals sent",
                          ordersWon: "Orders won",
                          pipelineValue: "Pipeline value",
                          pipelineVelocity: "Pipeline velocity",
                          closeRatePct: "Close rate",
                          netRevenueRetentionPct: "NRR",
                          newCustomersPerMonth: "New customers",
                          pipelineCoverageRatio: "Coverage ratio",
                          averageDealSize: "Avg deal size",
                          customerAcquisitionCost: "CAC",
                          marketingSourcedPipelineCount: "Marketing-sourced #",
                          feedRetentionPct: "Feed retention",
                          grossRevenueRetentionPct: "GRR",
                          marketingSourcedPipelinePct: "Marketing-sourced pipeline",
                          leadToOpportunityConversionPct: "Lead to opportunity",
                          salesCycleDays: "Sales cycle",
                          cacPaybackMonths: "CAC payback",
                        };

                        return (
                          <div className="flex flex-1 items-center justify-between gap-3">
                            <span className="text-muted-foreground">
                              {isPredictionPoint
                                ? `${labelMap[metricKey]} estimate`
                                : labelMap[metricKey]}
                            </span>
                            <span className="font-mono font-medium text-foreground">
                              {formatMetricByKey(metricKey, Number(value))}
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
              {showSla ? (
                <Area
                  yAxisId="left"
                  dataKey="feedSlaQualityScore"
                  type={curveType}
                  stroke="var(--color-feedSlaQualityScore)"
                  fill="url(#slaFill)"
                  strokeWidth={getAdaptiveLineStrokeWidth(chartTimeline, 2.5)}
                  dot={slaDot}
                  activeDot={{
                    r: 4,
                    fill: "var(--color-feedSlaQualityScore)",
                    stroke: "var(--background)",
                    strokeWidth: 2,
                  }}
                  {...getSeriesAnimationProps(0)}
                />
              ) : null}
              {showIncidents ? (
                <Line
                  yAxisId="right"
                  dataKey="incidentCount"
                  type="linear"
                  stroke="var(--color-incidentCount)"
                  strokeWidth={getAdaptiveLineStrokeWidth(chartTimeline, 2.65)}
                  dot={incidentDot}
                  activeDot={{
                    r: 4,
                    fill: "var(--color-incidentCount)",
                    stroke: "var(--background)",
                    strokeWidth: 2,
                  }}
                  {...getSeriesAnimationProps(1)}
                />
              ) : null}
              {predictionMode !== "off" && showSla ? (
                <PredictionArea
                  dataKey={getPredictionAreaDataKey("feedSlaQualityScore")}
                  yAxisId="left"
                  fill="var(--color-feedSlaQualityScore)"
                  fillOpacity={0.1}
                  animationIndex={2}
                />
              ) : null}
              {predictionMode !== "off" && showSla ? (
                <ForesightLine
                  metricKey="feedSlaQualityScore"
                  yAxisId="left"
                  stroke="var(--color-feedSlaQualityScore)"
                  strokeWidth={getAdaptiveLineStrokeWidth(chartTimeline, 2.2)}
                  animationIndex={3}
                />
              ) : null}
              {predictionMode !== "off" && showIncidents ? (
                <ForesightLine
                  metricKey="incidentCount"
                  yAxisId="right"
                  stroke="var(--color-incidentCount)"
                  strokeWidth={getAdaptiveLineStrokeWidth(chartTimeline, 2.35)}
                  animationIndex={4}
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
