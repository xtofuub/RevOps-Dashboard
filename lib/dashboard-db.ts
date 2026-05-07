import "server-only";

import Database from "better-sqlite3";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";

import {
  normalizeStageMetrics,
  weeklySnapshotPayloadSchema,
  weeklySnapshotSchema,
  weeklySnapshotsSchema,
  type WeeklySnapshot,
  type WeeklySnapshotPayload,
} from "@/lib/kpi-dashboard";

const dataDirectoryPath = path.join(/* turbopackIgnore: true */ process.cwd(), "data");
function getDatabaseFilePath() {
  return (
    process.env.REVOPS_DASHBOARD_DB_PATH ??
    path.join(dataDirectoryPath, "revops-dashboard.db")
  );
}

function getLegacySnapshotFilePath() {
  return (
    process.env.REVOPS_LEGACY_SNAPSHOT_PATH ??
    path.join(dataDirectoryPath, "weekly-metrics.json")
  );
}
const defaultWorkspaceSlug = "fitsec";
const defaultWorkspaceName = "Fitsec";

type SnapshotRow = {
  id: number;
  week_of: string;
  payload_json: string;
};

type SnapshotRevisionRow = SnapshotRow & {
  revision_number: number;
  created_at: string;
  author_label: string;
};

let database: Database.Database | null = null;

function ensureDataDirectory() {
  mkdirSync(dataDirectoryPath, { recursive: true });
  mkdirSync(path.dirname(getDatabaseFilePath()), { recursive: true });
}

function getDatabase() {
  if (database) {
    return database;
  }

  ensureDataDirectory();
  const instance = new Database(getDatabaseFilePath());
  instance.pragma("journal_mode = WAL");
  instance.pragma("foreign_keys = ON");
  initializeSchema(instance);
  dropUnusedSeedTables(instance);
  seedDefaultWorkspace(instance);
  migrateLegacySnapshots(instance);
  database = instance;
  return instance;
}

function initializeSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS workspaces (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workspace_id INTEGER NOT NULL,
      week_of TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      latest_revision_id INTEGER,
      UNIQUE(workspace_id, week_of),
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
      FOREIGN KEY (latest_revision_id) REFERENCES snapshot_revisions(id)
    );

    CREATE TABLE IF NOT EXISTS snapshot_revisions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      snapshot_id INTEGER NOT NULL,
      revision_number INTEGER NOT NULL,
      payload_json TEXT NOT NULL,
      author_label TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(snapshot_id, revision_number),
      FOREIGN KEY (snapshot_id) REFERENCES snapshots(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_snapshots_workspace_week
      ON snapshots(workspace_id, week_of);
    CREATE INDEX IF NOT EXISTS idx_snapshot_revisions_snapshot_revision
      ON snapshot_revisions(snapshot_id, revision_number DESC);
  `);
}

function dropUnusedSeedTables(db: Database.Database) {
  db.exec(`
    DROP INDEX IF EXISTS idx_alert_subscriptions_workspace;
    DROP TABLE IF EXISTS alert_subscriptions;
    DROP INDEX IF EXISTS idx_metric_targets_workspace;
    DROP TABLE IF EXISTS metric_targets;
  `);
}

function seedDefaultWorkspace(db: Database.Database) {
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO workspaces (slug, name, created_at, updated_at)
    VALUES (@slug, @name, @created_at, @updated_at)
    ON CONFLICT(slug) DO UPDATE SET
      name = excluded.name,
      updated_at = excluded.updated_at
  `).run({
    slug: defaultWorkspaceSlug,
    name: defaultWorkspaceName,
    created_at: now,
    updated_at: now,
  });
}

function getWorkspaceId(db: Database.Database) {
  const row = db
    .prepare("SELECT id FROM workspaces WHERE slug = ?")
    .get(defaultWorkspaceSlug) as { id: number } | undefined;

  if (!row) {
    throw new Error("Default workspace is missing.");
  }

  return row.id;
}

