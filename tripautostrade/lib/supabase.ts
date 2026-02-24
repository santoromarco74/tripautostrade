import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gkyahazhuvtiqersqlmh.supabase.co';
const SUPABASE_KEY = 'sb_publishable_4iee5t_pvQt5ZMGOnkcuWA_CENLTuFZ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
