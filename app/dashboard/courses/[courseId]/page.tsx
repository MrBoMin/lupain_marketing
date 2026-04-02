import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/app/actions/auth"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Clock, CheckCircle2, Circle, ChevronLeft, ChevronDown, ChevronRight, FolderOpen } from "lucide-react"

interface Chapter {
  id: string
  title: string
  description: string | null
  order: number
}

interface Lesson {
  id: string
  chapter_id: string | null
  title: string
  description: string | null
  vimeo_video_id: string
  order: number
  duration: number
}

export default async function CourseViewerPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params
  const user = await getUser()

  if (!user) {
    redirect("/login")
  }

  const supabase = await createClient()

  // Check if user is enrolled and approved
  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("*")
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .single()

  if (!enrollment || enrollment.status !== "approved") {
    redirect(`/courses/${courseId}`)
  }

  // Get course details
  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("id", courseId)
    .single()

  if (!course) {
    notFound()
  }

  // Get all chapters
  const { data: chapters } = await supabase
    .from("chapters")
    .select("*")
    .eq("course_id", courseId)
    .order("order", { ascending: true })

  // Get all lessons
  const { data: lessons } = await supabase
    .from("lessons")
    .select("*")
    .eq("course_id", courseId)
    .order("order", { ascending: true })

  // Get user's progress for all lessons
  const { data: progressData } = await supabase
    .from("lesson_progress")
    .select("*")
    .eq("user_id", user.id)
    .eq("course_id", courseId)

  const progressMap = new Map(progressData?.map((p) => [p.lesson_id, p]) || [])

  // Group lessons by chapter
  const chaptersWithLessons = (chapters || []).map((chapter: Chapter) => ({
    ...chapter,
    lessons: (lessons || []).filter((l: Lesson) => l.chapter_id === chapter.id),
  }))

  // Lessons without chapters (legacy support)
  const unassignedLessons = (lessons || []).filter((l: Lesson) => !l.chapter_id)

  // Find the first incomplete lesson
  let currentLessonId = lessons?.[0]?.id
  if (lessons && progressData) {
    const lastWatchedLesson = progressData.sort(
      (a, b) => new Date(b.last_watched_at).getTime() - new Date(a.last_watched_at).getTime()
    )[0]

    if (lastWatchedLesson) {
      currentLessonId = lastWatchedLesson.lesson_id
    } else {
      const firstIncompleteLesson = lessons.find(
        (lesson: Lesson) => !progressMap.get(lesson.id)?.completed
      )
      if (firstIncompleteLesson) {
        currentLessonId = firstIncompleteLesson.id
      }
    }
  }

  // Calculate overall progress
  const totalLessons = lessons?.length || 0
  const completedLessons = progressData?.filter((p) => p.completed).length || 0
  const overallProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

  // Calculate total duration from all lesson videos (in seconds)
  const totalDurationSeconds = lessons?.reduce((acc, l) => acc + (l.duration || 0), 0) || 0
  const totalHours = Math.floor(totalDurationSeconds / 3600)
  const totalMinutes = Math.floor((totalDurationSeconds % 3600) / 60)
  const formattedTotalDuration = totalHours > 0 
    ? `${totalHours}h ${totalMinutes}m` 
    : `${totalMinutes} min`

  // Helper to render a lesson item
  const renderLesson = (lesson: Lesson) => {
    const progress = progressMap.get(lesson.id)
    const isCompleted = progress?.completed || false

    return (
      <Link
        key={lesson.id}
        href={`/dashboard/courses/${courseId}/lessons/${lesson.id}`}
        className={`block p-4 rounded-lg border transition-colors ${
          lesson.id === currentLessonId
            ? "border-primary bg-primary/5"
            : "border-border hover:bg-muted"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex-shrink-0">
              {isCompleted ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <div className="font-medium">{lesson.title}</div>
              {lesson.description && (
                <div className="text-sm text-muted-foreground line-clamp-1">
                  {lesson.description}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground ml-4">
            <Clock className="h-4 w-4" />
            <span>
              {Math.floor(lesson.duration / 60)}:
              {String(lesson.duration % 60).padStart(2, "0")}
            </span>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />

      <div className="container mx-auto max-w-7xl px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/dashboard">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
              <p className="text-muted-foreground">{course.instructor_name}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground mb-1">Course Progress</div>
              <div className="text-2xl font-bold">{overallProgress}%</div>
            </div>
          </div>
          <Progress value={overallProgress} className="mt-4" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Course Content */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Course Content</CardTitle>
                <CardDescription>
                  {completedLessons} of {totalLessons} lessons completed
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Chapters with lessons */}
                {chaptersWithLessons.length > 0 ? (
                  <div className="space-y-6">
                    {chaptersWithLessons.map((chapter, chapterIndex) => {
                      const chapterLessons = chapter.lessons as Lesson[]
                      const completedInChapter = chapterLessons.filter(
                        (l) => progressMap.get(l.id)?.completed
                      ).length

                      return (
                        <div key={chapter.id} className="space-y-3">
                          {/* Chapter Header */}
                          <div className="flex items-center gap-3 py-2 border-b border-border">
                            <div className="flex items-center justify-center w-7 h-7 rounded-md bg-secondary text-xs font-bold">
                              {chapterIndex + 1}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold">{chapter.title}</h3>
                              {chapter.description && (
                                <p className="text-sm text-muted-foreground">{chapter.description}</p>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {completedInChapter}/{chapterLessons.length}
                            </div>
                          </div>

                          {/* Chapter Lessons */}
                          <div className="space-y-2 pl-4">
                            {chapterLessons.length > 0 ? (
                              chapterLessons.map((lesson) => renderLesson(lesson))
                            ) : (
                              <p className="text-sm text-muted-foreground py-4 text-center">
                                No lessons in this chapter yet
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : unassignedLessons.length > 0 ? (
                  // Legacy: Show lessons without chapters
                  <div className="space-y-2">
                    {unassignedLessons.map((lesson) => renderLesson(lesson))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <FolderOpen className="h-10 w-10 mx-auto mb-4 opacity-50" />
                    <p>No lessons available yet</p>
                    <p className="text-sm">The instructor is preparing the content</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Course Info Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle>About this course</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground whitespace-pre-line">{course.description}</p>
                <div className="pt-4 border-t space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Chapters</span>
                    <span className="font-medium">{chaptersWithLessons.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Lessons</span>
                    <span className="font-medium">{totalLessons}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Completed</span>
                    <span className="font-medium">{completedLessons}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Duration</span>
                    <span className="font-medium">{formattedTotalDuration}</span>
                  </div>
                  {course.category && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Category</span>
                      <span className="font-medium">{course.category}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
