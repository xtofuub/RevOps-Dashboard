import { cookies } from "next/headers";

import { getUserById, getUserByUsername, listUsers } from "@/lib/user-store";

interface Session {
  user: { id: string; username: string; name: string; role: string };
}

export async function auth(): Promise<Session | null> {
  const jar = await cookies();
  const raw = jar.get("session")?.value;
  if (!raw) return null;
  try {
    const { id, username } = JSON.parse(raw);
    const user =
      (typeof id === "string" && getUserById(id)) ||
      (typeof username === "string" && getUserByUsername(username));

    if (!user) return null;

    return {
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      },
    };
  } catch {
    return null;
  }
}

export function getAllUsers() {
  return listUsers();
}
