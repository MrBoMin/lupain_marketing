"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, Clock, FileText, Lock } from "lucide-react"

interface Lesson {
    id: string
    title: string
    description: string | null
    lesson_type?: "video" | "pdf"
    duration: number
    order: number
}

interface Chapter {
    id: string
    title: string
    description: string | null
    order: number
    lessons: Lesson[]
}

interface CourseContentPreviewProps {
    chapters: Chapter[]
    unassignedLessons: Lesson[]
}

export function CourseContentPreview({ chapters, unassignedLessons }: CourseContentPreviewProps) {
    const [expandedChapters, setExpandedChapters] = useState<Set<string>>(
        // Start with first chapter expanded
        new Set(chapters.length > 0 ? [chapters[0].id] : [])
    )

    const toggleChapter = (chapterId: string) => {
        setExpandedChapters((prev) => {
            const next = new Set(prev)
            if (next.has(chapterId)) {
                next.delete(chapterId)
            } else {
                next.add(chapterId)
            }
            return next
        })
    }

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, "0")}`
    }

    const totalLessons = chapters.reduce((acc, ch) => acc + ch.lessons.length, 0) + unassignedLessons.length

    if (chapters.length === 0 && unassignedLessons.length === 0) {
        return (
            <p className="text-muted-foreground py-8 text-center">No lessons available yet.</p>
        )
    }

    // If no chapters, show flat list (legacy)
    if (chapters.length === 0) {
        return (
            <div className="space-y-2">
                {unassignedLessons.map((lesson, index) => (
                    <div
                        key={lesson.id}
                        className="flex items-center gap-4 p-4 border border-border rounded-xl"
                    >
                        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-sm font-medium">
                            {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-medium truncate">{lesson.title}</h3>
                            {lesson.description && (
                                <p className="text-sm text-muted-foreground truncate">{lesson.description}</p>
                            )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                            {(lesson.lesson_type || "video") === "pdf" ? "PDF" : formatDuration(lesson.duration)}
                        </span>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {chapters.map((chapter, chapterIndex) => {
                const isExpanded = expandedChapters.has(chapter.id)
                const chapterDuration = chapter.lessons.reduce((acc, l) => acc + (l.duration || 0), 0)
                const formattedChapterDuration = chapterDuration > 0
                    ? `${Math.floor(chapterDuration / 60)} min`
                    : ""

                return (
                    <div key={chapter.id} className="border border-border rounded-xl overflow-hidden">
                        {/* Chapter Header - Clickable */}
                        <button
                            onClick={() => toggleChapter(chapter.id)}
                            className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors text-left"
                        >
                            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-sm font-bold">
                                {chapterIndex + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold">{chapter.title}</h3>
                                <p className="text-sm text-muted-foreground">
                                    {chapter.lessons.length} lesson{chapter.lessons.length !== 1 ? "s" : ""}
                                    {formattedChapterDuration && ` • ${formattedChapterDuration}`}
                                </p>
                            </div>
                            {isExpanded ? (
                                <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                            ) : (
                                <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                            )}
                        </button>

                        {/* Lessons List - Collapsible */}
                        {isExpanded && chapter.lessons.length > 0 && (
                            <div className="border-t border-border bg-muted/20">
                                {chapter.lessons.map((lesson, lessonIndex) => (
                                    <div
                                        key={lesson.id}
                                        className="flex items-center gap-4 px-4 py-3 border-b border-border last:border-b-0"
                                    >
                                        <div className="w-6 h-6 rounded-full bg-secondary/50 flex items-center justify-center">
                                            <Lock className="h-3 w-3 text-muted-foreground" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-medium truncate">{lesson.title}</h4>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            {(lesson.lesson_type || "video") === "pdf" ? (
                                                <FileText className="h-3 w-3" />
                                            ) : (
                                                <Clock className="h-3 w-3" />
                                            )}
                                            <span>{(lesson.lesson_type || "video") === "pdf" ? "PDF" : formatDuration(lesson.duration)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {isExpanded && chapter.lessons.length === 0 && (
                            <div className="border-t border-border bg-muted/20 p-4">
                                <p className="text-sm text-muted-foreground text-center">No lessons in this chapter yet</p>
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}
