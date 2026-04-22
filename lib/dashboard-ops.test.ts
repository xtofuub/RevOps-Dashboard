import { describe, expect, it } from "vitest";

import {
  buildMetricTargetStatuses,
  buildOperatorBrief,
  getDefaultMetricTargets,
} from "@/lib/dashboard-ops";
import { sampleSnapshot } from "@/tests/fixtures";

describe("dashboard ops", () => {
  it("computes breach and watch statuses from the latest snapshot", () => {
    const statuses = buildMetricTargetStatuses(
      {
        ...sampleSnapshot,
        pipelineCoverageRatio: 2.8,
        closeRatePct: 23,
      },
      getDefaultMetricTargets("2026-04-18T00:00:00.000Z"),
    );

    const coverage = statuses.find(
      (status) => status.metricKey === "pipelineCoverageRatio",
    );
    const closeRate = statuses.find((status) => status.metricKey === "closeRatePct");

    expect(coverage?.status).toBe("breach");
    expect(closeRate?.status).toBe("watch");
  });

  it("builds an operator brief for the top flagged metrics", () => {
    const statuses = buildMetricTargetStatuses(
      {
        ...sampleSnapshot,
        pipelineCoverageRatio: 2.8,
        incidentCount: 4,
      },
      getDefaultMetricTargets("2026-04-18T00:00:00.000Z"),
    );

    const brief = buildOperatorBrief(sampleSnapshot, statuses);

    expect(brief.length).toBeGreaterThanOrEqual(2);
    expect(brief.some((item) => item.id === "pipelineCoverageRatio")).toBe(true);
    expect(brief.some((item) => item.id === "incidentCount")).toBe(true);
    expect(brief[0]?.priority).toBe("high");
    expect(brief[0]?.ownerName).toBeTruthy();
  });
});
