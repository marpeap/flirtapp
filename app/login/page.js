'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');
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

    if (data?.user) {
      router.push('/profiles');
    }
  }

  return (
    <main>
      <div className="card" style={{ maxWidth: 420, margin: '0 auto' }}>
        <h1>Connexion</h1>
        <p style={{ marginBottom: 18, color: '#9ca3af', fontSize: 14 }}>
          Retrouve ton compte et tes conversations.
        </p>

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ marginTop: 4 }}
              placeholder="toi@example.com"
            />
          </label>

          <label>
            Mot de passe
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ marginTop: 4 }}
              placeholder="••••••••"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            style={{ marginTop: 4, alignSelf: 'flex-start' }}
          >
            {loading ? 'Connexion…' : 'Me connecter'}
          </button>
        </form>

        {errorMsg && (
          <p style={{ color: 'tomato', marginTop: 16, fontSize: 14 }}>
            {errorMsg}
          </p>
        )}

        <p style={{ marginTop: 16, fontSize: 13, color: '#9ca3af' }}>
          Pas encore de compte ?{' '}
          <a href="/signup" style={{ color: '#7dd3fc' }}>
            Créer un profil
          </a>
        </p>
      </div>
    </main>
  );
}

