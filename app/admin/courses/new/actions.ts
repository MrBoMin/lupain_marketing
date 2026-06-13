"use server"

import { getUser } from "@/app/actions/auth"
import { createAdminClient } from "@/lib/supabase/admin"

interface CreateCourseInput {
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
}

export async function createCourse(input: CreateCourseInput) {
  const user = await getUser()

  if (!user || user.role !== "admin") {
    return { error: "You are not authorized to create courses." }
  }

  const supabase = createAdminClient()
  const { data: course, error } = await supabase
    .from("courses")
    .insert(input)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  return { course }
}

export async function updateCourseThumbnail(courseId: string, thumbnailUrl: string) {
  const user = await getUser()

  if (!user || user.role !== "admin") {
    return { error: "You are not authorized to update courses." }
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from("courses")
    .update({ thumbnail_url: thumbnailUrl })
    .eq("id", courseId)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}
