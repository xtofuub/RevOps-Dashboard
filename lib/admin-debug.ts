import Database from "better-sqlite3";
import path from "node:path";

import type {
  AdminDebugData,
  AdminRevisionDebugRecord,
  AdminSnapshotDebugRecord,
  AdminSqlConsoleState,
  AdminSqlQueryResult,
  AdminSqlRow,
  AdminSqlTableColumn,
  AdminSqlTablePreview,
  AdminSqlValue,
} from "@/lib/admin-debug-types";
import { listWeeklySnapshots } from "@/lib/dashboard-db";

const dataDirectoryPath = path.join(
  /* turbopackIgnore: true */ process.cwd(),
  "data",
);

const tablePreviewRowLimit = 12;
const sqlConsoleRowLimit = 100;
const maxSqlQueryLength = 8_000;
const maxPayloadPreviewLength = 1_200;

type SnapshotSummaryRow = {
  id: number;
  week_of: string;
  created_at: string;
  updated_at: string;
  latest_revision_id: number | null;
  revision_count: number;
};

type RevisionSummaryRow = {
  id: number;
  week_of: string;
  revision_number: number;
  created_at: string;
  author_label: string;
  payload_json: string;
};

function getDatabaseFilePath() {
  return (
    process.env.REVOPS_DASHBOARD_DB_PATH ??
    path.join(dataDirectoryPath, "revops-dashboard.db")
  );
}

function getUsersFilePath() {
  return (
    process.env.REVOPS_USERS_FILE_PATH ??
    path.join(dataDirectoryPath, "users.json")
  );
}

function ensureDatabaseExists() {
  void listWeeklySnapshots();
}

function openReadonlyDatabase() {
  ensureDatabaseExists();
  const db = new Database(getDatabaseFilePath(), {
    readonly: true,
    fileMustExist: true,
  });

  db.pragma("query_only = ON");

  return db;
}

