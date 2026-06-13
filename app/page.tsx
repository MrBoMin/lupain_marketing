import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/app/actions/auth"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Clock, BookOpen, ArrowRight, Play, Timer, Eye } from "lucide-react"
import { BRAND_NAME } from "@/lib/brand"

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

// Helper to format duration from seconds
const formatDuration = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes} min`
}

const calculateDaysLeft = (deadline: string | null) => {
  if (!deadline) return null
  const diff = +new Date(deadline) - +new Date()
  if (diff <= 0) return null
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
  return days
}

// Helper for video duration
const formatVideoDuration = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

const formatViews = (views: number) => {
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`
  if (views >= 1000) return `${(views / 1000).toFixed(1)}K`
  return `${views}`
}

export default async function HomePage() {
  const supabase = await createClient()

  const userPromise = getUser()
  const coursesPromise = supabase
    .from("courses")
    .select(`
      id,
      title,
      description,
      thumbnail_url,
      instructor_name,
      category,
      promo_tag,
      promo_deadline,
      price,
      original_price,
      currency,
      created_at,
      lessons:lessons(duration)
    `)
    .eq("published", true)
    .order("created_at", { ascending: false })

  const featuredVideosPromise = supabase
    .from("free_videos")
    .select("id, title, thumbnail_url, duration, view_count, order_index")
    .eq("published", true)
    .eq("is_featured", true)
    .order("order_index", { ascending: true })
    .limit(3)

  const [user, { data: courses }, { data: featuredVideos }] = await Promise.all([
    userPromise,
    coursesPromise,
    featuredVideosPromise,
  ])

  // Calculate total duration for each course from lessons
  const coursesWithDuration = courses?.map(course => {
    const totalSeconds = course.lessons?.reduce((acc: number, lesson: { duration: number }) => acc + (lesson.duration || 0), 0) || 0
    return {
      ...course,
      calculatedDuration: formatDuration(totalSeconds),
      daysLeft: calculateDaysLeft(course.promo_deadline),
      promoLabel: course.promo_tag ? getPromoLabel(course.promo_tag) : null,
    }
  })

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />

      {/* Hero Section */}
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-sm">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-foreground/70">New courses available</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1]">
              Learn marketing.
              <br />
              <span className="text-primary">Grow your business.</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Learn through hands-on video courses at your own pace with practical, expert-led content.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              {user ? (
                <Button size="lg" asChild className="h-12 px-8 text-base">
                  <Link href="/dashboard">
                    Continue Learning
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button size="lg" asChild className="h-12 px-8 text-base">
                    <Link href="/signup">
                      Start Learning — It&apos;s Free
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild className="h-12 px-8 text-base">
                    <Link href="/login">Sign In</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Videos Section */}
      {featuredVideos && featuredVideos.length > 0 && (
        <section className="py-16 px-6 border-t border-border bg-secondary/30">
          <div className="container mx-auto max-w-6xl">
            <div className="flex items-center justify-between mb-10">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-background text-xs mb-4">
                  <Play className="h-3 w-3" />
                  <span className="text-muted-foreground">Watch & Learn</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2">Tutorials</h2>
                <p className="text-muted-foreground">
                  Quick tips to boost your skills
                </p>
              </div>
              <Button variant="outline" asChild>
                <Link href="/videos" className="gap-2">
                  View All
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredVideos.map((video) => (
                <Link
                  key={video.id}
                  href={`/videos/${video.id}`}
                  className="group block"
                >
                  <article className="border border-border rounded-xl overflow-hidden bg-card hover:border-foreground/20 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgb(255,255,255,0.02)]">
                    <div className="aspect-video relative bg-secondary overflow-hidden">
                      {video.thumbnail_url ? (
                        <Image
                          src={video.thumbnail_url}
                          alt={video.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full bg-gradient-to-br from-secondary to-secondary/50">
                          <div className="w-14 h-14 rounded-full bg-foreground/10 flex items-center justify-center group-hover:bg-foreground/20 transition-colors">
                            <Play className="h-6 w-6 text-muted-foreground ml-1" />
                          </div>
                        </div>
                      )}
                      
                      {/* Duration Badge */}
                      <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-medium px-2 py-1 rounded">
                        {formatVideoDuration(video.duration)}
                      </div>

                      {/* Play Overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                          <Play className="h-5 w-5 text-black ml-0.5" fill="black" />
                        </div>
                      </div>
                    </div>

                    <div className="p-4 space-y-2">
                      <h3 className="font-semibold line-clamp-2 group-hover:text-foreground/80 transition-colors">
                        {video.title}
                      </h3>

                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Eye className="h-3.5 w-3.5" />
                        <span>{formatViews(video.view_count)} views</span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Courses Section */}
      <section className="py-20 px-6 border-t border-border">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Explore Courses</h2>
            <p className="text-lg text-muted-foreground">
              Start your journey with our curated collection
            </p>
          </div>

          {coursesWithDuration && coursesWithDuration.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {coursesWithDuration.map((course) => (
                <Link
                  key={course.id}
                  href={`/courses/${course.id}`}
                  className="group block"
                >
                  <article className="border border-border rounded-xl overflow-hidden bg-card hover:border-foreground/20 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgb(255,255,255,0.02)]">
                    <div className="aspect-[16/10] relative bg-secondary overflow-hidden">
                      {course.thumbnail_url ? (
                        <Image
                          src={course.thumbnail_url}
                          alt={course.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <div className="w-16 h-16 rounded-full bg-foreground/5 flex items-center justify-center group-hover:bg-foreground/10 transition-colors">
                            <Play className="h-6 w-6 text-muted-foreground ml-1" />
                          </div>
                        </div>
                      )}
                      {/* Promo Tag Badge */}
                      {course.promoLabel && (
                        <div className="absolute top-3 left-3">
                          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg ${course.promoLabel.style}`}>
                            {course.promoLabel.text}
                          </span>
                        </div>
                      )}

                      {/* Deadline Badge */}
                      {course.daysLeft && (
                        <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md text-white text-xs font-medium px-2.5 py-1 rounded-md flex items-center gap-1.5 border border-white/10">
                          <Timer className="h-3.5 w-3.5 text-amber-400" />
                          <span>
                            {course.daysLeft} days left
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-6 space-y-4">
                      <div className="flex items-center gap-3">
                        {course.category && (
                          <span className="px-3 py-1 rounded-full bg-secondary text-xs font-medium">
                            {course.category}
                          </span>
                        )}
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          {course.calculatedDuration}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold mb-2 group-hover:text-foreground/80 transition-colors line-clamp-1">
                          {course.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                          {course.description}
                        </p>
                      </div>

                      {/* Price */}
                      {course.price === 0 ? (
                        <div className="pt-2">
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full text-sm font-bold">
                            🎉 FREE
                          </span>
                        </div>
                      ) : course.price > 0 && (
                        <div className="pt-2 flex items-center gap-2">
                          <span className="text-lg font-bold">
                            {formatPrice(course.price, course.currency)}
                          </span>
                          {course.original_price && course.original_price > course.price && (
                            <span className="text-sm text-muted-foreground line-through">
                              {formatPrice(course.original_price, course.currency)}
                            </span>
                          )}
                          {course.original_price && course.original_price > course.price && (
                            <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                              {Math.round((1 - course.price / course.original_price) * 100)}% OFF
                            </span>
                          )}
                        </div>
                      )}

                      <div className="pt-2 flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          {course.instructor_name}
                        </span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 border border-dashed border-border rounded-xl">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-6">
                <BookOpen className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No courses available yet</h3>
              <p className="text-muted-foreground">Check back soon for new courses!</p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt={BRAND_NAME} width={28} height={28} className="w-7 h-7 rounded-md object-cover" />
              <span className="text-sm text-muted-foreground">{BRAND_NAME}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} {BRAND_NAME}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
