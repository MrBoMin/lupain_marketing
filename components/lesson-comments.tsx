"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  getComments,
  createComment,
  updateComment,
  deleteComment,
  Comment,
} from "@/app/actions/comments"
import { MessageCircle, Reply, Edit2, Trash2, Send, X, Shield } from "lucide-react"

interface LessonCommentsProps {
  lessonId: string
  courseId: string
  currentUserId: string
  currentUserRole: string
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

const getInitials = (name: string | null) => {
  if (!name) return "U"
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

interface CommentItemProps {
  comment: Comment
  isReply?: boolean
  currentUserId: string
  currentUserRole: string
  editingId: string | null
  editContent: string
  replyingTo: string | null
  replyContent: string
  isSubmitting: boolean
  onEditStart: (id: string, content: string) => void
  onEditSave: (id: string) => void
  onEditCancel: () => void
  onEditChange: (content: string) => void
  onReplyStart: (id: string) => void
  onReplySubmit: (id: string) => void
  onReplyCancel: () => void
  onReplyChange: (content: string) => void
  onDelete: (id: string) => void
}

const CommentItem = ({
  comment,
  isReply = false,
  currentUserId,
  currentUserRole,
  editingId,
  editContent,
  replyingTo,
  replyContent,
  isSubmitting,
  onEditStart,
  onEditSave,
  onEditCancel,
  onEditChange,
  onReplyStart,
  onReplySubmit,
  onReplyCancel,
  onReplyChange,
  onDelete,
}: CommentItemProps) => {
  const isOwner = comment.user_id === currentUserId
  const isAdmin = currentUserRole === "admin"
  const canModify = isOwner || isAdmin
  const isEditing = editingId === comment.id

  return (
    <div className={`${isReply ? "ml-12 mt-3" : "mt-4"}`}>
      <div className="flex gap-3">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={comment.user?.avatar_url || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary text-xs">
            {getInitials(comment.user?.full_name)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{comment.user?.full_name || "Unknown"}</span>
            {comment.user?.role === "admin" && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-amber-500/20 text-amber-500">
                <Shield className="h-3 w-3" />
                Instructor
              </span>
            )}
            <span className="text-xs text-muted-foreground">{formatDate(comment.created_at)}</span>
            {comment.updated_at !== comment.created_at && (
              <span className="text-xs text-muted-foreground">(edited)</span>
            )}
          </div>

          {isEditing ? (
            <div className="mt-2">
              <textarea
                value={editContent}
                onChange={(e) => onEditChange(e.target.value)}
                className="w-full p-2 text-sm bg-muted/50 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                rows={3}
              />
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  onClick={() => onEditSave(comment.id)}
                  disabled={isSubmitting}
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onEditCancel}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm mt-1 text-foreground/90 whitespace-pre-wrap break-words">
                {comment.content}
              </p>

              <div className="flex items-center gap-3 mt-2">
                {!isReply && (
                  <button
                    onClick={() => onReplyStart(comment.id)}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    <Reply className="h-3 w-3" />
                    Reply
                  </button>
                )}
                {isOwner && (
                  <button
                    onClick={() => onEditStart(comment.id, comment.content)}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    <Edit2 className="h-3 w-3" />
                    Edit
                  </button>
                )}
                {canModify && (
                  <button
                    onClick={() => onDelete(comment.id)}
                    className="text-xs text-muted-foreground hover:text-red-500 flex items-center gap-1"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </button>
                )}
              </div>
            </>
          )}

          {/* Reply input */}
          {replyingTo === comment.id && (
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={replyContent}
                onChange={(e) => onReplyChange(e.target.value)}
                placeholder="Write a reply..."
                className="flex-1 px-3 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    onReplySubmit(comment.id)
                  }
                }}
              />
              <Button
                size="sm"
                onClick={() => onReplySubmit(comment.id)}
                disabled={isSubmitting || !replyContent.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onReplyCancel}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="border-l-2 border-border pl-4 mt-3">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  isReply
                  currentUserId={currentUserId}
                  currentUserRole={currentUserRole}
                  editingId={editingId}
                  editContent={editContent}
                  replyingTo={replyingTo}
                  replyContent={replyContent}
                  isSubmitting={isSubmitting}
                  onEditStart={onEditStart}
                  onEditSave={onEditSave}
                  onEditCancel={onEditCancel}
                  onEditChange={onEditChange}
                  onReplyStart={onReplyStart}
                  onReplySubmit={onReplySubmit}
                  onReplyCancel={onReplyCancel}
                  onReplyChange={onReplyChange}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function LessonComments({
  lessonId,
  courseId,
  currentUserId,
  currentUserRole,
}: LessonCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadComments = useCallback(async () => {
    setIsLoading(true)
    const data = await getComments(lessonId)
    setComments(data)
    setIsLoading(false)
  }, [lessonId])

  useEffect(() => {
    loadComments()
  }, [loadComments])

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return

    setIsSubmitting(true)
    const result = await createComment(lessonId, courseId, newComment)

    if (result.success) {
      setNewComment("")
      await loadComments()
    } else {
      alert(result.error)
    }
    setIsSubmitting(false)
  }

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim()) return

    setIsSubmitting(true)
    const result = await createComment(lessonId, courseId, replyContent, parentId)

    if (result.success) {
      setReplyContent("")
      setReplyingTo(null)
      await loadComments()
    } else {
      alert(result.error)
    }
    setIsSubmitting(false)
  }

  const handleUpdateComment = async (commentId: string) => {
    if (!editContent.trim()) return

    setIsSubmitting(true)
    const result = await updateComment(commentId, courseId, lessonId, editContent)

    if (result.success) {
      setEditingId(null)
      setEditContent("")
      await loadComments()
    } else {
      alert(result.error)
    }
    setIsSubmitting(false)
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return

    const result = await deleteComment(commentId, courseId, lessonId)

    if (result.success) {
      await loadComments()
    } else {
      alert(result.error)
    }
  }

  return (
    <div>
      {/* New comment input */}
      <div className="flex gap-3">
        <div className="flex-1">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Ask a question or share your thoughts..."
            className="w-full p-3 text-sm bg-muted/50 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
            rows={3}
          />
          <div className="flex justify-end mt-2">
            <Button
              onClick={handleSubmitComment}
              disabled={isSubmitting || !newComment.trim()}
              size="sm"
            >
              <Send className="h-4 w-4 mr-2" />
              Post Comment
            </Button>
          </div>
        </div>
      </div>

      {/* Comments list */}
      <div className="mt-6">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No comments yet. Be the first to start a discussion!</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {comments.map((comment) => (
              <div key={comment.id} className="py-4 first:pt-0 last:pb-0">
                <CommentItem
                  comment={comment}
                  currentUserId={currentUserId}
                  currentUserRole={currentUserRole}
                  editingId={editingId}
                  editContent={editContent}
                  replyingTo={replyingTo}
                  replyContent={replyContent}
                  isSubmitting={isSubmitting}
                  onEditStart={(id, content) => {
                    setEditingId(id)
                    setEditContent(content)
                  }}
                  onEditSave={handleUpdateComment}
                  onEditCancel={() => {
                    setEditingId(null)
                    setEditContent("")
                  }}
                  onEditChange={setEditContent}
                  onReplyStart={(id) => {
                    setReplyingTo(replyingTo === id ? null : id)
                    setReplyContent("")
                  }}
                  onReplySubmit={handleSubmitReply}
                  onReplyCancel={() => {
                    setReplyingTo(null)
                    setReplyContent("")
                  }}
                  onReplyChange={setReplyContent}
                  onDelete={handleDeleteComment}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
