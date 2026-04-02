import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/app/actions/auth"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Clock, BookOpen, CheckCircle2, PlayCircle, Loader2, AlertCircle, Sparkles } from "lucide-react"
import { CourseContentPreview } from "@/components/course-content-preview"
import { PromotionBanner } from "@/components/promotion-banner"

interface Chapter {
  id: string
  title: string
  description: string | null
  order: number
}

interface Lesson {
  id: string
  chapter_id: string | null
  title: string
  description: string | null
  duration: number
  order: number
  vimeo_video_id: string
}

const formatPrice = (price: number, currency: string = 'MMK') => {
  return new Intl.NumberFormat('en-US').format(price) + ' ' + currency
}

const getPromoLabel = (tag: string) => {
  const labels: Record<string, { text: string; style: string }> = {
    launch: { text: '🚀 Launch Special', style: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white' },
    discount: { text: '🔥 Discount', style: 'bg-gradient-to-r from-red-500 to-pink-500 text-white' },
    new: { text: '✨ New', style: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' },
    popular: { text: '⭐ Popular', style: 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white' },
    bestseller: { text: '🏆 Bestseller', style: 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white' },
  }
  return labels[tag] || { text: tag, style: 'bg-secondary' }
}

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getUser()
  const supabase = await createClient()

  // Get course details
  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("id", id)
    .single()

  if (!course) {
    notFound()
  }

  // Get lessons for this course
  const { data: lessons } = await supabase
    .from("lessons")
    .select("*")
    .eq("course_id", id)
    .eq("course_id", id)
    .order("order", { ascending: true })

  // Get all chapters
  const { data: chapters } = await supabase
    .from("chapters")
    .select("*")
    .eq("course_id", id)
    .order("order", { ascending: true })

  // Group lessons by chapter
  const chaptersWithLessons = (chapters || []).map((chapter: Chapter) => ({
    ...chapter,
    lessons: (lessons || []).filter((l: Lesson) => l.chapter_id === chapter.id),
  }))

  // Lessons without chapters (legacy support)
  const unassignedLessons = (lessons || []).filter((l: Lesson) => !l.chapter_id)

  // Calculate total duration from all lesson videos (in seconds)
  const totalDurationSeconds = lessons?.reduce((acc, lesson) => acc + (lesson.duration || 0), 0) || 0
  const totalHours = Math.floor(totalDurationSeconds / 3600)
  const totalMinutes = Math.floor((totalDurationSeconds % 3600) / 60)
  const formattedTotalDuration = totalHours > 0
    ? `${totalHours}h ${totalMinutes}m`
    : `${totalMinutes} min`

  // Check enrollment status
  let enrollment: any = null
  if (user) {
    const { data } = await supabase
      .from("enrollments")
      .select("*")
      .eq("user_id", user.id)
      .eq("course_id", id)
      .single()

    enrollment = data
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      <PromotionBanner
        deadline={course.promo_deadline}
        promoTag={course.promo_tag}
      />

      <div className="container mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Hero Image */}
            <div className="aspect-video relative bg-secondary rounded-xl overflow-hidden">
              {course.thumbnail_url ? (
                <Image
                  src={course.thumbnail_url}
                  alt={course.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="w-20 h-20 rounded-full bg-foreground/5 flex items-center justify-center">
                    <BookOpen className="h-8 w-8 text-muted-foreground" />
                  </div>
                </div>
              )}
              {/* Promo Tag */}
              {course.promo_tag && (
                <div className="absolute top-4 left-4">
                  <span className={`px-4 py-2 rounded-full text-sm font-semibold shadow-lg ${getPromoLabel(course.promo_tag).style}`}>
                    {getPromoLabel(course.promo_tag).text}
                  </span>
                </div>
              )}
            </div>

            {/* Course Info */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                {course.category && (
                  <span className="px-3 py-1 rounded-full bg-secondary text-sm font-medium">
                    {course.category}
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {formattedTotalDuration}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-3">{course.title}</h1>
              <p className="text-muted-foreground">by {course.instructor_name}</p>
            </div>

            {/* Description */}
            <div>
              <h2 className="text-xl font-semibold mb-3">About this course</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{course.description}</p>
            </div>

            {/* Lessons */}
            <div>
              <h2 className="text-xl font-semibold mb-4">
                Course Content
                <span className="text-muted-foreground font-normal ml-2">
                  ({lessons?.length || 0} lessons)
                </span>
              </h2>

              <div className="space-y-4">
                <CourseContentPreview
                  chapters={chaptersWithLessons}
                  unassignedLessons={unassignedLessons}
                />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="border border-border rounded-xl p-6 sticky top-24 space-y-6">
              {/* Pricing */}
              {course.price === 0 ? (
                <div className="pb-6 border-b border-border">
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full text-lg font-bold">
                    🎉 FREE Course
                  </span>
                  <p className="text-sm text-muted-foreground mt-2">
                    Enroll for free and start learning today!
                  </p>
                </div>
              ) : course.price > 0 && (
                <div className="pb-6 border-b border-border">
                  <div className="flex items-baseline gap-3 mb-2">
                    <span className="text-3xl font-bold">
                      {formatPrice(course.price, course.currency)}
                    </span>
                    {course.original_price && course.original_price > course.price && (
                      <span className="text-lg text-muted-foreground line-through">
                        {formatPrice(course.original_price, course.currency)}
                      </span>
                    )}
                  </div>
                  {course.original_price && course.original_price > course.price && (
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded bg-green-500/10 text-green-600 dark:text-green-400 text-sm font-semibold">
                        {Math.round((1 - course.price / course.original_price) * 100)}% OFF
                      </span>
                      {course.promo_tag === 'launch' && (
                        <span className="text-sm text-muted-foreground">Limited time offer!</span>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div>
                <h3 className="font-semibold mb-4">Course Details</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Lessons</span>
                    <span className="font-medium">{lessons?.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="font-medium">{formattedTotalDuration}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Instructor</span>
                    <span className="font-medium">{course.instructor_name}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-6">
                {enrollment ? (
                  <>
                    {enrollment.status === "approved" && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm text-foreground">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>You're enrolled</span>
                        </div>
                        <Button className="w-full" asChild>
                          <Link href={`/dashboard/courses/${id}`}>
                            <PlayCircle className="mr-2 h-4 w-4" />
                            Continue Learning
                          </Link>
                        </Button>
                      </div>
                    )}
                    {enrollment.status === "pending" && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Enrollment pending approval</span>
                        </div>
                        <Button className="w-full" variant="outline" asChild>
                          <Link href={`/courses/${id}/enroll`}>View Status</Link>
                        </Button>
                      </div>
                    )}
                    {enrollment.status === "rejected" && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm text-destructive">
                          <AlertCircle className="h-4 w-4" />
                          <span>Enrollment rejected</span>
                        </div>
                        <Button className="w-full" variant="outline" asChild>
                          <Link href={`/courses/${id}/enroll`}>View Details</Link>
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <Button className="w-full" asChild>
                    <Link href={user ? `/courses/${id}/enroll` : "/login"}>
                      {user ? "Enroll Now" : "Sign in to Enroll"}
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
