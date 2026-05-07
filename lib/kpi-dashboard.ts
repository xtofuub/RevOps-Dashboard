import { z } from "zod";

export const DEFAULT_STAGE_ORDER = [
  "Lead",
  "Qualified",
  "Proposal",
  "Negotiation",
  "Closed Won",
] as const;

export const DASHBOARD_TABS = [
  {
    id: "overview",
    label: "Overview",
    description: "Your latest weekly snapshot, key trends, and what to watch.",
  },
  {
    id: "revenue-engine",
    label: "Revenue Engine",
    description: "Pipeline value, close rate, deal size, and sales cycle.",
  },
  {
    id: "product-market-signal",
    label: "Product-Market Signal",
    description: "Retention rates, top reasons deals are lost, and what customers keep asking for.",
  },
  {
    id: "delivery-stability",
    label: "Delivery Stability",
    description: "Proposals sent, orders won, service quality, and incidents.",
  },
  {
    id: "weekly-update",
    label: "Weekly Update",
    description: "Enter or update this week's numbers. Saving again keeps earlier values in history.",
  },
] as const;

export type DashboardTab = (typeof DASHBOARD_TABS)[number]["id"];
export type StageName = (typeof DEFAULT_STAGE_ORDER)[number];

export type MetricFormat =
  | "count"
  | "currency"
  | "percent"
  | "days"
  | "months"
  | "ratio";

function parseIsoUtcDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function isCanonicalIsoDate(value: string) {
  return formatIsoDate(parseIsoUtcDate(value)) === value;
}

function isWeekEndingDate(value: string) {
  return parseIsoUtcDate(value).getUTCDay() === 5;
}

const stageMetricSchema = z.object({
  stage: z.enum(DEFAULT_STAGE_ORDER),
  conversionPct: z.number().min(0).max(100),
  avgDaysInStage: z.number().min(0).max(365),
});

const boundedTextSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .transform((value) => value.replace(/\s+/g, " "));

