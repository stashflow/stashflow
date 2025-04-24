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
      note_ratings: {
        Row: {
          id: string
          note_id: string
          user_id: string
          rating: number
          created_at: string
        }
        Insert: {
          id?: string
          note_id: string
          user_id: string
          rating: number
          created_at?: string
        }
        Update: {
          id?: string
          note_id?: string
          user_id?: string
          rating?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_ratings_note_id_fkey"
            columns: ["note_id"]
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_ratings_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      notes: {
        Row: {
          id: string
          created_at: string
          title: string
          pdf_url: string
          uploader_id: string
          course_prefix: string
          course_number: number
          professor: string
          semester: string
          keywords: string[] | null
          description: string | null
          average_rating: number | null
          ratings_count: number | null
        }
        Insert: {
          id?: string
          created_at?: string
          title: string
          pdf_url: string
          uploader_id: string
          course_prefix: string
          course_number: number
          professor: string
          semester: string
          keywords?: string[] | null
          description?: string | null
          average_rating?: number | null
          ratings_count?: number | null
        }
        Update: {
          id?: string
          created_at?: string
          title?: string
          pdf_url?: string
          uploader_id?: string
          course_prefix?: string
          course_number?: number
          professor?: string
          semester?: string
          keywords?: string[] | null
          description?: string | null
          average_rating?: number | null
          ratings_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "notes_uploader_id_fkey"
            columns: ["uploader_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      note_comments: {
        Row: {
          id: string
          note_id: string
          user_id: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          note_id: string
          user_id: string
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          note_id?: string
          user_id?: string
          content?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_comments_note_id_fkey"
            columns: ["note_id"]
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_comments_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      comment_likes: {
        Row: {
          id: string
          comment_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          comment_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          comment_id?: string
          user_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            referencedRelation: "note_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_likes_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_reputation: {
        Row: {
          id: string
          user_id: string
          total_points: number
          uploads_count: number
          ratings_count: number
          comments_count: number
          received_likes_count: number
          level: number
        }
        Insert: {
          id?: string
          user_id: string
          total_points?: number
          uploads_count?: number
          ratings_count?: number
          comments_count?: number
          received_likes_count?: number
          level?: number
        }
        Update: {
          id?: string
          user_id?: string
          total_points?: number
          uploads_count?: number
          ratings_count?: number
          comments_count?: number
          received_likes_count?: number
          level?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_reputation_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_badges: {
        Row: {
          id: string
          user_id: string
          badge_type: string
          badge_name: string
          badge_description: string
          awarded_at: string
        }
        Insert: {
          id?: string
          user_id: string
          badge_type: string
          badge_name: string
          badge_description: string
          awarded_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          badge_type?: string
          badge_name?: string
          badge_description?: string
          awarded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          updated_at: string | null
          username: string | null
          avatar_url: string | null
        }
        Insert: {
          id: string
          updated_at?: string | null
          username?: string | null
          avatar_url?: string | null
        }
        Update: {
          id?: string
          updated_at?: string | null
          username?: string | null
          avatar_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      notes_with_ratings: {
        Row: {
          id: string | null
          created_at: string | null
          title: string | null
          pdf_url: string | null
          uploader_id: string | null
          course_prefix: string | null
          course_number: number | null
          professor: string | null
          semester: string | null
          keywords: string[] | null
          description: string | null
          uploader_email: string | null
          average_rating: number | null
          ratings_count: number | null
          user_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notes_uploader_id_fkey"
            columns: ["uploader_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      comments_with_users: {
        Row: {
          id: string | null
          note_id: string | null
          user_id: string | null
          content: string | null
          created_at: string | null
          updated_at: string | null
          email: string | null
          avatar_url: string | null
          user_name: string | null
          likes_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "note_comments_note_id_fkey"
            columns: ["note_id"]
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_comments_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_reputation_with_badges: {
        Row: {
          id: string | null
          user_id: string | null
          total_points: number | null
          uploads_count: number | null
          ratings_count: number | null
          comments_count: number | null
          received_likes_count: number | null
          level: number | null
          total_badges: number | null
          gold_badges: number | null
          silver_badges: number | null
          bronze_badges: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_reputation_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
} 