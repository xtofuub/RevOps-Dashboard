import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { buildAdminDebugData, executeReadonlySqlQuery } from "@/lib/admin-debug";
import {
  createSnapshotRevision,
  resetDashboardDatabaseForTests,
} from "@/lib/dashboard-db";
import type { WeeklySnapshotPayload } from "@/lib/kpi-dashboard";

function makeSnapshotPayload(weekOf: string): WeeklySnapshotPayload {
  return {
    weekOf,
    newCustomersPerMonth: 11,
    pipelineValue: 325000,
    closeRatePct: 24,
    salesCycleDays: 36,
    pipelineCoverageRatio: 3.4,
    averageDealSize: 21000,
    customerAcquisitionCost: 3850,
    netRevenueRetentionPct: 106.5,
    grossRevenueRetentionPct: 92.3,
    pipelineVelocity: 25000,
    marketingSourcedPipelinePct: 40,
    marketingSourcedPipelineCount: 19,
    leadToOpportunityConversionPct: 31.5,
    cacPaybackMonths: 12.8,
    feedRetentionPct: 95,
    proposalsSent: 23,
    ordersWon: 5,
    feedSlaQualityScore: 98.8,
    incidentCount: 2,
    lossReasonsTop3: ["Budget", "Timing", "Integration"],
    repeatedRequests: ["Audit trail", "Alerts by account"],
    stageMetrics: [
      { stage: "Lead", conversionPct: 58, avgDaysInStage: 6 },
      { stage: "Qualified", conversionPct: 50, avgDaysInStage: 8.5 },
      { stage: "Proposal", conversionPct: 43, avgDaysInStage: 8 },
      { stage: "Negotiation", conversionPct: 34, avgDaysInStage: 5.8 },
      { stage: "Closed Won", conversionPct: 24.5, avgDaysInStage: 2.3 },
    ],
  };
}

describe("admin debug helpers", () => {
  const originalDbPath = process.env.REVOPS_DASHBOARD_DB_PATH;
  const originalLegacyPath = process.env.REVOPS_LEGACY_SNAPSHOT_PATH;
  const originalUsersPath = process.env.REVOPS_USERS_FILE_PATH;
  let tempDirectory = "";

  beforeEach(() => {
    resetDashboardDatabaseForTests();
    tempDirectory = mkdtempSync(path.join(os.tmpdir(), "revops-admin-debug-"));
    process.env.REVOPS_DASHBOARD_DB_PATH = path.join(
      tempDirectory,
      "revops-dashboard.db",
    );
    process.env.REVOPS_LEGACY_SNAPSHOT_PATH = path.join(
      tempDirectory,
      "weekly-metrics.json",
    );
    process.env.REVOPS_USERS_FILE_PATH = path.join(tempDirectory, "users.json");
  });

  afterEach(() => {
    resetDashboardDatabaseForTests();

    if (originalDbPath === undefined) {
      delete process.env.REVOPS_DASHBOARD_DB_PATH;
    } else {
      process.env.REVOPS_DASHBOARD_DB_PATH = originalDbPath;
    }

    if (originalLegacyPath === undefined) {
      delete process.env.REVOPS_LEGACY_SNAPSHOT_PATH;
    } else {
      process.env.REVOPS_LEGACY_SNAPSHOT_PATH = originalLegacyPath;
    }

    if (originalUsersPath === undefined) {
      delete process.env.REVOPS_USERS_FILE_PATH;
    } else {
      process.env.REVOPS_USERS_FILE_PATH = originalUsersPath;
    }

    if (tempDirectory) {
      rmSync(tempDirectory, { recursive: true, force: true });
    }
  });

  it("builds admin debug summaries for tables and revisions", () => {
    createSnapshotRevision(makeSnapshotPayload("2026-05-02"));
    createSnapshotRevision(makeSnapshotPayload("2026-05-02"));

    const debugData = buildAdminDebugData();

    expect(debugData.snapshotCount).toBe(1);
    expect(debugData.revisionCount).toBe(2);
    expect(debugData.tables.some((table) => table.name === "snapshots")).toBe(true);
    expect(debugData.tables.some((table) => table.name === "snapshot_revisions")).toBe(
      true,
    );
    expect(debugData.snapshots[0]?.revisionCount).toBe(2);
    expect(debugData.recentRevisions[0]?.weekOf).toBe("2026-05-02");
  });

  it("allows read-only queries and blocks unsafe SQL", () => {
    createSnapshotRevision(makeSnapshotPayload("2026-05-09"));

    const result = executeReadonlySqlQuery(
      "SELECT week_of FROM snapshots ORDER BY week_of DESC",
    );

    expect(result.columns).toEqual(["week_of"]);
    expect(result.rows[0]?.week_of).toBe("2026-05-09");

    expect(() =>
      executeReadonlySqlQuery("SELECT week_of FROM snapshots; SELECT 1"),
    ).toThrow(/Only one SQL statement/i);
    expect(() => executeReadonlySqlQuery("DELETE FROM snapshots")).toThrow(
      /Only read-only SQL queries/i,
    );
  });
});
