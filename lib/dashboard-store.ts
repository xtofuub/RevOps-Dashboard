import "server-only";

import {
  createSnapshotRevision,
  deleteSnapshot,
  listSnapshotRevisions,
  listWeeklySnapshots,
} from "@/lib/dashboard-db";
import {
  calculatePipelineVelocity,
  type WeeklySnapshotPayload,
} from "@/lib/kpi-dashboard";

export async function readWeeklySnapshots() {
  return listWeeklySnapshots();
}

export async function upsertWeeklySnapshot(
  payload: WeeklySnapshotPayload,
  options?: { authorLabel?: string },
) {
  const history = listWeeklySnapshots();

  return createSnapshotRevision(
    {
      ...payload,
      pipelineVelocity: calculatePipelineVelocity(payload, history),
    },
    options,
  );
}

export async function deleteWeeklySnapshot(weekOf: string) {
  return deleteSnapshot(weekOf);
}

export async function readSnapshotRevisions(weekOf: string) {
  return listSnapshotRevisions(weekOf);
}
