import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fidsdbgurwkyynazclcv.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpZHNkYmd1cndreXluYXpjbGN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0OTY1MTMsImV4cCI6MjA4OTA3MjUxM30.WuZ17Dh7_-ADd-A9Sn7nEB3S21RqG73wRSYjpmQ8oNk';

export const supabase = createClient(supabaseUrl, supabaseKey);
