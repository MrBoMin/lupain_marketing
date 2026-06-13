import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/app/actions/auth"
import { Navbar } from "@/components/navbar"
import { BookOpen, Users, GraduationCap, ArrowRight, Plus, PlayCircle, type LucideIcon } from "lucide-react"

type Stat = {
  label: string
  value: number
  icon: LucideIcon
  highlight?: boolean
}

type RecentEnrollment = {
  id: string
  enrolled_at: string
  users:
    | {
        full_name: string | null
        email: string | null
      }
    | {
        full_name: string | null
        email: string | null
      }[]
    | null
  courses:
    | {
        title: string | null
      }
    | {
        title: string | null
      }[]
    | null
}

type RecentEnrollmentItem = {
  id: string
  enrolled_at: string
  user: {
    full_name: string | null
    email: string | null
  } | null
  course: {
    title: string | null
  } | null
}

export default async function AdminDashboard() {
  const user = await getUser()

  if (!user || user.role !== "admin") {
    redirect("/dashboard")
  }

  const supabase = await createClient()

  const [
    { count: totalCourses },
    { count: totalUsers },
    { count: totalEnrollments },
    { count: pendingEnrollments },
    { data: recentEnrollments },
  ] = await Promise.all([
    supabase.from("courses").select("id", { count: "exact", head: true }),
    supabase.from("users").select("id", { count: "exact", head: true }),
    supabase.from("enrollments").select("id", { count: "exact", head: true }),
    supabase
      .from("enrollments")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("enrollments")
      .select(`
        id,
        enrolled_at,
        users (full_name, email),
        courses (title)
      `)
      .order("enrolled_at", { ascending: false })
      .limit(5),
  ])

  const stats: Stat[] = [
    { label: "Total Courses", value: totalCourses || 0, icon: BookOpen },
    { label: "Total Users", value: totalUsers || 0, icon: Users },
    { label: "Enrollments", value: totalEnrollments || 0, icon: GraduationCap },
    { 
      label: "Pending", 
      value: pendingEnrollments || 0,
      icon: GraduationCap,
      highlight: (pendingEnrollments || 0) > 0
    },
  ]

  const quickActions = [
    { label: "Courses", href: "/admin/courses", icon: BookOpen },
    { label: "Videos", href: "/admin/videos", icon: PlayCircle },
    { label: "Enrollments", href: "/admin/enrollments", icon: GraduationCap },
    { label: "Students", href: "/admin/students", icon: Users },
  ]

  const recentEnrollmentItems: RecentEnrollmentItem[] = (recentEnrollments || []).map(
    (enrollment: RecentEnrollment) => {
      const enrollmentUser = Array.isArray(enrollment.users)
        ? enrollment.users[0]
        : enrollment.users
      const enrollmentCourse = Array.isArray(enrollment.courses)
        ? enrollment.courses[0]
        : enrollment.courses

      return {
        id: enrollment.id,
        enrolled_at: enrollment.enrolled_at,
        user: enrollmentUser || null,
        course: enrollmentCourse || null,
      }
    }
  )

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />

      <div className="container mx-auto max-w-6xl px-6 py-12">
        {/* Header */}
        <div className="flex items-start justify-between mb-12">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">Admin Dashboard</h1>
            <p className="text-lg text-muted-foreground">
              Overview of your learning platform
            </p>
          </div>
          <Link
            href="/admin/courses/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-lg text-sm font-medium hover:bg-foreground/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Course
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className={`border rounded-xl p-6 ${
                stat.highlight 
                  ? "border-foreground bg-foreground text-background" 
                  : "border-border bg-card"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className={`text-sm ${stat.highlight ? "text-background/70" : "text-muted-foreground"}`}>
                  {stat.label}
                </span>
                <stat.icon className={`h-4 w-4 ${stat.highlight ? "text-background/70" : "text-muted-foreground"}`} />
              </div>
              <p className="text-3xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="group flex items-center justify-between p-6 border border-border rounded-xl bg-card hover:border-foreground/20 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                    <action.icon className="h-5 w-5 text-foreground" />
                  </div>
                  <span className="font-medium">Manage {action.label}</span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-xl font-semibold mb-6">Recent Enrollments</h2>
          <div className="border border-border rounded-xl overflow-hidden">
            {recentEnrollmentItems.length > 0 ? (
              <div className="divide-y divide-border">
                {recentEnrollmentItems.map((enrollment) => (
                  <div
                    key={enrollment.id}
                    className="flex items-center justify-between p-5 hover:bg-secondary/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-semibold">
                        {(enrollment.user?.full_name || enrollment.user?.email || "U")[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">
                          {enrollment.user?.full_name || enrollment.user?.email}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Enrolled in {enrollment.course?.title}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(enrollment.enrolled_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                No enrollments yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
