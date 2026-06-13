"use server"

import { getUser } from "@/app/actions/auth"
import { createAdminClient } from "@/lib/supabase/admin"

interface ChapterInput {
  course_id: string
  title: string
  description: string | null
  order?: number
}

interface LessonInput {
  course_id: string
  chapter_id: string
  title: string
  description: string | null
  lesson_type: "video" | "pdf"
  vimeo_video_id: string | null
  pdf_file_url: string | null
  pdf_file_name: string | null
  duration: number
  order?: number
}

async function requireAdmin() {
  const user = await getUser()
  if (!user || user.role !== "admin") {
    return { error: "You are not authorized to manage course content." }
  }

  return { user }
}

export async function createChapter(input: ChapterInput) {
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error }

  const supabase = createAdminClient()
  const { error } = await supabase.from("chapters").insert(input)

  if (error) return { error: error.message }
  return { success: true }
}

export async function getCourseContent(courseId: string) {
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error }

  const supabase = createAdminClient()

  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("title")
    .eq("id", courseId)
    .single()

  if (courseError) return { error: courseError.message }

  const { data: chapters, error: chaptersError } = await supabase
    .from("chapters")
    .select("*")
    .eq("course_id", courseId)
    .order("order", { ascending: true })

  if (chaptersError) return { error: chaptersError.message }

  const { data: lessons, error: lessonsError } = await supabase
    .from("lessons")
    .select("*")
    .eq("course_id", courseId)
    .order("order", { ascending: true })

  if (lessonsError) return { error: lessonsError.message }

  return {
    course,
    chapters: chapters || [],
    lessons: lessons || [],
  }
}

export async function updateChapter(chapterId: string, input: Pick<ChapterInput, "title" | "description">) {
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error }

  const supabase = createAdminClient()
  const { error } = await supabase.from("chapters").update(input).eq("id", chapterId)

  if (error) return { error: error.message }
  return { success: true }
}

export async function deleteChapter(chapterId: string) {
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error }

  const supabase = createAdminClient()
  const { error } = await supabase.from("chapters").delete().eq("id", chapterId)

  if (error) return { error: error.message }
  return { success: true }
}

export async function createLesson(input: LessonInput) {
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error }

  const supabase = createAdminClient()
  const { error } = await supabase.from("lessons").insert(input)

  if (error) return { error: error.message }
  return { success: true }
}

export async function updateLesson(lessonId: string, input: Omit<LessonInput, "course_id" | "chapter_id" | "order">) {
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error }

  const supabase = createAdminClient()
  const { error } = await supabase.from("lessons").update(input).eq("id", lessonId)

  if (error) return { error: error.message }
  return { success: true }
}

export async function deleteLesson(lessonId: string) {
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error }

  const supabase = createAdminClient()
  const { error } = await supabase.from("lessons").delete().eq("id", lessonId)

  if (error) return { error: error.message }
  return { success: true }
}

export async function moveLesson(lessonId: string, chapterId: string, order: number) {
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from("lessons")
    .update({ chapter_id: chapterId, order })
    .eq("id", lessonId)

  if (error) return { error: error.message }
  return { success: true }
}
