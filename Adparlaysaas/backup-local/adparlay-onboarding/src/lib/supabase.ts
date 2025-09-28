import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://jsiaxncamphtmbbjobxi.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzaWF4bmNhbXBodG1iYmpvYnhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1OTg0MTksImV4cCI6MjA3MTE3NDQxOX0.ra_8pPPyQjLrSnuC-5jtLtsKOZ_DbZHReA6TyHwzXOo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Form {
  id: string;
  title: string;
  form_name?: string;
  blocks: any[];
  questions: any[];
  media: any;
  form_style?: any;
  user_id: string;
  created_at: string;
  updated_at: string;
  is_published: boolean;
  share_url?: string;
}

export interface FormResponse {
  id: string;
  form_id: string;
  form_title: string;
  form_data: any;
  user_id?: string;
  created_at: string;
  ip_address?: string;
  user_agent?: string;
}

export interface Analytics {
  id: string;
  form_id: string;
  event_type: 'view' | 'start' | 'complete' | 'abandon';
  timestamp: string;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
}