export const weeklySnapshotPayloadSchema = z
  .object({
    weekOf: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .refine(isCanonicalIsoDate, {
        message: "Enter a valid reporting date.",
      }),
    newCustomersPerMonth: z.number().min(0).max(100000),
    pipelineValue: z.number().min(0).max(1_000_000_000),
    closeRatePct: z.number().min(0).max(100),
    salesCycleDays: z.number().min(0).max(365),
    pipelineCoverageRatio: z.number().min(0).max(25),
    averageDealSize: z.number().min(0).max(1_000_000),
    customerAcquisitionCost: z.number().min(0).max(1_000_000),
    netRevenueRetentionPct: z.number().min(0).max(250),
    grossRevenueRetentionPct: z.number().min(0).max(100),
    pipelineVelocity: z.number().min(0).max(1_000_000_000),
    marketingSourcedPipelinePct: z.number().min(0).max(100),
    marketingSourcedPipelineCount: z.number().min(0).max(100000),
    leadToOpportunityConversionPct: z.number().min(0).max(100),
    cacPaybackMonths: z.number().min(0).max(120),
    feedRetentionPct: z.number().min(0).max(100),
    proposalsSent: z.number().min(0).max(100000),
    ordersWon: z.number().min(0).max(100000),
    feedSlaQualityScore: z.number().min(0).max(100),
    incidentCount: z.number().min(0).max(100000),
    lossReasonsTop3: z.array(boundedTextSchema).length(3),
    repeatedRequests: z.array(boundedTextSchema).min(1).max(6),
    stageMetrics: z.array(stageMetricSchema).length(DEFAULT_STAGE_ORDER.length),
  })
  .superRefine(({ stageMetrics }, ctx) => {
    DEFAULT_STAGE_ORDER.forEach((stage, index) => {
      if (stageMetrics[index]?.stage !== stage) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Stage ${index + 1} must be ${stage}.`,
          path: ["stageMetrics", index, "stage"],
        });
      }
    });
  });

export const weeklySnapshotSchema = weeklySnapshotPayloadSchema.extend({
  updatedAt: z.string().datetime(),
});

export const weeklySnapshotsSchema = z.array(weeklySnapshotSchema);

export type WeeklySnapshotPayload = z.infer<typeof weeklySnapshotPayloadSchema>;
export type WeeklySnapshot = z.infer<typeof weeklySnapshotSchema>;
export type StageMetric = WeeklySnapshot["stageMetrics"][number];

export type NumericMetricKey = Exclude<
  keyof WeeklySnapshotPayload,
  "weekOf" | "lossReasonsTop3" | "repeatedRequests" | "stageMetrics"
>;

export type MetricFieldDefinition = {
  key: NumericMetricKey;
  label: string;
  shortLabel: string;
  description: string;
  format: MetricFormat;
  min: number;
  max: number;
  step: number;
  betterDirection: "up" | "down" | "neutral";
};

const revenueEngineFields: readonly MetricFieldDefinition[] = [
  {
    key: "newCustomersPerMonth",
    label: "New customers / month",
    shortLabel: "New customers",
    description: "Number of new customers won this month so far.",
    format: "count",
    min: 0,
    max: 100000,
    step: 1,
    betterDirection: "up",
  },
  {
    key: "pipelineValue",
    label: "Pipeline value",
    shortLabel: "Pipeline value",
    description: "Total value of all open deals in your pipeline right now.",
    format: "currency",
    min: 0,
    max: 1_000_000_000,
    step: 1000,
    betterDirection: "up",
  },
  {
    key: "closeRatePct",
    label: "Close rate %",
    shortLabel: "Close rate",
    description: "Share of opportunities converted into won deals.",
    format: "percent",
    min: 0,
    max: 100,
    step: 0.1,
    betterDirection: "up",
  },
  {
    key: "salesCycleDays",
    label: "Sales cycle (days)",
    shortLabel: "Sales cycle",
    description: "Average number of days from opportunity to close.",
    format: "days",
    min: 0,
    max: 365,
    step: 0.1,
    betterDirection: "down",
  },
  {
    key: "pipelineCoverageRatio",
    label: "Pipeline coverage ratio",
    shortLabel: "Coverage ratio",
    description: "Pipeline value divided by your sales target for this period. 3x means three times the target.",
    format: "ratio",
    min: 0,
    max: 25,
    step: 0.1,
    betterDirection: "up",
  },
  {
    key: "averageDealSize",
    label: "Average deal size",
    shortLabel: "Avg deal size",
    description: "Average value of closed deals in the current period.",
    format: "currency",
    min: 0,
    max: 1_000_000,
    step: 100,
    betterDirection: "up",
  },
  {
    key: "customerAcquisitionCost",
    label: "Customer acquisition cost",
    shortLabel: "CAC",
    description: "Average cost to win one new customer (sales + marketing spend ÷ new customers).",
    format: "currency",
    min: 0,
    max: 1_000_000,
    step: 5,
    betterDirection: "down",
  },
  {
    key: "pipelineVelocity",
    label: "Pipeline velocity",
    shortLabel: "Pipeline velocity",
    description:
      "Calculated for you. Estimates how fast revenue moves through your pipeline based on recent history.",
    format: "currency",
    min: 0,
    max: 1_000_000_000,
    step: 1000,
    betterDirection: "up",
  },
  {
    key: "marketingSourcedPipelinePct",
    label: "Marketing-sourced pipeline %",
    shortLabel: "Marketing-sourced %",
    description: "Percentage of pipeline value that started as a marketing lead.",
    format: "percent",
    min: 0,
    max: 100,
    step: 0.1,
    betterDirection: "up",
  },
  {
    key: "marketingSourcedPipelineCount",
    label: "Marketing-sourced pipeline (count)",
    shortLabel: "Marketing-sourced #",
    description:
      "Number of marketing-originated pipeline items created during the week.",
    format: "count",
    min: 0,
    max: 100000,
    step: 1,
    betterDirection: "up",
  },
  {
    key: "leadToOpportunityConversionPct",
    label: "Lead-to-opportunity conversion %",
    shortLabel: "Lead to opp %",
    description: "Percentage of incoming leads that turn into qualified sales opportunities.",
    format: "percent",
    min: 0,
    max: 100,
    step: 0.1,
    betterDirection: "up",
  },
  {
    key: "cacPaybackMonths",
    label: "CAC payback period",
    shortLabel: "CAC payback",
    description: "How many months it takes to earn back the cost of acquiring a customer.",
    format: "months",
    min: 0,
    max: 120,
    step: 0.1,
    betterDirection: "down",
  },
] as const;

const productMarketSignalFields: readonly MetricFieldDefinition[] = [
  {
    key: "feedRetentionPct",
    label: "Feed retention %",
    shortLabel: "Feed retention",
    description: "Percentage of customers still actively using the feed product week over week.",
    format: "percent",
    min: 0,
    max: 100,
    step: 0.1,
    betterDirection: "up",
  },
  {
    key: "netRevenueRetentionPct",
    label: "Net revenue retention",
    shortLabel: "NRR",
    description: "Revenue kept from existing customers, including upsells. Above 100% means accounts are growing.",
    format: "percent",
    min: 0,
    max: 250,
    step: 0.1,
    betterDirection: "up",
  },
  {
    key: "grossRevenueRetentionPct",
    label: "Gross revenue retention",
    shortLabel: "GRR",
    description: "Revenue kept from existing customers, not counting upsells. Drops mean churn.",
    format: "percent",
    min: 0,
    max: 100,
    step: 0.1,
    betterDirection: "up",
  },
] as const;

const deliveryStabilityFields: readonly MetricFieldDefinition[] = [
  {
    key: "proposalsSent",
    label: "Proposals sent",
    shortLabel: "Proposals sent",
    description: "Number of proposals or offers sent during the week.",
    format: "count",
    min: 0,
    max: 100000,
    step: 1,
    betterDirection: "up",
  },
  {
    key: "ordersWon",
    label: "Orders won",
    shortLabel: "Orders won",
    description: "Number of proposals that converted into signed orders.",
    format: "count",
    min: 0,
    max: 100000,
    step: 1,
    betterDirection: "up",
  },
  {
    key: "feedSlaQualityScore",
    label: "Feed SLA / quality indicator",
    shortLabel: "Feed SLA",
    description: "How reliably the feed met its service level this week (uptime, response, quality).",
    format: "percent",
    min: 0,
    max: 100,
    step: 0.1,
    betterDirection: "up",
  },
  {
    key: "incidentCount",
    label: "Incident count",
    shortLabel: "Incidents",
    description: "Number of service incidents or outages this week.",
    format: "count",
    min: 0,
    max: 100000,
    step: 1,
    betterDirection: "down",
  },
] as const;

export const KPI_FORM_SECTIONS = [
  {
    id: "revenue-engine",
    title: "Revenue Engine",
    description: "How fast you're winning deals and what they cost to acquire.",
    fields: revenueEngineFields,
  },
  {
    id: "product-market-signal",
    title: "Product-Market Signal",
    description: "How well customers stay, what they ask for, and why deals stall.",
    fields: productMarketSignalFields,
  },
  {
    id: "delivery-stability",
    title: "Delivery Stability",
    description: "How many proposals you sent, how many closed, and how reliable delivery is.",
    fields: deliveryStabilityFields,
  },
] as const;

export const NUMERIC_FIELD_DEFINITIONS = KPI_FORM_SECTIONS.flatMap(
  (section) => section.fields,
) as MetricFieldDefinition[];

export const metricFieldMap = Object.fromEntries(
  NUMERIC_FIELD_DEFINITIONS.map((field) => [field.key, field]),
) as Record<NumericMetricKey, MetricFieldDefinition>;

export type TimelinePoint = WeeklySnapshot & {
  label: string;
};

export type RankedTextItem = {
  label: string;
  count: number;
  lastSeenWeekOf: string;
  lastSeenLabel: string;
};

export type DashboardHealthAlert = {
  id: string;
  title: string;
  description: string;
  variant: "default" | "destructive";
};

export type DashboardData = {
  timeline: TimelinePoint[];
  latestSnapshot: WeeklySnapshot | null;
  previousSnapshot: WeeklySnapshot | null;
  totalWeeks: number;
  suggestedWeekOf: string;
  lastUpdatedLabel: string | null;
  latestStageMetrics: StageMetric[];
  lossReasonCounts: RankedTextItem[];
  repeatedRequestCounts: RankedTextItem[];
  healthAlerts: DashboardHealthAlert[];
};

type PipelineVelocityInput = Pick<
  WeeklySnapshotPayload,
  "pipelineValue" | "salesCycleDays" | "closeRatePct"
>;

const shortNumberFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
});

const wholeNumberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const monthDayFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

const monthDayYearFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
});

const pipelineVelocityFallbackScale = 3;
const pipelineVelocityRegressionFeatureCount = 4;
const pipelineVelocityHistoryWindow = 12;

function multiplyMatrices(left: number[][], right: number[][]) {
  return left.map((leftRow) =>
    right[0]!.map((_, columnIndex) =>
      leftRow.reduce(
        (sum, value, rowIndex) => sum + value * (right[rowIndex]?.[columnIndex] ?? 0),
        0,
      ),
    ),
  );
}

function transposeMatrix(matrix: number[][]) {
  return matrix[0]!.map((_, columnIndex) => matrix.map((row) => row[columnIndex] ?? 0));
}

function invertMatrix(matrix: number[][]) {
  const size = matrix.length;
  const working = matrix.map((row, rowIndex) => [
    ...row,
    ...Array.from({ length: size }, (_, columnIndex) =>
      rowIndex === columnIndex ? 1 : 0,
    ),
  ]);

  for (let pivotIndex = 0; pivotIndex < size; pivotIndex += 1) {
    let pivotRow = pivotIndex;

    for (let rowIndex = pivotIndex + 1; rowIndex < size; rowIndex += 1) {
      if (
        Math.abs(working[rowIndex]?.[pivotIndex] ?? 0) >
        Math.abs(working[pivotRow]?.[pivotIndex] ?? 0)
      ) {
        pivotRow = rowIndex;
      }
    }

    if (Math.abs(working[pivotRow]?.[pivotIndex] ?? 0) < 1e-9) {
      return null;
    }

    if (pivotRow !== pivotIndex) {
      [working[pivotIndex], working[pivotRow]] = [
        working[pivotRow]!,
        working[pivotIndex]!,
      ];
    }

    const divisor = working[pivotIndex]![pivotIndex]!;

    for (let columnIndex = 0; columnIndex < size * 2; columnIndex += 1) {
      working[pivotIndex]![columnIndex]! /= divisor;
    }

    for (let rowIndex = 0; rowIndex < size; rowIndex += 1) {
      if (rowIndex === pivotIndex) {
        continue;
      }

      const multiplier = working[rowIndex]![pivotIndex]!;

      for (let columnIndex = 0; columnIndex < size * 2; columnIndex += 1) {
        working[rowIndex]![columnIndex]! -=
          multiplier * working[pivotIndex]![columnIndex]!;
      }
    }
  }

  return working.map((row) => row.slice(size));
}

function roundPipelineVelocity(value: number) {
  return Math.max(0, Math.round(value / 10) * 10);
}

function getPipelineVelocityBaseValue(input: PipelineVelocityInput) {
  if (!Number.isFinite(input.pipelineValue) || !Number.isFinite(input.salesCycleDays)) {
    return 0;
  }

  if (input.pipelineValue <= 0 || input.salesCycleDays <= 0) {
    return 0;
  }

  return input.pipelineValue / input.salesCycleDays;
}

function isValidPipelineVelocitySample(
  snapshot: WeeklySnapshot,
): snapshot is WeeklySnapshot {
  return (
    Number.isFinite(snapshot.pipelineValue) &&
    snapshot.pipelineValue > 0 &&
    Number.isFinite(snapshot.salesCycleDays) &&
    snapshot.salesCycleDays > 0 &&
    Number.isFinite(snapshot.closeRatePct) &&
    Number.isFinite(snapshot.pipelineVelocity) &&
    snapshot.pipelineVelocity >= 0
  );
}

function buildPipelineVelocityRegression(history: WeeklySnapshot[]) {
  const samples = sortSnapshots(history)
    .filter(isValidPipelineVelocitySample)
    .slice(-pipelineVelocityHistoryWindow);

  if (samples.length < pipelineVelocityRegressionFeatureCount) {
    return null;
  }

  const designMatrix = samples.map((snapshot) => [
    1,
    snapshot.pipelineValue,
    snapshot.salesCycleDays,
    snapshot.closeRatePct,
  ]);
  const targetMatrix = samples.map((snapshot) => [snapshot.pipelineVelocity]);
  const transposed = transposeMatrix(designMatrix);
  const normalMatrix = multiplyMatrices(transposed, designMatrix);
  const inverse = invertMatrix(normalMatrix);

  if (!inverse) {
    return null;
  }

  const solution = multiplyMatrices(
    inverse,
    multiplyMatrices(transposed, targetMatrix),
  );

  return solution.map((row) => row[0] ?? 0);
}

function getMedian(values: number[]) {
  if (!values.length) {
    return pipelineVelocityFallbackScale;
  }

  const sortedValues = [...values].sort((left, right) => left - right);
  const midpoint = Math.floor(sortedValues.length / 2);

  if (sortedValues.length % 2 === 0) {
    return (sortedValues[midpoint - 1]! + sortedValues[midpoint]!) / 2;
  }

  return sortedValues[midpoint]!;
}

export function calculatePipelineVelocity(
  input: PipelineVelocityInput,
  history: WeeklySnapshot[] = [],
) {
  if (!Number.isFinite(input.closeRatePct)) {
    return 0;
  }

  const baseValue = getPipelineVelocityBaseValue(input);

  if (baseValue <= 0) {
    return 0;
  }

  const regression = buildPipelineVelocityRegression(history);

  if (regression) {
    const estimatedValue =
      regression[0]! +
      regression[1]! * input.pipelineValue +
      regression[2]! * input.salesCycleDays +
      regression[3]! * input.closeRatePct;

    return roundPipelineVelocity(estimatedValue);
  }

  const fallbackScale = getMedian(
    sortSnapshots(history)
      .filter(isValidPipelineVelocitySample)
      .slice(-pipelineVelocityHistoryWindow)
      .map((snapshot) => snapshot.pipelineVelocity / getPipelineVelocityBaseValue(snapshot))
      .filter((value) => Number.isFinite(value) && value > 0),
  );

  return roundPipelineVelocity(baseValue * fallbackScale);
}

export function createEmptyStageMetrics(): StageMetric[] {
  return DEFAULT_STAGE_ORDER.map((stage) => ({
    stage,
    conversionPct: 0,
    avgDaysInStage: 0,
  }));
}

export function normalizeStageMetrics(stageMetrics: StageMetric[]): StageMetric[] {
  const stageMap = new Map(stageMetrics.map((metric) => [metric.stage, metric]));

  return DEFAULT_STAGE_ORDER.map((stage) => {
    const match = stageMap.get(stage);

    return {
      stage,
      conversionPct: match?.conversionPct ?? 0,
      avgDaysInStage: match?.avgDaysInStage ?? 0,
    };
  });
}

export function parseWeekOf(weekOf: string) {
  return parseIsoUtcDate(weekOf);
}

export function formatWeekOf(date: Date) {
  return formatIsoDate(date);
}

export function formatWeekLabel(weekOf: string) {
  return monthDayFormatter.format(parseWeekOf(weekOf));
}

export function formatWeekLabelWithYear(weekOf: string) {
  return monthDayYearFormatter.format(parseWeekOf(weekOf));
}

export function formatDateTimeLabel(isoDateTime: string) {
  return dateTimeFormatter.format(new Date(isoDateTime));
}

export function sortSnapshots<T extends { weekOf: string }>(snapshots: T[]) {
  return [...snapshots].sort((left, right) =>
    left.weekOf.localeCompare(right.weekOf),
  );
}

export function getCurrentWeekEndingFriday(referenceDate = new Date()) {
  const weekEnding = new Date(
    Date.UTC(
      referenceDate.getUTCFullYear(),
      referenceDate.getUTCMonth(),
      referenceDate.getUTCDate(),
    ),
  );
  const isoDay = weekEnding.getUTCDay() === 0 ? 7 : weekEnding.getUTCDay();
  const offsetToFriday = 5 - isoDay;
  weekEnding.setUTCDate(weekEnding.getUTCDate() + offsetToFriday);

  return weekEnding;
}

export function getSuggestedWeekOf(_latestWeekOf?: string | null) {
  void _latestWeekOf;
  const today = new Date();

  return formatIsoDate(
    new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())),
  );
}

export function normalizeTextEntry(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function getLossRatePct(closeRatePct: number) {
  return Math.max(0, Math.min(100, 100 - closeRatePct));
}

function compactCurrency(value: number) {
  const absoluteValue = Math.abs(value);

  if (absoluteValue >= 100000) {
    return `€${shortNumberFormatter.format(value)}`;
  }

  return currencyFormatter.format(value);
}

export function formatMetricValue(value: number, format: MetricFormat) {
  switch (format) {
    case "currency":
      return compactCurrency(value);
    case "percent":
      return `${percentFormatter.format(value)}%`;
    case "days":
      return `${numberFormatter.format(value)}d`;
    case "months":
      return `${numberFormatter.format(value)} mo`;
    case "ratio":
      return `${numberFormatter.format(value)}x`;
    case "count":
    default:
      return wholeNumberFormatter.format(value);
  }
}

export function formatMetricByKey(key: NumericMetricKey, value: number) {
  return formatMetricValue(value, metricFieldMap[key].format);
}

export function formatMetricDelta(
  key: NumericMetricKey,
  currentValue: number,
  previousValue?: number | null,
) {
  if (previousValue === null || previousValue === undefined) {
    return "Baseline week";
  }

  const delta = currentValue - previousValue;

  if (delta === 0) {
    return "No change";
  }

  const prefix = delta > 0 ? "+" : "−";

  return `${prefix}${formatMetricByKey(key, Math.abs(delta))} vs prior week`;
}

export function aggregateTextItems(
  snapshots: WeeklySnapshot[],
  selector: (snapshot: WeeklySnapshot) => string[],
  limit = 5,
) {
  const aggregate = new Map<
    string,
    { label: string; count: number; lastSeenWeekOf: string }
  >();

  sortSnapshots(snapshots).forEach((snapshot) => {
    selector(snapshot).forEach((item) => {
      const normalized = normalizeTextEntry(item);

      if (!normalized) {
        return;
      }

      const existing = aggregate.get(normalized);

      if (existing) {
        existing.count += 1;
        existing.lastSeenWeekOf = snapshot.weekOf;
        return;
      }

      aggregate.set(normalized, {
        label: item.trim().replace(/\s+/g, " "),
        count: 1,
        lastSeenWeekOf: snapshot.weekOf,
      });
    });
  });

  return [...aggregate.values()]
    .sort(
      (left, right) =>
        right.count - left.count || left.label.localeCompare(right.label),
    )
    .slice(0, limit)
    .map((item) => ({
      ...item,
      lastSeenLabel: formatWeekLabel(item.lastSeenWeekOf),
    }));
}

export function buildHealthAlerts(
  latestSnapshot: WeeklySnapshot | null,
): DashboardHealthAlert[] {
  if (!latestSnapshot) {
    return [];
  }

  const alerts: DashboardHealthAlert[] = [];

  if (latestSnapshot.pipelineCoverageRatio < 3) {
    alerts.push({
      id: "coverage",
      title: "Pipeline coverage is below the 3.0x safety floor",
      description:
        "Top-of-funnel creation needs reinforcement before the next sales cycle tightens.",
      variant: "destructive",
    });
  }

  if (
    latestSnapshot.feedSlaQualityScore < 98.5 ||
    latestSnapshot.incidentCount >= 3
  ) {
    alerts.push({
      id: "delivery",
      title: "Delivery reliability needs attention",
      description:
        "SLA quality or incident pressure is high enough to show up in customer confidence.",
      variant: "destructive",
    });
  }

  if (latestSnapshot.closeRatePct < 22 || latestSnapshot.salesCycleDays > 40) {
    alerts.push({
      id: "conversion",
      title: "Commercial efficiency is still uneven",
      description:
        "Conversion is improving, but close rate and cycle time still leave room for sharper execution.",
      variant: "default",
    });
  }

  return alerts.slice(0, 3);
}

export function buildDashboardData(snapshots: WeeklySnapshot[]): DashboardData {
  const timeline = sortSnapshots(snapshots).map((snapshot) => ({
    ...snapshot,
    label: formatWeekLabel(snapshot.weekOf),
    stageMetrics: normalizeStageMetrics(snapshot.stageMetrics),
  }));

  const latestSnapshot = timeline.at(-1) ?? null;
  const previousSnapshot = timeline.at(-2) ?? null;

  return {
    timeline,
    latestSnapshot,
    previousSnapshot,
    totalWeeks: timeline.length,
    suggestedWeekOf: getSuggestedWeekOf(latestSnapshot?.weekOf ?? null),
    lastUpdatedLabel: latestSnapshot
      ? formatDateTimeLabel(latestSnapshot.updatedAt)
      : null,
    latestStageMetrics: latestSnapshot?.stageMetrics ?? createEmptyStageMetrics(),
    lossReasonCounts: aggregateTextItems(
      timeline,
      (snapshot) => snapshot.lossReasonsTop3,
      5,
    ),
    repeatedRequestCounts: aggregateTextItems(
      timeline,
      (snapshot) => snapshot.repeatedRequests,
      6,
    ),
    healthAlerts: buildHealthAlerts(latestSnapshot),
  };
}
