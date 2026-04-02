"use client"

import { useState } from "react"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import {
  Plus,
  Play,
  Eye,
  Star,
  StarOff,
  Pencil,
  Trash2,
  GripVertical,
  EyeOff,
  Loader2,
  ExternalLink,
  BarChart3,
} from "lucide-react"

interface Video {
  id: string
  title: string
  description: string | null
  vimeo_video_id: string
  thumbnail_url: string | null
  duration: number
  is_featured: boolean
  order_index: number
  published: boolean
  view_count: number
  created_at: string
}

interface VideosClientProps {
  initialVideos: Video[]
}

const formatDuration = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function VideosClient({ initialVideos }: VideosClientProps) {
  const [videos, setVideos] = useState<Video[]>(initialVideos)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingVimeo, setIsFetchingVimeo] = useState(false)
  const [editingVideo, setEditingVideo] = useState<Video | null>(null)
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    vimeo_video_id: "",
    thumbnail_url: "",
    duration: 0,
    is_featured: false,
    published: true,
  })

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      vimeo_video_id: "",
      thumbnail_url: "",
      duration: 0,
      is_featured: false,
      published: true,
    })
    setEditingVideo(null)
  }

  const openCreateDialog = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const openEditDialog = (video: Video) => {
    setEditingVideo(video)
    setFormData({
      title: video.title,
      description: video.description || "",
      vimeo_video_id: video.vimeo_video_id,
      thumbnail_url: video.thumbnail_url || "",
      duration: video.duration,
      is_featured: video.is_featured,
      published: video.published,
    })
    setIsDialogOpen(true)
  }

  const fetchVimeoInfo = async () => {
    if (!formData.vimeo_video_id) {
      toast.error("Please enter a Vimeo video ID")
      return
    }

    setIsFetchingVimeo(true)
    try {
      const response = await fetch(`/api/vimeo/${formData.vimeo_video_id}`)
      if (!response.ok) throw new Error("Failed to fetch video info")
      
      const data = await response.json()
      setFormData(prev => ({
        ...prev,
        title: prev.title || data.title,
        description: prev.description || data.description || "",
        thumbnail_url: data.thumbnail || "",
        duration: data.duration || 0,
      }))
      toast.success("Video info fetched from Vimeo")
    } catch (error) {
      toast.error("Failed to fetch video info from Vimeo")
    } finally {
      setIsFetchingVimeo(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = createClient()

      if (editingVideo) {
        // Update existing video
        const { error } = await supabase
          .from("free_videos")
          .update({
            title: formData.title,
            description: formData.description || null,
            vimeo_video_id: formData.vimeo_video_id,
            thumbnail_url: formData.thumbnail_url || null,
            duration: formData.duration,
            is_featured: formData.is_featured,
            published: formData.published,
          })
          .eq("id", editingVideo.id)

        if (error) throw error

        setVideos(prev =>
          prev.map(v =>
            v.id === editingVideo.id
              ? { ...v, ...formData, description: formData.description || null, thumbnail_url: formData.thumbnail_url || null }
              : v
          )
        )
        toast.success("Video updated successfully")
      } else {
        // Create new video
        const maxOrder = Math.max(...videos.map(v => v.order_index), -1)
        
        const { data, error } = await supabase
          .from("free_videos")
          .insert({
            title: formData.title,
            description: formData.description || null,
            vimeo_video_id: formData.vimeo_video_id,
            thumbnail_url: formData.thumbnail_url || null,
            duration: formData.duration,
            is_featured: formData.is_featured,
            published: formData.published,
            order_index: maxOrder + 1,
          })
          .select()
          .single()

        if (error) throw error

        setVideos(prev => [...prev, data])
        toast.success("Video created successfully")
      }

      setIsDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error("Error saving video:", error)
      toast.error("Failed to save video")
    } finally {
      setIsLoading(false)
    }
  }

  const toggleFeatured = async (video: Video) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("free_videos")
        .update({ is_featured: !video.is_featured })
        .eq("id", video.id)

      if (error) throw error

      setVideos(prev =>
        prev.map(v =>
          v.id === video.id ? { ...v, is_featured: !v.is_featured } : v
        )
      )
      toast.success(video.is_featured ? "Removed from featured" : "Added to featured")
    } catch (error) {
      toast.error("Failed to update video")
    }
  }

  const togglePublished = async (video: Video) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("free_videos")
        .update({ published: !video.published })
        .eq("id", video.id)

      if (error) throw error

      setVideos(prev =>
        prev.map(v =>
          v.id === video.id ? { ...v, published: !v.published } : v
        )
      )
      toast.success(video.published ? "Video unpublished" : "Video published")
    } catch (error) {
      toast.error("Failed to update video")
    }
  }

  const deleteVideo = async (video: Video) => {
    if (!confirm(`Are you sure you want to delete "${video.title}"?`)) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("free_videos")
        .delete()
        .eq("id", video.id)

      if (error) throw error

      setVideos(prev => prev.filter(v => v.id !== video.id))
      toast.success("Video deleted")
    } catch (error) {
      toast.error("Failed to delete video")
    }
  }

  return (
    <div>
      {/* Add Video Button */}
      <div className="mb-6">
        <Button onClick={openCreateDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Video
        </Button>
      </div>

      {/* Videos List */}
      {videos.length > 0 ? (
        <div className="space-y-3">
          {videos.map((video) => (
            <div
              key={video.id}
              className={`flex items-center gap-4 p-4 border rounded-xl bg-card ${
                !video.published ? "opacity-60" : ""
              }`}
            >
              {/* Thumbnail */}
              <div className="relative w-32 aspect-video flex-shrink-0 rounded-lg overflow-hidden bg-secondary">
                {video.thumbnail_url ? (
                  <Image
                    src={video.thumbnail_url}
                    alt={video.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Play className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
                  {formatDuration(video.duration)}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold truncate">{video.title}</h3>
                  {video.is_featured && (
                    <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 text-xs font-medium rounded-full">
                      Featured
                    </span>
                  )}
                  {!video.published && (
                    <span className="px-2 py-0.5 bg-secondary text-muted-foreground text-xs font-medium rounded-full">
                      Draft
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {video.description || "No description"}
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" />
                    {video.view_count.toLocaleString()} views
                  </span>
                  <span>Vimeo ID: {video.vimeo_video_id}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleFeatured(video)}
                  title={video.is_featured ? "Remove from featured" : "Add to featured"}
                >
                  {video.is_featured ? (
                    <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                  ) : (
                    <StarOff className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => togglePublished(video)}
                  title={video.published ? "Unpublish" : "Publish"}
                >
                  {video.published ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openEditDialog(video)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteVideo(video)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                >
                  <a
                    href={`https://vimeo.com/${video.vimeo_video_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border border-dashed border-border rounded-xl">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
            <Play className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No videos yet</h3>
          <p className="text-muted-foreground mb-6">
            Add your first free video to get started
          </p>
          <Button onClick={openCreateDialog} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Video
          </Button>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingVideo ? "Edit Video" : "Add New Video"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Vimeo ID with Fetch Button */}
            <div className="space-y-2">
              <Label htmlFor="vimeo_video_id">Vimeo Video ID</Label>
              <div className="flex gap-2">
                <Input
                  id="vimeo_video_id"
                  placeholder="e.g., 123456789"
                  value={formData.vimeo_video_id}
                  onChange={(e) =>
                    setFormData({ ...formData, vimeo_video_id: e.target.value })
                  }
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={fetchVimeoInfo}
                  disabled={isFetchingVimeo}
                >
                  {isFetchingVimeo ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Fetch"
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter the Vimeo video ID and click Fetch to auto-fill details
              </p>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Video title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <textarea
                id="description"
                placeholder="Video description..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full min-h-[80px] px-3 py-2 border border-input rounded-md bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Thumbnail URL */}
            <div className="space-y-2">
              <Label htmlFor="thumbnail_url">Thumbnail URL (optional)</Label>
              <Input
                id="thumbnail_url"
                placeholder="https://..."
                value={formData.thumbnail_url}
                onChange={(e) =>
                  setFormData({ ...formData, thumbnail_url: e.target.value })
                }
              />
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (seconds)</Label>
              <Input
                id="duration"
                type="number"
                placeholder="0"
                value={formData.duration}
                onChange={(e) =>
                  setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })
                }
              />
            </div>

            {/* Toggles */}
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e) =>
                    setFormData({ ...formData, is_featured: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm">Featured on homepage</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.published}
                  onChange={(e) =>
                    setFormData({ ...formData, published: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm">Published</span>
              </label>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : editingVideo ? (
                  "Update Video"
                ) : (
                  "Add Video"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
