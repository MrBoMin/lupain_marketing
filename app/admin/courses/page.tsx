import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/app/actions/auth"
import { Navbar } from "@/components/navbar"
import { Plus, Play, Clock, ArrowRight } from "lucide-react"

export default async function AdminCoursesPage() {
  const user = await getUser()

  if (!user || user.role !== "admin") {
    redirect("/dashboard")
  }

  const supabase = await createClient()

  const { data: courses } = await supabase
    .from("courses")
    .select("*")
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />

      <div className="container mx-auto max-w-6xl px-6 py-12">
        <div className="flex items-start justify-between mb-12">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">Courses</h1>
            <p className="text-lg text-muted-foreground">
              Manage your course catalog
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

        {courses && courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Link
                key={course.id}
                href={`/admin/courses/${course.id}`}
                className="group block"
              >
                <article className="border border-border rounded-xl overflow-hidden bg-card hover:border-foreground/20 transition-all h-full">
                  <div className="aspect-[16/10] relative bg-secondary">
                    {course.thumbnail_url ? (
                      <Image
                        src={course.thumbnail_url}
                        alt={course.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="w-12 h-12 rounded-full bg-foreground/5 flex items-center justify-center">
                          <Play className="h-5 w-5 text-muted-foreground ml-0.5" />
                        </div>
                      </div>
                    )}
                    <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium ${
                      course.published 
                        ? "bg-foreground text-background" 
                        : "bg-secondary text-muted-foreground border border-border"
                    }`}>
                      {course.published ? "Published" : "Draft"}
                    </div>
                  </div>
                  <div className="p-5 space-y-3">
                    <div className="flex items-center gap-3">
                      {course.category && (
                        <span className="px-2 py-0.5 rounded-full bg-secondary text-xs font-medium">
                          {course.category}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {course.duration} min
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1 line-clamp-1 group-hover:text-foreground/80 transition-colors">
                        {course.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {course.description}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-sm text-muted-foreground">
                        {course.instructor_name}
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border border-dashed border-border rounded-xl">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-6">
              <Play className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No courses yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first course to get started
            </p>
            <Link
              href="/admin/courses/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-lg text-sm font-medium hover:bg-foreground/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Course
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
