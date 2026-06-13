"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { updateEnrollmentStatus } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { 
  ChevronLeft, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  BookOpen,
  Calendar,
  ImageIcon,
  ExternalLink
} from "lucide-react"

interface Enrollment {
  id: string
  user_id: string
  course_id: string
  status: string
  payment_screenshot_url: string | null
  user_note: string | null
  admin_note: string | null
  enrolled_at: string
  reviewed_at: string | null
  users: {
    id: string
    email: string
    full_name: string | null
  }
  courses: {
    id: string
    title: string
  }
}

export default function EnrollmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null)
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null)

  useEffect(() => {
    params.then((p) => {
      setEnrollmentId(p.id)
      fetchEnrollment(p.id)
    })
  }, [params])

  const fetchEnrollment = async (id: string) => {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("enrollments")
      .select(`
        *,
        users (id, email, full_name),
        courses (id, title)
      `)
      .eq("id", id)
      .single()

    if (error || !data) {
      toast.error("Enrollment not found")
      router.push("/admin/enrollments")
      return
    }

    setEnrollment(data)

    if (data.payment_screenshot_url) {
      if (data.payment_screenshot_url.startsWith("http")) {
        setScreenshotUrl(data.payment_screenshot_url)
      } else {
        const { data: signedUrlData } = await supabase.storage
          .from("payment-screenshots")
          .createSignedUrl(data.payment_screenshot_url, 60 * 60)

        setScreenshotUrl(signedUrlData?.signedUrl || null)
      }
    } else {
      setScreenshotUrl(null)
    }

    setLoading(false)
  }

  const handleApprove = async () => {
    if (!enrollmentId) return
    setProcessing(true)

    try {
      const result = await updateEnrollmentStatus(enrollmentId, "approved")
      
      if (result.error) throw new Error(result.error)

      toast.success("Enrollment approved!")
      fetchEnrollment(enrollmentId)
    } catch (error) {
      toast.error("Failed to approve enrollment")
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!enrollmentId) return
    setProcessing(true)

    try {
      const result = await updateEnrollmentStatus(enrollmentId, "rejected", rejectReason)
      
      if (result.error) throw new Error(result.error)

      toast.success("Enrollment rejected")
      fetchEnrollment(enrollmentId)
      setShowRejectForm(false)
    } catch (error) {
      toast.error("Failed to reject enrollment")
    } finally {
      setProcessing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-foreground text-background">
            <CheckCircle2 className="h-4 w-4" />
            Approved
          </span>
        )
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-destructive/10 text-destructive">
            <XCircle className="h-4 w-4" />
            Rejected
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-secondary text-muted-foreground">
            <Clock className="h-4 w-4" />
            Pending
          </span>
        )
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!enrollment) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl px-6 py-12">
        <Link
          href="/admin/enrollments"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Enrollments
        </Link>

        <div className="flex items-start justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold mb-2">Enrollment Request</h1>
            <p className="text-muted-foreground">Review and manage this enrollment</p>
          </div>
          {getStatusBadge(enrollment.status)}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {/* User Info */}
          <div className="border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <User className="h-5 w-5" />
              </div>
              <h2 className="font-semibold">Student</h2>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{enrollment.users?.full_name || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{enrollment.users?.email}</p>
              </div>
            </div>
          </div>

          {/* Course Info */}
          <div className="border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <BookOpen className="h-5 w-5" />
              </div>
              <h2 className="font-semibold">Course</h2>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Title</p>
                <p className="font-medium">{enrollment.courses?.title}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Requested</p>
                <p className="font-medium">
                  {new Date(enrollment.enrolled_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Screenshot */}
        <div className="border border-border rounded-xl p-6 mb-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
              <ImageIcon className="h-5 w-5" />
            </div>
            <h2 className="font-semibold">Payment Screenshot</h2>
          </div>

          {screenshotUrl ? (
            <div className="space-y-4">
              <div className="relative aspect-video max-w-lg bg-secondary rounded-lg overflow-hidden">
                <Image
                  src={screenshotUrl}
                  alt="Payment screenshot"
                  fill
                  className="object-contain"
                />
              </div>
              <a
                href={screenshotUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Open in new tab
              </a>
            </div>
          ) : (
            <p className="text-muted-foreground">No screenshot uploaded</p>
          )}

          {enrollment.user_note && (
            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground mb-2">Note from student:</p>
              <p className="text-sm bg-secondary/50 rounded-lg p-4">{enrollment.user_note}</p>
            </div>
          )}
        </div>

        {/* Admin Note (if rejected) */}
        {enrollment.admin_note && (
          <div className="border border-destructive/30 rounded-xl p-6 mb-10">
            <p className="text-sm text-muted-foreground mb-2">Rejection reason:</p>
            <p className="text-sm">{enrollment.admin_note}</p>
          </div>
        )}

        {/* Actions */}
        {enrollment.status === "pending" && (
          <div className="border border-border rounded-xl p-6">
            <h2 className="font-semibold mb-6">Actions</h2>

            {showRejectForm ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reason">Rejection Reason (optional)</Label>
                  <Input
                    id="reason"
                    placeholder="e.g., Payment not verified"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="destructive"
                    onClick={handleReject}
                    disabled={processing}
                    className="gap-2"
                  >
                    {processing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    Confirm Reject
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowRejectForm(false)}
                    disabled={processing}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
                <Button onClick={handleApprove} disabled={processing} className="gap-2">
                  {processing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Approve Enrollment
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowRejectForm(true)}
                  disabled={processing}
                  className="gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Reviewed Info */}
        {enrollment.reviewed_at && (
          <div className="mt-6 text-sm text-muted-foreground text-center">
            Reviewed on{" "}
            {new Date(enrollment.reviewed_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </div>
        )}
      </div>
    </div>
  )
}
