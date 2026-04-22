import "server-only";

import {
  createSnapshotRevision,
  listAlertSubscriptions,
  listMetricTargets,
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

export async function upsertWeeklySnapshot(payload: WeeklySnapshotPayload) {
  const history = listWeeklySnapshots();

  return createSnapshotRevision({
    ...payload,
    pipelineVelocity: calculatePipelineVelocity(payload, history),
  });
}

export async function readSnapshotRevisions(weekOf: string) {
  return listSnapshotRevisions(weekOf);
}

export async function readMetricTargets() {
  return listMetricTargets();
}

export async function readAlertSubscriptions() {
  return listAlertSubscriptions();
}
