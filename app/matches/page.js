'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import {
  distanceKm,
  computeCompatibilityScore,
  computeMatchScore,
  getCompatibilityLevel,
} from '../../lib/matchCompatibility';

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

      // 2. Son profil complet + ses réponses au questionnaire
      const [{ data: me, error: meError }, { data: myAnswers }] = await Promise.all([
        supabase
          .from('profiles')
          .select(
            'id, user_id, display_name, gender, main_intent, city, main_photo_url, looking_for_gender, lat, lng, bio'
          )
          .eq('user_id', currentUserId)
          .maybeSingle(),
        supabase
          .from('matchmaking_answers')
          .select('answers')
          .eq('user_id', currentUserId)
          .maybeSingle(),
      ]);

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

      // 3. Candidats proches via RPC nearby_profiles
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

      // 4. Récupérer les réponses au questionnaire de tous les candidats
      const candidateUserIds = (nearby || []).map((p) => p.user_id);
      const { data: allAnswers } = await supabase
        .from('matchmaking_answers')
        .select('user_id, answers')
        .in('user_id', candidateUserIds);

      const answersMap = new Map(
        (allAnswers || []).map((a) => [a.user_id, a.answers])
      );

      // 5. Calculer les scores de compatibilité pour chaque candidat
      const rawList = (nearby || []).map((p) => {
        const otherAnswers = answersMap.get(p.user_id);
        const myAnswersData = myAnswers?.answers || {};

        // Calculer le score de compatibilité basé sur le questionnaire
        let compatibilityScore = 0;
        if (myAnswersData && otherAnswers) {
          compatibilityScore = computeCompatibilityScore(
            myAnswersData,
            otherAnswers
          );
        }

        // Calculer le score de match complet
        const score = computeMatchScore(me, p, radiusKm, compatibilityScore);
        const d = distanceKm(me.lat, me.lng, p.lat, p.lng);
        const compatibility = getCompatibilityLevel(compatibilityScore);

        return {
          ...p,
          score,
          compatibilityScore,
          compatibility,
          distanceKm: d,
        };
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
        Ces suggestions sont basées sur votre compatibilité (réponses au questionnaire),
        la proximité géographique, et vos préférences mutuelles.
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
                    {p.compatibility && (
                      <div
                        style={{
                          marginBottom: 4,
                          padding: '4px 8px',
                          borderRadius: 6,
                          background: `${p.compatibility.color}20`,
                          border: `1px solid ${p.compatibility.color}`,
                          color: p.compatibility.color,
                          fontWeight: 600,
                        }}
                      >
                        {p.compatibility.label}
                      </div>
                    )}
                    <div style={{ marginTop: 4 }}>
                      Score : {p.score}
                      {p.compatibilityScore > 0 && (
                        <span style={{ color: '#9ca3af' }}>
                          {' '}
                          (Compatibilité: {p.compatibilityScore}/1000)
                        </span>
                      )}
                    </div>
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

