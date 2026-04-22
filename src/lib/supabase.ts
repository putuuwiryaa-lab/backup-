import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pjjayeiusyqtrzztkbqt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqamF5ZWl1c3lxdHJ6enRrYnF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njg0MjkwOCwiZXhwIjoyMDkyNDE4OTA4fQ.KUePy-klieHQlubbSZWL04ZyGuPvltAs3zzMMzQ1t80'.trim();

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
