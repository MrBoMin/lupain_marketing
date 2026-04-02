import { redirect } from "next/navigation"
import Link from "next/link"
import { createAdminClient } from "@/lib/supabase/admin"
import { getUser } from "@/app/actions/auth"
import { ChevronLeft, Users, BookOpen } from "lucide-react"
import { StudentsClientView } from "./client-view"

// Force dynamic rendering to always get fresh data
export const dynamic = 'force-dynamic'

export default async function StudentsPage() {
  const user = await getUser()

  if (!user || user.role !== "admin") {
    redirect("/dashboard")
  }

  // Use admin client to bypass RLS
  const supabase = createAdminClient()

  // 1. Fetch all courses
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title")
    .order("title")

  // 2. Fetch all enrollments
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("id, user_id, course_id, status, enrolled_at")
    .order("enrolled_at", { ascending: false })

  // 3. Fetch all users
  const { data: users } = await supabase
    .from("users")
    .select("id, email, full_name")


  // Create lookup maps
  const usersMap = new Map((users || []).map(u => [u.id, u]))
  const coursesMap = new Map((courses || []).map(c => [c.id, c]))

  // Combine enrollment data with user and course info
  const allEnrollments = (enrollments || []).map(e => ({
    id: e.id,
    user_id: e.user_id,
    course_id: e.course_id,
    status: e.status,
    created_at: e.enrolled_at,
    user: usersMap.get(e.user_id) || null,
    course: coursesMap.get(e.course_id) || null,
  }))

  // Group by course for the "By Course" view
  const coursesWithEnrollments = (courses || []).map(course => {
    const courseEnrollments = allEnrollments.filter(e => e.course_id === course.id)
    return {
      id: course.id,
      title: course.title,
      enrollments: courseEnrollments,
      approvedCount: courseEnrollments.filter(e => e.status === "approved").length,
      pendingCount: courseEnrollments.filter(e => e.status === "pending").length,
    }
  })

  // Calculate stats
  const approvedEnrollments = allEnrollments.filter(e => e.status === "approved")
  const uniqueStudentIds = new Set(approvedEnrollments.map(e => e.user_id).filter(Boolean))
  const totalStudents = uniqueStudentIds.size
  const totalEnrollments = approvedEnrollments.length

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-5xl px-6 py-12">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Admin
        </Link>

        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-2">Students & Enrollments</h1>
          <p className="text-muted-foreground">View enrolled students and course statistics</p>
        </div>


        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="border border-border rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalStudents}</p>
                <p className="text-sm text-muted-foreground">Total Students</p>
              </div>
            </div>
          </div>

          <div className="border border-border rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalEnrollments}</p>
                <p className="text-sm text-muted-foreground">Total Enrollments</p>
              </div>
            </div>
          </div>

          <div className="border border-border rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{courses?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Total Courses</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pass all data to client for filtering/display */}
        <StudentsClientView 
          courses={coursesWithEnrollments} 
          allEnrollments={allEnrollments} 
        />
      </div>
    </div>
  )
}
