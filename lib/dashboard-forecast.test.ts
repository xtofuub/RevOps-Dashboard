import {
  calculatePipelineVelocity,
  type WeeklySnapshot,
} from "@/lib/kpi-dashboard";
import { buildDashboardForecast } from "@/lib/dashboard-forecast";

const snapshotHistory: WeeklySnapshot[] = [
  {
    weekOf: "2026-03-27",
    updatedAt: "2026-03-23T08:14:00.000Z",
    newCustomersPerMonth: 10,
    pipelineValue: 301000,
    closeRatePct: 23,
    salesCycleDays: 37,
    pipelineCoverageRatio: 3.3,
    averageDealSize: 20800,
    customerAcquisitionCost: 3900,
    netRevenueRetentionPct: 106,
    grossRevenueRetentionPct: 92,
    pipelineVelocity: 24100,
    marketingSourcedPipelinePct: 39,
    marketingSourcedPipelineCount: 18,
    leadToOpportunityConversionPct: 31,
    cacPaybackMonths: 13.1,
    feedRetentionPct: 94.5,
    proposalsSent: 22,
    ordersWon: 5,
    feedSlaQualityScore: 98.6,
    incidentCount: 2,
    lossReasonsTop3: [
      "Procurement delay",
      "Integration gap",
      "No clear ROI case",
    ],
    repeatedRequests: [
      "Salesforce sync",
      "Alerts by account",
      "Audit trail",
      "Multi-feed comparison",
    ],
    stageMetrics: [
      { stage: "Lead", conversionPct: 57, avgDaysInStage: 6.2 },
      { stage: "Qualified", conversionPct: 49, avgDaysInStage: 8.9 },
      { stage: "Proposal", conversionPct: 42, avgDaysInStage: 8.1 },
      { stage: "Negotiation", conversionPct: 33.5, avgDaysInStage: 6.1 },
      { stage: "Closed Won", conversionPct: 24, avgDaysInStage: 2.5 },
    ],
  },
  {
    weekOf: "2026-04-03",
    updatedAt: "2026-03-30T08:12:00.000Z",
    newCustomersPerMonth: 9,
    pipelineValue: 318000,
    closeRatePct: 24,
    salesCycleDays: 36,
    pipelineCoverageRatio: 3.4,
    averageDealSize: 21400,
    customerAcquisitionCost: 3840,
    netRevenueRetentionPct: 106.5,
    grossRevenueRetentionPct: 92,
    pipelineVelocity: 25600,
    marketingSourcedPipelinePct: 40,
    marketingSourcedPipelineCount: 19,
    leadToOpportunityConversionPct: 31.5,
    cacPaybackMonths: 12.8,
    feedRetentionPct: 95,
    proposalsSent: 23,
    ordersWon: 5,
    feedSlaQualityScore: 98.8,
    incidentCount: 2,
    lossReasonsTop3: [
      "No clear ROI case",
      "Procurement delay",
      "Integration gap",
    ],
    repeatedRequests: [
      "Salesforce sync",
      "Role-based access",
      "Audit trail",
      "Executive dashboard PDF",
    ],
    stageMetrics: [
      { stage: "Lead", conversionPct: 58, avgDaysInStage: 5.9 },
      { stage: "Qualified", conversionPct: 50, avgDaysInStage: 8.5 },
      { stage: "Proposal", conversionPct: 43, avgDaysInStage: 7.9 },
      { stage: "Negotiation", conversionPct: 34, avgDaysInStage: 5.8 },
      { stage: "Closed Won", conversionPct: 24.5, avgDaysInStage: 2.3 },
    ],
  },
  {
    weekOf: "2026-04-10",
    updatedAt: "2026-04-06T08:10:00.000Z",
    newCustomersPerMonth: 11,
    pipelineValue: 336000,
    closeRatePct: 24,
    salesCycleDays: 35,
    pipelineCoverageRatio: 3.5,
    averageDealSize: 22000,
    customerAcquisitionCost: 3780,
    netRevenueRetentionPct: 107,
    grossRevenueRetentionPct: 92.5,
    pipelineVelocity: 26800,
    marketingSourcedPipelinePct: 40.5,
    marketingSourcedPipelineCount: 20,
    leadToOpportunityConversionPct: 32,
    cacPaybackMonths: 12.4,
    feedRetentionPct: 95.5,
    proposalsSent: 24,
    ordersWon: 6,
    feedSlaQualityScore: 98.9,
    incidentCount: 2,
    lossReasonsTop3: [
      "No clear ROI case",
      "Budget timing",
      "Integration gap",
    ],
    repeatedRequests: [
      "Salesforce sync",
      "Role-based access",
      "Alerts by account",
      "Executive dashboard PDF",
    ],
    stageMetrics: [
      { stage: "Lead", conversionPct: 59, avgDaysInStage: 5.7 },
      { stage: "Qualified", conversionPct: 50, avgDaysInStage: 8.2 },
      { stage: "Proposal", conversionPct: 43.5, avgDaysInStage: 7.7 },
      { stage: "Negotiation", conversionPct: 34.5, avgDaysInStage: 5.7 },
      { stage: "Closed Won", conversionPct: 24.5, avgDaysInStage: 2.2 },
    ],
  },
  {
    weekOf: "2026-04-17",
    updatedAt: "2026-04-13T08:08:00.000Z",
    newCustomersPerMonth: 12,
    pipelineValue: 358000,
    closeRatePct: 25,
    salesCycleDays: 34,
    pipelineCoverageRatio: 3.7,
    averageDealSize: 22600,
    customerAcquisitionCost: 3720,
    netRevenueRetentionPct: 108,
    grossRevenueRetentionPct: 93,
    pipelineVelocity: 28100,
    marketingSourcedPipelinePct: 41,
    marketingSourcedPipelineCount: 22,
    leadToOpportunityConversionPct: 33,
    cacPaybackMonths: 12.1,
    feedRetentionPct: 96,
    proposalsSent: 25,
    ordersWon: 6,
    feedSlaQualityScore: 98.7,
    incidentCount: 2,
    lossReasonsTop3: [
      "No clear ROI case",
      "Budget timing",
      "Integration gap",
    ],
    repeatedRequests: [
      "Salesforce sync",
      "Role-based access",
      "Alerts by account",
      "Executive dashboard PDF",
    ],
    stageMetrics: [
      { stage: "Lead", conversionPct: 60, avgDaysInStage: 5.5 },
      { stage: "Qualified", conversionPct: 51, avgDaysInStage: 8 },
      { stage: "Proposal", conversionPct: 44, avgDaysInStage: 7.5 },
      { stage: "Negotiation", conversionPct: 35, avgDaysInStage: 5.6 },
      { stage: "Closed Won", conversionPct: 25, avgDaysInStage: 2.1 },
    ],
  },
];

describe("dashboard forecast helpers", () => {
  it("estimates pipeline velocity from saved history", () => {
    expect(
      calculatePipelineVelocity(
        {
          pipelineValue: 358000,
          salesCycleDays: 34,
          closeRatePct: 25,
        },
        snapshotHistory,
      ),
    ).toBe(28100);
  });

  it("builds 7 day and 30 day forward estimates", () => {
    const forecast = buildDashboardForecast(snapshotHistory);

    expect(forecast).not.toBeNull();
    expect(forecast?.generatedFromWeeks).toBe(4);
    expect(forecast?.metrics).toHaveLength(5);

    const pipelineValueProjection = forecast?.metrics.find(
      (metric) => metric.metricKey === "pipelineValue",
    );
    const cacProjection = forecast?.metrics.find(
      (metric) => metric.metricKey === "customerAcquisitionCost",
    );

    expect(pipelineValueProjection?.forecast7d).toBeGreaterThan(
      pipelineValueProjection?.latestValue ?? 0,
    );
    expect(pipelineValueProjection?.forecast30d).toBeGreaterThan(
      pipelineValueProjection?.forecast7d ?? 0,
    );
    expect(cacProjection?.forecast7d).toBeLessThan(cacProjection?.latestValue ?? 0);
  });
});
