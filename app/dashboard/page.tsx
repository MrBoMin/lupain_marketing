import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/app/actions/auth"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { BookOpen, Play, ArrowRight } from "lucide-react"

export default async function DashboardPage() {
  const user = await getUser()

  if (!user) {
    redirect("/login")
  }

  const supabase = await createClient()

  // Get user's enrolled courses with progress
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select(`
      id,
      course_id,
      status,
      enrolled_at,
      courses (
        id,
        title,
        description,
        thumbnail_url,
        instructor_name
      )
    `)
    .eq("user_id", user.id)
    .order("enrolled_at", { ascending: false })

  const courseIds = (enrollments || [])
    .map((enrollment) => enrollment.course_id)
    .filter((courseId): courseId is string => Boolean(courseId))

  const [{ data: lessons }, { data: completedProgress }] = courseIds.length > 0
    ? await Promise.all([
        supabase
          .from("lessons")
          .select("id, course_id")
          .in("course_id", courseIds),
        supabase
          .from("lesson_progress")
          .select("lesson_id, course_id")
          .eq("user_id", user.id)
          .eq("completed", true)
          .in("course_id", courseIds),
      ])
    : [{ data: [] }, { data: [] }]

  const totalLessonsByCourse = new Map<string, number>()
  for (const lesson of lessons || []) {
    totalLessonsByCourse.set(
      lesson.course_id,
      (totalLessonsByCourse.get(lesson.course_id) || 0) + 1
    )
  }

  const completedLessonsByCourse = new Map<string, number>()
  for (const progress of completedProgress || []) {
    completedLessonsByCourse.set(
      progress.course_id,
      (completedLessonsByCourse.get(progress.course_id) || 0) + 1
    )
  }

  const coursesWithProgress = (enrollments || [])
    .map((enrollment) => {
      const course = Array.isArray(enrollment.courses)
        ? enrollment.courses[0]
        : enrollment.courses

      if (!course) return null

      const totalLessons = totalLessonsByCourse.get(course.id) || 0
      const completedLessons = completedLessonsByCourse.get(course.id) || 0
      const progress = totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0

      return {
        ...enrollment,
        course,
        progress,
        totalLessons,
        completedLessons,
      }
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />

      <div className="container mx-auto max-w-6xl px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Welcome back, {user.full_name?.split(" ")[0] || "Learner"}
          </h1>
          <p className="text-lg text-muted-foreground">
            Continue your learning journey
          </p>
        </div>

        {coursesWithProgress.length > 0 ? (
          <div className="space-y-12">
            {/* In Progress */}
            {coursesWithProgress.some((c) => c.progress > 0 && c.progress < 100) && (
              <section>
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-foreground" />
                  Continue Learning
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {coursesWithProgress
                    .filter((c) => c.progress > 0 && c.progress < 100)
                    .slice(0, 2)
                    .map((item) => (
                      <Link
                        key={item.course.id}
                        href={`/dashboard/courses/${item.course.id}`}
                        className="group block"
                      >
                        <article className="border border-border rounded-xl overflow-hidden bg-card hover:border-foreground/20 transition-all">
                          <div className="aspect-[21/9] relative bg-secondary">
                            {item.course.thumbnail_url ? (
                              <Image
                                src={item.course.thumbnail_url}
                                alt={item.course.title}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <Play className="h-8 w-8 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="p-6">
                            <h3 className="font-semibold mb-2 group-hover:text-foreground/80 transition-colors">
                              {item.course.title}
                            </h3>
                            <div className="space-y-3">
                              <Progress value={item.progress} className="h-1.5" />
                              <div className="flex items-center justify-between text-sm text-muted-foreground">
                                <span>{item.completedLessons}/{item.totalLessons} lessons</span>
                                <span className="font-medium text-foreground">{item.progress}%</span>
                              </div>
                            </div>
                          </div>
                        </article>
                      </Link>
                    ))}
                </div>
              </section>
            )}

            {/* All Courses */}
            <section>
              <h2 className="text-xl font-semibold mb-6">All Courses</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {coursesWithProgress.map((item) => (
                  <Link
                    key={item.course.id}
                    href={`/dashboard/courses/${item.course.id}`}
                    className="group block"
                  >
                    <article className="border border-border rounded-xl overflow-hidden bg-card hover:border-foreground/20 transition-all h-full">
                      <div className="aspect-[16/10] relative bg-secondary">
                        {item.course.thumbnail_url ? (
                          <Image
                            src={item.course.thumbnail_url}
                            alt={item.course.title}
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
                        {item.progress === 100 && (
                          <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-foreground text-background text-xs font-medium">
                            Completed
                          </div>
                        )}
                      </div>
                      <div className="p-5 space-y-4">
                        <div>
                          <h3 className="font-semibold mb-1 line-clamp-1 group-hover:text-foreground/80 transition-colors">
                            {item.course.title}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {item.course.description}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Progress value={item.progress} className="h-1" />
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{item.completedLessons}/{item.totalLessons} lessons</span>
                            <span>{item.progress}%</span>
                          </div>
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        ) : (
          <div className="text-center py-20 border border-dashed border-border rounded-xl">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-6">
              <BookOpen className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No courses yet</h3>
            <p className="text-muted-foreground mb-6">
              Browse our catalog and start learning today
            </p>
            <Button asChild>
              <Link href="/">
                Browse Courses
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
