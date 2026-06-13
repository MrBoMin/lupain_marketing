"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
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
  ChevronLeft, 
  Plus, 
  Trash2, 
  Video, 
  FileText,
  Loader2, 
  FolderPlus,
  ChevronDown,
  ChevronRight,
  Pencil,
  AlertTriangle,
  ArrowRight,
  Search,
  PlayCircle,
} from "lucide-react"
import {
  createChapter,
  createLesson,
  deleteChapter,
  deleteLesson,
  getCourseContent,
  moveLesson,
  updateChapter,
  updateLesson,
} from "./actions"

interface Chapter {
  id: string
  title: string
  description: string | null
  order: number
  lessons: Lesson[]
}

interface Lesson {
  id: string
  chapter_id: string | null
  title: string
  description: string | null
  lesson_type: "video" | "pdf"
  vimeo_video_id: string | null
  pdf_file_url: string | null
  pdf_file_name: string | null
  order: number
  duration: number
}

interface VimeoVideoOption {
  id: string
  title: string
  description: string
  duration: number
  thumbnail: string | null
  link: string | null
}

export default function ManageLessonsPage({ params }: { params: Promise<{ id: string }> }) {
  const [courseId, setCourseId] = useState<string | null>(null)
  const [courseTitle, setCourseTitle] = useState("")
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [unassignedLessons, setUnassignedLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set())
  
  // Chapter form state
  const [showChapterForm, setShowChapterForm] = useState(false)
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null)
  const [chapterForm, setChapterForm] = useState({ title: "", description: "" })
  const [savingChapter, setSavingChapter] = useState(false)
  
  // Lesson form state
  const [addingLessonToChapter, setAddingLessonToChapter] = useState<string | null>(null)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const [lessonForm, setLessonForm] = useState({
    lesson_type: "video" as "video" | "pdf",
    title: "",
    description: "",
    vimeo_video_id: "",
    pdf_file_url: "",
    pdf_file_name: "",
    duration: "",
  })
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [savingLesson, setSavingLesson] = useState(false)
  const [fetchingInfo, setFetchingInfo] = useState(false)
  const [showVimeoPicker, setShowVimeoPicker] = useState(false)
  const [vimeoVideos, setVimeoVideos] = useState<VimeoVideoOption[]>([])
  const [vimeoSearch, setVimeoSearch] = useState("")
  const [vimeoPage, setVimeoPage] = useState(1)
  const [vimeoHasNextPage, setVimeoHasNextPage] = useState(false)
  const [loadingVimeoVideos, setLoadingVimeoVideos] = useState(false)
  
  // Move lesson modal
  const [movingLesson, setMovingLesson] = useState<Lesson | null>(null)

  useEffect(() => {
    params.then((p) => {
      setCourseId(p.id)
      fetchData(p.id)
    })
  }, [params])

  const fetchData = async (id: string) => {
    setLoading(true)
    const result = await getCourseContent(id)

    if (result.error || !result.course) {
      toast.error(result.error || "Failed to fetch course content")
      setLoading(false)
      return
    }

    setCourseTitle(result.course.title)
    const chaptersData = result.chapters || []
    const lessonsData = result.lessons || []

    // Group lessons by chapter
    const chaptersWithLessons: Chapter[] = (chaptersData || []).map((chapter) => ({
      ...chapter,
      lessons: (lessonsData || []).filter((l) => l.chapter_id === chapter.id),
    }))

    // Find unassigned lessons (no chapter_id)
    const orphanLessons = (lessonsData || []).filter((l) => !l.chapter_id)

    setChapters(chaptersWithLessons)
    setUnassignedLessons(orphanLessons)
    
    // Expand all chapters by default
    setExpandedChapters(new Set(chaptersWithLessons.map(c => c.id)))
    
    setLoading(false)
  }

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(chapterId)) {
        newSet.delete(chapterId)
      } else {
        newSet.add(chapterId)
      }
      return newSet
    })
  }

  // Chapter CRUD
  const handleSaveChapter = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!courseId) return
    setSavingChapter(true)

    try {
      if (editingChapter) {
        const result = await updateChapter(editingChapter.id, {
          title: chapterForm.title,
          description: chapterForm.description || null,
        })

        if (result.error) throw new Error(result.error)
        toast.success("Chapter updated")
      } else {
        const result = await createChapter({
          course_id: courseId,
          title: chapterForm.title,
          description: chapterForm.description || null,
          order: chapters.length + 1,
        })

        if (result.error) throw new Error(result.error)
        toast.success("Chapter created")
      }

      setChapterForm({ title: "", description: "" })
      setShowChapterForm(false)
      setEditingChapter(null)
      fetchData(courseId)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save chapter"
      toast.error(message)
    } finally {
      setSavingChapter(false)
    }
  }

  const handleEditChapter = (chapter: Chapter) => {
    setEditingChapter(chapter)
    setChapterForm({ title: chapter.title, description: chapter.description || "" })
    setShowChapterForm(true)
  }

  const handleDeleteChapter = async (chapterId: string) => {
    if (!confirm("Delete this chapter and all its lessons?")) return
    if (!courseId) return

    try {
      const result = await deleteChapter(chapterId)
      if (result.error) throw new Error(result.error)
      toast.success("Chapter deleted")
      fetchData(courseId)
    } catch (error) {
      toast.error("Failed to delete chapter")
    }
  }

  // Lesson CRUD
  const fetchVimeoInfo = async () => {
    if (!lessonForm.vimeo_video_id) {
      toast.error("Please enter a Vimeo Video ID first")
      return
    }

    setFetchingInfo(true)
    try {
      const response = await fetch(`/api/vimeo/${lessonForm.vimeo_video_id}`)
      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Failed to fetch video info")
        return
      }

      setLessonForm({
        ...lessonForm,
        title: lessonForm.title || data.title || "",
        description: lessonForm.description || data.description || "",
        duration: data.duration?.toString() || lessonForm.duration,
      })
      toast.success("Video info fetched!")
    } catch (error) {
      toast.error("Failed to fetch video info")
    } finally {
      setFetchingInfo(false)
    }
  }

  const fetchVimeoVideos = async (page = 1, query = vimeoSearch) => {
    setLoadingVimeoVideos(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
      })

      if (query.trim()) {
        params.set("query", query.trim())
      }

      const response = await fetch(`/api/admin/vimeo/videos?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Failed to fetch Vimeo videos")
        return
      }

      setVimeoVideos(data.videos || [])
      setVimeoPage(data.page || page)
      setVimeoHasNextPage(Boolean(data.hasNextPage))
    } catch (error) {
      toast.error("Failed to fetch Vimeo videos")
    } finally {
      setLoadingVimeoVideos(false)
    }
  }

  const openVimeoPicker = () => {
    setShowVimeoPicker(true)
    if (vimeoVideos.length === 0) {
      fetchVimeoVideos(1, "")
    }
  }

  const selectVimeoVideo = (video: VimeoVideoOption) => {
    setLessonForm({
      ...lessonForm,
      vimeo_video_id: video.id,
      title: lessonForm.title || video.title,
      description: lessonForm.description || video.description || "",
      duration: video.duration?.toString() || lessonForm.duration,
    })
    setShowVimeoPicker(false)
    toast.success("Vimeo video selected")
  }

  const handleEditLesson = (lesson: Lesson, chapterId: string) => {
    setEditingLesson(lesson)
    setAddingLessonToChapter(chapterId)
    setLessonForm({
      lesson_type: lesson.lesson_type || "video",
      title: lesson.title,
      description: lesson.description || "",
      vimeo_video_id: lesson.vimeo_video_id || "",
      pdf_file_url: lesson.pdf_file_url || "",
      pdf_file_name: lesson.pdf_file_name || "",
      duration: lesson.duration.toString(),
    })
    setPdfFile(null)
  }

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!courseId || !addingLessonToChapter) return
    if (lessonForm.lesson_type === "video" && !lessonForm.vimeo_video_id.trim()) {
      toast.error("Please enter a Vimeo Video ID")
      return
    }
    if (lessonForm.lesson_type === "pdf" && !pdfFile && !lessonForm.pdf_file_url) {
      toast.error("Please upload a PDF file")
      return
    }
    setSavingLesson(true)

    try {
      let pdfFileUrl = lessonForm.pdf_file_url || null
      let pdfFileName = lessonForm.pdf_file_name || null

      if (lessonForm.lesson_type === "pdf" && pdfFile) {
        const uploadForm = new FormData()
        uploadForm.append("courseId", courseId)
        uploadForm.append("file", pdfFile)

        const response = await fetch("/api/admin/lesson-pdfs", {
          method: "POST",
          body: uploadForm,
        })
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to upload PDF")
        }

        pdfFileUrl = data.filePath
        pdfFileName = data.fileName
      }

      const lessonPayload = {
        title: lessonForm.title,
        description: lessonForm.description || null,
        lesson_type: lessonForm.lesson_type,
        vimeo_video_id: lessonForm.lesson_type === "video" ? lessonForm.vimeo_video_id : null,
        pdf_file_url: lessonForm.lesson_type === "pdf" ? pdfFileUrl : null,
        pdf_file_name: lessonForm.lesson_type === "pdf" ? pdfFileName : null,
        duration: parseInt(lessonForm.duration) || 0,
      }

      if (editingLesson) {
        const result = await updateLesson(editingLesson.id, lessonPayload)

        if (result.error) throw new Error(result.error)
        toast.success("Lesson updated")
      } else {
        const chapter = chapters.find((c) => c.id === addingLessonToChapter)
        const lessonOrder = chapter ? chapter.lessons.length + 1 : 1

        const result = await createLesson({
          course_id: courseId,
          chapter_id: addingLessonToChapter,
          ...lessonPayload,
          order: lessonOrder,
        })

        if (result.error) throw new Error(result.error)
        toast.success("Lesson added")
      }

      setLessonForm({ lesson_type: "video", title: "", description: "", vimeo_video_id: "", pdf_file_url: "", pdf_file_name: "", duration: "" })
      setPdfFile(null)
      setAddingLessonToChapter(null)
      setEditingLesson(null)
      fetchData(courseId)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save lesson"
      toast.error(message)
    } finally {
      setSavingLesson(false)
    }
  }

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm("Delete this lesson?")) return
    if (!courseId) return

    try {
      const result = await deleteLesson(lessonId)
      if (result.error) throw new Error(result.error)
      toast.success("Lesson deleted")
      fetchData(courseId)
    } catch (error) {
      toast.error("Failed to delete lesson")
    }
  }

  const handleMoveLesson = async (lessonId: string, targetChapterId: string) => {
    if (!courseId) return

    try {
      const targetChapter = chapters.find(c => c.id === targetChapterId)
      const newOrder = targetChapter ? targetChapter.lessons.length + 1 : 1

      const result = await moveLesson(lessonId, targetChapterId, newOrder)
      if (result.error) throw new Error(result.error)
      toast.success("Lesson moved to chapter")
      setMovingLesson(null)
      fetchData(courseId)
    } catch (error) {
      toast.error("Failed to move lesson")
    }
  }

  const cancelLessonForm = () => {
    setAddingLessonToChapter(null)
    setEditingLesson(null)
    setLessonForm({ lesson_type: "video", title: "", description: "", vimeo_video_id: "", pdf_file_url: "", pdf_file_name: "", duration: "" })
    setPdfFile(null)
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl px-6 py-12">
        <Link
          href={`/admin/courses/${courseId}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Course
        </Link>

        <div className="flex items-start justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold mb-2">Course Content</h1>
            <p className="text-muted-foreground">{courseTitle}</p>
          </div>
          {!showChapterForm && (
            <Button onClick={() => setShowChapterForm(true)} className="gap-2">
              <FolderPlus className="h-4 w-4" />
              Add Chapter
            </Button>
          )}
        </div>

        {/* Unassigned Lessons Warning */}
        {unassignedLessons.length > 0 && (
          <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-amber-600 dark:text-amber-400 mb-1">
                  {unassignedLessons.length} Unassigned Lesson{unassignedLessons.length !== 1 ? "s" : ""}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  These lessons were created before chapters. Move them to a chapter or delete them.
                </p>
                <div className="space-y-2">
                  {unassignedLessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="flex items-center gap-3 p-3 bg-background rounded-lg border border-border"
                    >
                      {(lesson.lesson_type || "video") === "pdf" ? (
                        <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      ) : (
                        <Video className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{lesson.title}</h4>
                        <p className="text-xs text-muted-foreground">{formatDuration(lesson.duration)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {chapters.length > 0 ? (
                          <div className="relative">
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleMoveLesson(lesson.id, e.target.value)
                                }
                              }}
                              className="h-8 pl-3 pr-8 text-xs rounded-md border border-border bg-secondary/50 cursor-pointer appearance-none"
                              defaultValue=""
                            >
                              <option value="" disabled>Move to...</option>
                              {chapters.map((ch) => (
                                <option key={ch.id} value={ch.id}>
                                  {ch.title}
                                </option>
                              ))}
                            </select>
                            <ArrowRight className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Create a chapter first →</span>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteLesson(lesson.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chapter Form */}
        {showChapterForm && (
          <form onSubmit={handleSaveChapter} className="mb-8 p-6 border border-border rounded-xl space-y-5">
            <h2 className="text-lg font-semibold">
              {editingChapter ? "Edit Chapter" : "New Chapter"}
            </h2>

            <div className="space-y-2">
              <Label htmlFor="chapter-title">Chapter Title *</Label>
              <Input
                id="chapter-title"
                placeholder="e.g., Getting Started"
                value={chapterForm.title}
                onChange={(e) => setChapterForm({ ...chapterForm, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="chapter-desc">Description (optional)</Label>
              <Input
                id="chapter-desc"
                placeholder="What this chapter covers..."
                value={chapterForm.description}
                onChange={(e) => setChapterForm({ ...chapterForm, description: e.target.value })}
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={savingChapter}>
                {savingChapter ? "Saving..." : editingChapter ? "Update Chapter" : "Create Chapter"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowChapterForm(false)
                  setEditingChapter(null)
                  setChapterForm({ title: "", description: "" })
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        {/* Chapters List */}
        <div className="space-y-4">
          {chapters.length > 0 ? (
            chapters.map((chapter, chapterIndex) => (
              <div key={chapter.id} className="border border-border rounded-xl overflow-hidden">
                {/* Chapter Header */}
                <div
                  className="flex items-center gap-3 p-4 bg-secondary/30 cursor-pointer hover:bg-secondary/50 transition-colors"
                  onClick={() => toggleChapter(chapter.id)}
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-foreground/10 text-sm font-bold">
                    {chapterIndex + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{chapter.title}</h3>
                    {chapter.description && (
                      <p className="text-sm text-muted-foreground">{chapter.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {chapter.lessons.length} lesson{chapter.lessons.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditChapter(chapter)}
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteChapter(chapter.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    {expandedChapters.has(chapter.id) ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Lessons */}
                {expandedChapters.has(chapter.id) && (
                  <div className="divide-y divide-border">
                    {chapter.lessons.map((lesson, lessonIndex) => (
                      <div
                        key={lesson.id}
                        className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors group"
                      >
                        <div className="w-6 text-center text-sm text-muted-foreground">
                          {lessonIndex + 1}
                        </div>
                        {(lesson.lesson_type || "video") === "pdf" ? (
                          <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        ) : (
                          <Video className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{lesson.title}</h4>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span>{(lesson.lesson_type || "video") === "pdf" ? lesson.pdf_file_name || "PDF lesson" : lesson.vimeo_video_id}</span>
                            <span>•</span>
                            <span>{formatDuration(lesson.duration)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditLesson(lesson, chapter.id)}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteLesson(lesson.id)}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    {/* Add/Edit Lesson Form */}
                    {addingLessonToChapter === chapter.id ? (
                      <form onSubmit={handleSaveLesson} className="p-4 bg-muted/30 space-y-4">
                        <h4 className="font-medium text-sm">
                          {editingLesson ? "Edit Lesson" : "Add New Lesson"}
                        </h4>

                        <div className="space-y-2">
                          <Label className="text-xs">Lesson Type</Label>
                          <div className="inline-flex rounded-lg border border-border bg-background p-1">
                            <button
                              type="button"
                              onClick={() => {
                                setLessonForm({ ...lessonForm, lesson_type: "video" })
                                setPdfFile(null)
                              }}
                              className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors ${
                                lessonForm.lesson_type === "video"
                                  ? "bg-foreground text-background"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              <Video className="h-4 w-4" />
                              Video
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setLessonForm({ ...lessonForm, lesson_type: "pdf", vimeo_video_id: "" })
                              }
                              className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors ${
                                lessonForm.lesson_type === "pdf"
                                  ? "bg-foreground text-background"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              <FileText className="h-4 w-4" />
                              PDF
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          {lessonForm.lesson_type === "video" ? (
                            <div className="space-y-2">
                              <Label htmlFor="vimeo-id" className="text-xs">Vimeo Video ID *</Label>
                              <div className="flex flex-wrap gap-2">
                                <Input
                                  id="vimeo-id"
                                  placeholder="123456789"
                                  value={lessonForm.vimeo_video_id}
                                  onChange={(e) =>
                                    setLessonForm({ ...lessonForm, vimeo_video_id: e.target.value })
                                  }
                                  className="h-9 min-w-0 flex-1 text-sm"
                                  required={lessonForm.lesson_type === "video"}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={openVimeoPicker}
                                  className="gap-2"
                                >
                                  <PlayCircle className="h-3.5 w-3.5" />
                                  Choose from Video
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={fetchVimeoInfo}
                                  disabled={fetchingInfo || !lessonForm.vimeo_video_id}
                                >
                                  {fetchingInfo ? <Loader2 className="h-3 w-3 animate-spin" /> : "Fetch"}
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Label htmlFor="pdf-file" className="text-xs">PDF File *</Label>
                              <Input
                                id="pdf-file"
                                type="file"
                                accept="application/pdf,.pdf"
                                onChange={(e) => {
                                  const file = e.target.files?.[0] || null
                                  if (file && file.type !== "application/pdf") {
                                    toast.error("Please upload a PDF file")
                                    e.target.value = ""
                                    return
                                  }
                                  setPdfFile(file)
                                }}
                                className="h-9 text-sm"
                              />
                              {(pdfFile || lessonForm.pdf_file_name) && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {pdfFile?.name || lessonForm.pdf_file_name}
                                </p>
                              )}
                            </div>
                          )}
                          <div className="space-y-2">
                            <Label htmlFor="lesson-duration" className="text-xs">
                              {lessonForm.lesson_type === "pdf" ? "Estimated Duration (seconds)" : "Duration (seconds) *"}
                            </Label>
                            <Input
                              id="lesson-duration"
                              type="number"
                              placeholder="300"
                              value={lessonForm.duration}
                              onChange={(e) => setLessonForm({ ...lessonForm, duration: e.target.value })}
                              className="h-9 text-sm"
                              required={lessonForm.lesson_type === "video"}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="lesson-title" className="text-xs">Lesson Title *</Label>
                          <Input
                            id="lesson-title"
                            placeholder="Introduction"
                            value={lessonForm.title}
                            onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                            className="h-9 text-sm"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="lesson-desc" className="text-xs">Description (optional)</Label>
                          <Input
                            id="lesson-desc"
                            placeholder="What students will learn..."
                            value={lessonForm.description}
                            onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                            className="h-9 text-sm"
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button type="submit" size="sm" disabled={savingLesson}>
                            {savingLesson ? "Saving..." : editingLesson ? "Update Lesson" : "Add Lesson"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={cancelLessonForm}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <button
                        onClick={() => setAddingLessonToChapter(chapter.id)}
                        className="w-full p-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors flex items-center justify-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add Lesson
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-16 border border-dashed border-border rounded-xl">
              <FolderPlus className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No chapters yet</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Create chapters to organize your lessons
              </p>
              {!showChapterForm && (
                <Button onClick={() => setShowChapterForm(true)} className="gap-2">
                  <FolderPlus className="h-4 w-4" />
                  Add Chapter
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Summary */}
        {(chapters.length > 0 || unassignedLessons.length > 0) && (
          <div className="mt-8 p-4 bg-secondary/30 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total:</span>
              <span className="font-medium">
                {chapters.length} chapter{chapters.length !== 1 ? "s" : ""}, {" "}
                {chapters.reduce((acc, c) => acc + c.lessons.length, 0) + unassignedLessons.length} lesson
                {chapters.reduce((acc, c) => acc + c.lessons.length, 0) + unassignedLessons.length !== 1 ? "s" : ""}
                {unassignedLessons.length > 0 && (
                  <span className="text-amber-500"> ({unassignedLessons.length} unassigned)</span>
                )}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total Duration:</span>
              <span className="font-medium">
                {(() => {
                  const allLessons = [...chapters.flatMap(c => c.lessons), ...unassignedLessons]
                  const totalSeconds = allLessons.reduce((acc, l) => acc + (l.duration || 0), 0)
                  const hours = Math.floor(totalSeconds / 3600)
                  const minutes = Math.floor((totalSeconds % 3600) / 60)
                  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes} min`
                })()}
              </span>
            </div>
          </div>
        )}

        <Dialog open={showVimeoPicker} onOpenChange={setShowVimeoPicker}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Choose from Vimeo</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <form
                className="flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault()
                  fetchVimeoVideos(1, vimeoSearch)
                }}
              >
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search Vimeo videos..."
                    value={vimeoSearch}
                    onChange={(event) => setVimeoSearch(event.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button type="submit" variant="outline" disabled={loadingVimeoVideos}>
                  {loadingVimeoVideos ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Search"
                  )}
                </Button>
              </form>

              <div className="max-h-[440px] overflow-y-auto rounded-lg border border-border">
                {loadingVimeoVideos ? (
                  <div className="flex h-48 items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : vimeoVideos.length > 0 ? (
                  <div className="divide-y divide-border">
                    {vimeoVideos.map((video) => (
                      <button
                        key={video.id}
                        type="button"
                        onClick={() => selectVimeoVideo(video)}
                        className="flex w-full gap-4 p-3 text-left transition-colors hover:bg-muted/60"
                      >
                        <div className="relative flex h-20 w-32 flex-shrink-0 items-center justify-center overflow-hidden rounded-md bg-secondary">
                          {video.thumbnail ? (
                            <img
                              src={video.thumbnail}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Video className="h-6 w-6 text-muted-foreground" />
                          )}
                          <div className="absolute bottom-1 right-1 rounded bg-black/80 px-1.5 py-0.5 text-[11px] font-medium text-white">
                            {formatDuration(video.duration)}
                          </div>
                        </div>
                        <div className="min-w-0 flex-1 py-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="truncate font-medium">{video.title}</h3>
                              <p className="mt-1 text-xs text-muted-foreground">
                                Vimeo ID: {video.id}
                              </p>
                            </div>
                          </div>
                          {video.description && (
                            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                              {video.description}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-48 flex-col items-center justify-center px-6 text-center">
                    <Video className="mb-3 h-8 w-8 text-muted-foreground" />
                    <h3 className="font-medium">No Vimeo videos found</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Try another search or check the Vimeo API token.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  disabled={loadingVimeoVideos || vimeoPage <= 1}
                  onClick={() => fetchVimeoVideos(vimeoPage - 1, vimeoSearch)}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">Page {vimeoPage}</span>
                <Button
                  type="button"
                  variant="outline"
                  disabled={loadingVimeoVideos || !vimeoHasNextPage}
                  onClick={() => fetchVimeoVideos(vimeoPage + 1, vimeoSearch)}
                >
                  Next
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
