import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase não configurado: defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY em app/.env (veja .env.example).'
  );
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '', {
  auth: {
    // sessionStorage isola a sessão por aba, permitindo que usuários diferentes
    // (admin, guia, comum) fiquem logados simultaneamente em abas separadas
    // sem que o login de um sobrescreva a sessão do outro (o que acontece com
    // o localStorage padrão, compartilhado entre abas da mesma origem).
    storage: window.sessionStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