function migrateLegacySnapshots(db: Database.Database) {
  const workspaceId = getWorkspaceId(db);
  const snapshotCount = db
    .prepare("SELECT COUNT(*) AS count FROM snapshots WHERE workspace_id = ?")
    .get(workspaceId) as { count: number };

  const legacySnapshotFilePath = getLegacySnapshotFilePath();

  if (snapshotCount.count > 0 || !existsSync(legacySnapshotFilePath)) {
    return;
  }

  const fileContents = readFileSync(legacySnapshotFilePath, "utf8");
  if (!fileContents.trim()) {
    return;
  }

  const snapshots = weeklySnapshotsSchema.parse(JSON.parse(fileContents));
  const insertSnapshot = db.prepare(`
    INSERT INTO snapshots (workspace_id, week_of, created_at, updated_at)
    VALUES (@workspace_id, @week_of, @created_at, @updated_at)
  `);
  const insertRevision = db.prepare(`
    INSERT INTO snapshot_revisions (
      snapshot_id,
      revision_number,
      payload_json,
      author_label,
      created_at
    ) VALUES (
      @snapshot_id,
      @revision_number,
      @payload_json,
      @author_label,
      @created_at
    )
  `);
  const updateSnapshot = db.prepare(`
    UPDATE snapshots
    SET latest_revision_id = @latest_revision_id, updated_at = @updated_at
    WHERE id = @id
  `);

  const migrate = db.transaction(() => {
    for (const snapshot of snapshots) {
      const snapshotResult = insertSnapshot.run({
        workspace_id: workspaceId,
        week_of: snapshot.weekOf,
        created_at: snapshot.updatedAt,
        updated_at: snapshot.updatedAt,
      });
      const snapshotId = Number(snapshotResult.lastInsertRowid);
      const revisionResult = insertRevision.run({
        snapshot_id: snapshotId,
        revision_number: 1,
        payload_json: JSON.stringify({
          ...snapshot,
          stageMetrics: normalizeStageMetrics(snapshot.stageMetrics),
        }),
        author_label: "Legacy import",
        created_at: snapshot.updatedAt,
      });
      updateSnapshot.run({
        id: snapshotId,
        latest_revision_id: Number(revisionResult.lastInsertRowid),
        updated_at: snapshot.updatedAt,
      });
    }
  });

  migrate();
}

function parseSnapshot(json: string) {
  const parsed = weeklySnapshotSchema.parse(JSON.parse(json));
  return {
    ...parsed,
    stageMetrics: normalizeStageMetrics(parsed.stageMetrics),
  };
}

export type SnapshotRevisionRecord = {
  id: number;
  weekOf: string;
  revisionNumber: number;
  createdAt: string;
  authorLabel: string;
  snapshot: WeeklySnapshot;
};

export function listWeeklySnapshots() {
  const db = getDatabase();
  const workspaceId = getWorkspaceId(db);
  const rows = db
    .prepare(`
      SELECT snapshots.id, snapshots.week_of, snapshot_revisions.payload_json
      FROM snapshots
      INNER JOIN snapshot_revisions
        ON snapshot_revisions.id = snapshots.latest_revision_id
      WHERE snapshots.workspace_id = ?
      ORDER BY snapshots.week_of ASC
    `)
    .all(workspaceId) as SnapshotRow[];

  return rows.map((row) => parseSnapshot(row.payload_json));
}

export function listSnapshotRevisions(weekOf: string) {
  const db = getDatabase();
  const workspaceId = getWorkspaceId(db);
  const rows = db
    .prepare(`
      SELECT snapshots.id, snapshots.week_of, snapshot_revisions.payload_json,
        snapshot_revisions.revision_number, snapshot_revisions.created_at,
        snapshot_revisions.author_label
      FROM snapshots
      INNER JOIN snapshot_revisions
        ON snapshot_revisions.snapshot_id = snapshots.id
      WHERE snapshots.workspace_id = ?
        AND snapshots.week_of = ?
      ORDER BY snapshot_revisions.revision_number DESC
    `)
    .all(workspaceId, weekOf) as SnapshotRevisionRow[];

  return rows.map<SnapshotRevisionRecord>((row) => ({
    id: row.id,
    weekOf: row.week_of,
    revisionNumber: row.revision_number,
    createdAt: row.created_at,
    authorLabel: row.author_label,
    snapshot: parseSnapshot(row.payload_json),
  }));
}

