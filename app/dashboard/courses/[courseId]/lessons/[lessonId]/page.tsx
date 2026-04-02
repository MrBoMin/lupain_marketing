import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/app/actions/auth"
import { Navbar } from "@/components/navbar"
import { LessonPlayer } from "@/components/lesson-player"

export default async function LessonPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>
}) {
  const { courseId, lessonId } = await params
  const user = await getUser()

  if (!user) {
    redirect("/login")
  }

  const supabase = await createClient()

  // Check enrollment is approved
  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("*")
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .single()

  if (!enrollment || enrollment.status !== "approved") {
    redirect(`/courses/${courseId}`)
  }

  // Get course
  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("id", courseId)
    .single()

  if (!course) {
    notFound()
  }

  // Get current lesson
  const { data: lesson } = await supabase
    .from("lessons")
    .select("*")
    .eq("id", lessonId)
    .eq("course_id", courseId)
    .single()

  if (!lesson) {
    notFound()
  }

  // Get all chapters
  const { data: chapters } = await supabase
    .from("chapters")
    .select("*")
    .eq("course_id", courseId)
    .order("order", { ascending: true })

  // Get all lessons for navigation
  const { data: allLessons } = await supabase
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

  // Get current lesson progress
  const currentProgress = progressMap.get(lessonId)

  // Find previous and next lessons (considering all lessons in order)
  const sortedLessons = allLessons || []
  const currentIndex = sortedLessons.findIndex((l) => l.id === lessonId)
  const previousLesson = currentIndex > 0 ? sortedLessons[currentIndex - 1] : null
  const nextLesson = currentIndex < sortedLessons.length - 1 ? sortedLessons[currentIndex + 1] : null

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />

      <LessonPlayer
        user={user}
        course={course}
        lesson={lesson}
        chapters={chapters || []}
        allLessons={allLessons || []}
        progressData={progressData || []}
        currentProgress={currentProgress}
        previousLesson={previousLesson}
        nextLesson={nextLesson}
      />
    </div>
  )
}
