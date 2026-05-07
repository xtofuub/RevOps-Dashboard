/** @vitest-environment node */

import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { sampleSnapshot, sampleSnapshotPayload } from "@/tests/fixtures";

let tempDirectory = "";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(async () => ({
    user: {
      id: "1",
      username: "admin",
      name: "Admin User",
      role: "admin",
    },
  })),
}));

async function loadModules() {
  const dbModule = await import("@/lib/dashboard-db");
  const routeModule = await import("@/app/api/weekly-snapshots/route");
  const revisionsModule = await import(
    "@/app/api/weekly-snapshots/[weekOf]/revisions/route"
  );

  return { dbModule, routeModule, revisionsModule };
}

describe("weekly snapshots api", () => {
  beforeEach(async () => {
    tempDirectory = mkdtempSync(path.join(os.tmpdir(), "revops-dashboard-"));
    process.env.REVOPS_DASHBOARD_DB_PATH = path.join(tempDirectory, "dashboard.db");
    process.env.REVOPS_LEGACY_SNAPSHOT_PATH = path.join(
      tempDirectory,
      "weekly-metrics.json",
    );
    writeFileSync(
      process.env.REVOPS_LEGACY_SNAPSHOT_PATH,
      JSON.stringify([sampleSnapshot], null, 2),
    );
    vi.resetModules();
  });

  afterEach(async () => {
    const { dbModule } = await loadModules();
    dbModule.resetDashboardDatabaseForTests();
    delete process.env.REVOPS_DASHBOARD_DB_PATH;
    delete process.env.REVOPS_LEGACY_SNAPSHOT_PATH;
    rmSync(tempDirectory, { recursive: true, force: true });
  });

  it("returns the seeded timeline", async () => {
    const { routeModule } = await loadModules();

    const response = await routeModule.GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.snapshots).toHaveLength(1);
    expect(body.dashboard.totalWeeks).toBe(1);
    expect(body.forecast).not.toBeNull();
    expect(body.forecast.metrics.length).toBeGreaterThan(0);
  });

  it("creates a new immutable revision and exposes it via the revisions route", async () => {
    const { routeModule, revisionsModule } = await loadModules();

    const response = await routeModule.POST(
      new Request("http://localhost/api/weekly-snapshots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...sampleSnapshotPayload,
          closeRatePct: 26,
          pipelineVelocity: 0,
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.revisionNumber).toBe(2);
    expect(body.snapshot.pipelineVelocity).toBeGreaterThan(0);
    expect(body.snapshot.pipelineVelocity).not.toBe(0);

    const revisionsResponse = await revisionsModule.GET(new Request("http://localhost"), {
      params: Promise.resolve({ weekOf: "2026-04-17" }),
    });
    const revisionsBody = await revisionsResponse.json();

    expect(revisionsResponse.status).toBe(200);
    expect(revisionsBody.revisions).toHaveLength(2);
    expect(revisionsBody.revisions[0]?.authorLabel).toBe("Admin User (@admin)");
    expect(revisionsBody.revisions[0]?.snapshot.closeRatePct).toBe(26);
    expect(revisionsBody.revisions[1]?.snapshot.closeRatePct).toBe(25);
  });
});
