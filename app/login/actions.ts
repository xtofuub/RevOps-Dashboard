"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { verifyUserCredentials } from "@/lib/user-store";
import { signSession } from "@/lib/session";

export async function login(_: unknown, formData: FormData) {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  const user = await verifyUserCredentials(username, password);
  if (!user) {
    return { error: "Invalid username or password." };
  }

  const jar = await cookies();
  jar.set("session", signSession({ id: user.id, username: user.username }), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  redirect("/dashboard");
}

export async function logout() {
  const jar = await cookies();
  jar.delete("session");
  redirect("/login");
}
