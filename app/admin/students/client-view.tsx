"use client"

import { useState } from "react"
import { BookOpen, Search, ChevronDown, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"

interface Enrollment {
  id: string
  user_id: string
  course_id: string
  status: string
  created_at: string
  user: { id: string; email: string; full_name: string } | null
  course: { id: string; title: string } | null
}

interface CourseWithEnrollments {
  id: string
  title: string
  enrollments: Enrollment[]
  approvedCount: number
  pendingCount: number
}

interface Props {
  courses: CourseWithEnrollments[]
  allEnrollments: Enrollment[]
}

export function StudentsClientView({ courses, allEnrollments }: Props) {
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set())
  const [view, setView] = useState<"by-course" | "all-students">("by-course")

  const toggleCourse = (courseId: string) => {
    const newExpanded = new Set(expandedCourses)
    if (newExpanded.has(courseId)) {
      newExpanded.delete(courseId)
    } else {
      newExpanded.add(courseId)
    }
    setExpandedCourses(newExpanded)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-500/10 text-green-600 dark:text-green-400">Approved</span>
      case "pending":
        return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">Pending</span>
      case "rejected":
        return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-500/10 text-red-600 dark:text-red-400">Rejected</span>
      default:
        return null
    }
  }

  // Filter enrollments for search
  const filteredEnrollments = allEnrollments.filter(e => 
    e.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.course?.title?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <>
      {/* View Toggle */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setView("by-course")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            view === "by-course" 
              ? "bg-foreground text-background" 
              : "bg-secondary hover:bg-secondary/80"
          }`}
        >
          By Course
        </button>
        <button
          onClick={() => setView("all-students")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            view === "all-students" 
              ? "bg-foreground text-background" 
              : "bg-secondary hover:bg-secondary/80"
          }`}
        >
          All Students
        </button>
      </div>

      {view === "by-course" ? (
        /* By Course View */
        <div className="space-y-4">
          {courses.length === 0 ? (
            <div className="border border-border rounded-xl p-12 text-center text-muted-foreground">
              No courses yet
            </div>
          ) : (
            courses.map((course) => {
              const isExpanded = expandedCourses.has(course.id)

              return (
                <div key={course.id} className="border border-border rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleCourse(course.id)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-secondary/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold">{course.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {course.approvedCount} student{course.approvedCount !== 1 ? "s" : ""} enrolled
                          {course.pendingCount > 0 && ` · ${course.pendingCount} pending`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="px-3 py-1 text-sm font-bold rounded-full bg-foreground text-background">
                        {course.approvedCount}
                      </span>
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  {isExpanded && course.enrollments && course.enrollments.length > 0 && (
                    <div className="border-t border-border">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border bg-secondary/30">
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Student</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {course.enrollments.map((enrollment) => (
                            <tr key={enrollment.id} className="hover:bg-secondary/20">
                              <td className="px-6 py-4 text-sm font-medium">
                                {enrollment.user?.full_name || "—"}
                              </td>
                              <td className="px-6 py-4 text-sm text-muted-foreground">
                                {enrollment.user?.email || "—"}
                              </td>
                              <td className="px-6 py-4">
                                {getStatusBadge(enrollment.status)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {isExpanded && (!course.enrollments || course.enrollments.length === 0) && (
                    <div className="border-t border-border px-6 py-8 text-center text-muted-foreground">
                      No students enrolled yet
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      ) : (
        /* All Students View */
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or course..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Course</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Enrolled</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredEnrollments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                    {searchQuery ? "No results found" : "No enrollments yet"}
                  </td>
                </tr>
              ) : (
                filteredEnrollments.map((enrollment) => (
                  <tr key={enrollment.id} className="hover:bg-secondary/20">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">{enrollment.user?.full_name || "—"}</p>
                        <p className="text-sm text-muted-foreground">{enrollment.user?.email || "—"}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {enrollment.course?.title || "—"}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(enrollment.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(enrollment.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