function quoteIdentifier(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function quoteSqlText(value: string) {
  return `'${value.replaceAll("'", "''")}'`;
}

function serializeSqlValue(value: unknown): AdminSqlValue {
  if (value === null || value === undefined) {
    return null;
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  if (value instanceof Uint8Array) {
    return `<blob ${value.byteLength} bytes>`;
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function serializeSqlRow(row: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [key, serializeSqlValue(value)]),
  ) as AdminSqlRow;
}

function formatPayloadPreview(payloadJson: string) {
  let preview = payloadJson;

  try {
    preview = JSON.stringify(JSON.parse(payloadJson), null, 2);
  } catch {
    preview = payloadJson;
  }

  return preview.length > maxPayloadPreviewLength
    ? `${preview.slice(0, maxPayloadPreviewLength)}\n...`
    : preview;
}

function formatCompactCurrency(value: unknown) {
  return typeof value === "number"
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "EUR",
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(value)
    : "n/a";
}

function formatCompactNumber(value: unknown, suffix = "") {
  return typeof value === "number"
    ? `${new Intl.NumberFormat("en-US", {
        maximumFractionDigits: 1,
      }).format(value)}${suffix}`
    : "n/a";
}

function buildPayloadSummary(payloadJson: string) {
  try {
    const payload = JSON.parse(payloadJson) as Record<string, unknown>;

    return [
      { label: "Pipeline", value: formatCompactCurrency(payload.pipelineValue) },
      { label: "Close rate", value: formatCompactNumber(payload.closeRatePct, "%") },
      {
        label: "Won / sent",
        value: `${formatCompactNumber(payload.ordersWon)} / ${formatCompactNumber(payload.proposalsSent)}`,
      },
      { label: "SLA", value: formatCompactNumber(payload.feedSlaQualityScore, "%") },
      { label: "Incidents", value: formatCompactNumber(payload.incidentCount) },
      { label: "NRR", value: formatCompactNumber(payload.netRevenueRetentionPct, "%") },
    ];
  } catch {
    return [{ label: "Payload", value: "JSON unavailable" }];
  }
}

function buildPayloadSections(payloadJson: string) {
  try {
    const payload = JSON.parse(payloadJson) as Record<string, unknown>;
    const lossReasons = Array.isArray(payload.lossReasonsTop3)
      ? payload.lossReasonsTop3.join(", ")
      : "n/a";
    const requests = Array.isArray(payload.repeatedRequests)
      ? payload.repeatedRequests.join(", ")
      : "n/a";
    const stageFlow = Array.isArray(payload.stageMetrics)
      ? payload.stageMetrics
          .map((stageMetric) => {
            if (
              !stageMetric ||
              typeof stageMetric !== "object" ||
              !("stage" in stageMetric)
            ) {
              return null;
            }

            const metric = stageMetric as Record<string, unknown>;

            return {
              label: String(metric.stage),
              value: `${formatCompactNumber(metric.conversionPct, "%")} / ${formatCompactNumber(metric.avgDaysInStage, "d")}`,
            };
          })
          .filter((item): item is { label: string; value: string } => item !== null)
      : [];

    return [
      {
        title: "Revenue",
        items: [
          { label: "New customers", value: formatCompactNumber(payload.newCustomersPerMonth) },
          { label: "Pipeline", value: formatCompactCurrency(payload.pipelineValue) },
          { label: "Close rate", value: formatCompactNumber(payload.closeRatePct, "%") },
          { label: "Sales cycle", value: formatCompactNumber(payload.salesCycleDays, "d") },
          { label: "Coverage", value: formatCompactNumber(payload.pipelineCoverageRatio, "x") },
          { label: "Avg deal", value: formatCompactCurrency(payload.averageDealSize) },
        ],
      },
      {
        title: "Market signal",
        items: [
          { label: "Feed retention", value: formatCompactNumber(payload.feedRetentionPct, "%") },
          { label: "NRR", value: formatCompactNumber(payload.netRevenueRetentionPct, "%") },
          { label: "GRR", value: formatCompactNumber(payload.grossRevenueRetentionPct, "%") },
          { label: "Lead to opp", value: formatCompactNumber(payload.leadToOpportunityConversionPct, "%") },
        ],
      },
      {
        title: "Delivery",
        items: [
          { label: "Proposals sent", value: formatCompactNumber(payload.proposalsSent) },
          { label: "Orders won", value: formatCompactNumber(payload.ordersWon) },
          { label: "SLA quality", value: formatCompactNumber(payload.feedSlaQualityScore, "%") },
          { label: "Incidents", value: formatCompactNumber(payload.incidentCount) },
        ],
      },
      {
        title: "Text signals",
        items: [
          { label: "Lost because", value: lossReasons },
          { label: "Requests", value: requests },
        ],
      },
      {
        title: "Stage flow",
        items: stageFlow,
      },
    ].filter((section) => section.items.length > 0);
  } catch {
    return [
      {
        title: "Payload",
        items: [{ label: "Status", value: "Could not parse payload JSON" }],
      },
    ];
  }
}

function loadTableColumns(
  db: Database.Database,
  tableName: string,
): AdminSqlTableColumn[] {
  const statement = db.prepare(
    `SELECT name, type, "notnull" AS not_null, dflt_value, pk
     FROM pragma_table_info(${quoteSqlText(tableName)})`,
  );

  return statement.all().map((row) => {
    const record = row as {
      name: string;
      type: string;
      not_null: number;
      dflt_value: string | null;
      pk: number;
    };

    return {
      name: record.name,
      type: record.type || "TEXT",
      notNull: Boolean(record.not_null),
      defaultValue: record.dflt_value,
      isPrimaryKey: Boolean(record.pk),
    };
  });
}

function loadTablePreview(
  db: Database.Database,
  tableName: string,
): AdminSqlTablePreview {
  const rowCount = (
    db
      .prepare(`SELECT COUNT(*) AS count FROM ${quoteIdentifier(tableName)}`)
      .get() as { count: number }
  ).count;
  const rows = db
    .prepare(`SELECT * FROM ${quoteIdentifier(tableName)} LIMIT ?`)
    .all(tablePreviewRowLimit)
    .map((row) => serializeSqlRow(row as Record<string, unknown>));

  return {
    name: tableName,
    rowCount,
    columns: loadTableColumns(db, tableName),
    rows,
    previewLimit: tablePreviewRowLimit,
    truncated: rowCount > rows.length,
  };
}

function normalizeSqlQuery(input: string) {
  const trimmed = input.trim();

  if (!trimmed) {
    throw new Error("Enter a SQL query first.");
  }

  if (trimmed.length > maxSqlQueryLength) {
    throw new Error(`Query too long. Keep it under ${maxSqlQueryLength} characters.`);
  }

  const withoutTrailingSemicolon = trimmed.replace(/;\s*$/, "");

  if (withoutTrailingSemicolon.includes(";")) {
    throw new Error("Only one SQL statement is allowed at a time.");
  }

  if (/\battach\b|\bdetach\b/i.test(withoutTrailingSemicolon)) {
    throw new Error("ATTACH and DETACH are blocked in the admin console.");
  }

  if (/^pragma\b/i.test(withoutTrailingSemicolon) && /=/.test(withoutTrailingSemicolon)) {
    throw new Error("Write-style PRAGMA statements are blocked. Use read-only inspection PRAGMA queries only.");
  }

  return withoutTrailingSemicolon;
}

export function buildAdminDebugData(): AdminDebugData {
  const db = openReadonlyDatabase();

  try {
    const tableNames = (
      db
        .prepare(
          `SELECT name
           FROM sqlite_master
           WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
           ORDER BY name ASC`,
        )
        .all() as Array<{ name: string }>
    ).map((row) => row.name);
    const snapshotCount = (
      db.prepare("SELECT COUNT(*) AS count FROM snapshots").get() as { count: number }
    ).count;
    const revisionCount = (
      db
        .prepare("SELECT COUNT(*) AS count FROM snapshot_revisions")
        .get() as { count: number }
    ).count;
    const snapshots = db
      .prepare(
        `SELECT snapshots.id, snapshots.week_of, snapshots.created_at, snapshots.updated_at,
            snapshots.latest_revision_id, COUNT(snapshot_revisions.id) AS revision_count
         FROM snapshots
         LEFT JOIN snapshot_revisions
           ON snapshot_revisions.snapshot_id = snapshots.id
         GROUP BY snapshots.id
         ORDER BY snapshots.week_of DESC
         LIMIT 12`,
      )
      .all() as SnapshotSummaryRow[];
    const revisions = db
      .prepare(
        `SELECT snapshot_revisions.id, snapshots.week_of, snapshot_revisions.revision_number,
            snapshot_revisions.created_at, snapshot_revisions.author_label,
            snapshot_revisions.payload_json
         FROM snapshot_revisions
         INNER JOIN snapshots
           ON snapshots.id = snapshot_revisions.snapshot_id
         ORDER BY snapshot_revisions.created_at DESC
         LIMIT 18`,
      )
      .all() as RevisionSummaryRow[];

    return {
      databaseFilePath: getDatabaseFilePath(),
      usersFilePath: getUsersFilePath(),
      snapshotCount,
      revisionCount,
      tableCount: tableNames.length,
      tables: tableNames.map((tableName) => loadTablePreview(db, tableName)),
      snapshots: snapshots.map<AdminSnapshotDebugRecord>((row) => ({
        id: row.id,
        weekOf: row.week_of,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        latestRevisionId: row.latest_revision_id,
        revisionCount: row.revision_count,
      })),
      recentRevisions: revisions.map<AdminRevisionDebugRecord>((row) => ({
        id: row.id,
        weekOf: row.week_of,
        revisionNumber: row.revision_number,
        createdAt: row.created_at,
        authorLabel: row.author_label,
        payloadSummary: buildPayloadSummary(row.payload_json),
        payloadSections: buildPayloadSections(row.payload_json),
        payloadPreview: formatPayloadPreview(row.payload_json),
      })),
    };
  } finally {
    db.close();
  }
}

export function executeReadonlySqlQuery(sql: string): AdminSqlQueryResult {
  const normalizedSql = normalizeSqlQuery(sql);
  const db = openReadonlyDatabase();
  const startedAt = performance.now();

  try {
    const statement = db.prepare(normalizedSql);

    if (!statement.reader) {
      throw new Error("Only read-only SQL queries are allowed in this console.");
    }

    const rows: AdminSqlRow[] = [];
    let truncated = false;

    for (const row of statement.iterate() as Iterable<Record<string, unknown>>) {
      if (rows.length >= sqlConsoleRowLimit) {
        truncated = true;
        break;
      }

      rows.push(serializeSqlRow(row));
    }

    return {
      sql: normalizedSql,
      columns: statement.columns().map((column) => column.name),
      rows,
      durationMs: Math.round((performance.now() - startedAt) * 100) / 100,
      truncated,
      rowLimit: sqlConsoleRowLimit,
    };
  } finally {
    db.close();
  }
}

export function getInitialAdminSqlConsoleState(): AdminSqlConsoleState {
  return {
    status: "idle",
    message: "",
    result: null,
  };
}
