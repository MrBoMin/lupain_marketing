"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, KeyRound } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { BRAND_NAME } from "@/lib/brand"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [hasSession, setHasSession] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      setHasSession(Boolean(session))
      setCheckingSession(false)
    }

    checkSession()
  }, [])

  const handlePasswordUpdate = async (event: React.FormEvent) => {
    event.preventDefault()

    if (password !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password })

      if (error) {
        toast.error(error.message)
        return
      }

      toast.success("Password updated. Please sign in again.")
      await supabase.auth.signOut()
      window.location.href = "/login"
    } catch (error) {
      toast.error("Failed to update password")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:flex lg:w-1/2 bg-secondary items-center justify-center p-12 border-r border-border">
        <div className="max-w-md">
          <img src="/logo.png" alt={BRAND_NAME} className="w-14 h-14 rounded-xl object-cover mb-8" />
          <h1 className="text-4xl font-bold mb-4 leading-tight">Create a new password</h1>
          <p className="text-muted-foreground text-lg">
            Choose a strong password to protect your learning account.
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

            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <KeyRound className="h-7 w-7 text-primary" />
            </div>

            <h2 className="text-3xl font-bold mb-2">Set new password</h2>
            <p className="text-muted-foreground">
              Enter and confirm your new password.
            </p>
          </div>

          {checkingSession ? (
            <div className="text-sm text-muted-foreground">Checking reset link...</div>
          ) : hasSession ? (
            <form onSubmit={handlePasswordUpdate} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  New password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirm password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  className="h-12"
                />
              </div>

              <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
                {loading ? "Updating..." : "Update password"}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-secondary/40 p-4 text-sm text-muted-foreground">
                This reset link is invalid or has expired. Please request a new password reset email.
              </div>
              <Button asChild className="w-full h-12 text-base">
                <Link href="/forgot-password">Request new reset link</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
