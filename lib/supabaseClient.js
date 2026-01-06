import { createClient } from '@supabase/supabase-js';

// Utiliser les mêmes variables d'environnement que la version mobile
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

// Vérification en développement
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Variables Supabase manquantes. Assurez-vous que NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY sont définies.');
  }
}

// Vérifier que les variables sont définies avant de créer le client
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ ERREUR: Variables Supabase manquantes!');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✓' : '✗');
  console.error('Assurez-vous que le fichier .env.local existe dans le répertoire web/');
}

// Créer le client avec les mêmes options que la version mobile
// pour garantir la compatibilité et le partage de session
export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true, // Important pour Next.js
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

