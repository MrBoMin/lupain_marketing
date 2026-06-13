"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { ChevronLeft, Upload, Loader2, X } from "lucide-react"
import { createCourse, updateCourseThumbnail } from "./actions"

export default function NewCoursePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [tempImageFile, setTempImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    instructor_name: "",
    duration: "",
    category: "",
    published: false,
    price: "",
    original_price: "",
    currency: "MMK",
    promo_tag: "",
  })

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB")
      return
    }

    setTempImageFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleRemoveImage = () => {
    setTempImageFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // First create the course to get the ID
      const result = await createCourse({
          title: formData.title,
          description: formData.description,
          instructor_name: formData.instructor_name,
          duration: parseInt(formData.duration) || 0,
          category: formData.category || null,
          thumbnail_url: null,
          published: formData.published,
          price: parseInt(formData.price) || 0,
          original_price: parseInt(formData.original_price) || null,
          currency: formData.currency || "MMK",
          promo_tag: formData.promo_tag || null,
        })

      if (result.error || !result.course) {
        throw new Error(result.error || "Failed to create course")
      }

      const course = result.course

      // Upload image if selected
      let thumbnailUrl = null
      if (tempImageFile && course) {
        const supabase = createClient()
        setUploading(true)
        const fileExt = tempImageFile.name.split(".").pop()
        const fileName = `${course.id}-${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from("course-thumbnails")
          .upload(fileName, tempImageFile)

        if (uploadError) {
          console.error("Upload error:", uploadError)
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from("course-thumbnails")
            .getPublicUrl(fileName)

          thumbnailUrl = publicUrl

          // Update course with thumbnail URL
          const updateResult = await updateCourseThumbnail(course.id, thumbnailUrl)
          if (updateResult.error) {
            console.error("Thumbnail update error:", updateResult.error)
          }
        }
      }

      toast.success("Course created successfully")
      router.push(`/admin/courses/${course.id}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create course"
      console.error("Create course error:", error)
      toast.error(message)
    } finally {
      setLoading(false)
      setUploading(false)
    }
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

        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-2">Create Course</h1>
          <p className="text-muted-foreground">Add a new course to your catalog</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Thumbnail Upload */}
          <div className="border border-border rounded-xl p-6">
            <Label className="mb-4 block">Course Thumbnail</Label>
            
            {previewUrl ? (
              <div className="relative">
                <div className="aspect-video relative bg-secondary rounded-lg overflow-hidden max-w-md">
                  <Image
                    src={previewUrl}
                    alt="Course thumbnail preview"
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
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">Click to upload</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div className="space-y-6 p-6 border border-border rounded-xl">
            <div className="space-y-2">
              <Label htmlFor="title">Course Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Introduction to Python"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <textarea
                id="description"
                placeholder="What will students learn in this course?"
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
                placeholder="Your name"
                value={formData.instructor_name}
                onChange={(e) => setFormData({ ...formData, instructor_name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes) *</Label>
                <Input
                  id="duration"
                  type="number"
                  placeholder="60"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  placeholder="e.g., Marketing"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
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
                Publish immediately (visible to students)
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
            <Button type="submit" disabled={loading || uploading} className="flex-1">
              {loading || uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {uploading ? "Uploading image..." : "Creating..."}
                </>
              ) : (
                "Create Course"
              )}
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
      </div>
    </div>
  )
}