export function createSnapshotRevision(
  payload: WeeklySnapshotPayload,
  options?: { authorLabel?: string },
) {
  const db = getDatabase();
  const workspaceId = getWorkspaceId(db);
  const now = new Date().toISOString();
  const safePayload = weeklySnapshotPayloadSchema.parse({
    ...payload,
    stageMetrics: normalizeStageMetrics(payload.stageMetrics),
  });
  const nextSnapshot = weeklySnapshotSchema.parse({
    ...safePayload,
    updatedAt: now,
  });

  const insertRevision = db.prepare(`
    INSERT INTO snapshot_revisions (
      snapshot_id,
      revision_number,
      payload_json,
      author_label,
      created_at
    ) VALUES (
      @snapshot_id,
      @revision_number,
      @payload_json,
      @author_label,
      @created_at
    )
  `);
  const createOrUpdateSnapshot = db.transaction(() => {
    const existingSnapshot = db
      .prepare(`
        SELECT id, created_at
        FROM snapshots
        WHERE workspace_id = ? AND week_of = ?
      `)
      .get(workspaceId, nextSnapshot.weekOf) as
      | { id: number; created_at: string }
      | undefined;

    let snapshotId = existingSnapshot?.id;

    if (!snapshotId) {
      const createdSnapshot = db
        .prepare(`
          INSERT INTO snapshots (workspace_id, week_of, created_at, updated_at)
          VALUES (?, ?, ?, ?)
        `)
        .run(workspaceId, nextSnapshot.weekOf, now, now);
      snapshotId = Number(createdSnapshot.lastInsertRowid);
    }

    const revisionRow = db
      .prepare(`
        SELECT COALESCE(MAX(revision_number), 0) AS revision_number
        FROM snapshot_revisions
        WHERE snapshot_id = ?
      `)
      .get(snapshotId) as { revision_number: number };
    const revisionNumber = revisionRow.revision_number + 1;
    const revisionResult = insertRevision.run({
      snapshot_id: snapshotId,
      revision_number: revisionNumber,
      payload_json: JSON.stringify(nextSnapshot),
      author_label: options?.authorLabel ?? "Ops analyst",
      created_at: now,
    });

    db.prepare(`
      UPDATE snapshots
      SET latest_revision_id = ?, updated_at = ?
      WHERE id = ?
    `).run(Number(revisionResult.lastInsertRowid), now, snapshotId);

    return {
      snapshot: nextSnapshot,
      revisionNumber,
      createdAt: now,
      authorLabel: options?.authorLabel ?? "Ops analyst",
    };
  });

  return createOrUpdateSnapshot();
}

export function deleteSnapshot(weekOf: string) {
  const db = getDatabase();
  const workspaceId = getWorkspaceId(db);

  const deleteTransaction = db.transaction(() => {
    const snapshot = db
      .prepare(`
        SELECT id FROM snapshots
        WHERE workspace_id = ? AND week_of = ?
      `)
      .get(workspaceId, weekOf) as { id: number } | undefined;

    if (!snapshot) {
      return false;
    }

    db.prepare(`
      UPDATE snapshots SET latest_revision_id = NULL WHERE id = ?
    `).run(snapshot.id);

    db.prepare(`
      DELETE FROM snapshot_revisions WHERE snapshot_id = ?
    `).run(snapshot.id);

    db.prepare(`
      DELETE FROM snapshots WHERE id = ?
    `).run(snapshot.id);

    return true;
  });

  return deleteTransaction();
}

export function resetDashboardDatabaseForTests() {
  if (database) {
    database.close();
    database = null;
  }
}
