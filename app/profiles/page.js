'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function ProfilesListPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [filterIntent, setFilterIntent] = useState('');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setErrorMsg('');

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        setLoading(false);
        router.push('/login');
        return;
      }

      const currentUserId = userData.user.id;

      const { data: ownProfileRows, error: ownProfileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', currentUserId)
        .limit(1);

      if (ownProfileError) {
        setErrorMsg(ownProfileError.message);
        setLoading(false);
        return;
      }

      const hasProfile = ownProfileRows && ownProfileRows.length > 0;
      if (!hasProfile) {
        setLoading(false);
        router.push('/onboarding');
        return;
      }

      let query = supabase
        .from('profiles')
        .select(
          'id, user_id, display_name, gender, main_intent, city, main_photo_url'
        )
        .neq('user_id', currentUserId);

      if (filterIntent) {
        query = query.eq('main_intent', filterIntent);
      }

      const { data: list, error: listError } = await query.order('created_at', {
        ascending: false,
      });

      if (listError) {
        setErrorMsg(listError.message);
      } else {
        setProfiles(list || []);
      }

      setLoading(false);
    }

    loadData();
  }, [router, filterIntent]);

  if (loading) {
    return <main>Chargement…</main>;
  }

  return (
    <main>
      <h1>Profils proches</h1>

      <div style={{ margin: '12px 0 20px 0' }}>
        <label>
          Type de rencontre :{' '}
          <select
            value={filterIntent}
            onChange={(e) => setFilterIntent(e.target.value)}
          >
            <option value="">Tous</option>
            <option value="friendly">Amical</option>
            <option value="sexy">Coquin</option>
            <option value="both">Amical & Coquin</option>
          </select>
        </label>
      </div>

      {errorMsg && <p style={{ color: 'red' }}>{errorMsg}</p>}

      {profiles.length === 0 && !errorMsg && (
        <p>Aucun profil ne correspond à ces critères.</p>
      )}

      <ul className="list-card">
        {profiles.map((p) => (
          <li key={p.id} className="list-card-item">
            <Link
              href={`/profiles/${p.id}`}
              style={{ color: 'inherit', textDecoration: 'none' }}
            >
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                {/* Photo */}
                {p.main_photo_url ? (
                  <img
                    src={p.main_photo_url}
                    alt={p.display_name || 'Photo de profil'}
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      backgroundColor: '#111827',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 20,
                      flexShrink: 0,
                    }}
                  >
                    {(p.display_name || '?').charAt(0).toUpperCase()}
                  </div>
                )}

                {/* Infos texte */}
                <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <strong>{p.display_name || 'Sans pseudo'}</strong>
                    <div style={{ fontSize: 12, marginTop: 4 }}>
                      {p.city || 'Ville ?'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 12 }}>
                    <div>Genre : {p.gender || '-'}</div>
                    <div>Intention : {p.main_intent || '-'}</div>
                  </div>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}

