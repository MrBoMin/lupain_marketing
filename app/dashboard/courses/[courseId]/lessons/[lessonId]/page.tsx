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
    .select("id, status")
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .single()

  if (!enrollment || enrollment.status !== "approved") {
    redirect(`/courses/${courseId}`)
  }

  const [
    { data: course },
    { data: chapters },
    { data: allLessons },
    { data: progressData },
  ] = await Promise.all([
    supabase
      .from("courses")
      .select("id, title")
      .eq("id", courseId)
      .single(),
    supabase
      .from("chapters")
      .select("id, title, description, order")
      .eq("course_id", courseId)
      .order("order", { ascending: true }),
    supabase
      .from("lessons")
      .select("id, chapter_id, title, description, lesson_type, vimeo_video_id, pdf_file_url, pdf_file_name, order, duration")
      .eq("course_id", courseId)
      .order("order", { ascending: true }),
    supabase
      .from("lesson_progress")
      .select("lesson_id, completed, last_position, last_watched_at")
      .eq("user_id", user.id)
      .eq("course_id", courseId),
  ])

  if (!course) {
    notFound()
  }

  const lesson = allLessons?.find((item) => item.id === lessonId)

  if (!lesson) {
    notFound()
  }

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
