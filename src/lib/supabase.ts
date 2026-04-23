import { createClient } from '@supabase/supabase-js';

// URL Supabase Anda (Pastikan tidak ada spasi di awal/akhir)
const supabaseUrl = 'https://pjjayeiusyqtrzztkbqt.supabase.co';
// Gunakan Anon Key (Ini adalah kunci publik standar Supabase)
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqamF5ZWl1c3lxdHJ6enRrYnF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4NDI5MDgsImV4cCI6MjA5MjQxODkwOH0.fy15e3TpT2vFZV3ePK-UFDr0Uq7cnBMr29QcDEj5YAM'.trim();

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  }
});
