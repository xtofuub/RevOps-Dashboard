"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const USERS: Record<string, { password: string; role: string }> = {
  admin: { password: "admin123", role: "admin" },
  user:  { password: "user123",  role: "user"  },
};

export async function login(_: unknown, formData: FormData) {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  const user = USERS[username];
  if (!user || user.password !== password) {
    return { error: "Invalid username or password." };
  }

  const jar = await cookies();
  jar.set("session", JSON.stringify({ id: "1", username, role: user.role }), {
    httpOnly: true,
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
