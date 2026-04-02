"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getUser } from "./auth"
import { revalidatePath } from "next/cache"

export interface Comment {
  id: string
  lesson_id: string
  user_id: string
  parent_id: string | null
  content: string
  created_at: string
  updated_at: string
  user: {
    id: string
    full_name: string | null
    email: string
    avatar_url: string | null
    role: string
  }
  replies?: Comment[]
}

export async function getComments(lessonId: string): Promise<Comment[]> {
  // Use admin client to bypass RLS (enrollment is already verified at page level)
  const adminSupabase = createAdminClient()

  const { data: comments, error } = await adminSupabase
    .from("lesson_comments")
    .select(`
      *,
      user:users(id, full_name, email, avatar_url, role)
    `)
    .eq("lesson_id", lessonId)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("Error fetching comments:", error)
    return []
  }

  // Organize comments into threads (parent comments with replies)
  const parentComments: Comment[] = []
  const repliesMap: Map<string, Comment[]> = new Map()

  comments?.forEach((comment) => {
    if (comment.parent_id) {
      const replies = repliesMap.get(comment.parent_id) || []
      replies.push(comment as Comment)
      repliesMap.set(comment.parent_id, replies)
    } else {
      parentComments.push(comment as Comment)
    }
  })

  // Attach replies to parent comments
  parentComments.forEach((comment) => {
    comment.replies = repliesMap.get(comment.id) || []
  })

  return parentComments
}

export async function createComment(
  lessonId: string,
  courseId: string,
  content: string,
  parentId?: string
): Promise<{ success: boolean; error?: string }> {
  const user = await getUser()

  if (!user) {
    return { success: false, error: "You must be logged in to comment" }
  }

  // Use admin client to bypass RLS (enrollment already verified at page level)
  const adminSupabase = createAdminClient()

  const { error } = await adminSupabase.from("lesson_comments").insert({
    lesson_id: lessonId,
    user_id: user.id,
    content: content.trim(),
    parent_id: parentId || null,
  })

  if (error) {
    console.error("Error creating comment:", error)
    return { success: false, error: "Failed to create comment" }
  }

  revalidatePath(`/dashboard/courses/${courseId}/lessons/${lessonId}`)
  return { success: true }
}

export async function updateComment(
  commentId: string,
  courseId: string,
  lessonId: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  const user = await getUser()

  if (!user) {
    return { success: false, error: "You must be logged in" }
  }

  const supabase = await createClient()
  const adminSupabase = createAdminClient()

  // Check if user owns the comment
  const { data: comment } = await supabase
    .from("lesson_comments")
    .select("user_id")
    .eq("id", commentId)
    .single()

  if (!comment || comment.user_id !== user.id) {
    return { success: false, error: "You can only edit your own comments" }
  }

  // Use admin client to bypass RLS
  const { error } = await adminSupabase
    .from("lesson_comments")
    .update({ content: content.trim(), updated_at: new Date().toISOString() })
    .eq("id", commentId)

  if (error) {
    console.error("Error updating comment:", error)
    return { success: false, error: "Failed to update comment" }
  }

  revalidatePath(`/dashboard/courses/${courseId}/lessons/${lessonId}`)
  return { success: true }
}

export async function deleteComment(
  commentId: string,
  courseId: string,
  lessonId: string
): Promise<{ success: boolean; error?: string }> {
  const user = await getUser()

  if (!user) {
    return { success: false, error: "You must be logged in" }
  }

  const supabase = await createClient()
  const adminSupabase = createAdminClient()

  // Check if user owns the comment
  const { data: comment } = await supabase
    .from("lesson_comments")
    .select("user_id")
    .eq("id", commentId)
    .single()

  const isAdmin = user.role === "admin"
  const isOwner = comment?.user_id === user.id

  if (!comment || (!isOwner && !isAdmin)) {
    return { success: false, error: "You can only delete your own comments" }
  }

  // Use admin client to delete (bypasses RLS)
  const { error } = await adminSupabase
    .from("lesson_comments")
    .delete()
    .eq("id", commentId)

  if (error) {
    console.error("Error deleting comment:", error)
    return { success: false, error: "Failed to delete comment" }
  }

  revalidatePath(`/dashboard/courses/${courseId}/lessons/${lessonId}`)
  return { success: true }
}
