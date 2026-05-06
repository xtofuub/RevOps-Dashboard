"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/lib/auth";
import {
  createUser,
  deleteUser,
  getUserById,
  updateUser,
  updateUserPassword,
  type UserRole,
} from "@/lib/user-store";

export type AdminActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

const initialState: AdminActionState = {
  status: "idle",
  message: "",
};

const roleSchema = z.enum(["admin", "user"]);

const createUserSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters.")
    .regex(
      /^[a-zA-Z0-9._-]+$/,
      "Use letters, numbers, dots, underscores, or hyphens only.",
    ),
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  role: roleSchema,
  password: z.string().min(6, "Password must be at least 6 characters."),
  confirmPassword: z.string(),
});

const updateUserSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  role: roleSchema,
});

const passwordSchema = z.object({
  id: z.string().min(1),
  password: z.string().min(6, "Password must be at least 6 characters."),
  confirmPassword: z.string(),
});

const deleteUserSchema = z.object({
  id: z.string().min(1),
});

async function requireAdmin() {
  const session = await auth();

  if (!session?.user) {
    throw new Error("You must be signed in.");
  }

  if (session.user.role !== "admin") {
    throw new Error("Only admins can manage user accounts.");
  }

  return session.user;
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function success(message: string): AdminActionState {
  revalidatePath("/admin");
  revalidatePath("/dashboard");

  return { status: "success", message };
}

function failure(error: unknown): AdminActionState {
  return {
    status: "error",
    message:
      error instanceof Error
        ? error.message
        : "The admin action could not be completed.",
  };
}

export async function createUserAction(
  _previousState: AdminActionState = initialState,
  formData: FormData,
): Promise<AdminActionState> {
  void _previousState;

  try {
    await requireAdmin();

    const payload = createUserSchema.parse({
      username: getString(formData, "username"),
      name: getString(formData, "name"),
      role: getString(formData, "role"),
      password: getString(formData, "password"),
      confirmPassword: getString(formData, "confirmPassword"),
    });

    if (payload.password !== payload.confirmPassword) {
      throw new Error("Passwords do not match.");
    }

    await createUser({
      username: payload.username,
      name: payload.name,
      role: payload.role,
      password: payload.password,
    });

    return success(`${payload.name} can now sign in.`);
  } catch (error) {
    return failure(error);
  }
}

export async function updateUserAction(
  _previousState: AdminActionState = initialState,
  formData: FormData,
): Promise<AdminActionState> {
  void _previousState;

  try {
    const currentUser = await requireAdmin();
    const payload = updateUserSchema.parse({
      id: getString(formData, "id"),
      name: getString(formData, "name"),
      role: getString(formData, "role"),
    });
    const existingUser = getUserById(payload.id);

    if (!existingUser) {
      throw new Error("User account not found.");
    }

    if (currentUser.id === payload.id && existingUser.role !== payload.role) {
      throw new Error("You cannot change your own admin role.");
    }

    updateUser({
      id: payload.id,
      name: payload.name,
      role: payload.role as UserRole,
    });

    return success(`${payload.name} was updated.`);
  } catch (error) {
    return failure(error);
  }
}

export async function resetPasswordAction(
  _previousState: AdminActionState = initialState,
  formData: FormData,
): Promise<AdminActionState> {
  void _previousState;

  try {
    await requireAdmin();

    const payload = passwordSchema.parse({
      id: getString(formData, "id"),
      password: getString(formData, "password"),
      confirmPassword: getString(formData, "confirmPassword"),
    });
    const targetUser = getUserById(payload.id);

    if (!targetUser) {
      throw new Error("User account not found.");
    }

    if (payload.password !== payload.confirmPassword) {
      throw new Error("Passwords do not match.");
    }

    await updateUserPassword({
      id: payload.id,
      password: payload.password,
    });

    return success(`${targetUser.name}'s password was updated.`);
  } catch (error) {
    return failure(error);
  }
}

export async function deleteUserAction(
  _previousState: AdminActionState = initialState,
  formData: FormData,
): Promise<AdminActionState> {
  void _previousState;

  try {
    const currentUser = await requireAdmin();
    const payload = deleteUserSchema.parse({
      id: getString(formData, "id"),
    });
    const targetUser = getUserById(payload.id);

    if (!targetUser) {
      throw new Error("User account not found.");
    }

    if (currentUser.id === payload.id) {
      throw new Error("You cannot delete your own account.");
    }

    deleteUser(payload.id);

    return success(`${targetUser.name} was removed.`);
  } catch (error) {
    return failure(error);
  }
}
