export type AdminSqlValue = string | number | boolean | null;

export type AdminSqlRow = Record<string, AdminSqlValue>;

export type AdminSqlTableColumn = {
  name: string;
  type: string;
  notNull: boolean;
  defaultValue: string | null;
  isPrimaryKey: boolean;
};

export type AdminSqlTablePreview = {
  name: string;
  rowCount: number;
  columns: AdminSqlTableColumn[];
  rows: AdminSqlRow[];
  previewLimit: number;
  truncated: boolean;
};

export type AdminSnapshotDebugRecord = {
  id: number;
  weekOf: string;
  createdAt: string;
  updatedAt: string;
  latestRevisionId: number | null;
  revisionCount: number;
};

export type AdminRevisionDebugRecord = {
  id: number;
  weekOf: string;
  revisionNumber: number;
  createdAt: string;
  authorLabel: string;
  payloadSummary: {
    label: string;
    value: string;
  }[];
  payloadSections: {
    title: string;
    items: {
      label: string;
      value: string;
    }[];
  }[];
  payloadPreview: string;
};

export type AdminDebugData = {
  databaseFilePath: string;
  usersFilePath: string;
  snapshotCount: number;
  revisionCount: number;
  tableCount: number;
  tables: AdminSqlTablePreview[];
  snapshots: AdminSnapshotDebugRecord[];
  recentRevisions: AdminRevisionDebugRecord[];
};

export type AdminSqlQueryResult = {
  sql: string;
  columns: string[];
  rows: AdminSqlRow[];
  durationMs: number;
  truncated: boolean;
  rowLimit: number;
};

export type AdminSqlConsoleState = {
  status: "idle" | "success" | "error";
  message: string;
  result: AdminSqlQueryResult | null;
};
