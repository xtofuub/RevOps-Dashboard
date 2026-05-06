import { cookies } from "next/headers";

interface Session {
  user: { id: string; username: string; role: string };
}

export async function auth(): Promise<Session | null> {
  const jar = await cookies();
  const raw = jar.get("session")?.value;
  if (!raw) return null;
  try {
    const { username, role } = JSON.parse(raw);
    if (!username) return null;
    return { user: { id: "1", username, role } };
  } catch {
    return null;
  }
}

export function getAllUsers() {
  return [
    { id: "1", username: "admin", name: "Admin User", role: "admin" as const, createdAt: new Date().toISOString() },
    { id: "2", username: "user", name: "Regular User", role: "user" as const, createdAt: new Date().toISOString() },
  ]
}