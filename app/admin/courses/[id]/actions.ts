"use server"

import { getUser } from "@/app/actions/auth"
import { createAdminClient } from "@/lib/supabase/admin"

interface UpdateCourseInput {
  title: string
  description: string
  instructor_name: string
  duration: number
  category: string | null
  thumbnail_url: string | null
  published: boolean
  price: number
  original_price: number | null
  currency: string
  promo_tag: string | null
  promo_deadline: string | null
}

async function requireAdmin() {
  const user = await getUser()
  if (!user || user.role !== "admin") {
    return { error: "You are not authorized to manage courses." }
  }

  return { user }
}

export async function getAdminCourse(courseId: string) {
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error }

  const supabase = createAdminClient()

  const { data: course, error } = await supabase
    .from("courses")
    .select("*")
    .eq("id", courseId)
    .single()

  if (error) {
    return { error: error.message }
  }

  const { data: lessons, error: lessonsError } = await supabase
    .from("lessons")
    .select("duration")
    .eq("course_id", courseId)

  if (lessonsError) {
    return { error: lessonsError.message }
  }

  return { course, lessons: lessons || [] }
}

export async function updateAdminCourse(courseId: string, input: UpdateCourseInput) {
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from("courses")
    .update(input)
    .eq("id", courseId)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function deleteAdminCourse(courseId: string) {
  const auth = await requireAdmin()
  if (auth.error) return { error: auth.error }

  const supabase = createAdminClient()
  const { error } = await supabase.from("courses").delete().eq("id", courseId)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}
