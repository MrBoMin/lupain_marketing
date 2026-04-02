"use client"

import { useEffect, useRef, useState } from "react"
import Player from "@vimeo/player"

interface VimeoPlayerProps {
  videoId: string
  onTimeUpdate?: (seconds: number) => void
  onEnded?: () => void
  startTime?: number
}

export function VimeoPlayer({ videoId, onTimeUpdate, onEnded, startTime = 0 }: VimeoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<Player | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Clear previous content
    containerRef.current.innerHTML = ""
    setIsReady(false)
    setError(null)

    // Validate video ID
    const numericId = Number(videoId)
    if (isNaN(numericId) || numericId <= 0) {
      setError("Invalid video ID")
      return
    }

    try {
      // Initialize Vimeo player
      const player = new Player(containerRef.current, {
        id: numericId,
        responsive: true,
        autopause: true,
        dnt: true, // Do not track
      })

      playerRef.current = player

      // Handle ready event
      player.ready().then(() => {
        setIsReady(true)
        // Set start time if provided
        if (startTime > 0) {
          player.setCurrentTime(startTime).catch((err) => {
            console.error("Error setting start time:", err)
          })
        }
      }).catch((err) => {
        console.error("Player ready error:", err)
        setError("Failed to load video. Please check the video ID.")
      })

      // Handle time update
      player.on("timeupdate", (data) => {
        if (onTimeUpdate) {
          onTimeUpdate(data.seconds)
        }
      })

      // Handle video ended
      player.on("ended", () => {
        if (onEnded) {
          onEnded()
        }
      })

      // Handle errors
      player.on("error", (err) => {
        console.error("Vimeo player error:", err)
        setError("Video playback error")
      })

      // Cleanup
      return () => {
        player.destroy()
      }
    } catch (err) {
      console.error("Error creating player:", err)
      setError("Failed to initialize video player")
    }
  }, [videoId, startTime, onTimeUpdate, onEnded])

  if (error) {
    return (
      <div className="relative w-full bg-black rounded-lg overflow-hidden" style={{ paddingBottom: "56.25%" }}>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
          <svg className="w-12 h-12 mb-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-gray-400">{error}</p>
          <p className="text-xs text-gray-500 mt-2">Video ID: {videoId}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full">
      {/* Responsive container - Vimeo will inject iframe here */}
      <div 
        ref={containerRef} 
        className="w-full bg-black rounded-lg overflow-hidden"
        style={{ minHeight: "300px" }}
      />
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black rounded-lg" style={{ minHeight: "300px" }}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      )}
    </div>
  )
}
