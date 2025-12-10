
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qqupjuyebqaajpvhhwpk.supabase.co'
const supabaseAnonKey = 'sb_publishable_S-b2b-pAyD4wwtexHVGeOQ_qTTyuZcE'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
