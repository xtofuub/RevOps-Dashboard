import {
  type WeeklySnapshot,
  type WeeklySnapshotPayload,
} from "@/lib/kpi-dashboard";

export const sampleSnapshotPayload: WeeklySnapshotPayload = {
  weekOf: "2026-04-17",
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
};

export const sampleSnapshot: WeeklySnapshot = {
  ...sampleSnapshotPayload,
  updatedAt: "2026-04-13T08:08:00.000Z",
};

export const priorSnapshot: WeeklySnapshot = {
  ...sampleSnapshot,
  weekOf: "2026-04-10",
  closeRatePct: 24,
  pipelineCoverageRatio: 3.5,
  feedRetentionPct: 95.5,
  feedSlaQualityScore: 99,
  updatedAt: "2026-04-06T08:10:00.000Z",
};
