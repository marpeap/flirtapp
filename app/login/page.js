'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '../../lib/supabaseClient';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState(() => {
    if (searchParams?.get('push_success')) {
      return 'Paiement réussi. Tes crédits seront bientôt mis à jour.';
    }
    if (searchParams?.get('push_canceled')) {
      return 'Paiement annulé. Aucun débit n’a été effectué.';
    }
    return '';
  });

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    // Si connexion OK, on envoie vers la home qui adapte selon logged-in
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
      {/* Image de fond plein écran spécifique à la page login */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: -2,
        }}
      >
        <Image
          src="/background-login.png"
          alt="Fond de connexion CupidWave"
          fill
          priority
          sizes="100vw"
          style={{
            objectFit: 'cover',
          }}
        />
      </div>

      {/* Overlay sombre pour lisibilité du formulaire */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background:
            'radial-gradient(circle at top, rgba(15,23,42,0.45), rgba(15,23,42,0.9))',
          zIndex: -1,
        }}
      />

      {/* Carte glassmorphism avec le formulaire de connexion */}
      <div
        className="card"
        style={{
          maxWidth: 420,
          width: '100%',
        }}
      >
        <h1>Me connecter à CupidWave</h1>
        <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 14 }}>
          Retrouve tes discussions, tes réactions et ton Mode Tornado là où tu
          les as laissés.
        </p>

        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ton mot de passe"
              style={{ marginTop: 4, width: '100%' }}
            />
          </label>

          <button type="submit" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? 'Connexion en cours…' : 'Me connecter'}
          </button>
        </form>

        <p style={{ fontSize: 13, marginTop: 10 }}>
          Pas encore de compte ?{' '}
          <a href="/signup" style={{ color: '#fda4af' }}>
            Créer mon compte
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

