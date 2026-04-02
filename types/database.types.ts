export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: 'user' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'user' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'user' | 'admin'
          created_at?: string
          updated_at?: string
        }
      }
      courses: {
        Row: {
          id: string
          title: string
          description: string
          thumbnail_url: string | null
          instructor_name: string
          duration: number
          category: string | null
          created_at: string
          updated_at: string
          published: boolean
          promo_deadline: string | null
        }
        Insert: {
          id?: string
          title: string
          description: string
          thumbnail_url?: string | null
          instructor_name: string
          duration: number
          category?: string | null
          created_at?: string
          updated_at?: string
          published?: boolean
        }
        Update: {
          id?: string
          title?: string
          description?: string
          thumbnail_url?: string | null
          instructor_name?: string
          duration?: number
          category?: string | null
          created_at?: string
          updated_at?: string
          published?: boolean
        }
      }
      lessons: {
        Row: {
          id: string
          course_id: string
          title: string
          description: string | null
          vimeo_video_id: string
          order: number
          duration: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          course_id: string
          title: string
          description?: string | null
          vimeo_video_id: string
          order: number
          duration: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          title?: string
          description?: string | null
          vimeo_video_id?: string
          order?: number
          duration?: number
          created_at?: string
          updated_at?: string
        }
      }
      enrollments: {
        Row: {
          id: string
          user_id: string
          course_id: string
          enrolled_at: string
        }
        Insert: {
          id?: string
          user_id: string
          course_id: string
          enrolled_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          course_id?: string
          enrolled_at?: string
        }
      }
      lesson_progress: {
        Row: {
          id: string
          user_id: string
          lesson_id: string
          course_id: string
          completed: boolean
          last_position: number
          last_watched_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          lesson_id: string
          course_id: string
          completed?: boolean
          last_position?: number
          last_watched_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          lesson_id?: string
          course_id?: string
          completed?: boolean
          last_position?: number
          last_watched_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      free_videos: {
        Row: {
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
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          vimeo_video_id: string
          thumbnail_url?: string | null
          duration?: number
          is_featured?: boolean
          order_index?: number
          published?: boolean
          view_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          vimeo_video_id?: string
          thumbnail_url?: string | null
          duration?: number
          is_featured?: boolean
          order_index?: number
          published?: boolean
          view_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      video_views: {
        Row: {
          id: string
          video_id: string
          user_id: string | null
          ip_hash: string | null
          watch_duration: number
          completed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          video_id: string
          user_id?: string | null
          ip_hash?: string | null
          watch_duration?: number
          completed?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          video_id?: string
          user_id?: string | null
          ip_hash?: string | null
          watch_duration?: number
          completed?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'user' | 'admin'
    }
  }
}
