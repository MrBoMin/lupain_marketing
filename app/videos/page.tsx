import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/app/actions/auth"
import { Navbar } from "@/components/navbar"
import { Clock, Play, Eye, ArrowRight } from "lucide-react"

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

export default async function VideosPage() {
  const user = await getUser()
  const supabase = await createClient()

  const { data: videos } = await supabase
    .from("free_videos")
    .select("*")
    .eq("published", true)
    .order("order_index", { ascending: true })

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />

      {/* Header */}
      <section className="py-16 px-6 border-b border-border">
        <div className="container mx-auto max-w-6xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-secondary/50 text-sm mb-6">
            <Play className="h-3.5 w-3.5" />
            <span className="text-muted-foreground">Watch & Learn</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Tutorials</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Quick tips and tutorials to level up your marketing skills.
          </p>
        </div>
      </section>

      {/* Videos Grid */}
      <section className="py-12 px-6">
        <div className="container mx-auto max-w-6xl">
          {videos && videos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((video) => (
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
                          <div className="w-16 h-16 rounded-full bg-foreground/10 flex items-center justify-center group-hover:bg-foreground/20 transition-colors">
                            <Play className="h-7 w-7 text-muted-foreground ml-1" />
                          </div>
                        </div>
                      )}
                      
                      {/* Duration Badge */}
                      <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-medium px-2 py-1 rounded">
                        {formatDuration(video.duration)}
                      </div>

                      {/* Play Overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center">
                          <Play className="h-6 w-6 text-black ml-1" fill="black" />
                        </div>
                      </div>
                    </div>

                    <div className="p-4 space-y-2">
                      <h3 className="font-semibold line-clamp-2 group-hover:text-foreground/80 transition-colors">
                        {video.title}
                      </h3>
                      
                      {video.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {video.description}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3.5 w-3.5" />
                          {formatViews(video.view_count)}
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 border border-dashed border-border rounded-xl">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-6">
                <Play className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Coming soon</h3>
              <p className="text-muted-foreground">New tutorials are on the way!</p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
                <span className="text-primary-foreground text-[10px] font-bold">LP</span>
              </div>
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
