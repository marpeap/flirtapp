'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    // Après inscription, on envoie directement sur la création de profil
    router.push('/onboarding');
  }

  return (
    <main>
      <div className="card" style={{ maxWidth: 420, margin: '0 auto' }}>
        <h1>Créer un compte</h1>
        <p style={{ marginBottom: 18, color: '#9ca3af', fontSize: 14 }}>
          Un email, un mot de passe, et tu peux commencer à rencontrer du monde.
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
              placeholder="Au moins 6 caractères"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            style={{ marginTop: 4, alignSelf: 'flex-start' }}
          >
            {loading ? 'Création…' : 'Créer mon compte'}
          </button>
        </form>

        {errorMsg && (
          <p style={{ color: 'tomato', marginTop: 16, fontSize: 14 }}>
            {errorMsg}
          </p>
        )}

        <p style={{ marginTop: 16, fontSize: 13, color: '#9ca3af' }}>
          Tu as déjà un compte ?{' '}
          <a href="/login" style={{ color: '#7dd3fc' }}>
            Me connecter
          </a>
        </p>
      </div>
    </main>
  );
}

