'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';

export default function HomePage() {
  const [loadingUser, setLoadingUser] = useState(true);
  const [user, setUser] = useState(null);
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    async function loadUser() {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user) {
        setUser(data.user);

        // récup pseudo si profil existe
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('user_id', data.user.id)
          .maybeSingle();

        if (profile?.display_name) {
          setDisplayName(profile.display_name);
        }
      } else {
        setUser(null);
      }
      setLoadingUser(false);
    }
    loadUser();
  }, []);

  if (loadingUser) {
    return <main>Chargement…</main>;
  }

  const isLoggedIn = !!user;

  if (!isLoggedIn) {
    // --- Version visiteur / non connecté ---
    return (
      <main>
        <section
          style={{
            padding: '32px 20px',
            borderRadius: 16,
            background:
              'radial-gradient(circle at top, rgba(248,113,113,0.22), rgba(15,23,42,1))',
            border: '1px solid #1f2937',
            marginBottom: 32,
          }}
        >
          <p
            style={{
              fontSize: 12,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
              color: '#fecaca',
            }}
          >
            CupidWave — Bêta
          </p>
          <h1 style={{ fontSize: 28, marginTop: 8, marginBottom: 12 }}>
            Rencontres charnelles et bienveillantes
          </h1>
          <p style={{ maxWidth: 520, color: '#fee2e2', marginBottom: 20 }}>
            Un petit espace discret pour des rencontres amicales, coquines ou
            les deux, sans algorithme opaque ni défilement infini. Tu choisis ta
            vibe, ton rayon, et tu vois qui est vraiment proche.
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/signup">
              <button>Créer mon compte</button>
            </Link>
            <Link href="/login" style={{ fontSize: 14, color: '#fda4af' }}>
              J’ai déjà un compte
            </Link>
          </div>
        </section>

        <section
          style={{
            marginBottom: 28,
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
            gap: 24,
          }}
        >
          <div>
            <h2 style={{ fontSize: 18, marginBottom: 10 }}>
              Pourquoi CupidWave existe
            </h2>
            <p style={{ color: '#e5e7eb', marginBottom: 10, fontSize: 14 }}>
              Les grosses apps demandent 100 écrans, te poussent des abonnements
              et te noient dans les profils. Ici, l’idée est de faire simple :
              quelques infos utiles, des vrais messages, et basta.
            </p>
            <p style={{ color: '#e5e7eb', fontSize: 14 }}>
              Tu remplis ton profil en 2 minutes, tu choisis qui tu cherches,
              ton rayon, et tu laisses les rencontres se faire à ton rythme.
            </p>
          </div>

          <ul style={{ listStyle: 'none', padding: 0, fontSize: 14 }}>
            <li
              style={{
                padding: 10,
                borderRadius: 10,
                border: '1px solid #1f2937',
                marginBottom: 8,
                backgroundColor: '#020617',
              }}
            >
              <strong>Simple.</strong> Un seul questionnaire, quelques filtres,
              pas de feed infini.
            </li>
            <li
              style={{
                padding: 10,
                borderRadius: 10,
                border: '1px solid #1f2937',
                marginBottom: 8,
                backgroundColor: '#020617',
              }}
            >
              <strong>Charnel mais respectueux.</strong> Tu choisis ce que tu
              montres et ce que tu racontes, sans jugement.
            </li>
            <li
              style={{
                padding: 10,
                borderRadius: 10,
                border: '1px solid #1f2937',
                backgroundColor: '#020617',
              }}
            >
              <strong>Proche de toi.</strong> Les profils sont triés par
              proximité et par attentes mutuelles.
            </li>
          </ul>
        </section>

        <section>
          <h2 style={{ fontSize: 18, marginBottom: 10 }}>Comment ça marche ?</h2>
          <ol
            style={{
              listStyle: 'decimal',
              paddingLeft: 20,
              color: '#fef9c3',
              fontSize: 14,
              lineHeight: 1.5,
            }}
          >
            <li style={{ marginBottom: 6 }}>
              Tu crées un compte puis ton profil : pseudo, vibe, ce que tu
              cherches et photo.
            </li>
            <li style={{ marginBottom: 6 }}>
              Tu choisis ton rayon et ton type de rencontres, CupidWave te
              montre les profils compatibles proches de toi.
            </li>
            <li style={{ marginBottom: 6 }}>
              Tu envoies un like ou un message privé et vous voyez si le
              courant passe.
            </li>
          </ol>
        </section>
      </main>
    );
  }

  // --- Version membre connecté ---
  const friendlyName =
    displayName || user.email?.split('@')[0] || 'toi';

  return (
    <main>
      <section
        style={{
          padding: '28px 20px',
          borderRadius: 16,
          background:
            'radial-gradient(circle at top, rgba(250,204,21,0.25), rgba(15,23,42,1))',
          border: '1px solid #1f2937',
          marginBottom: 28,
        }}
      >
        <p
          style={{
            fontSize: 12,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
            color: '#fef3c7',
          }}
        >
          Bonjour {friendlyName}
        </p>
        <h1 style={{ fontSize: 26, marginTop: 8, marginBottom: 10 }}>
          Prêt·e pour de nouvelles ondes ?
        </h1>
        <p style={{ maxWidth: 540, color: '#e5e7eb', marginBottom: 18 }}>
          Tu es connecté·e à CupidWave. Tu peux explorer les profils proches,
          lancer un Tornado, envoyer un Push Éclair ou reprendre tes messages
          là où tu les as laissés.
        </p>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
            marginBottom: 4,
          }}
        >
          <Link href="/profiles">
            <button>Voir les profils proches</button>
          </Link>
          <Link href="/matches">
            <button
              style={{
                backgroundImage:
                  'linear-gradient(135deg, #38bdf8, #4f46e5)',
              }}
            >
              Matchs suggérés
            </button>
          </Link>
          <Link href="/messages" style={{ fontSize: 14, color: '#fda4af' }}>
            Aller à mes messages
          </Link>
        </div>

        <p style={{ fontSize: 12, color: '#9ca3af' }}>
          Tu peux aussi ajuster ton profil et ta confidentialité dans “Mon
          profil” et “Compte”.
        </p>
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
          gap: 20,
        }}
      >
        <div className="card" style={{ padding: 14 }}>
          <h2 style={{ fontSize: 16, marginBottom: 6 }}>Raccourcis utiles</h2>
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              fontSize: 14,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <li>
              <Link href="/onboarding" style={{ color: '#fda4af' }}>
                Mettre à jour mon profil
              </Link>{' '}
              <span style={{ fontSize: 12, color: '#9ca3af' }}>
                (photo, intentions, qui tu cherches)
              </span>
            </li>
            <li>
              <Link href="/profiles" style={{ color: '#fda4af' }}>
                Lancer un Tornado ou un Push Éclair
              </Link>{' '}
              <span style={{ fontSize: 12, color: '#9ca3af' }}>
                depuis la page Profils
              </span>
            </li>
            <li>
              <Link href="/account" style={{ color: '#fda4af' }}>
                Gérer mes données et ma confidentialité
              </Link>
            </li>
          </ul>
        </div>

        <div className="card" style={{ padding: 14 }}>
          <h2 style={{ fontSize: 16, marginBottom: 6 }}>Conseil du moment</h2>
          <p style={{ fontSize: 13, color: '#e5e7eb', marginBottom: 6 }}>
            Les profils qui ont une description claire et une photo nette
            reçoivent beaucoup plus de réponses que les profils vides. Prends
            une minute pour dire ce que tu cherches vraiment.
          </p>
          <p style={{ fontSize: 12, color: '#9ca3af' }}>
            Tu peux aussi utiliser les réactions avec emojis et les
            icebreakers sur chaque profil pour briser la glace sans prise de
            tête.
          </p>
        </div>
      </section>
    </main>
  );
}

