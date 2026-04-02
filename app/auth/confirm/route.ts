import { type EmailOtpType } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null
  const next = searchParams.get("next") ?? "/dashboard"
  
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || origin

  if (token_hash && type) {
    const supabase = await createClient()

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })

    if (error) {
      console.error("Error verifying OTP:", error)
      return NextResponse.redirect(
        `${baseUrl}/login?error=${encodeURIComponent(error.message)}`
      )
    }

    // Email confirmed successfully
    return NextResponse.redirect(`${baseUrl}${next}`)
  }

  // Missing parameters
  return NextResponse.redirect(
    `${baseUrl}/login?error=${encodeURIComponent("Invalid confirmation link")}`
  )
}
