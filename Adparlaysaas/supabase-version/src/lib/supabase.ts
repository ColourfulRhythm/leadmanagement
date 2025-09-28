import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Database types
export interface Database {
  public: {
    Tables: {
      forms: {
        Row: {
          id: string
          title: string
          description?: string
          created_at: string
          updated_at: string
          is_published: boolean
          user_id: string
        }
        Insert: {
          id?: string
          title: string
          description?: string
          created_at?: string
          updated_at?: string
          is_published?: boolean
          user_id: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          created_at?: string
          updated_at?: string
          is_published?: boolean
          user_id?: string
        }
      }
      form_blocks: {
        Row: {
          id: string
          form_id: string
          title: string
          description?: string
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          form_id: string
          title: string
          description?: string
          order_index: number
          created_at?: string
        }
        Update: {
          id?: string
          form_id?: string
          title?: string
          description?: string
          order_index?: number
          created_at?: string
        }
      }
      form_questions: {
        Row: {
          id: string
          block_id: string
          type: string
          label: string
          help_text?: string
          required: boolean
          options?: string[]
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          block_id: string
          type: string
          label: string
          help_text?: string
          required?: boolean
          options?: string[]
          order_index: number
          created_at?: string
        }
        Update: {
          id?: string
          block_id?: string
          type?: string
          label?: string
          help_text?: string
          required?: boolean
          options?: string[]
          order_index?: number
          created_at?: string
        }
      }
      form_submissions: {
        Row: {
          id: string
          form_id: string
          user_id?: string
          answers: Record<string, any>
          created_at: string
        }
        Insert: {
          id?: string
          form_id: string
          user_id?: string
          answers: Record<string, any>
          created_at?: string
        }
        Update: {
          id?: string
          form_id?: string
          user_id?: string
          answers?: Record<string, any>
          created_at?: string
        }
      }
    }
  }
}
