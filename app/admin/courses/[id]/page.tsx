"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { ChevronLeft, BookOpen, Trash2, Upload, Loader2, X, Clock } from "lucide-react"

export default function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [courseId, setCourseId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    instructor_name: "",
    duration: "",
    category: "",
    thumbnail_url: "",
    published: false,
    price: "",
    original_price: "",
    currency: "MMK",
    promo_tag: "",
    promo_deadline: "",
  })

  useEffect(() => {
    params.then((p) => {
      setCourseId(p.id)
      fetchCourse(p.id)
    })
  }, [params])

  const [calculatedDuration, setCalculatedDuration] = useState({ hours: 0, minutes: 0, lessonCount: 0 })

  const fetchCourse = async (id: string) => {
    setFetching(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("id", id)
      .single()

    if (error) {
      toast.error("Failed to fetch course")
      setFetching(false)
      return
    }

    // Fetch lessons to calculate total duration
    const { data: lessons } = await supabase
      .from("lessons")
      .select("duration")
      .eq("course_id", id)

    const totalSeconds = lessons?.reduce((acc, l) => acc + (l.duration || 0), 0) || 0
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    setCalculatedDuration({ hours, minutes, lessonCount: lessons?.length || 0 })

    setFormData({
      title: data.title || "",
      description: data.description || "",
      instructor_name: data.instructor_name || "",
      duration: Math.ceil(totalSeconds / 60).toString(), // Convert to minutes
      category: data.category || "",
      thumbnail_url: data.thumbnail_url || "",
      published: data.published || false,
      price: data.price?.toString() || "",
      original_price: data.original_price?.toString() || "",
      currency: data.currency || "MMK",
      promo_tag: data.promo_tag || "",
      promo_deadline: data.promo_deadline ? new Date(data.promo_deadline).toISOString().slice(0, 16) : "",
    })
    setFetching(false)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !courseId) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB")
      return
    }

    setUploading(true)

    try {
      const supabase = createClient()
      const fileExt = file.name.split(".").pop()
      const fileName = `${courseId}-${Date.now()}.${fileExt}`

      // Delete old image if exists
      if (formData.thumbnail_url) {
        const oldPath = formData.thumbnail_url.split("/").pop()
        if (oldPath) {
          await supabase.storage.from("course-thumbnails").remove([oldPath])
        }
      }

      // Upload new image
      const { error: uploadError } = await supabase.storage
        .from("course-thumbnails")
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("course-thumbnails")
        .getPublicUrl(fileName)

      setFormData({ ...formData, thumbnail_url: publicUrl })
      toast.success("Image uploaded!")
    } catch (error) {
      toast.error("Failed to upload image")
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = async () => {
    if (!formData.thumbnail_url) return

    try {
      const supabase = createClient()
      const fileName = formData.thumbnail_url.split("/").pop()

      if (fileName) {
        await supabase.storage.from("course-thumbnails").remove([fileName])
      }

      setFormData({ ...formData, thumbnail_url: "" })
      toast.success("Image removed")
    } catch (error) {
      toast.error("Failed to remove image")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!courseId) return

    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("courses")
        .update({
          title: formData.title,
          description: formData.description,
          instructor_name: formData.instructor_name,
          duration: parseInt(formData.duration) || 0,
          category: formData.category || null,
          thumbnail_url: formData.thumbnail_url || null,
          published: formData.published,
          price: parseInt(formData.price) || 0,
          original_price: parseInt(formData.original_price) || null,
          currency: formData.currency || "MMK",
          promo_tag: formData.promo_tag || null,
          promo_deadline: formData.promo_deadline ? new Date(formData.promo_deadline).toISOString() : null,
        })
        .eq("id", courseId)

      if (error) throw error

      toast.success("Course updated successfully")
    } catch (error) {
      toast.error("Failed to update course")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!courseId) return
    if (!confirm("Are you sure you want to delete this course? This action cannot be undone.")) {
      return
    }

    setDeleting(true)

    try {
      const supabase = createClient()

      // Delete thumbnail if exists
      if (formData.thumbnail_url) {
        const fileName = formData.thumbnail_url.split("/").pop()
        if (fileName) {
          await supabase.storage.from("course-thumbnails").remove([fileName])
        }
      }

      const { error } = await supabase.from("courses").delete().eq("id", courseId)

      if (error) throw error

      toast.success("Course deleted successfully")
      router.push("/admin/courses")
    } catch (error) {
      toast.error("Failed to delete course")
    } finally {
      setDeleting(false)
    }
  }

  if (fetching) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-3xl px-6 py-12">
        <Link
          href="/admin/courses"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Courses
        </Link>

        <div className="flex items-start justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold mb-2">Edit Course</h1>
            <p className="text-muted-foreground">Update course details and settings</p>
          </div>
          <Link
            href={`/admin/courses/${courseId}/lessons`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-sm font-medium transition-colors"
          >
            <BookOpen className="h-4 w-4" />
            Manage Content
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Thumbnail Upload */}
          <div className="border border-border rounded-xl p-6">
            <Label className="mb-4 block">Course Thumbnail</Label>

            {formData.thumbnail_url ? (
              <div className="relative">
                <div className="aspect-video relative bg-secondary rounded-lg overflow-hidden max-w-md">
                  <Image
                    src={formData.thumbnail_url}
                    alt="Course thumbnail"
                    fill
                    className="object-cover"
                  />
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label className="cursor-pointer block">
                <div className="aspect-video max-w-md border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center hover:border-foreground/20 transition-colors">
                  {uploading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm font-medium">Click to upload</p>
                      <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            )}
          </div>

          <div className="space-y-6 p-6 border border-border rounded-xl">
            <div className="space-y-2">
              <Label htmlFor="title">Course Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="flex min-h-[120px] w-full rounded-lg border border-border bg-secondary/50 px-4 py-3 text-base transition-all placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/30 resize-none"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructor">Instructor Name *</Label>
              <Input
                id="instructor"
                value={formData.instructor_name}
                onChange={(e) => setFormData({ ...formData, instructor_name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Duration (auto-calculated)</Label>
                <div className="flex h-11 items-center rounded-lg border border-border bg-secondary/30 px-4">
                  <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="font-medium">
                    {calculatedDuration.hours > 0
                      ? `${calculatedDuration.hours}h ${calculatedDuration.minutes}m`
                      : `${calculatedDuration.minutes} min`}
                  </span>
                  <span className="text-muted-foreground ml-2 text-sm">
                    ({calculatedDuration.lessonCount} lessons)
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Calculated from video durations
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Marketing"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="published"
                checked={formData.published}
                onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                className="w-4 h-4 rounded border-border text-foreground focus:ring-foreground/20"
              />
              <Label htmlFor="published" className="cursor-pointer">
                Published (visible to students)
              </Label>
            </div>
          </div>

          {/* Pricing Section */}
          <div className="space-y-6 p-6 border border-border rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-lg font-semibold">Pricing & Promotions</h2>
              <span className="text-xs px-2 py-0.5 bg-secondary rounded-full text-muted-foreground">Optional</span>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Sale Price</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="50000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="original_price">Original Price</Label>
                <Input
                  id="original_price"
                  type="number"
                  value={formData.original_price}
                  onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                  placeholder="150000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <select
                  id="currency"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="flex h-11 w-full rounded-lg border border-border bg-secondary/50 px-4 py-2 text-base transition-all focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/30"
                >
                  <option value="MMK">MMK</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="promo_tag">Promotional Tag</Label>
              <select
                id="promo_tag"
                value={formData.promo_tag}
                onChange={(e) => setFormData({ ...formData, promo_tag: e.target.value })}
                className="flex h-11 w-full rounded-lg border border-border bg-secondary/50 px-4 py-2 text-base transition-all focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/30"
              >
                <option value="">No tag</option>
                <option value="launch">🚀 Launch Special</option>
                <option value="discount">🔥 Discount</option>
                <option value="new">✨ New</option>
                <option value="popular">⭐ Popular</option>
                <option value="bestseller">🏆 Bestseller</option>
              </select>
              <p className="text-xs text-muted-foreground">
                This tag will be displayed on the course card
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="promo_deadline">Promotion Deadline</Label>
              <Input
                id="promo_deadline"
                type="datetime-local"
                value={formData.promo_deadline}
                onChange={(e) => setFormData({ ...formData, promo_deadline: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Set a deadline for the promotion to show a countdown timer
              </p>
            </div>

            {formData.price && formData.original_price && parseInt(formData.original_price) > parseInt(formData.price) && (
              <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                <p className="text-sm font-medium text-green-600 dark:text-green-400">
                  💰 Discount: {Math.round((1 - parseInt(formData.price) / parseInt(formData.original_price)) * 100)}% OFF
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Customers will see: <span className="font-semibold">{parseInt(formData.price).toLocaleString()} {formData.currency}</span>
                  {" "}(was <span className="line-through">{parseInt(formData.original_price).toLocaleString()} {formData.currency}</span>)
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/courses")}
            >
              Cancel
            </Button>
          </div>
        </form>

        {/* Danger Zone */}
        <div className="mt-12 p-6 border border-destructive/30 rounded-xl">
          <h2 className="text-lg font-semibold text-destructive mb-2">Danger Zone</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Once you delete a course, there is no going back.
          </p>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {deleting ? "Deleting..." : "Delete Course"}
          </Button>
        </div>
      </div>
    </div>
  )
}
