import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://zoaseopyyifktrnbjajp.supabase.co";
const SUPABASE_KEY = "sb_publishable_u7vVqOU1ctsbaAt5pRl9_g_xL4a62Xh";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);