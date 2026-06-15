import { redirect } from "next/navigation"
import Link from "next/link"
import { createAdminClient } from "@/lib/supabase/admin"
import { getUser } from "@/app/actions/auth"
import { Navbar } from "@/components/navbar"
import { Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react"

export const dynamic = "force-dynamic"

type Enrollment = {
  id: string
  status: "pending" | "approved" | "rejected"
  enrolled_at: string
  users: {
    id: string
    email: string | null
    full_name: string | null
  } | null
  courses: {
    id: string
    title: string | null
  } | null
}

export default async function AdminEnrollmentsPage() {
  const user = await getUser()

  if (!user || user.role !== "admin") {
    redirect("/dashboard")
  }

  const supabase = createAdminClient()

  // Get all enrollments with user and course info
  const { data: enrollmentsData, error: enrollmentsError } = await supabase
    .from("enrollments")
    .select(`
      *,
      users:user_id (id, email, full_name),
      courses:course_id (id, title)
    `)
    .order("enrolled_at", { ascending: false })

  const enrollments = (enrollmentsData || []) as Enrollment[]
  const pendingCount = enrollments?.filter((e) => e.status === "pending").length || 0
  const approvedCount = enrollments?.filter((e) => e.status === "approved").length || 0
  const rejectedCount = enrollments?.filter((e) => e.status === "rejected").length || 0

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle2 className="h-4 w-4 text-foreground" />
      case "rejected":
        return <XCircle className="h-4 w-4 text-destructive" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-foreground text-background"
      case "rejected":
        return "bg-destructive/10 text-destructive"
      default:
        return "bg-secondary text-muted-foreground"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />

      <div className="container mx-auto max-w-6xl px-6 py-12">
        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Enrollments</h1>
          <p className="text-lg text-muted-foreground">
            Manage enrollment requests
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          <div className="border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Pending</span>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{pendingCount}</p>
          </div>
          <div className="border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Approved</span>
              <CheckCircle2 className="h-4 w-4 text-foreground" />
            </div>
            <p className="text-2xl font-bold">{approvedCount}</p>
          </div>
          <div className="border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Rejected</span>
              <XCircle className="h-4 w-4 text-destructive" />
            </div>
            <p className="text-2xl font-bold">{rejectedCount}</p>
          </div>
        </div>

        {enrollmentsError && (
          <div className="mb-8 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {enrollmentsError.message}
          </div>
        )}

        {/* Pending Requests */}
        {pendingCount > 0 && (
          <div className="mb-10">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
              Pending Requests ({pendingCount})
            </h2>
            <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
              {enrollments
                ?.filter((e) => e.status === "pending")
                .map((enrollment) => (
                  <Link
                    key={enrollment.id}
                    href={`/admin/enrollments/${enrollment.id}`}
                    className="flex items-center justify-between p-5 hover:bg-secondary/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-semibold">
                        {(enrollment.users?.full_name || enrollment.users?.email || "U")[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">
                          {enrollment.users?.full_name || enrollment.users?.email}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {enrollment.courses?.title}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(enrollment.status)}`}>
                        {getStatusIcon(enrollment.status)}
                        {enrollment.status}
                      </span>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(enrollment.enrolled_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        )}

        {/* All Enrollments */}
        <div>
          <h2 className="text-xl font-semibold mb-4">All Enrollments</h2>
          {enrollments && enrollments.length > 0 ? (
            <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
              {enrollments.map((enrollment) => (
                <Link
                  key={enrollment.id}
                  href={`/admin/enrollments/${enrollment.id}`}
                  className="flex items-center justify-between p-5 hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-semibold">
                      {(enrollment.users?.full_name || enrollment.users?.email || "U")[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">
                        {enrollment.users?.full_name || enrollment.users?.email}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {enrollment.courses?.title}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(enrollment.status)}`}>
                      {getStatusIcon(enrollment.status)}
                      {enrollment.status}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(enrollment.enrolled_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border border-dashed border-border rounded-xl">
              <p className="text-muted-foreground">No enrollments yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
