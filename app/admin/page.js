'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

const ADMIN_EMAIL = 'azajbs@gmail.com';

export default function AdminPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [stats, setStats] = useState({
    profilesCount: null,
    conversationsCount: null,
  });
  const [latestProfiles, setLatestProfiles] = useState([]);

  useEffect(() => {
    async function init() {
      setLoading(true);
      setErrorMsg('');

      // Vérifier l’utilisateur connecté
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser(); // [web:624]

      if (userError || !user) {
        setLoading(false);
        router.replace('/login');
        return;
      }

      if (user.email !== ADMIN_EMAIL) {
        setLoading(false);
        router.replace('/');
        return;
      }

      setIsAdmin(true);

      // Charger quelques stats simples
      try {
        const [
          { count: profilesCount, error: profErr },
          { count: convCount, error: convErr },
          { data: latest, error: latestErr },
        ] = await Promise.all([
          supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true }),
          supabase
            .from('conversations')
            .select('id', { count: 'exact', head: true }),
          supabase
            .from('profiles')
            .select('id, display_name, city, gender, main_intent, created_at')
            .order('created_at', { ascending: false })
            .limit(10),
        ]); // [web:317]

        if (profErr || convErr || latestErr) {
          setErrorMsg(
            profErr?.message || convErr?.message || latestErr?.message
          );
        }

        setStats({
          profilesCount: profilesCount ?? 0,
          conversationsCount: convCount ?? 0,
        });
        setLatestProfiles(latest || []);
      } catch (err) {
        console.error(err);
        setErrorMsg('Erreur lors du chargement des données admin.');
      }

      setLoading(false);
    }

    init();
  }, [router]);

  if (loading) {
    return <main>Chargement de l’espace admin…</main>;
  }

  if (!isAdmin) {
    return (
      <main>
        <p>Accès refusé.</p>
      </main>
    );
  }

  return (
    <main
      style={{
        maxWidth: 960,
        margin: '0 auto',
        padding: '16px 12px 40px',
      }}
    >
      <button
        type="button"
        onClick={() => router.push('/')}
        style={{
          marginBottom: 12,
          fontSize: 13,
          padding: '4px 10px',
          backgroundImage: 'linear-gradient(135deg,#4b5563,#020617)',
          color: '#e5e7eb',
        }}
      >
        ← Retour à l’app
      </button>

      <h1 style={{ marginBottom: 6 }}>Admin CupidWave</h1>
      <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 16 }}>
        Cet espace est visible uniquement pour le compte {ADMIN_EMAIL}. De
        nouvelles fonctionnalités (modération, statistiques détaillées, gestion
        des groupes) seront ajoutées ici plus tard.
      </p>

      {errorMsg && (
        <p style={{ color: 'tomato', marginBottom: 12, fontSize: 13 }}>
          {errorMsg}
        </p>
      )}

      {/* Bloc stats globales */}
      <section
        className="card"
        style={{
          marginBottom: 16,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
        }}
      >
        <div
          style={{
            padding: '10px 12px',
            borderRadius: 10,
            border: '1px solid #1f2937',
            backgroundColor: '#020617',
          }}
        >
          <h2 style={{ fontSize: 14, marginBottom: 4 }}>Profils</h2>
          <p style={{ fontSize: 24, fontWeight: 'bold' }}>
            {stats.profilesCount ?? '—'}
          </p>
          <p style={{ fontSize: 12, color: '#9ca3af' }}>
            Nombre total de profils dans la table profiles.
          </p>
        </div>

        <div
          style={{
            padding: '10px 12px',
            borderRadius: 10,
            border: '1px solid #1f2937',
            backgroundColor: '#020617',
          }}
        >
          <h2 style={{ fontSize: 14, marginBottom: 4 }}>Conversations</h2>
          <p style={{ fontSize: 24, fontWeight: 'bold' }}>
            {stats.conversationsCount ?? '—'}
          </p>
          <p style={{ fontSize: 12, color: '#9ca3af' }}>
            Nombre total de conversations dans la table conversations.
          </p>
        </div>
      </section>

      {/* Bloc derniers profils */}
      <section className="card">
        <h2 style={{ fontSize: 15, marginBottom: 8 }}>
          Derniers profils créés
        </h2>
        {latestProfiles.length === 0 ? (
          <p style={{ fontSize: 13, color: '#9ca3af' }}>
            Aucun profil trouvé pour le moment.
          </p>
        ) : (
          <div
            style={{
              maxHeight: '50vh',
              overflowY: 'auto',
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 12,
              }}
            >
              <thead>
                <tr
                  style={{
                    textAlign: 'left',
                    borderBottom: '1px solid #1f2937',
                  }}
                >
                  <th style={{ padding: '6px 4px' }}>Pseudo</th>
                  <th style={{ padding: '6px 4px' }}>Ville</th>
                  <th style={{ padding: '6px 4px' }}>Genre</th>
                  <th style={{ padding: '6px 4px' }}>Intention</th>
                  <th style={{ padding: '6px 4px' }}>Créé le</th>
                </tr>
              </thead>
              <tbody>
                {latestProfiles.map((p) => (
                  <tr
                    key={p.id}
                    style={{
                      borderBottom: '1px solid #0f172a',
                    }}
                  >
                    <td style={{ padding: '6px 4px' }}>
                      {p.display_name || 'Sans pseudo'}
                    </td>
                    <td style={{ padding: '6px 4px' }}>{p.city || '—'}</td>
                    <td style={{ padding: '6px 4px' }}>{p.gender || '—'}</td>
                    <td style={{ padding: '6px 4px' }}>
                      {p.main_intent || '—'}
                    </td>
                    <td style={{ padding: '6px 4px', whiteSpace: 'nowrap' }}>
                      {p.created_at
                        ? new Date(p.created_at).toLocaleString()
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

