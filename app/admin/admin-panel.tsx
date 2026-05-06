"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  CalendarClockIcon,
  KeyRoundIcon,
  LoaderCircleIcon,
  PlusIcon,
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
  variant?: "page" | "workspace";
};

const idleState: AdminActionState = {
  status: "idle",
  message: "",
};

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
      {pending ? <LoaderCircleIcon data-icon="inline-start" className="animate-spin" /> : icon}
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
              Add a teammate with a local dashboard login and the right access level.
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
              Set a new password for {user.name}. The change applies immediately.
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
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Delete ${user.name}`}
        >
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

export function AdminPanel({
  users,
  currentUser,
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
              Manage local dashboard access, account roles, and password resets.
            </p>
          </div>
        </div>
        {!isWorkspace ? (
          <form action={logout}>
            <Button variant="outline" size="sm" type="submit">
              Sign out
            </Button>
          </form>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
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
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">
            <UsersIcon data-icon="inline-start" />
            Users
          </TabsTrigger>
          <TabsTrigger value="security">
            <KeyRoundIcon data-icon="inline-start" />
            Security
          </TabsTrigger>
        </TabsList>
        <TabsContent value="users">
          <UserTable users={users} currentUser={currentUser} />
        </TabsContent>
        <TabsContent value="security">
          <Card className="border-border bg-card shadow-none">
            <CardHeader>
              <CardTitle>Admin safeguards</CardTitle>
              <CardDescription>
                Guardrails currently enforced by the account management layer.
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </section>
  );
}
