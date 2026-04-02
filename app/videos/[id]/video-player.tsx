"use client"

import { useEffect, useRef, useState } from "react"
import { VimeoPlayer } from "@/components/vimeo-player"
import { createClient } from "@/lib/supabase/client"

interface VideoPlayerWithTrackingProps {
  videoId: string
  vimeoVideoId: string
  userId?: string
}

export function VideoPlayerWithTracking({
  videoId,
  vimeoVideoId,
  userId,
}: VideoPlayerWithTrackingProps) {
  const [hasRecordedView, setHasRecordedView] = useState(false)
  const watchDurationRef = useRef(0)
  const viewIdRef = useRef<string | null>(null)

  // Record view when video starts playing (after 5 seconds of watch time)
  const handleTimeUpdate = async (seconds: number) => {
    watchDurationRef.current = Math.floor(seconds)

    // Record view after 5 seconds of watch time
    if (!hasRecordedView && seconds >= 5) {
      setHasRecordedView(true)
      await recordView()
    }
  }

  const recordView = async () => {
    try {
      const supabase = createClient()
      
      // Generate a simple hash for anonymous tracking (based on current session)
      const ipHash = `anon_${Date.now()}_${Math.random().toString(36).substring(7)}`
      
      const { data, error } = await supabase
        .from("video_views")
        .insert({
          video_id: videoId,
          user_id: userId || null,
          ip_hash: userId ? null : ipHash,
          watch_duration: watchDurationRef.current,
          completed: false,
        })
        .select()
        .single()

      if (error) {
        console.error("Error recording view:", error)
      } else if (data) {
        viewIdRef.current = data.id
      }
    } catch (error) {
      console.error("Error recording view:", error)
    }
  }

  const handleEnded = async () => {
    // Update the view record to mark as completed
    if (viewIdRef.current) {
      try {
        const supabase = createClient()
        await supabase
          .from("video_views")
          .update({
            watch_duration: watchDurationRef.current,
            completed: true,
          })
          .eq("id", viewIdRef.current)
      } catch (error) {
        console.error("Error updating view completion:", error)
      }
    }
  }

  // Update watch duration periodically (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(async () => {
      if (viewIdRef.current && watchDurationRef.current > 0) {
        try {
          const supabase = createClient()
          await supabase
            .from("video_views")
            .update({
              watch_duration: watchDurationRef.current,
            })
            .eq("id", viewIdRef.current)
        } catch (error) {
          console.error("Error updating watch duration:", error)
        }
      }
    }, 30000) // Every 30 seconds

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
      <VimeoPlayer
        videoId={vimeoVideoId}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
      />
    </div>
  )
}
