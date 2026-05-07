import "server-only";

import bcrypt from "bcryptjs";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { z } from "zod";

const userRoles = ["admin", "user"] as const;

export type UserRole = (typeof userRoles)[number];

const userRecordSchema = z.object({
  id: z.string().min(1),
  username: z.string().min(1),
  name: z.string().min(1),
  role: z.enum(userRoles),
  passwordHash: z.string().min(1),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  passwordUpdatedAt: z.string().min(1),
});

const userFileSchema = z.array(userRecordSchema);

type UserRecord = z.infer<typeof userRecordSchema>;

export type PublicUser = Omit<UserRecord, "passwordHash">;

const dataDirectoryPath = path.join(
  /* turbopackIgnore: true */ process.cwd(),
  "data",
);

function getUsersFilePath() {
  return (
    process.env.REVOPS_USERS_FILE_PATH ??
    path.join(dataDirectoryPath, "users.json")
  );
}

function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

function ensureUsersFile() {
  const usersFilePath = getUsersFilePath();

  mkdirSync(path.dirname(usersFilePath), { recursive: true });

  if (existsSync(usersFilePath)) {
    return;
  }

  const now = new Date().toISOString();
  const defaultUsers: UserRecord[] = [
    {
      id: randomUUID(),
      username: "admin",
      name: "Admin User",
      role: "admin",
      passwordHash: bcrypt.hashSync("admin123", 10),
      createdAt: now,
      updatedAt: now,
      passwordUpdatedAt: now,
    },
    {
      id: randomUUID(),
      username: "user",
      name: "Regular User",
      role: "user",
      passwordHash: bcrypt.hashSync("user123", 10),
      createdAt: now,
      updatedAt: now,
      passwordUpdatedAt: now,
    },
  ];

  writeUsers(defaultUsers);
}

function readUsers() {
  ensureUsersFile();

  const usersFilePath = getUsersFilePath();
  const contents = readFileSync(usersFilePath, "utf8");

  if (!contents.trim()) {
    return [];
  }

  return userFileSchema.parse(JSON.parse(contents));
}

function writeUsers(users: UserRecord[]) {
  const usersFilePath = getUsersFilePath();
  const tempFilePath = `${usersFilePath}.tmp`;

  mkdirSync(path.dirname(usersFilePath), { recursive: true });
  writeFileSync(tempFilePath, `${JSON.stringify(users, null, 2)}\n`);
  renameSync(tempFilePath, usersFilePath);
}

function toPublicUser(user: UserRecord): PublicUser {
  const { passwordHash, ...publicUser } = user;
  void passwordHash;

  return publicUser;
}

function countAdmins(users: UserRecord[]) {
  return users.filter((user) => user.role === "admin").length;
}

export function listUsers() {
  return readUsers().map(toPublicUser);
}

export function getUserById(id: string) {
  const user = readUsers().find((item) => item.id === id);

  return user ? toPublicUser(user) : null;
}

export function getUserByUsername(username: string) {
  const normalizedUsername = normalizeUsername(username);
  const user = readUsers().find((item) => item.username === normalizedUsername);

  return user ? toPublicUser(user) : null;
}

export async function verifyUserCredentials(username: string, password: string) {
  const normalizedUsername = normalizeUsername(username);
  const user = readUsers().find((item) => item.username === normalizedUsername);

  if (!user) {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);

  return isValid ? toPublicUser(user) : null;
}

export async function createUser(input: {
  username: string;
  name: string;
  role: UserRole;
  password: string;
}) {
  const users = readUsers();
  const now = new Date().toISOString();
  const username = normalizeUsername(input.username);
  const name = input.name.trim();

  if (users.some((user) => user.username === username)) {
    throw new Error("That username is already in use.");
  }

  const nextUser: UserRecord = {
    id: randomUUID(),
    username,
    name,
    role: input.role,
    passwordHash: await bcrypt.hash(input.password, 10),
    createdAt: now,
    updatedAt: now,
    passwordUpdatedAt: now,
  };

  writeUsers([...users, nextUser]);

  return toPublicUser(nextUser);
}

export function updateUser(input: {
  id: string;
  name: string;
  role: UserRole;
}) {
  const users = readUsers();
  const userIndex = users.findIndex((user) => user.id === input.id);

  if (userIndex === -1) {
    throw new Error("User account not found.");
  }

  const nextUsers = users.map((user) =>
    user.id === input.id
      ? {
          ...user,
          name: input.name.trim(),
          role: input.role,
          updatedAt: new Date().toISOString(),
        }
      : user,
  );

  if (countAdmins(nextUsers) === 0) {
    throw new Error("At least one admin account is required.");
  }

  writeUsers(nextUsers);

  return toPublicUser(nextUsers[userIndex]);
}

export async function updateUserPassword(input: {
  id: string;
  password: string;
}) {
  const users = readUsers();
  const now = new Date().toISOString();
  const passwordHash = await bcrypt.hash(input.password, 10);
  let updatedUser: UserRecord | null = null;
  const nextUsers = users.map((user) => {
    if (user.id !== input.id) {
      return user;
    }

    updatedUser = {
      ...user,
      passwordHash,
      updatedAt: now,
      passwordUpdatedAt: now,
    };

    return updatedUser;
  });

  if (!updatedUser) {
    throw new Error("User account not found.");
  }

  writeUsers(nextUsers);

  return toPublicUser(updatedUser);
}

export function deleteUser(id: string) {
  const users = readUsers();
  const targetUser = users.find((user) => user.id === id);

  if (!targetUser) {
    throw new Error("User account not found.");
  }

  const nextUsers = users.filter((user) => user.id !== id);

  if (countAdmins(nextUsers) === 0) {
    throw new Error("At least one admin account is required.");
  }

  writeUsers(nextUsers);
}
