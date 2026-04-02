"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { ChevronLeft, Upload, Copy, Check, Loader2, CreditCard, AlertCircle } from "lucide-react"

interface Course {
  id: string
  title: string
  instructor_name: string
  price: number
  original_price: number | null
  currency: string
}

export default function EnrollPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [courseId, setCourseId] = useState<string | null>(null)
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [note, setNote] = useState("")
  const [user, setUser] = useState<any>(null)
  const [existingEnrollment, setExistingEnrollment] = useState<any>(null)

  useEffect(() => {
    params.then((p) => {
      setCourseId(p.id)
      fetchData(p.id)
    })
  }, [params])

  const fetchData = async (id: string) => {
    const supabase = createClient()

    // Get current user
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      router.push("/login")
      return
    }
    setUser(authUser)

    // Check existing enrollment
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("*")
      .eq("user_id", authUser.id)
      .eq("course_id", id)
      .single()

    if (enrollment) {
      setExistingEnrollment(enrollment)
    }

    // Get course
    const { data: courseData } = await supabase
      .from("courses")
      .select("id, title, instructor_name, price, original_price, currency")
      .eq("id", id)
      .single()

    if (courseData) {
      setCourse(courseData)
    }

    setLoading(false)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB")
        return
      }
      setFile(selectedFile)
      setPreview(URL.createObjectURL(selectedFile))
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success("Copied to clipboard")
    setTimeout(() => setCopied(false), 2000)
  }

  const isFree = course?.price === 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!courseId || !user) {
      toast.error("Something went wrong")
      return
    }

    // Only require screenshot for paid courses
    if (!isFree && !file) {
      toast.error("Please upload a payment screenshot")
      return
    }

    setSubmitting(true)

    try {
      const supabase = createClient()

      let screenshotUrl = null

      // Upload screenshot only for paid courses
      if (file) {
        const fileExt = file.name.split(".").pop()
        const fileName = `${user.id}/${courseId}-${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from("payment-screenshots")
          .upload(fileName, file)

        if (uploadError) {
          throw new Error("Failed to upload screenshot")
        }

        const { data: { publicUrl } } = supabase.storage
          .from("payment-screenshots")
          .getPublicUrl(fileName)

        screenshotUrl = publicUrl
      }

      // Create enrollment request
      const { error: enrollError } = await supabase
        .from("enrollments")
        .insert({
          user_id: user.id,
          course_id: courseId,
          status: isFree ? "approved" : "pending", // Auto-approve free courses
          payment_screenshot_url: screenshotUrl,
          user_note: note || null,
        })

      if (enrollError) {
        throw new Error("Failed to submit enrollment")
      }

      if (isFree) {
        toast.success("You're enrolled! Start learning now.")
        router.push(`/dashboard/courses/${courseId}`)
      } else {
        toast.success("Enrollment request submitted!")
        router.push(`/courses/${courseId}?enrolled=pending`)
      }
    } catch (error: any) {
      toast.error(error.message || "Something went wrong")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (existingEnrollment) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto max-w-2xl px-6 py-12">
          <Link
            href={`/courses/${courseId}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Course
          </Link>

          <div className="border border-border rounded-xl p-8 text-center">
            {existingEnrollment.status === "pending" && (
              <>
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-6">
                  <Loader2 className="h-7 w-7 text-muted-foreground animate-spin" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Enrollment Pending</h1>
                <p className="text-muted-foreground mb-6">
                  Your enrollment request is being reviewed. We'll notify you once it's approved.
                </p>
              </>
            )}
            {existingEnrollment.status === "approved" && (
              <>
                <div className="w-16 h-16 rounded-full bg-foreground flex items-center justify-center mx-auto mb-6">
                  <Check className="h-7 w-7 text-background" />
                </div>
                <h1 className="text-2xl font-bold mb-2">You're Enrolled!</h1>
                <p className="text-muted-foreground mb-6">
                  You have full access to this course.
                </p>
                <Button asChild>
                  <Link href={`/dashboard/courses/${courseId}`}>Start Learning</Link>
                </Button>
              </>
            )}
            {existingEnrollment.status === "rejected" && (
              <>
                <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="h-7 w-7 text-destructive" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Enrollment Rejected</h1>
                <p className="text-muted-foreground mb-4">
                  Your enrollment request was not approved.
                </p>
                {existingEnrollment.admin_note && (
                  <div className="bg-secondary/50 rounded-lg p-4 mb-6 text-left">
                    <p className="text-sm font-medium mb-1">Reason:</p>
                    <p className="text-sm text-muted-foreground">{existingEnrollment.admin_note}</p>
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  Please contact support if you believe this is an error.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-2xl px-6 py-12">
        <Link
          href={`/courses/${courseId}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Course
        </Link>

        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-2">Enroll in Course</h1>
          <p className="text-muted-foreground">{course?.title}</p>
          {isFree ? (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full text-sm font-semibold">
              🎉 This course is FREE!
            </div>
          ) : (
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-2xl font-bold">
                {course?.price?.toLocaleString()} {course?.currency}
              </span>
              {course?.original_price && course.original_price > course.price && (
                <span className="text-muted-foreground line-through">
                  {course.original_price.toLocaleString()} {course?.currency}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Payment Information - Only show for paid courses */}
        {!isFree && (
          <div className="border border-border rounded-xl p-6 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold">Payment Information</h2>
                <p className="text-sm text-muted-foreground">Choose any payment method below</p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { name: "KBZ Pay", number: "09955214464", holder: "Bo Bo Min" },
                { name: "Wave Pay", number: "09955214464", holder: "Bo Bo Min" },
                { name: "AYA Pay", number: "09955214464", holder: "Bo Bo Min" },
                { name: "UAB Pay", number: "09955214464", holder: "Bo Bo Min" },
              ].map((method) => (
                <div
                  key={method.name}
                  className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg hover:bg-secondary/70 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-foreground/10 flex items-center justify-center font-bold text-sm">
                      {method.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{method.name}</p>
                      <p className="text-sm text-muted-foreground">{method.holder}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{method.number}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(method.number)}
                      className="h-8 w-8 p-0"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-4 bg-secondary/30 rounded-lg">
              <p className="text-sm text-muted-foreground">
                📱 After payment, take a screenshot and upload it below
              </p>
            </div>
          </div>
        )}

        {/* Upload Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Screenshot upload - only required for paid courses */}
          {!isFree && (
            <div className="border border-border rounded-xl p-6">
              <h2 className="font-semibold mb-6">Upload Payment Screenshot</h2>

              <div className="space-y-4">
                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                    preview ? "border-foreground/20" : "border-border hover:border-foreground/20"
                  }`}
                >
                  {preview ? (
                    <div className="space-y-4">
                      <img
                        src={preview}
                        alt="Payment screenshot"
                        className="max-h-64 mx-auto rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setFile(null)
                          setPreview(null)
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                        <Upload className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <p className="font-medium mb-1">Click to upload</p>
                      <p className="text-sm text-muted-foreground">PNG, JPG up to 5MB</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Note field for both free and paid */}
          <div className="border border-border rounded-xl p-6">
            <h2 className="font-semibold mb-4">{isFree ? "Enrollment Request" : "Additional Information"}</h2>
            <div className="space-y-2">
              <Label htmlFor="note">Note (optional)</Label>
              <Input
                id="note"
                placeholder={isFree ? "Tell us why you're interested in this course..." : "Any additional information..."}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>

          <Button type="submit" className="w-full h-12" disabled={submitting || (!isFree && !file)}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {isFree ? "Enrolling..." : "Submitting..."}
              </>
            ) : isFree ? (
              "Enroll Now — It's Free! 🎉"
            ) : (
              "Submit Enrollment Request"
            )}
          </Button>

          <p className="text-sm text-muted-foreground text-center">
            {isFree 
              ? "You'll get instant access to this course" 
              : "Your request will be reviewed within 24 hours"
            }
          </p>
        </form>
      </div>
    </div>
  )
}

