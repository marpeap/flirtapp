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

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
    } else {
      // après login réussi, on t’enverra vers la page principale
      router.push('/');
    }
  }

  return (
    <main style={{ maxWidth: 400, margin: '40px auto', color: 'white' }}>
      <h1>Connexion</h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          />
        </label>

        <label>
          Mot de passe
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          style={{ padding: 10, marginTop: 8 }}
        >
          {loading ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>

      {errorMsg && (
        <p style={{ color: 'red', marginTop: 16 }}>{errorMsg}</p>
      )}
    </main>
  );
}

