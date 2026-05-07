"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  CalendarClockIcon,
  DatabaseIcon,
  KeyRoundIcon,
  LoaderCircleIcon,
  PlusIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
  Trash2Icon,
  UserCogIcon,
  UsersIcon,
} from "lucide-react";
import { toast } from "sonner";

import { logout } from "@/app/login/actions";
import {
  createUserAction,
  deleteUserAction,
  resetPasswordAction,
  runSqlQueryAction,
  updateUserAction,
  type AdminActionState,
} from "@/app/admin/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type {
  AdminDebugData,
  AdminSqlConsoleState,
  AdminSqlRow,
  AdminSqlTablePreview,
} from "@/lib/admin-debug-types";
import type { PublicUser, UserRole } from "@/lib/user-store";
import { cn } from "@/lib/utils";

type CurrentUser = {
  id: string;
  username: string;
  name: string;
  role: string;
};

type AdminPanelProps = {
  users: PublicUser[];
  currentUser: CurrentUser;
  debugData?: AdminDebugData | null;
  variant?: "page" | "workspace";
};

const idleState: AdminActionState = {
  status: "idle",
  message: "",
};

const idleSqlState: AdminSqlConsoleState = {
  status: "idle",
  message: "",
  result: null,
};

const defaultSqlExamples = [
  {
    label: "Saved weekly reports",
    sql: "SELECT * FROM snapshots ORDER BY week_of DESC LIMIT 20",
  },
  {
    label: "Saved report versions",
    sql: "SELECT * FROM snapshot_revisions ORDER BY created_at DESC LIMIT 20",
  },
  {
    label: "Report table schema",
    sql: 'PRAGMA table_info("snapshots")',
  },
  {
    label: "Version table schema",
    sql: 'PRAGMA table_info("snapshot_revisions")',
  },
  {
    label: "Dashboard workspace",
    sql: "SELECT * FROM workspaces ORDER BY id ASC",
  },
  {
    label: "Version counts by week",
    sql: `SELECT snapshots.week_of, COUNT(snapshot_revisions.id) AS revision_count
FROM snapshots
LEFT JOIN snapshot_revisions ON snapshot_revisions.snapshot_id = snapshots.id
GROUP BY snapshots.id
ORDER BY snapshots.week_of DESC`,
  },
  {
    label: "Current report data",
    sql: `SELECT snapshots.week_of, snapshot_revisions.revision_number, snapshot_revisions.author_label, snapshot_revisions.created_at, snapshot_revisions.payload_json
FROM snapshots
INNER JOIN snapshot_revisions ON snapshot_revisions.id = snapshots.latest_revision_id
ORDER BY snapshots.week_of DESC
LIMIT 10`,
  },
];

const backendTableMeta: Record<string, { label: string; description: string }> = {
  workspaces: {
    label: "Dashboard workspace",
    description:
      "The workspace record for this dashboard. The app currently uses one workspace.",
  },
  snapshots: {
    label: "Saved weekly reports",
    description:
      "One row per Friday reporting week. This points at the current visible saved version.",
  },
  snapshot_revisions: {
    label: "Saved report versions",
    description:
      "Every time a week is saved again, a new version is stored here instead of overwriting history.",
  },
};

function getTableMeta(tableName: string) {
  return (
    backendTableMeta[tableName] ?? {
      label: tableName,
      description: "Raw backend table from the local SQLite database.",
    }
  );
}

