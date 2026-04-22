import { describe, expect, it } from "vitest";

import {
  getWeeklySnapshotCsvTemplate,
  parseWeeklySnapshotCsv,
} from "@/lib/weekly-snapshot-csv";

describe("weekly snapshot csv", () => {
  it("parses the provided wide-row template format", () => {
    const parsed = parseWeeklySnapshotCsv(getWeeklySnapshotCsvTemplate());

    expect(parsed.weekOf).toBe("2026-04-24");
    expect(parsed.pipelineCoverageRatio).toBe(3.8);
    expect(parsed.lossReasonsTop3).toEqual([
      "No clear ROI case",
      "Budget timing",
      "Integration gap",
    ]);
    expect(parsed.stageMetrics[0]).toEqual({
      stage: "Lead",
      conversionPct: 60,
      avgDaysInStage: 5.5,
    });
  });

  it("parses key-value csv input", () => {
    const csv = [
      "field,value",
      "weekOf,2026-04-24",
      "closeRatePct,26",
      "pipelineCoverageRatio,4.2",
      "feedRetentionPct,96.5",
      "feedSlaQualityScore,99.1",
      "lossReasonsTop3_1,Security review",
      "lossReasonsTop3_2,Budget timing",
      "lossReasonsTop3_3,Integration gap",
      "repeatedRequests,Salesforce sync|Approval workflow",
      "leadConversionPct,61",
      "leadAvgDaysInStage,5.3",
      "qualifiedConversionPct,52",
      "qualifiedAvgDaysInStage,7.9",
      "proposalConversionPct,45",
      "proposalAvgDaysInStage,7.1",
      "negotiationConversionPct,36",
      "negotiationAvgDaysInStage,5.1",
      "closedWonConversionPct,26",
      "closedWonAvgDaysInStage,2",
      "newCustomersPerMonth,13",
      "pipelineValue,370000",
      "salesCycleDays,33",
      "averageDealSize,23100",
      "customerAcquisitionCost,3600",
      "netRevenueRetentionPct,109",
      "grossRevenueRetentionPct,93.4",
      "pipelineVelocity,29500",
      "marketingSourcedPipelinePct,42",
      "marketingSourcedPipelineCount,23",
      "leadToOpportunityConversionPct,34",
      "cacPaybackMonths,11.8",
      "proposalsSent,26",
      "ordersWon,7",
      "incidentCount,1",
    ].join("\n");

    const parsed = parseWeeklySnapshotCsv(csv);

    expect(parsed.closeRatePct).toBe(26);
    expect(parsed.repeatedRequests).toEqual([
      "Salesforce sync",
      "Approval workflow",
    ]);
    expect(parsed.stageMetrics[4]).toEqual({
      stage: "Closed Won",
      conversionPct: 26,
      avgDaysInStage: 2,
    });
  });
});
