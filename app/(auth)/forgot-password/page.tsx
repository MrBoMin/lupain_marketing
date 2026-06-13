"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, MailCheck } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { BRAND_NAME } from "@/lib/brand"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleResetRequest = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      const origin = window.location.origin
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/callback?next=/reset-password`,
      })

      if (error) {
        toast.error(error.message)
        return
      }

      setSent(true)
      toast.success("Password reset email sent")
    } catch (error) {
      toast.error("Failed to send password reset email")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:flex lg:w-1/2 bg-secondary items-center justify-center p-12 border-r border-border">
        <div className="max-w-md">
          <img src="/logo.png" alt={BRAND_NAME} className="w-14 h-14 rounded-xl object-cover mb-8" />
          <h1 className="text-4xl font-bold mb-4 leading-tight">Reset your password</h1>
          <p className="text-muted-foreground text-lg">
            We will send a secure reset link to your email address.
          </p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8">
          <div>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to sign in
            </Link>

            {sent ? (
              <div className="text-center space-y-5">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <MailCheck className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold mb-2">Check your email</h2>
                  <p className="text-muted-foreground">
                    If an account exists for <span className="font-medium text-foreground">{email}</span>, a reset link has been sent.
                  </p>
                </div>
                <Button asChild className="w-full h-12 text-base">
                  <Link href="/login">Back to sign in</Link>
                </Button>
              </div>
            ) : (
              <>
                <h2 className="text-3xl font-bold mb-2">Forgot password?</h2>
                <p className="text-muted-foreground">
                  Enter your email and we will send you a reset link.
                </p>
              </>
            )}
          </div>

          {!sent && (
            <form onSubmit={handleResetRequest} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="h-12"
                />
              </div>

              <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
                {loading ? "Sending..." : "Send reset link"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
