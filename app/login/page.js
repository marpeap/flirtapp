'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

// Wrapper exporté par défaut, sans useSearchParams à l'intérieur
export default function LoginPage() {
  return (
    <Suspense fallback={<main>Chargement de la page de connexion…</main>}>
      <LoginContent />
    </Suspense>
  );
}

// Contenu réel de la page : ici on peut utiliser useSearchParams
function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams(); // OK car enveloppé par <Suspense> [web:1009][web:1001]

  // Paramètre optionnel pour rediriger après connexion: /login?redirectTo=/profiles
  const redirectTo = searchParams.get('redirectTo') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    // Login par email + mot de passe (adapte si tu utilises OTP ou social login) [web:1016][web:317]
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    // Redirection après succès
    router.push(redirectTo);
  }

  return (
    <main
      style={{
        maxWidth: 420,
        margin: '0 auto',
        padding: '32px 16px 40px',
      }}
    >
      <div className="card">
        <h1 style={{ marginBottom: 8 }}>Connexion</h1>
        <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 12 }}>
          Connecte‑toi pour continuer sur ManyLovr.
        </p>

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
        >
          <label style={{ fontSize: 13 }}>
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ marginTop: 4, width: '100%' }}
            />
          </label>

          <label style={{ fontSize: 13 }}>
            Mot de passe
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ marginTop: 4, width: '100%' }}
            />
          </label>

          <button type="submit" disabled={loading}>
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        {errorMsg && (
          <p
            style={{
              marginTop: 8,
              fontSize: 12,
              color: 'tomato',
            }}
          >
            {errorMsg}
          </p>
        )}
      </div>
    </main>
  );
}

