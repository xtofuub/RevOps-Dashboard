import { cookies } from "next/headers";

import { getUserById, listUsers } from "@/lib/user-store";
import { verifySession } from "@/lib/session";

interface Session {
  user: { id: string; username: string; name: string; role: string };
}

export async function auth(): Promise<Session | null> {
  const jar = await cookies();
  const raw = jar.get("session")?.value;
  if (!raw) return null;

  const payload = verifySession(raw);
  if (!payload) return null;

  const { id } = payload;
  if (typeof id !== "string") return null;

  const user = getUserById(id);
  if (!user) return null;

  return {
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    },
  };
}

export function getAllUsers() {
  return listUsers();
}
