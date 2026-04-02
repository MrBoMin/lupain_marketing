"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { VimeoPlayer } from "@/components/vimeo-player"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { createClient } from "@/lib/supabase/client"
import { ChevronLeft, ChevronRight, CheckCircle2, Circle, List, FolderOpen } from "lucide-react"
import { toast } from "sonner"
import { LessonComments } from "@/components/lesson-comments"
import { MessageCircle } from "lucide-react"

interface Chapter {
  id: string
  title: string
  description: string | null
  order: number
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

interface LessonPlayerProps {
  user: any
  course: any
  lesson: any
  chapters: Chapter[]
  allLessons: Lesson[]
  progressData: any[]
  currentProgress: any
  previousLesson: any
  nextLesson: any
}

export function LessonPlayer({
  user,
  course,
  lesson,
  chapters,
  allLessons,
  progressData,
  currentProgress,
  previousLesson,
  nextLesson,
}: LessonPlayerProps) {
  const router = useRouter()
  const [isCompleted, setIsCompleted] = useState(currentProgress?.completed || false)
  const [lastPosition, setLastPosition] = useState(currentProgress?.last_position || 0)
  const [isSaving, setIsSaving] = useState(false)

  const progressMap = new Map(progressData.map((p) => [p.lesson_id, p]))

  // Calculate course progress
  const completedCount = progressData.filter((p) => p.completed).length
  const overallProgress = allLessons.length > 0 ? Math.round((completedCount / allLessons.length) * 100) : 0

  // Group lessons by chapter
  const chaptersWithLessons = chapters.map((chapter) => ({
    ...chapter,
    lessons: allLessons.filter((l) => l.chapter_id === chapter.id),
  }))

  // Unassigned lessons (legacy)
  const unassignedLessons = allLessons.filter((l) => !l.chapter_id)

  // Save progress to database
  const saveProgress = useCallback(
    async (seconds: number, completed: boolean = false) => {
      if (isSaving) return

      setIsSaving(true)
      const supabase = createClient()

      try {
        const { error } = await supabase.from("lesson_progress").upsert(
          {
            user_id: user.id,
            lesson_id: lesson.id,
            course_id: course.id,
            completed,
            last_position: Math.floor(seconds),
            last_watched_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id,lesson_id",
          }
        )

        if (error) {
          console.error("Error saving progress:", error)
        } else {
          setLastPosition(Math.floor(seconds))
          if (completed && !isCompleted) {
            setIsCompleted(true)
            toast.success("Lesson marked as complete!")
            router.refresh()
          }
        }
      } catch (error) {
        console.error("Error saving progress:", error)
      } finally {
        setIsSaving(false)
      }
    },
    [user.id, lesson.id, course.id, isSaving, isCompleted, router]
  )

  // Debounced time update handler
  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const debouncedSave = (seconds: number) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        saveProgress(seconds)
      }, 3000)
    }

    return () => clearTimeout(timeoutId)
  }, [saveProgress])

  const handleTimeUpdate = (seconds: number) => {
    if (Math.abs(seconds - lastPosition) > 5) {
      saveProgress(seconds)
    }
  }

  const handleVideoEnded = () => {
    saveProgress(0, true)
  }

  const handleMarkComplete = async () => {
    await saveProgress(lastPosition, !isCompleted)
  }

  // Render a lesson item
  const renderLessonItem = (l: Lesson, showNumber?: number) => {
    const progress = progressMap.get(l.id)
    const completed = progress?.completed || false

    return (
      <Link
        key={l.id}
        href={`/dashboard/courses/${course.id}/lessons/${l.id}`}
        className={`block p-3 rounded-lg border transition-colors ${l.id === lesson.id
          ? "border-primary bg-primary/5"
          : "border-border hover:bg-muted"
          }`}
      >
        <div className="flex items-center gap-3">
          {showNumber !== undefined && (
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium flex-shrink-0">
              {showNumber}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{l.title}</div>
            <div className="text-xs text-muted-foreground">
              {Math.floor(l.duration / 60)}:{String(l.duration % 60).padStart(2, "0")}
            </div>
          </div>
          {completed && (
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500 flex-shrink-0" />
          )}
        </div>
      </Link>
    )
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href={`/dashboard/courses/${course.id}`}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Course
          </Link>
        </Button>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">{lesson.title}</h1>
            <p className="text-sm text-muted-foreground">{course.title}</p>
          </div>
          <Button
            variant={isCompleted ? "outline" : "default"}
            onClick={handleMarkComplete}
            disabled={isSaving}
          >
            {isCompleted ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Completed
              </>
            ) : (
              <>
                <Circle className="mr-2 h-4 w-4" />
                Mark as Complete
              </>
            )}
          </Button>
        </div>
        <Progress value={overallProgress} className="mb-2" />
        <p className="text-sm text-muted-foreground">
          Course Progress: {completedCount} of {allLessons.length} lessons ({overallProgress}%)
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Player */}
        <div className="lg:col-span-2 space-y-6">
          <VimeoPlayer
            videoId={lesson.vimeo_video_id}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleVideoEnded}
            startTime={lastPosition}
          />

          {/* Navigation */}
          <div className="flex items-center justify-between">
            {previousLesson ? (
              <Button variant="outline" asChild>
                <Link href={`/dashboard/courses/${course.id}/lessons/${previousLesson.id}`}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Previous
                </Link>
              </Button>
            ) : (
              <div />
            )}
            {nextLesson ? (
              <Button asChild>
                <Link href={`/dashboard/courses/${course.id}/lessons/${nextLesson.id}`}>
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <Button variant="outline" asChild>
                <Link href={`/dashboard/courses/${course.id}`}>Back to Course</Link>
              </Button>
            )}
          </div>

          {/* Lesson Details */}
          <Card>
            <CardHeader>
              <CardTitle>About this lesson</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="overview" className="w-full">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="lessons">
                    <List className="mr-2 h-4 w-4" />
                    Lessons
                  </TabsTrigger>
                  <TabsTrigger value="discussion">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Discussion
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="space-y-4">
                  {lesson.description ? (
                    <p className="text-muted-foreground whitespace-pre-line">{lesson.description}</p>
                  ) : (
                    <p className="text-muted-foreground">No description available for this lesson.</p>
                  )}
                </TabsContent>
                <TabsContent value="lessons" className="space-y-4">
                  {chaptersWithLessons.length > 0 ? (
                    chaptersWithLessons.map((chapter) => (
                      <div key={chapter.id}>
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                          <FolderOpen className="h-4 w-4 text-muted-foreground" />
                          {chapter.title}
                        </h4>
                        <div className="space-y-2 pl-6">
                          {chapter.lessons.map((l, idx) => renderLessonItem(l, idx + 1))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="space-y-2">
                      {allLessons.map((l, idx) => renderLessonItem(l, idx + 1))}
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="discussion" className="space-y-4 pt-2">
                  <LessonComments
                    lessonId={lesson.id}
                    courseId={course.id}
                    currentUserId={user.id}
                    currentUserRole={user.role}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Course Content */}
        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle>Course Content</CardTitle>
              <CardDescription>
                {completedCount} of {allLessons.length} lessons completed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {chaptersWithLessons.length > 0 ? (
                  // Show chapters with lessons
                  chaptersWithLessons.map((chapter, chapterIdx) => {
                    const chapterCompleted = chapter.lessons.filter(
                      (l) => progressMap.get(l.id)?.completed
                    ).length

                    return (
                      <div key={chapter.id}>
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border">
                          <div className="flex items-center justify-center w-6 h-6 rounded-md bg-secondary text-xs font-bold">
                            {chapterIdx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm truncate">{chapter.title}</h4>
                            <p className="text-xs text-muted-foreground">
                              {chapterCompleted}/{chapter.lessons.length} completed
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2 pl-2">
                          {chapter.lessons.map((l, idx) => renderLessonItem(l, idx + 1))}
                        </div>
                      </div>
                    )
                  })
                ) : unassignedLessons.length > 0 ? (
                  // Legacy: show lessons without chapters
                  <div className="space-y-2">
                    {unassignedLessons.map((l, idx) => renderLessonItem(l, idx + 1))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No lessons available
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
