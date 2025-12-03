'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    // Connexion email + mot de passe (modèle recommandé par Supabase pour Next.js) [web:1016][web:317]
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    // Redirection simple après connexion (tu pourras affiner plus tard)
    router.push('/');
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

