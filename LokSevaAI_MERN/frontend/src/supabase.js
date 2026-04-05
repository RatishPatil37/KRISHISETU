import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ofvvofbpxwkrnowhzmoh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mdnZvZmJweHdrcm5vd2h6bW9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNjc1NzEsImV4cCI6MjA4ODY0MzU3MX0.sscHTe1AqEdqP1e80kx1yX5wzSZNQufueYrjda2gzZU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);