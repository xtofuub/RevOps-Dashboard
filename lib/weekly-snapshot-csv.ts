import {
  DEFAULT_STAGE_ORDER,
  createEmptyStageMetrics,
  weeklySnapshotPayloadSchema,
  type StageMetric,
  type WeeklySnapshotPayload,
} from "@/lib/kpi-dashboard";

const stageAliases = Object.fromEntries(
  DEFAULT_STAGE_ORDER.map((stage) => [
    stage.toLowerCase().replace(/\s+/g, ""),
    stage,
  ]),
) as Record<string, (typeof DEFAULT_STAGE_ORDER)[number]>;

const flatArrayHeaders = {
  lossReasonsTop3_1: ["lossReasonsTop3", 0] as const,
  lossReasonsTop3_2: ["lossReasonsTop3", 1] as const,
  lossReasonsTop3_3: ["lossReasonsTop3", 2] as const,
} as const;

function parseCsv(content: string) {
  const rows: string[][] = [];
  let currentCell = "";
  let currentRow: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const character = content[index];
    const nextCharacter = content[index + 1];

    if (character === '"') {
      if (inQuotes && nextCharacter === '"') {
        currentCell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }

      continue;
    }

    if (character === "," && !inQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = "";
      continue;
    }

    if ((character === "\n" || character === "\r") && !inQuotes) {
      if (character === "\r" && nextCharacter === "\n") {
        index += 1;
      }

      if (currentCell.length > 0 || currentRow.length > 0) {
        currentRow.push(currentCell.trim());
        rows.push(currentRow);
        currentRow = [];
        currentCell = "";
      }
      continue;
    }

    currentCell += character;
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    rows.push(currentRow);
  }

  return rows.filter((row) => row.some((cell) => cell.length > 0));
}

function toNumber(value: string) {
  const normalized = value.trim();
  if (!normalized) {
    return 0;
  }
  return Number(normalized);
}

function normalizeHeader(value: string) {
  return value.trim().replace(/\s+/g, "");
}

function createStageMetricsMap() {
  return new Map(
    createEmptyStageMetrics().map((metric) => [
      metric.stage,
      { ...metric },
    ]) satisfies Array<[string, StageMetric]>,
  );
}

function parseWideCsv(rows: string[][]) {
  if (rows.length < 2) {
    throw new Error("CSV import needs a header row and at least one value row.");
  }

  const [headers, values] = rows;
  const stageMetrics = createStageMetricsMap();
  const payload: Record<string, unknown> = {
    lossReasonsTop3: ["", "", ""],
    repeatedRequests: [],
  };

  headers.forEach((header, index) => {
    const normalizedHeader = normalizeHeader(header);
    const value = values[index] ?? "";

    if (normalizedHeader in flatArrayHeaders) {
      const [field, arrayIndex] =
        flatArrayHeaders[normalizedHeader as keyof typeof flatArrayHeaders];
      (payload[field] as string[])[arrayIndex] = value.trim();
      return;
    }

    if (normalizedHeader === "repeatedRequests") {
      payload.repeatedRequests = value
        .split("|")
        .map((item) => item.trim())
        .filter(Boolean);
      return;
    }

    const stageMatch = normalizedHeader.match(
      /^(lead|qualified|proposal|negotiation|closedwon)(conversionPct|avgDaysInStage)$/i,
    );
    if (stageMatch) {
      const stage = stageAliases[stageMatch[1].toLowerCase()];
      const metric = stageMetrics.get(stage);
      const metricKey = stageMatch[2]?.toLowerCase();
      if (metric) {
        if (metricKey === "conversionpct") {
          metric.conversionPct = toNumber(value);
        } else {
          metric.avgDaysInStage = toNumber(value);
        }
      }
      return;
    }

    payload[normalizedHeader] =
      normalizedHeader === "weekOf" ? value.trim() : toNumber(value);
  });

  payload.stageMetrics = DEFAULT_STAGE_ORDER.map(
    (stage) => stageMetrics.get(stage) ?? { stage, conversionPct: 0, avgDaysInStage: 0 },
  );

  return weeklySnapshotPayloadSchema.parse(payload);
}

function parseKeyValueCsv(rows: string[][]) {
  const stageMetrics = createStageMetricsMap();
  const payload: Record<string, unknown> = {
    lossReasonsTop3: ["", "", ""],
    repeatedRequests: [],
  };

  for (const row of rows) {
    const [rawKey, rawValue = ""] = row;
    const key = normalizeHeader(rawKey);
    const value = rawValue.trim();

    if (!key || key === "field") {
      continue;
    }

    if (key in flatArrayHeaders) {
      const [field, arrayIndex] =
        flatArrayHeaders[key as keyof typeof flatArrayHeaders];
      (payload[field] as string[])[arrayIndex] = value;
      continue;
    }

    if (key === "repeatedRequests") {
      payload.repeatedRequests = value
        .split("|")
        .map((item) => item.trim())
        .filter(Boolean);
      continue;
    }

    const stageMatch = key.match(
      /^(lead|qualified|proposal|negotiation|closedwon)(conversionPct|avgDaysInStage)$/i,
    );
    if (stageMatch) {
      const stage = stageAliases[stageMatch[1].toLowerCase()];
      const metric = stageMetrics.get(stage);
      const metricKey = stageMatch[2]?.toLowerCase();
      if (metric) {
        if (metricKey === "conversionpct") {
          metric.conversionPct = toNumber(value);
        } else {
          metric.avgDaysInStage = toNumber(value);
        }
      }
      continue;
    }

    payload[key] = key === "weekOf" ? value : toNumber(value);
  }

  payload.stageMetrics = DEFAULT_STAGE_ORDER.map(
    (stage) => stageMetrics.get(stage) ?? { stage, conversionPct: 0, avgDaysInStage: 0 },
  );

  return weeklySnapshotPayloadSchema.parse(payload);
}

export function parseWeeklySnapshotCsv(content: string): WeeklySnapshotPayload {
  const rows = parseCsv(content);
  if (!rows.length) {
    throw new Error("CSV file is empty.");
  }

  if (rows[0]?.length === 2 && rows.length > 2) {
    return parseKeyValueCsv(rows);
  }

  return parseWideCsv(rows);
}

export function getWeeklySnapshotCsvTemplate() {
  return [
    "weekOf,newCustomersPerMonth,pipelineValue,closeRatePct,salesCycleDays,pipelineCoverageRatio,averageDealSize,customerAcquisitionCost,netRevenueRetentionPct,grossRevenueRetentionPct,pipelineVelocity,marketingSourcedPipelinePct,marketingSourcedPipelineCount,leadToOpportunityConversionPct,cacPaybackMonths,feedRetentionPct,proposalsSent,ordersWon,feedSlaQualityScore,incidentCount,lossReasonsTop3_1,lossReasonsTop3_2,lossReasonsTop3_3,repeatedRequests,leadConversionPct,leadAvgDaysInStage,qualifiedConversionPct,qualifiedAvgDaysInStage,proposalConversionPct,proposalAvgDaysInStage,negotiationConversionPct,negotiationAvgDaysInStage,closedWonConversionPct,closedWonAvgDaysInStage",
    '2026-04-24,12,360000,25,34,3.8,22600,3720,108,93,28100,41,22,33,12.1,96,25,6,98.7,2,"No clear ROI case","Budget timing","Integration gap","Salesforce sync|Role-based access|Alerts by account|Executive dashboard PDF",60,5.5,51,8,44,7.5,35,5.6,25,2.1',
  ].join("\n");
}