function useAdminActionToast(state: AdminActionState, onSuccess?: () => void) {
  const router = useRouter();
  const lastMessageRef = React.useRef("");

  React.useEffect(() => {
    if (state.status === "idle" || !state.message) {
      return;
    }

    const toastKey = `${state.status}:${state.message}`;

    if (lastMessageRef.current === toastKey) {
      return;
    }

    lastMessageRef.current = toastKey;

    if (state.status === "success") {
      toast.success(state.message);
      onSuccess?.();
      router.refresh();
    } else {
      toast.error(state.message);
    }
  }, [onSuccess, router, state]);
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatCellValue(value: AdminSqlRow[string]) {
  if (value === null) {
    return "NULL";
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  if (typeof value === "number") {
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }

  return value;
}

function RoleBadge({ role }: { role: UserRole }) {
  return (
    <Badge variant={role === "admin" ? "default" : "secondary"}>
      <ShieldCheckIcon data-icon="inline-start" />
      {role === "admin" ? "Admin" : "User"}
    </Badge>
  );
}

function PendingButton({
  pending,
  children,
  icon,
  variant = "default",
}: {
  pending: boolean;
  children: React.ReactNode;
  icon?: React.ReactNode;
  variant?: React.ComponentProps<typeof Button>["variant"];
}) {
  return (
    <Button type="submit" variant={variant} disabled={pending}>
      {pending ? (
        <LoaderCircleIcon data-icon="inline-start" className="animate-spin" />
      ) : (
        icon
      )}
      {children}
    </Button>
  );
}

function RoleSelect({
  value,
  onValueChange,
  disabled,
}: {
  value: UserRole;
  onValueChange: (value: UserRole) => void;
  disabled?: boolean;
}) {
  return (
    <>
      <input type="hidden" name="role" value={value} />
      <Select
        value={value}
        onValueChange={(nextValue) => {
          if (nextValue === "admin" || nextValue === "user") {
            onValueChange(nextValue);
          }
        }}
        disabled={disabled}
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="user">User</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </>
  );
}

function CreateUserDialog() {
  const [open, setOpen] = React.useState(false);
  const [role, setRole] = React.useState<UserRole>("user");
  const [state, action, pending] = useActionState(createUserAction, idleState);

  useAdminActionToast(
    state,
    React.useCallback(() => {
      setOpen(false);
      setRole("user");
    }, []),
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <PlusIcon data-icon="inline-start" />
        Create user
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <form action={action} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Create user account</DialogTitle>
            <DialogDescription>
              Add a teammate with a local dashboard login and the right access
              level.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="create-name">Name</FieldLabel>
              <Input id="create-name" name="name" placeholder="Jane Operator" required />
            </Field>
            <Field>
              <FieldLabel htmlFor="create-username">Username</FieldLabel>
              <Input
                id="create-username"
                name="username"
                placeholder="jane.operator"
                required
              />
              <FieldDescription>
                Letters, numbers, dots, underscores, and hyphens are accepted.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel>Role</FieldLabel>
              <RoleSelect value={role} onValueChange={setRole} />
            </Field>
            <Field>
              <FieldLabel htmlFor="create-password">Temporary password</FieldLabel>
              <Input
                id="create-password"
                name="password"
                type="password"
                minLength={6}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="create-confirm-password">
                Confirm password
              </FieldLabel>
              <Input
                id="create-confirm-password"
                name="confirmPassword"
                type="password"
                minLength={6}
                required
              />
            </Field>
          </FieldGroup>
          <DialogFooter showCloseButton>
            <PendingButton pending={pending} icon={<PlusIcon data-icon="inline-start" />}>
              Create account
            </PendingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditUserDialog({
  user,
  currentUser,
  children,
}: {
  user: PublicUser;
  currentUser: CurrentUser;
  children: React.ReactElement;
}) {
  const [open, setOpen] = React.useState(false);
  const [role, setRole] = React.useState<UserRole>(user.role);
  const [state, action, pending] = useActionState(updateUserAction, idleState);
  const isCurrentUser = user.id === currentUser.id;

  React.useEffect(() => {
    if (open) {
      setRole(user.role);
    }
  }, [open, user.role]);

  useAdminActionToast(
    state,
    React.useCallback(() => setOpen(false), []),
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={children} />
      <DialogContent>
        <form action={action} className="flex flex-col gap-4">
          <input type="hidden" name="id" value={user.id} />
          <DialogHeader>
            <DialogTitle>Edit user</DialogTitle>
            <DialogDescription>
              Update profile details and dashboard access level.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor={`edit-name-${user.id}`}>Name</FieldLabel>
              <Input
                id={`edit-name-${user.id}`}
                name="name"
                defaultValue={user.name}
                required
              />
            </Field>
            <Field>
              <FieldLabel>Role</FieldLabel>
              <RoleSelect
                value={role}
                onValueChange={setRole}
                disabled={isCurrentUser}
              />
              {isCurrentUser ? (
                <FieldDescription>
                  Your own admin role is protected while you are signed in.
                </FieldDescription>
              ) : null}
            </Field>
          </FieldGroup>
          <DialogFooter showCloseButton>
            <PendingButton pending={pending}>Save changes</PendingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PasswordDialog({
  user,
  children,
}: {
  user: PublicUser;
  children: React.ReactElement;
}) {
  const [open, setOpen] = React.useState(false);
  const [state, action, pending] = useActionState(resetPasswordAction, idleState);

  useAdminActionToast(
    state,
    React.useCallback(() => setOpen(false), []),
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={children} />
      <DialogContent>
        <form action={action} className="flex flex-col gap-4">
          <input type="hidden" name="id" value={user.id} />
          <DialogHeader>
            <DialogTitle>Change password</DialogTitle>
            <DialogDescription>
              Set a new password for {user.name}. The change applies
              immediately.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor={`password-${user.id}`}>New password</FieldLabel>
              <Input
                id={`password-${user.id}`}
                name="password"
                type="password"
                minLength={6}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor={`confirm-password-${user.id}`}>
                Confirm password
              </FieldLabel>
              <Input
                id={`confirm-password-${user.id}`}
                name="confirmPassword"
                type="password"
                minLength={6}
                required
              />
            </Field>
          </FieldGroup>
          <DialogFooter showCloseButton>
            <PendingButton
              pending={pending}
              icon={<KeyRoundIcon data-icon="inline-start" />}
            >
              Update password
            </PendingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteUserDialog({
  user,
  currentUser,
  children,
}: {
  user: PublicUser;
  currentUser: CurrentUser;
  children: React.ReactElement;
}) {
  const [open, setOpen] = React.useState(false);
  const [state, action, pending] = useActionState(deleteUserAction, idleState);
  const isCurrentUser = user.id === currentUser.id;

  useAdminActionToast(
    state,
    React.useCallback(() => setOpen(false), []),
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={children} />
      <DialogContent>
        <form action={action} className="flex flex-col gap-4">
          <input type="hidden" name="id" value={user.id} />
          <DialogHeader>
            <DialogTitle>Delete user account</DialogTitle>
            <DialogDescription>
              Remove {user.name} from dashboard access. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {isCurrentUser ? (
            <Card className="border-destructive/30 bg-destructive/5 shadow-none">
              <CardContent className="pt-4 text-sm text-destructive">
                You cannot delete the account you are currently using.
              </CardContent>
            </Card>
          ) : null}
          <DialogFooter showCloseButton>
            <PendingButton
              pending={pending}
              variant="destructive"
              icon={<Trash2Icon data-icon="inline-start" />}
            >
              Delete account
            </PendingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function UserActions({
  user,
  currentUser,
}: {
  user: PublicUser;
  currentUser: CurrentUser;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      <EditUserDialog user={user} currentUser={currentUser}>
        <Button variant="ghost" size="icon-sm" aria-label={`Edit ${user.name}`}>
          <UserCogIcon />
        </Button>
      </EditUserDialog>
      <PasswordDialog user={user}>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Change password for ${user.name}`}
        >
          <KeyRoundIcon />
        </Button>
      </PasswordDialog>
      <DeleteUserDialog user={user} currentUser={currentUser}>
        <Button variant="ghost" size="icon-sm" aria-label={`Delete ${user.name}`}>
          <Trash2Icon />
        </Button>
      </DeleteUserDialog>
    </div>
  );
}

function UserTable({
  users,
  currentUser,
}: {
  users: PublicUser[];
  currentUser: CurrentUser;
}) {
  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <CardTitle>User management</CardTitle>
          <CardDescription>
            Create accounts, assign roles, reset passwords, and remove access.
          </CardDescription>
        </div>
        <CreateUserDialog />
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Password updated</TableHead>
                <TableHead className="w-12">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-medium">{user.name}</span>
                          {user.id === currentUser.id ? (
                            <Badge variant="outline">You</Badge>
                          ) : null}
                        </div>
                        <span className="truncate text-xs text-muted-foreground">
                          @{user.username}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <RoleBadge role={user.role} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(user.createdAt)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(user.passwordUpdatedAt)}
                  </TableCell>
                  <TableCell>
                    <UserActions user={user} currentUser={currentUser} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function GenericResultTable({
  columns,
  rows,
  emptyMessage,
}: {
  columns: string[];
  rows: AdminSqlRow[];
  emptyMessage: string;
}) {
  if (!rows.length) {
    return (
      <div className="rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column} className="whitespace-nowrap">
                {column}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={index}>
              {columns.map((column) => (
                <TableCell
                  key={column}
                  className="max-w-[18rem] whitespace-pre-wrap break-words align-top font-mono text-xs"
                >
                  {formatCellValue(row[column])}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function StorageOverviewCard({
  debugData,
}: {
  debugData: AdminDebugData;
}) {
  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader>
        <CardTitle>Real backend data</CardTitle>
        <CardDescription>
          Live read-only data from the local SQLite database and user file used
          by this app.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <div>
            <div className="text-sm font-medium">SQLite database</div>
            <p className="mt-1 break-all rounded-lg bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
              {debugData.databaseFilePath}
            </p>
          </div>
          <div>
            <div className="text-sm font-medium">Local user store</div>
            <p className="mt-1 break-all rounded-lg bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
              {debugData.usersFilePath}
            </p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border bg-muted/20 px-4 py-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Backend tables
            </div>
            <div className="mt-1 text-xl font-semibold">{debugData.tableCount}</div>
          </div>
          <div className="rounded-lg border bg-muted/20 px-4 py-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Weekly reports
            </div>
            <div className="mt-1 text-xl font-semibold">{debugData.snapshotCount}</div>
          </div>
          <div className="rounded-lg border bg-muted/20 px-4 py-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Saved versions
            </div>
            <div className="mt-1 text-xl font-semibold">{debugData.revisionCount}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SqlTableViewer({ tables }: { tables: AdminSqlTablePreview[] }) {
  const [selectedTableName, setSelectedTableName] = React.useState(
    tables[0]?.name ?? "",
  );
  const selectedTable =
    tables.find((table) => table.name === selectedTableName) ?? tables[0] ?? null;
  const selectedTableMeta = selectedTable ? getTableMeta(selectedTable.name) : null;

  if (!selectedTable) {
    return (
      <Card className="border-border bg-card shadow-none">
        <CardHeader>
          <CardTitle>Read-only SQL table viewer</CardTitle>
          <CardDescription>No SQL tables are available yet.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <CardTitle>Backend table viewer</CardTitle>
          <CardDescription>
            Browse real app data from SQLite. Plain names are shown first; raw
            table names are still visible for debugging.
          </CardDescription>
        </div>
        <div className="w-full max-w-xs">
          <Select
            value={selectedTable.name}
            onValueChange={(nextValue) => {
              if (nextValue) {
                setSelectedTableName(nextValue);
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {tables.map((table) => (
                  <SelectItem key={table.name} value={table.name}>
                    {getTableMeta(table.name).label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {selectedTableMeta ? (
          <div className="rounded-lg border bg-muted/20 px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="font-medium">{selectedTableMeta.label}</div>
              <Badge variant="outline" className="font-mono">
                {selectedTable.name}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {selectedTableMeta.description}
            </p>
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{selectedTable.rowCount} rows</Badge>
          <Badge variant="outline">{selectedTable.columns.length} columns</Badge>
          {selectedTable.truncated ? (
            <Badge variant="secondary">
              Previewing first {selectedTable.previewLimit} rows
            </Badge>
          ) : null}
        </div>
        <div className="grid gap-2 lg:grid-cols-2">
          {selectedTable.columns.map((column) => (
            <div
              key={column.name}
              className="rounded-lg border bg-muted/20 px-3 py-2 text-sm"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{column.name}</span>
                <Badge variant="secondary">{column.type}</Badge>
                {column.isPrimaryKey ? <Badge variant="outline">PK</Badge> : null}
                {column.notNull ? <Badge variant="outline">NOT NULL</Badge> : null}
              </div>
              {column.defaultValue ? (
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  default: {column.defaultValue}
                </p>
              ) : null}
            </div>
          ))}
        </div>
        <GenericResultTable
          columns={selectedTable.columns.map((column) => column.name)}
          rows={selectedTable.rows}
          emptyMessage="This table exists but currently has no rows."
        />
      </CardContent>
    </Card>
  );
}

function SnapshotHistoryCard({ debugData }: { debugData: AdminDebugData }) {
  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader>
        <CardTitle>Saved weekly reports</CardTitle>
        <CardDescription>
          One row per reporting week. If the same Friday is saved again, the
          version count increases and the newest version becomes current.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Week ending</TableHead>
                <TableHead>Report ID</TableHead>
                <TableHead>Current version ID</TableHead>
                <TableHead>Saved versions</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {debugData.snapshots.map((snapshot) => (
                <TableRow key={snapshot.id}>
                  <TableCell>{snapshot.weekOf}</TableCell>
                  <TableCell className="font-mono text-xs">{snapshot.id}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {snapshot.latestRevisionId ?? "NULL"}
                  </TableCell>
                  <TableCell>{snapshot.revisionCount}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(snapshot.createdAt)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(snapshot.updatedAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function RecentRevisionsCard({ debugData }: { debugData: AdminDebugData }) {
  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader>
        <CardTitle>Recent saved versions</CardTitle>
        <CardDescription>
          Audit trail for recent saves. Payload preview is the actual JSON data
          stored for that weekly report version.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Week ending</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Saved by</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Stored report data preview</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {debugData.recentRevisions.map((revision) => (
                <TableRow key={revision.id}>
                  <TableCell>{revision.weekOf}</TableCell>
                  <TableCell>r{revision.revisionNumber}</TableCell>
                  <TableCell>{revision.authorLabel}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(revision.createdAt)}
                  </TableCell>
                  <TableCell className="max-w-[28rem] whitespace-pre-wrap break-words font-mono text-xs text-muted-foreground">
                    {revision.payloadPreview}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function SqlConsoleCard() {
  const [query, setQuery] = React.useState(defaultSqlExamples[0]?.sql ?? "");
  const [state, action, pending] = useActionState(runSqlQueryAction, idleSqlState);

  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader>
        <CardTitle>Backend SQL console</CardTitle>
        <CardDescription>
          Run read-only queries against the same SQLite database that powers the
          dashboard. Presets load common reports; writes are blocked.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {defaultSqlExamples.map((example) => (
            <Button
              key={example.label}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setQuery(example.sql)}
            >
              {example.label}
            </Button>
          ))}
        </div>
        <form action={action} className="space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="admin-sql-query">SQL query</FieldLabel>
              <Textarea
                id="admin-sql-query"
                name="sql"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                rows={8}
                className="font-mono text-xs"
                placeholder="SELECT * FROM snapshots ORDER BY week_of DESC LIMIT 20"
              />
              <FieldDescription>
                One statement per run. Results are capped at 100 displayed rows.
              </FieldDescription>
            </Field>
          </FieldGroup>
          <PendingButton
            pending={pending}
            icon={<DatabaseIcon data-icon="inline-start" />}
          >
            Run query
          </PendingButton>
        </form>

        {state.message ? (
          <div
            className={cn(
              "rounded-lg border px-4 py-3 text-sm",
              state.status === "error"
                ? "border-destructive/40 bg-destructive/5 text-destructive"
                : "border-border bg-muted/20 text-foreground",
            )}
          >
            {state.message}
          </div>
        ) : null}

        {state.result ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">
                {state.result.rows.length} rows shown
              </Badge>
              <Badge variant="outline">{state.result.durationMs} ms</Badge>
              {state.result.truncated ? (
                <Badge variant="secondary">
                  Limited to first {state.result.rowLimit} rows
                </Badge>
              ) : null}
            </div>
            <div>
              <div className="mb-2 text-sm font-medium">Executed query</div>
              <pre className="overflow-x-auto rounded-lg bg-muted px-3 py-3 font-mono text-xs text-muted-foreground">
                {state.result.sql}
              </pre>
            </div>
            <GenericResultTable
              columns={state.result.columns}
              rows={state.result.rows}
              emptyMessage="Query returned zero rows."
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function SecurityCard() {
  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader>
        <CardTitle>Admin safeguards</CardTitle>
        <CardDescription>
          Guardrails currently enforced by the account management and SQL access
          layers.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <ShieldCheckIcon className="mt-0.5 size-4 text-muted-foreground" />
          <div className="flex flex-col gap-1">
            <div className="font-medium">Admin-only mutations</div>
            <p className="text-sm text-muted-foreground">
              Every account action re-checks the server-side session before
              changing data.
            </p>
          </div>
        </div>
        <Separator />
        <div className="flex items-start gap-3">
          <UsersIcon className="mt-0.5 size-4 text-muted-foreground" />
          <div className="flex flex-col gap-1">
            <div className="font-medium">At least one admin required</div>
            <p className="text-sm text-muted-foreground">
              The final admin cannot be deleted or demoted, keeping the
              workspace recoverable.
            </p>
          </div>
        </div>
        <Separator />
        <div className="flex items-start gap-3">
          <KeyRoundIcon className="mt-0.5 size-4 text-muted-foreground" />
          <div className="flex flex-col gap-1">
            <div className="font-medium">Passwords are hashed</div>
            <p className="text-sm text-muted-foreground">
              The local user file stores bcrypt password hashes, not raw
              passwords.
            </p>
          </div>
        </div>
        <Separator />
        <div className="flex items-start gap-3">
          <DatabaseIcon className="mt-0.5 size-4 text-muted-foreground" />
          <div className="flex flex-col gap-1">
            <div className="font-medium">SQL console is read-only</div>
            <p className="text-sm text-muted-foreground">
              The admin console only allows single-statement reader queries on a
              read-only SQLite connection. Write queries are blocked.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminPanel({
  users,
  currentUser,
  debugData = null,
  variant = "page",
}: AdminPanelProps) {
  const router = useRouter();
  const isWorkspace = variant === "workspace";
  const adminCount = users.filter((user) => user.role === "admin").length;
  const latestPasswordUpdate = [...users].sort((left, right) =>
    right.passwordUpdatedAt.localeCompare(left.passwordUpdatedAt),
  )[0];

  return (
    <section
      className={cn(
        "flex w-full flex-col gap-6",
        isWorkspace ? "" : "mx-auto max-w-7xl px-4 py-6 lg:px-8",
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          {!isWorkspace ? (
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push("/dashboard")}
              aria-label="Back to dashboard"
            >
              <ArrowLeftIcon />
            </Button>
          ) : null}
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                Admin panel
              </h1>
              <Badge variant="outline">
                <ShieldCheckIcon data-icon="inline-start" />
                {currentUser.role}
              </Badge>
            </div>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Manage users, inspect backend storage, review revisions, and run
              safe read-only SQL queries from the frontend.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => router.refresh()}>
            <RefreshCwIcon data-icon="inline-start" />
            Refresh
          </Button>
          {!isWorkspace ? (
            <form action={logout}>
              <Button variant="outline" size="sm" type="submit">
                Sign out
              </Button>
            </form>
          ) : null}
        </div>
      </div>

      <div
        className={cn(
          "grid gap-4",
          debugData ? "md:grid-cols-2 xl:grid-cols-4" : "md:grid-cols-3",
        )}
      >
        <StatCard
          title="Total users"
          value={String(users.length)}
          description="Active local dashboard accounts"
          icon={UsersIcon}
        />
        <StatCard
          title="Admins"
          value={String(adminCount)}
          description="Accounts with full management access"
          icon={ShieldCheckIcon}
        />
        <StatCard
          title="Latest password change"
          value={
            latestPasswordUpdate
              ? formatDate(latestPasswordUpdate.passwordUpdatedAt)
              : "No users"
          }
          description={
            latestPasswordUpdate
              ? `Updated for ${latestPasswordUpdate.name}`
              : "No account activity yet"
          }
          icon={CalendarClockIcon}
        />
        {debugData ? (
          <StatCard
            title="Snapshot revisions"
            value={String(debugData.revisionCount)}
            description={`${debugData.snapshotCount} saved reporting weeks`}
            icon={DatabaseIcon}
          />
        ) : null}
      </div>

      <Tabs defaultValue="users">
        <TabsList className="flex h-auto flex-wrap items-center gap-1">
          <TabsTrigger value="users">
            <UsersIcon data-icon="inline-start" />
            Users
          </TabsTrigger>
          {debugData ? (
            <TabsTrigger value="backend">
              <DatabaseIcon data-icon="inline-start" />
              Backend
            </TabsTrigger>
          ) : null}
          {debugData ? (
            <TabsTrigger value="sql">
              <DatabaseIcon data-icon="inline-start" />
              SQL Console
            </TabsTrigger>
          ) : null}
          <TabsTrigger value="security">
            <KeyRoundIcon data-icon="inline-start" />
            Security
          </TabsTrigger>
        </TabsList>
        <TabsContent value="users">
          <UserTable users={users} currentUser={currentUser} />
        </TabsContent>
        {debugData ? (
          <TabsContent value="backend" className="space-y-6">
            <StorageOverviewCard debugData={debugData} />
            <SqlTableViewer tables={debugData.tables} />
            <SnapshotHistoryCard debugData={debugData} />
            <RecentRevisionsCard debugData={debugData} />
          </TabsContent>
        ) : null}
        {debugData ? (
          <TabsContent value="sql">
            <SqlConsoleCard />
          </TabsContent>
        ) : null}
        <TabsContent value="security">
          <SecurityCard />
        </TabsContent>
      </Tabs>
    </section>
  );
}
