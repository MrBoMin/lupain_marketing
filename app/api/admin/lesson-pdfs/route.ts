import { NextResponse } from "next/server"
import { getUser } from "@/app/actions/auth"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  const user = await getUser()

  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 })
  }

  const formData = await request.formData()
  const courseId = formData.get("courseId")
  const file = formData.get("file")

  if (typeof courseId !== "string" || !courseId) {
    return NextResponse.json({ error: "Missing course ID" }, { status: 400 })
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing PDF file" }, { status: 400 })
  }

  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 })
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-")
  const filePath = `${courseId}/${Date.now()}-${safeName}`
  const supabase = createAdminClient()

  const { error } = await supabase.storage
    .from("lesson-pdfs")
    .upload(filePath, file, {
      contentType: "application/pdf",
      upsert: false,
    })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    filePath,
    fileName: file.name,
  })
}
