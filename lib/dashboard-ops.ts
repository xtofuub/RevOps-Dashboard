import {
  KPI_FORM_SECTIONS,
  formatMetricByKey,
  type MetricFieldDefinition,
  type NumericMetricKey,
  type WeeklySnapshot,
} from "@/lib/kpi-dashboard";

export type ThresholdDirection = "minimum" | "maximum";

export type MetricTarget = {
  metricKey: NumericMetricKey;
  ownerName: string;
  targetValue: number;
  thresholdValue: number;
  thresholdDirection: ThresholdDirection;
  updatedAt: string;
};

export type AlertChannel = "email" | "slack";

export type AlertSubscription = {
  metricKey: NumericMetricKey;
  recipient: string;
  channel: AlertChannel;
  isEnabled: boolean;
  createdAt: string;
};

export type MetricTargetStatus = MetricTarget & {
  currentValue: number | null;
  status: "on-track" | "watch" | "breach" | "no-data";
  targetLabel: string;
  thresholdLabel: string;
  currentLabel: string;
};

export type OperatorBriefItem = {
  id: string;
  title: string;
  changeSummary: string;
  whyItMatters: string;
  ownerName: string;
  priority: "high" | "medium";
};

type DefaultTargetTemplate = {
  ownerName: string;
  targetValue: number;
  thresholdValue: number;
  thresholdDirection: ThresholdDirection;
};

const defaultMetricTargets: Record<NumericMetricKey, DefaultTargetTemplate> = {
  newCustomersPerMonth: {
    ownerName: "Revenue Ops",
    targetValue: 12,
    thresholdValue: 8,
    thresholdDirection: "minimum",
  },
  pipelineValue: {
    ownerName: "Revenue Ops",
    targetValue: 350000,
    thresholdValue: 280000,
    thresholdDirection: "minimum",
  },
  closeRatePct: {
    ownerName: "Sales Leadership",
    targetValue: 25,
    thresholdValue: 22,
    thresholdDirection: "minimum",
  },
  salesCycleDays: {
    ownerName: "Sales Leadership",
    targetValue: 32,
    thresholdValue: 40,
    thresholdDirection: "maximum",
  },
  pipelineCoverageRatio: {
    ownerName: "Revenue Ops",
    targetValue: 4,
    thresholdValue: 3,
    thresholdDirection: "minimum",
  },
  averageDealSize: {
    ownerName: "Sales Leadership",
    targetValue: 24000,
    thresholdValue: 20000,
    thresholdDirection: "minimum",
  },
  customerAcquisitionCost: {
    ownerName: "Marketing Ops",
    targetValue: 3600,
    thresholdValue: 4200,
    thresholdDirection: "maximum",
  },
  netRevenueRetentionPct: {
    ownerName: "Customer Success",
    targetValue: 108,
    thresholdValue: 105,
    thresholdDirection: "minimum",
  },
  grossRevenueRetentionPct: {
    ownerName: "Customer Success",
    targetValue: 93,
    thresholdValue: 90,
    thresholdDirection: "minimum",
  },
  pipelineVelocity: {
    ownerName: "Revenue Ops",
    targetValue: 28000,
    thresholdValue: 22000,
    thresholdDirection: "minimum",
  },
  marketingSourcedPipelinePct: {
    ownerName: "Marketing Ops",
    targetValue: 42,
    thresholdValue: 35,
    thresholdDirection: "minimum",
  },
  marketingSourcedPipelineCount: {
    ownerName: "Marketing Ops",
    targetValue: 20,
    thresholdValue: 15,
    thresholdDirection: "minimum",
  },
  leadToOpportunityConversionPct: {
    ownerName: "Marketing Ops",
    targetValue: 33,
    thresholdValue: 29,
    thresholdDirection: "minimum",
  },
  cacPaybackMonths: {
    ownerName: "Finance",
    targetValue: 11.5,
    thresholdValue: 14,
    thresholdDirection: "maximum",
  },
  feedRetentionPct: {
    ownerName: "Customer Success",
    targetValue: 96,
    thresholdValue: 94,
    thresholdDirection: "minimum",
  },
  proposalsSent: {
    ownerName: "Sales Leadership",
    targetValue: 24,
    thresholdValue: 20,
    thresholdDirection: "minimum",
  },
  ordersWon: {
    ownerName: "Sales Leadership",
    targetValue: 6,
    thresholdValue: 4,
    thresholdDirection: "minimum",
  },
  feedSlaQualityScore: {
    ownerName: "Delivery Ops",
    targetValue: 99,
    thresholdValue: 98.5,
    thresholdDirection: "minimum",
  },
  incidentCount: {
    ownerName: "Delivery Ops",
    targetValue: 1,
    thresholdValue: 3,
    thresholdDirection: "maximum",
  },
};

