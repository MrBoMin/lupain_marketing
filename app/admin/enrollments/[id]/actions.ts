"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { sendEmail, getEnrollmentApprovedEmail, getEnrollmentRejectedEmail } from "@/lib/email"

type EnrollmentRelation<T> = T | T[] | null

type EnrollmentForNotification = {
  users: EnrollmentRelation<{
    email: string | null
    full_name: string | null
  }>
  courses: EnrollmentRelation<{
    title: string | null
  }>
}

function firstRelation<T>(relation: EnrollmentRelation<T>) {
  return Array.isArray(relation) ? relation[0] : relation
}

export async function updateEnrollmentStatus(
  enrollmentId: string,
  status: "approved" | "rejected",
  adminNote?: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") {
    return { error: "Not authorized" }
  }

  const adminSupabase = createAdminClient()

  // Get enrollment details with user and course info. Use the admin client after
  // verifying the current user is an admin so RLS policy drift cannot block review.
  const { data: enrollment, error: enrollmentError } = await adminSupabase
    .from("enrollments")
    .select(`
      users:user_id (email, full_name),
      courses:course_id (title)
    `)
    .eq("id", enrollmentId)
    .single<EnrollmentForNotification>()

  if (enrollmentError || !enrollment) {
    return { error: "Enrollment not found" }
  }

  // Update enrollment status
  const { error } = await adminSupabase
    .from("enrollments")
    .update({
      status,
      admin_note: adminNote || null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .eq("id", enrollmentId)

  if (error) {
    return { error: error.message }
  }

  // Send email notification
  const student = firstRelation(enrollment.users)
  const course = firstRelation(enrollment.courses)
  const studentEmail = student?.email
  const studentName = student?.full_name || "Student"
  const courseName = course?.title || "Course"

  if (studentEmail) {
    try {
      if (status === "approved") {
        const emailContent = getEnrollmentApprovedEmail(studentName, courseName)
        await sendEmail({
          to: studentEmail,
          subject: emailContent.subject,
          html: emailContent.html,
        })
      } else if (status === "rejected") {
        const emailContent = getEnrollmentRejectedEmail(studentName, courseName, adminNote)
        await sendEmail({
          to: studentEmail,
          subject: emailContent.subject,
          html: emailContent.html,
        })
      }
    } catch (emailError) {
      console.error("Failed to send email notification:", emailError)
      // Don't fail the whole operation if email fails
    }
  }

  // Revalidate the enrollments list page
  revalidatePath("/admin/enrollments")
  revalidatePath(`/admin/enrollments/${enrollmentId}`)
  
  return { success: true }
}
