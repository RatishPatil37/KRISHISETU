import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://awldamekqajcfbqfwwge.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_87c-6w_xL70ZVmCWdO0yDQ_muFlIsha';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);