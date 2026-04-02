import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/app/actions/auth"
import { Navbar } from "@/components/navbar"
import { VideosClient } from "./videos-client"
import { ArrowLeft, Plus } from "lucide-react"

export default async function AdminVideosPage() {
  const user = await getUser()

  if (!user || user.role !== "admin") {
    redirect("/dashboard")
  }

  const supabase = await createClient()

  // Fetch all free videos with view stats
  const { data: videos } = await supabase
    .from("free_videos")
    .select("*")
    .order("order_index", { ascending: true })

  // Get total views across all videos
  const totalViews = videos?.reduce((acc, video) => acc + (video.view_count || 0), 0) || 0

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />

      <div className="container mx-auto max-w-6xl px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Admin
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Free Videos</h1>
              <p className="text-muted-foreground">
                Manage your free video content • {videos?.length || 0} videos • {totalViews.toLocaleString()} total views
              </p>
            </div>
          </div>
        </div>

        {/* Videos Management */}
        <VideosClient initialVideos={videos || []} />
      </div>
    </div>
  )
}
