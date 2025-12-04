'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
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
          src="/login-bg.png"
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
            'radial-gradient(circle at top, rgba(15, 15, 35, 0.4), rgba(15, 15, 35, 0.85))',
          zIndex: -1,
        }}
      />

      <div
        style={{
          maxWidth: 420,
          width: '100%',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div className="card">
          <h1 style={{ marginBottom: 8 }}>Connexion</h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
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

          <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: 8 }}>
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <p style={{ fontSize: 13, marginTop: 12, textAlign: 'center' }}>
          Tu n'as pas encore de compte ?{' '}
          <a href="/signup" style={{ color: 'var(--color-primary-light)' }}>
            Créer un compte
          </a>
        </p>

        {errorMsg && (
          <p
            style={{
              marginTop: 12,
              fontSize: 13,
              color: 'var(--color-error)',
              textAlign: 'center',
            }}
          >
            {errorMsg}
          </p>
        )}
        </div>
      </div>
    </main>
  );
}

