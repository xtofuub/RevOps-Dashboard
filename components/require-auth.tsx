import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"

interface RequireAuthProps {
  children: React.ReactNode
  allowedRoles?: string[]
}

export async function RequireAuth({ children, allowedRoles }: RequireAuthProps) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard")
  }

  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    redirect("/dashboard")
  }

  return <>{children}</>
}
