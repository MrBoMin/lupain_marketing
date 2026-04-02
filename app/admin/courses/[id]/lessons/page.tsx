"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { 
  ChevronLeft, 
  Plus, 
  Trash2, 
  Video, 
  Loader2, 
  FolderPlus,
  ChevronDown,
  ChevronRight,
  Pencil,
  AlertTriangle,
  ArrowRight,
} from "lucide-react"

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
  vimeo_video_id: string
  order: number
  duration: number
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
    title: "",
    description: "",
    vimeo_video_id: "",
    duration: "",
  })
  const [savingLesson, setSavingLesson] = useState(false)
  const [fetchingInfo, setFetchingInfo] = useState(false)
  
  // Move lesson modal
  const [movingLesson, setMovingLesson] = useState<Lesson | null>(null)

  useEffect(() => {
    params.then((p) => {
      setCourseId(p.id)
      fetchData(p.id)
    })
  }, [params])

  const fetchData = async (id: string) => {
    const supabase = createClient()

    // Fetch course
    const { data: course } = await supabase
      .from("courses")
      .select("title")
      .eq("id", id)
      .single()

    if (course) setCourseTitle(course.title)

    // Fetch chapters
    const { data: chaptersData } = await supabase
      .from("chapters")
      .select("*")
      .eq("course_id", id)
      .order("order", { ascending: true })

    // Fetch all lessons
    const { data: lessonsData } = await supabase
      .from("lessons")
      .select("*")
      .eq("course_id", id)
      .order("order", { ascending: true })

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
      const supabase = createClient()
      
      if (editingChapter) {
        const { error } = await supabase
          .from("chapters")
          .update({
            title: chapterForm.title,
            description: chapterForm.description || null,
          })
          .eq("id", editingChapter.id)

        if (error) throw error
        toast.success("Chapter updated")
      } else {
        const { error } = await supabase.from("chapters").insert({
          course_id: courseId,
          title: chapterForm.title,
          description: chapterForm.description || null,
          order: chapters.length + 1,
        })

        if (error) throw error
        toast.success("Chapter created")
      }

      setChapterForm({ title: "", description: "" })
      setShowChapterForm(false)
      setEditingChapter(null)
      fetchData(courseId)
    } catch (error) {
      toast.error("Failed to save chapter")
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
      const supabase = createClient()
      const { error } = await supabase.from("chapters").delete().eq("id", chapterId)
      if (error) throw error
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

  const handleEditLesson = (lesson: Lesson, chapterId: string) => {
    setEditingLesson(lesson)
    setAddingLessonToChapter(chapterId)
    setLessonForm({
      title: lesson.title,
      description: lesson.description || "",
      vimeo_video_id: lesson.vimeo_video_id,
      duration: lesson.duration.toString(),
    })
  }

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!courseId || !addingLessonToChapter) return
    setSavingLesson(true)

    try {
      const supabase = createClient()

      if (editingLesson) {
        const { error } = await supabase
          .from("lessons")
          .update({
            title: lessonForm.title,
            description: lessonForm.description || null,
            vimeo_video_id: lessonForm.vimeo_video_id,
            duration: parseInt(lessonForm.duration) || 0,
          })
          .eq("id", editingLesson.id)

        if (error) throw error
        toast.success("Lesson updated")
      } else {
        const chapter = chapters.find((c) => c.id === addingLessonToChapter)
        const lessonOrder = chapter ? chapter.lessons.length + 1 : 1

        const { error } = await supabase.from("lessons").insert({
          course_id: courseId,
          chapter_id: addingLessonToChapter,
          title: lessonForm.title,
          description: lessonForm.description || null,
          vimeo_video_id: lessonForm.vimeo_video_id,
          duration: parseInt(lessonForm.duration) || 0,
          order: lessonOrder,
        })

        if (error) throw error
        toast.success("Lesson added")
      }

      setLessonForm({ title: "", description: "", vimeo_video_id: "", duration: "" })
      setAddingLessonToChapter(null)
      setEditingLesson(null)
      fetchData(courseId)
    } catch (error) {
      toast.error("Failed to save lesson")
    } finally {
      setSavingLesson(false)
    }
  }

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm("Delete this lesson?")) return
    if (!courseId) return

    try {
      const supabase = createClient()
      const { error } = await supabase.from("lessons").delete().eq("id", lessonId)
      if (error) throw error
      toast.success("Lesson deleted")
      fetchData(courseId)
    } catch (error) {
      toast.error("Failed to delete lesson")
    }
  }

  const handleMoveLesson = async (lessonId: string, targetChapterId: string) => {
    if (!courseId) return

    try {
      const supabase = createClient()
      const targetChapter = chapters.find(c => c.id === targetChapterId)
      const newOrder = targetChapter ? targetChapter.lessons.length + 1 : 1

      const { error } = await supabase
        .from("lessons")
        .update({ 
          chapter_id: targetChapterId,
          order: newOrder
        })
        .eq("id", lessonId)

      if (error) throw error
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
    setLessonForm({ title: "", description: "", vimeo_video_id: "", duration: "" })
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
                      <Video className="h-4 w-4 text-muted-foreground flex-shrink-0" />
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
                        <Video className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{lesson.title}</h4>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span>{lesson.vimeo_video_id}</span>
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

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="vimeo-id" className="text-xs">Vimeo Video ID *</Label>
                            <div className="flex gap-2">
                              <Input
                                id="vimeo-id"
                                placeholder="123456789"
                                value={lessonForm.vimeo_video_id}
                                onChange={(e) =>
                                  setLessonForm({ ...lessonForm, vimeo_video_id: e.target.value })
                                }
                                className="h-9 text-sm"
                                required
                              />
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
                          <div className="space-y-2">
                            <Label htmlFor="lesson-duration" className="text-xs">Duration (seconds) *</Label>
                            <Input
                              id="lesson-duration"
                              type="number"
                              placeholder="300"
                              value={lessonForm.duration}
                              onChange={(e) => setLessonForm({ ...lessonForm, duration: e.target.value })}
                              className="h-9 text-sm"
                              required
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
      </div>
    </div>
  )
}
