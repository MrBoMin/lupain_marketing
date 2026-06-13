"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { sendEmail, getEnrollmentApprovedEmail, getEnrollmentRejectedEmail } from "@/lib/email"

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

  // Get enrollment details with user and course info
  const { data: enrollment } = await supabase
    .from("enrollments")
    .select(`
      *,
      users:user_id (email, full_name),
      courses:course_id (title)
    `)
    .eq("id", enrollmentId)
    .single()

  if (!enrollment) {
    return { error: "Enrollment not found" }
  }

  // Update enrollment status
  const { error } = await supabase
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
  const studentEmail = enrollment.users?.email
  const studentName = enrollment.users?.full_name || "Student"
  const courseName = enrollment.courses?.title || "Course"

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
  
  return { success: true }
}
