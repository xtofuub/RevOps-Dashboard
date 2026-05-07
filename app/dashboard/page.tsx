import { redirect } from "next/navigation"
import { auth, getAllUsers } from "@/lib/auth"
import { buildAdminDebugData } from "@/lib/admin-debug"
import { DashboardWorkspace } from "@/components/dashboard-workspace"
import { buildDashboardForecast } from "@/lib/dashboard-forecast"
import { readWeeklySnapshots } from "@/lib/dashboard-store"
import { buildDashboardData } from "@/lib/kpi-dashboard"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard")
  }

  const snapshots = await readWeeklySnapshots()
  const dashboard = buildDashboardData(snapshots)
  const forecast = buildDashboardForecast(snapshots)
  const users = session.user.role === "admin" ? getAllUsers() : []
  const adminDebugData =
    session.user.role === "admin" ? buildAdminDebugData() : null

  return (
    <DashboardWorkspace
      snapshots={snapshots}
      dashboard={dashboard}
      forecast={forecast}
      users={users}
      adminDebugData={adminDebugData}
      user={session.user}
    />
  )
}
