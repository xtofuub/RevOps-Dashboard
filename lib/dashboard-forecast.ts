import {
  formatWeekOf,
  parseWeekOf,
  formatMetricByKey,
  formatWeekLabel,
  metricFieldMap,
  sortSnapshots,
  type NumericMetricKey,
  type WeeklySnapshot,
} from "@/lib/kpi-dashboard";

export const FORECAST_METRIC_KEYS = [
  "pipelineValue",
  "pipelineVelocity",
  "closeRatePct",
  "customerAcquisitionCost",
  "feedRetentionPct",
] as const satisfies readonly NumericMetricKey[];

export type DashboardForecastMetric = {
  metricKey: NumericMetricKey;
  label: string;
  latestValue: number;
  forecast7d: number;
  forecast30d: number;
  forecast7dLabel: string;
  forecast30dLabel: string;
};

export type DashboardForecast = {
  generatedFromWeeks: number;
  confidenceLabel: string;
  metrics: DashboardForecastMetric[];
};

export type ForecastProjectionPoint = {
  daysAhead: number;
  label: string;
  weekOf: string;
  values: Partial<Record<NumericMetricKey, number>>;
};

const forecastHistoryWindow = 12;

function clampMetricValue(metricKey: NumericMetricKey, value: number) {
  const field = metricFieldMap[metricKey];
  return Math.min(field.max, Math.max(field.min, value));
}

function projectMetricValue(
  snapshots: WeeklySnapshot[],
  metricKey: NumericMetricKey,
  horizonDays: number,
) {
  if (!snapshots.length) {
    return 0;
  }

  const values = snapshots
    .map((snapshot, index) => ({
      x: index,
      y: Number(snapshot[metricKey]),
    }))
    .filter((point) => Number.isFinite(point.y));

  if (!values.length) {
    return 0;
  }

  if (values.length === 1) {
    return clampMetricValue(metricKey, values[0]!.y);
  }

  const meanX = values.reduce((sum, point) => sum + point.x, 0) / values.length;
  const meanY = values.reduce((sum, point) => sum + point.y, 0) / values.length;
  const varianceX = values.reduce(
    (sum, point) => sum + (point.x - meanX) ** 2,
    0,
  );

  if (varianceX === 0) {
    return clampMetricValue(metricKey, values.at(-1)?.y ?? 0);
  }

  const covariance = values.reduce(
    (sum, point) => sum + (point.x - meanX) * (point.y - meanY),
    0,
  );
  const slope = covariance / varianceX;
  const intercept = meanY - slope * meanX;
  const futureIndex = values.length - 1 + horizonDays / 7;

  return clampMetricValue(metricKey, intercept + slope * futureIndex);
}

export function buildForecastProjectionPoints(
  snapshots: WeeklySnapshot[],
  metricKeys: readonly NumericMetricKey[],
  horizons: readonly number[] = [7, 30],
): ForecastProjectionPoint[] {
  if (!snapshots.length || !metricKeys.length || !horizons.length) {
    return [];
  }

  const timeline = sortSnapshots(snapshots).slice(-forecastHistoryWindow);
  const latestSnapshot = timeline.at(-1);

  if (!latestSnapshot) {
    return [];
  }

  return horizons.map((daysAhead) => {
    const forecastDate = parseWeekOf(latestSnapshot.weekOf);
    forecastDate.setUTCDate(forecastDate.getUTCDate() + daysAhead);
    const weekOf = formatWeekOf(forecastDate);

    return {
      daysAhead,
      label: formatWeekLabel(weekOf),
      weekOf,
      values: Object.fromEntries(
        metricKeys.map((metricKey) => [
          metricKey,
          projectMetricValue(timeline, metricKey, daysAhead),
        ]),
      ) as Partial<Record<NumericMetricKey, number>>,
    };
  });
}

export function buildDashboardForecast(
  snapshots: WeeklySnapshot[],
): DashboardForecast | null {
  if (!snapshots.length) {
    return null;
  }

  const timeline = sortSnapshots(snapshots).slice(-forecastHistoryWindow);
  const latestSnapshot = timeline.at(-1);

  if (!latestSnapshot) {
    return null;
  }

  return {
    generatedFromWeeks: timeline.length,
    confidenceLabel:
      timeline.length >= 8
        ? "Higher confidence"
        : timeline.length >= 4
          ? "Directional"
          : "Early signal",
    metrics: FORECAST_METRIC_KEYS.map((metricKey) => {
      const latestValue = latestSnapshot[metricKey];
      const [projection7d, projection30d] = buildForecastProjectionPoints(
        timeline,
        [metricKey],
      );
      const forecast7d = projection7d?.values[metricKey] ?? latestValue;
      const forecast30d = projection30d?.values[metricKey] ?? latestValue;

      return {
        metricKey,
        label: metricFieldMap[metricKey].shortLabel,
        latestValue,
        forecast7d,
        forecast30d,
        forecast7dLabel: formatMetricByKey(metricKey, forecast7d),
        forecast30dLabel: formatMetricByKey(metricKey, forecast30d),
      };
    }),
  };
}