export const defaultAlertSubscriptions: AlertSubscription[] = [
  {
    metricKey: "pipelineCoverageRatio",
    recipient: "revops@fitsec.example",
    channel: "slack",
    isEnabled: true,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    metricKey: "closeRatePct",
    recipient: "sales@fitsec.example",
    channel: "email",
    isEnabled: true,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    metricKey: "feedRetentionPct",
    recipient: "cs@fitsec.example",
    channel: "email",
    isEnabled: true,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    metricKey: "feedSlaQualityScore",
    recipient: "delivery@fitsec.example",
    channel: "slack",
    isEnabled: true,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    metricKey: "incidentCount",
    recipient: "delivery@fitsec.example",
    channel: "email",
    isEnabled: true,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
];

export function getDefaultMetricTargets(now = new Date().toISOString()) {
  return Object.entries(defaultMetricTargets).map(([metricKey, config]) => ({
    metricKey: metricKey as NumericMetricKey,
    ownerName: config.ownerName,
    targetValue: config.targetValue,
    thresholdValue: config.thresholdValue,
    thresholdDirection: config.thresholdDirection,
    updatedAt: now,
  }));
}

function formatThresholdLabel(target: MetricTarget) {
  const valueLabel = formatMetricByKey(target.metricKey, target.thresholdValue);
  return target.thresholdDirection === "minimum"
    ? `Alert below ${valueLabel}`
    : `Alert above ${valueLabel}`;
}

function getStatus(target: MetricTarget, currentValue: number | null) {
  if (currentValue === null) {
    return "no-data" as const;
  }

  if (target.thresholdDirection === "minimum") {
    if (currentValue < target.thresholdValue) {
      return "breach" as const;
    }

    if (currentValue < target.targetValue) {
      return "watch" as const;
    }

    return "on-track" as const;
  }

  if (currentValue > target.thresholdValue) {
    return "breach" as const;
  }

  if (currentValue > target.targetValue) {
    return "watch" as const;
  }

  return "on-track" as const;
}

function getMetricDefinition(metricKey: NumericMetricKey): MetricFieldDefinition {
  const sectionField = KPI_FORM_SECTIONS.flatMap((section) => section.fields).find(
    (field) => field.key === metricKey,
  );

  if (!sectionField) {
    throw new Error(`Missing metric field definition for ${metricKey}`);
  }

  return sectionField;
}

export function buildMetricTargetStatuses(
  latestSnapshot: WeeklySnapshot | null,
  metricTargets: MetricTarget[],
) {
  return metricTargets.map<MetricTargetStatus>((target) => {
    const currentValue = latestSnapshot ? latestSnapshot[target.metricKey] : null;

    return {
      ...target,
      currentValue,
      status: getStatus(target, currentValue),
      targetLabel: `Target ${formatMetricByKey(target.metricKey, target.targetValue)}`,
      thresholdLabel: formatThresholdLabel(target),
      currentLabel:
        currentValue === null
          ? "No current value"
          : `Current ${formatMetricByKey(target.metricKey, currentValue)}`,
    };
  });
}

export function buildOperatorBrief(
  latestSnapshot: WeeklySnapshot | null,
  metricTargetStatuses: MetricTargetStatus[],
) {
  if (!latestSnapshot) {
    return [] as OperatorBriefItem[];
  }

  return metricTargetStatuses
    .filter((target) => target.status === "breach" || target.status === "watch")
    .sort((left, right) => {
      const priorityOrder = { breach: 0, watch: 1, "on-track": 2, "no-data": 3 } as const;
      return priorityOrder[left.status] - priorityOrder[right.status];
    })
    .slice(0, 4)
    .map<OperatorBriefItem>((target) => {
      const metric = getMetricDefinition(target.metricKey);
      const highPriority = target.status === "breach";

      return {
        id: target.metricKey,
        title: `${metric.shortLabel} is ${highPriority ? "outside guardrail" : "below target"}`,
        changeSummary: `${target.currentLabel}. ${target.thresholdLabel}.`,
        whyItMatters:
          target.thresholdDirection === "minimum"
            ? `${metric.shortLabel} is trailing the operating plan and can slow revenue confidence if it slips further.`
            : `${metric.shortLabel} is above the acceptable ceiling and can create delivery or efficiency drag.`,
        ownerName: target.ownerName,
        priority: highPriority ? "high" : "medium",
      };
    });
}
