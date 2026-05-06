import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getAllUsers } from "@/lib/auth"
import { AdminPanel } from "./admin-panel"

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login?callbackUrl=/admin")
  }

  if (session.user.role !== "admin") {
    redirect("/dashboard")
  }

  const users = getAllUsers()

  return (
    <div className="min-h-screen bg-background">
      <AdminPanel users={users} currentUser={session.user} />
    </div>
  )
}
