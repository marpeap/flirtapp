'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

// Haversine pour approximer la distance en km entre deux points
function distanceKm(lat1, lng1, lat2, lng2) {
  if (
    lat1 == null ||
    lng1 == null ||
    lat2 == null ||
    lng2 == null
  ) {
    return null;
  }
  const R = 6371; // rayon de la Terre
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function isWantedGender(lookingFor, gender) {
  if (!lookingFor || lookingFor === 'any') return true;
  return lookingFor === gender;
}

function computeMatchScore(me, other, radiusKm) {
  let score = 0;

  // 1) Proximité (max ~60 points si très proche)
  const d = distanceKm(me.lat, me.lng, other.lat, other.lng);
  if (d != null) {
    const maxRadius = radiusKm || 50;
    const clamped = Math.max(0, Math.min(maxRadius, d));
    const distanceFactor = 1 - clamped / maxRadius; // 1 proche, 0 loin
    score += Math.round(distanceFactor * 60);
  }

  // 2) Préférences de genre mutuelles (jusqu'à 40 points)
  const meWantsOther = isWantedGender(me.looking_for_gender, other.gender);
  const otherWantsMe = isWantedGender(other.looking_for_gender, me.gender);

  if (meWantsOther && otherWantsMe) {
    score += 40;
  } else if (meWantsOther || otherWantsMe) {
    score += 20;
  }

  // 3) Intention de rencontre (jusqu'à 20 points)
  if (me.main_intent && other.main_intent) {
    if (me.main_intent === other.main_intent) {
      score += 20;
    } else if (
      me.main_intent === 'both' ||
      other.main_intent === 'both'
    ) {
      score += 10;
    }
  }

  return score;
}

export default function MatchesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [matches, setMatches] = useState([]);
  const [radiusKm, setRadiusKm] = useState(25);

  useEffect(() => {
    async function loadMatches() {
      setLoading(true);
      setErrorMsg('');

      // 1. Utilisateur connecté
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        setLoading(false);
        router.push('/login');
        return;
      }
      const currentUserId = userData.user.id;

      // 2. Son profil complet
      const { data: me, error: meError } = await supabase
        .from('profiles')
        .select(
          'id, user_id, display_name, gender, main_intent, city, main_photo_url, looking_for_gender, lat, lng, bio'
        )
        .eq('user_id', currentUserId)
        .maybeSingle();

      if (meError) {
        setErrorMsg(meError.message);
        setLoading(false);
        return;
      }
      if (!me) {
        setLoading(false);
        router.push('/onboarding');
        return;
      }

      // 3. Candidats proches via RPC nearby_profiles (déjà créée)
      const { data: nearby, error: nearbyError } = await supabase.rpc(
        'nearby_profiles',
        {
          p_lat: me.lat,
          p_lng: me.lng,
          p_radius_km: radiusKm,
          p_user_id: currentUserId,
        }
      );

      if (nearbyError) {
        setErrorMsg(nearbyError.message);
        setLoading(false);
        return;
      }

      const rawList = (nearby || []).map((p) => {
        const score = computeMatchScore(me, p, radiusKm);
        const d = distanceKm(me.lat, me.lng, p.lat, p.lng);
        return { ...p, score, distanceKm: d };
      });

      // 4. Filtrer les scores très bas et trier
      const filtered = rawList
        .filter((p) => p.score > 0)
        .sort((a, b) => b.score - a.score);

      setMatches(filtered);
      setLoading(false);
    }

    loadMatches();
  }, [router, radiusKm]);

  if (loading) {
    return <main>Calcul des matchs…</main>;
  }

  return (
    <main>
      <h1>Matchs suggérés</h1>
      <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 12 }}>
        Ces suggestions sont basées sur la proximité, vos préférences mutuelles
        (qui cherche qui) et le type de rencontres indiqué dans vos profils.
      </p>

      <div
        className="card"
        style={{
          marginBottom: 18,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: 13, color: '#9ca3af' }}>
          Rayon de recherche :
        </span>
        <select
          value={radiusKm}
          onChange={(e) => setRadiusKm(Number(e.target.value))}
          style={{ width: 140 }}
        >
          <option value={10}>≈ 10 km</option>
          <option value={25}>≈ 25 km</option>
          <option value={50}>≈ 50 km</option>
        </select>
      </div>

      {errorMsg && <p style={{ color: 'tomato' }}>{errorMsg}</p>}

      {matches.length === 0 && !errorMsg && (
        <p>Aucun match trouvé pour l’instant avec ces critères.</p>
      )}

      <ul className="list-card">
        {matches.map((p) => (
          <li key={p.id} className="list-card-item">
            <Link
              href={`/profiles/${p.id}`}
              style={{ color: 'inherit', textDecoration: 'none' }}
            >
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
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

                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 8,
                  }}
                >
                  <div>
                    <strong>{p.display_name || 'Sans pseudo'}</strong>
                    <div style={{ fontSize: 12, marginTop: 4 }}>
                      {p.city || 'Ville ?'}
                    </div>
                    {typeof p.distanceKm === 'number' && (
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>
                        ≈ {Math.round(p.distanceKm)} km
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 11 }}>
                    <div>Score : {p.score}</div>
                    <div>Genre : {p.gender || '-'}</div>
                    <div>
                      Cherche :{' '}
                      {p.looking_for_gender === 'men'
                        ? 'hommes'
                        : p.looking_for_gender === 'women'
                        ? 'femmes'
                        : p.looking_for_gender === 'couples'
                        ? 'couples'
                        : 'tout le monde'}
                    </div>
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

