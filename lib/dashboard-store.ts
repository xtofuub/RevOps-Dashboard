import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  normalizeStageMetrics,
  sortSnapshots,
  weeklySnapshotPayloadSchema,
  weeklySnapshotSchema,
  weeklySnapshotsSchema,
  type WeeklySnapshot,
  type WeeklySnapshotPayload,
} from "@/lib/kpi-dashboard";

const dashboardDataFilePath = path.join(
  process.cwd(),
  "data",
  "weekly-metrics.json",
);

export async function readWeeklySnapshots() {
  try {
    const fileContents = await readFile(dashboardDataFilePath, "utf8");

    if (!fileContents.trim()) {
      return [] as WeeklySnapshot[];
    }

    const parsed = weeklySnapshotsSchema.parse(JSON.parse(fileContents));

    return sortSnapshots(parsed).map((snapshot) => ({
      ...snapshot,
      stageMetrics: normalizeStageMetrics(snapshot.stageMetrics),
    }));
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return [] as WeeklySnapshot[];
    }

    throw error;
  }
}

export async function upsertWeeklySnapshot(payload: WeeklySnapshotPayload) {
  const safePayload = weeklySnapshotPayloadSchema.parse({
    ...payload,
    stageMetrics: normalizeStageMetrics(payload.stageMetrics),
  });

  const currentSnapshots = await readWeeklySnapshots();
  const nextSnapshot = weeklySnapshotSchema.parse({
    ...safePayload,
    updatedAt: new Date().toISOString(),
  });

  const snapshotIndex = currentSnapshots.findIndex(
    (snapshot) => snapshot.weekOf === nextSnapshot.weekOf,
  );

  const nextSnapshots = [...currentSnapshots];

  if (snapshotIndex >= 0) {
    nextSnapshots[snapshotIndex] = nextSnapshot;
  } else {
    nextSnapshots.push(nextSnapshot);
  }

  const sortedSnapshots = sortSnapshots(nextSnapshots);

  await mkdir(path.dirname(dashboardDataFilePath), { recursive: true });
  await writeFile(
    dashboardDataFilePath,
    `${JSON.stringify(sortedSnapshots, null, 2)}\n`,
    "utf8",
  );

  return nextSnapshot;
}
