import { createClient } from '@supabase/supabase-js';

// Utiliser les mêmes variables d'environnement que la version mobile
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

// #region agent log
// Vérification en développement
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('🔵 Configuration Supabase côté client:');
  console.log('🔵 URL:', supabaseUrl ? `✓ ${supabaseUrl.substring(0, 30)}...` : '✗ Manquante');
  console.log('🔵 Anon Key:', supabaseAnonKey ? `✓ ${supabaseAnonKey.substring(0, 20)}...` : '✗ Manquante');
  fetch('http://127.0.0.1:7244/ingest/b52ac800-6cee-4c21-a14d-e8a882350bc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'supabaseClient.js:8',message:'Supabase client initialization check',data:{hasUrl:!!supabaseUrl,urlPrefix:supabaseUrl?.substring(0,30)||null,hasKey:!!supabaseAnonKey,keyPrefix:supabaseAnonKey?.substring(0,20)||null,nodeEnv:process.env.NODE_ENV},timestamp:Date.now(),sessionId:'debug-session',runId:'init',hypothesisId:'B'})}).catch(()=>{});
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Variables Supabase manquantes. Assurez-vous que NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY sont définies.');
    console.warn('⚠️ Vérifiez que le fichier .env.local existe dans le répertoire web/');
    console.warn('⚠️ Redémarrez le serveur Next.js après avoir créé/modifié .env.local');
    fetch('http://127.0.0.1:7244/ingest/b52ac800-6cee-4c21-a14d-e8a882350bc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'supabaseClient.js:13',message:'Missing Supabase env vars warning',data:{missingUrl:!supabaseUrl,missingKey:!supabaseAnonKey},timestamp:Date.now(),sessionId:'debug-session',runId:'init',hypothesisId:'B'})}).catch(()=>{});
  }
}
// #endregion

// #region agent log
// Vérifier que les variables sont définies avant de créer le client
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ ERREUR: Variables Supabase manquantes!');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✓' : '✗');
  console.error('Assurez-vous que le fichier .env.local existe dans le répertoire web/');
  console.error('Redémarrez le serveur Next.js après avoir créé/modifié .env.local');
  fetch('http://127.0.0.1:7244/ingest/b52ac800-6cee-4c21-a14d-e8a882350bc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'supabaseClient.js:21',message:'Critical: Missing Supabase env vars',data:{hasUrl:!!supabaseUrl,hasKey:!!supabaseAnonKey,envKeys:Object.keys(process.env).filter(k=>k.includes('SUPABASE'))},timestamp:Date.now(),sessionId:'debug-session',runId:'init',hypothesisId:'B'})}).catch(()=>{});
}
// #endregion

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

// #region agent log
// Log de confirmation en développement
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('✅ Client Supabase initialisé');
  fetch('http://127.0.0.1:7244/ingest/b52ac800-6cee-4c21-a14d-e8a882350bc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'supabaseClient.js:49',message:'Supabase client created successfully',data:{url:supabaseUrl?.substring(0,40)||null,hasKey:!!supabaseAnonKey},timestamp:Date.now(),sessionId:'debug-session',runId:'init',hypothesisId:'D'})}).catch(()=>{});
}
// #endregion


