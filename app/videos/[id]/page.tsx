import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/app/actions/auth"
import { Navbar } from "@/components/navbar"
import { VideoPlayerWithTracking } from "./video-player"
import { ArrowLeft, Eye, Clock, Play } from "lucide-react"
import { Button } from "@/components/ui/button"

// Helper to format duration from seconds
const formatDuration = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

const formatViews = (views: number) => {
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M views`
  if (views >= 1000) return `${(views / 1000).toFixed(1)}K views`
  return `${views} views`
}

export default async function VideoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getUser()
  const supabase = await createClient()

  // Fetch the video
  const { data: video } = await supabase
    .from("free_videos")
    .select("*")
    .eq("id", id)
    .eq("published", true)
    .single()

  if (!video) {
    notFound()
  }

  // Fetch more videos (excluding current)
  const { data: moreVideos } = await supabase
    .from("free_videos")
    .select("*")
    .eq("published", true)
    .neq("id", id)
    .order("order_index", { ascending: true })
    .limit(6)

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />

      <div className="container mx-auto max-w-6xl px-6 py-8">
        {/* Back Link */}
        <Link
          href="/videos"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tutorials
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player */}
            <VideoPlayerWithTracking
              videoId={video.id}
              vimeoVideoId={video.vimeo_video_id}
              userId={user?.id}
            />

            {/* Video Info */}
            <div className="space-y-4">
              <h1 className="text-2xl md:text-3xl font-bold">{video.title}</h1>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Eye className="h-4 w-4" />
                  {formatViews(video.view_count)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {formatDuration(video.duration)}
                </span>
              </div>

              {video.description && (
                <div className="pt-4 border-t border-border">
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {video.description}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - More Videos */}
          <div className="space-y-4">
            <h2 className="font-semibold text-lg">More Tutorials</h2>
            
            {moreVideos && moreVideos.length > 0 ? (
              <div className="space-y-3">
                {moreVideos.map((moreVideo) => (
                  <Link
                    key={moreVideo.id}
                    href={`/videos/${moreVideo.id}`}
                    className="group flex gap-3"
                  >
                    <div className="relative w-40 aspect-video flex-shrink-0 rounded-lg overflow-hidden bg-secondary">
                      {moreVideo.thumbnail_url ? (
                        <Image
                          src={moreVideo.thumbnail_url}
                          alt={moreVideo.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Play className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
                        {formatDuration(moreVideo.duration)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm line-clamp-2 group-hover:text-foreground/80 transition-colors">
                        {moreVideo.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatViews(moreVideo.view_count)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No more tutorials available.</p>
            )}

            <Button variant="outline" className="w-full" asChild>
              <Link href="/videos">View All Tutorials</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-6 mt-12">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Luu Pain Marketing" className="w-7 h-7 rounded-md object-cover" />
              <span className="text-sm text-muted-foreground">Luu Pain Marketing</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Luu Pain Marketing
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
