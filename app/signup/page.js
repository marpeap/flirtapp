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

    try {
      // Vérifier que le client Supabase est bien configuré
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Configuration Supabase manquante. Vérifiez que le fichier .env.local existe avec NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY.');
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error('Erreur Supabase signup:', error);
        setErrorMsg(error.message || 'Erreur lors de la création du compte. Vérifiez votre connexion internet.');
        setLoading(false);
        return;
      }

      if (!data) {
        setErrorMsg('Aucune donnée retournée. Vérifiez votre connexion internet.');
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error('Erreur lors de la création du compte:', err);
      setErrorMsg(err.message || 'Erreur de connexion. Vérifiez votre connexion internet et réessayez.');
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

