'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '../../lib/supabaseClient';

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    setLoading(true);

    // #region agent log
    const signupStartTime = Date.now();
    fetch('http://127.0.0.1:7244/ingest/b52ac800-6cee-4c21-a14d-e8a882350bc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'signup/page.js:16',message:'Signup form submitted',data:{email:email?.substring(0,20)||null,hasPassword:!!password,supabaseInitialized:!!supabase},timestamp:signupStartTime,sessionId:'debug-session',runId:'signup',hypothesisId:'D'})}).catch(()=>{});
    // #endregion

    try {
      console.log('🔵 Tentative de création de compte pour:', email);
      console.log('🔵 Client Supabase:', supabase ? '✓ Initialisé' : '✗ Non initialisé');
      
      // Vérifier que le client Supabase est bien initialisé
      if (!supabase) {
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/b52ac800-6cee-4c21-a14d-e8a882350bc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'signup/page.js:27',message:'Supabase client not initialized error',data:{email:email?.substring(0,20)||null},timestamp:Date.now(),sessionId:'debug-session',runId:'signup',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        throw new Error('Client Supabase non initialisé. Vérifiez la configuration.');
      }

      // #region agent log
      const apiCallStartTime = Date.now();
      fetch('http://127.0.0.1:7244/ingest/b52ac800-6cee-4c21-a14d-e8a882350bc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'signup/page.js:31',message:'Calling supabase.auth.signUp',data:{email:email?.substring(0,20)||null,hasPassword:!!password},timestamp:apiCallStartTime,sessionId:'debug-session',runId:'signup',hypothesisId:'C'})}).catch(()=>{});
      // #endregion

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      // #region agent log
      const apiCallEndTime = Date.now();
      fetch('http://127.0.0.1:7244/ingest/b52ac800-6cee-4c21-a14d-e8a882350bc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'signup/page.js:36',message:'Supabase signUp response received',data:{hasData:!!data,hasError:!!error,errorMessage:error?.message||null,errorName:error?.name||null,errorStatus:error?.status||null,userId:data?.user?.id||null,duration:apiCallEndTime-apiCallStartTime},timestamp:apiCallEndTime,sessionId:'debug-session',runId:'signup',hypothesisId:'C'})}).catch(()=>{});
      // #endregion

      console.log('🔵 Réponse Supabase:', { data: data ? '✓ Données reçues' : '✗ Aucune donnée', error: error ? error.message : 'Aucune erreur' });

      if (error) {
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/b52ac800-6cee-4c21-a14d-e8a882350bc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'signup/page.js:38',message:'Supabase signUp returned error',data:{errorMessage:error.message,errorStatus:error.status,errorName:error.name,email:email?.substring(0,20)||null},timestamp:Date.now(),sessionId:'debug-session',runId:'signup',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        console.error('❌ Erreur Supabase signup:', error);
        console.error('❌ Détails:', {
          message: error.message,
          status: error.status,
          name: error.name
        });
        setErrorMsg(error.message || 'Erreur lors de la création du compte. Vérifiez votre connexion internet.');
        setLoading(false);
        return;
      }

      if (!data) {
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/b52ac800-6cee-4c21-a14d-e8a882350bc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'signup/page.js:50',message:'No data returned from Supabase',data:{email:email?.substring(0,20)||null},timestamp:Date.now(),sessionId:'debug-session',runId:'signup',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        console.error('❌ Aucune donnée retournée par Supabase');
        setErrorMsg('Aucune donnée retournée. Vérifiez votre connexion internet.');
        setLoading(false);
        return;
      }

      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/b52ac800-6cee-4c21-a14d-e8a882350bc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'signup/page.js:57',message:'Signup successful',data:{userId:data.user?.id||null,email:email?.substring(0,20)||null,totalDuration:Date.now()-signupStartTime},timestamp:Date.now(),sessionId:'debug-session',runId:'signup',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      console.log('✅ Compte créé avec succès:', data.user?.id);
    } catch (err) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/b52ac800-6cee-4c21-a14d-e8a882350bc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'signup/page.js:58',message:'Exception caught during signup',data:{errorType:err?.constructor?.name,errorMessage:err?.message,errorName:err?.name,hasStack:!!err?.stack,email:email?.substring(0,20)||null,isNetworkError:err?.message?.includes('Failed to fetch')||err?.name==='TypeError',totalDuration:Date.now()-signupStartTime},timestamp:Date.now(),sessionId:'debug-session',runId:'signup',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      console.error('❌ Erreur lors de la création du compte:', err);
      console.error('❌ Type d\'erreur:', err?.constructor?.name);
      console.error('❌ Message:', err?.message);
      console.error('❌ Stack:', err?.stack);
      
      // Gérer spécifiquement les erreurs de réseau
      if (err?.message?.includes('Failed to fetch') || err?.name === 'TypeError') {
        setErrorMsg('Erreur de connexion au serveur. Vérifiez que le serveur Next.js est démarré et que le fichier .env.local existe avec les bonnes valeurs. Redémarrez le serveur si nécessaire.');
      } else {
        setErrorMsg(err.message || 'Erreur de connexion. Vérifiez votre connexion internet et réessayez.');
      }
      setLoading(false);
      return;
    }

    setLoading(false);

    // Selon la config Supabase, un email de confirmation peut être envoyé.
    setInfoMsg(
      "Ton compte a été créé. Si la confirmation par e‑mail est activée, pense à vérifier ta boîte mail. Tu peux maintenant compléter ton profil."
    );

    // Redirection douce vers l’onboarding après un petit délai
    setTimeout(() => {
      router.push('/onboarding');
    }, 1500);
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
      }}
    >
      {/* Image de fond plein écran */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: -2,
        }}
      >
        <Image
          src="/signup_bg.png"
          alt="Fond ManyLovr"
          fill
          priority
          sizes="100vw"
          style={{
            objectFit: 'cover',
          }}
        />
      </div>

      {/* Overlay sombre léger pour garder le texte lisible */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background:
            'radial-gradient(circle at top, rgba(15,23,42,0.4), rgba(15,23,42,0.9))',
          zIndex: -1,
        }}
      />

      {/* Carte glassmorphism avec le formulaire */}
      <div
        className="card"
        style={{
          maxWidth: 420,
          width: '100%',
        }}
      >
        <h1>Créer mon compte ManyLovr</h1>
        <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 14 }}>
          Un e‑mail et un mot de passe suffisent pour commencer. Tu pourras
          ensuite compléter ton profil et choisir le type de chats en ligne que tu
          cherches.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label style={{ fontSize: 13 }}>
            Adresse e‑mail
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="toi@example.com"
              style={{ marginTop: 4, width: '100%' }}
            />
          </label>

          <label style={{ fontSize: 13 }}>
            Mot de passe
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Au moins 6 caractères"
              style={{ marginTop: 4, width: '100%' }}
            />
          </label>

          <button type="submit" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? 'Création en cours…' : 'Créer mon compte'}
          </button>
        </form>

        <p style={{ fontSize: 13, marginTop: 10 }}>
          Tu as déjà un compte ?{' '}
          <a href="/login" style={{ color: '#fda4af' }}>
            Me connecter
          </a>
        </p>

        {errorMsg && (
          <p style={{ color: 'tomato', marginTop: 10, fontSize: 13 }}>
            {errorMsg}
          </p>
        )}
        {infoMsg && (
          <p style={{ color: '#a3e635', marginTop: 10, fontSize: 13 }}>
            {infoMsg}
          </p>
        )}
      </div>
    </main>
  );
}

