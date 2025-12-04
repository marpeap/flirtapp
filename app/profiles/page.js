'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

const MAX_GROUP_SIZE = 7; // toi + 6 autres

export default function ProfilesListPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [filterIntent, setFilterIntent] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [radiusKm, setRadiusKm] = useState(25);

  const [currentUserId, setCurrentUserId] = useState(null);
  const [ownProfile, setOwnProfile] = useState(null);

  // Tornado
  const [tornadoOpen, setTornadoOpen] = useState(false);
  const [tornadoProfiles, setTornadoProfiles] = useState([]);
  const [tornadoIndex, setTornadoIndex] = useState(0);
  const [tornadoLoading, setTornadoLoading] = useState(false);
  const [tornadoError, setTornadoError] = useState('');
  const [tornadoRemaining, setTornadoRemaining] = useState(10);
  const [tornadoSessionSwipes, setTornadoSessionSwipes] = useState([]);

  // Push Éclair
  const [pushOpen, setPushOpen] = useState(false);
  const [pushImageFile, setPushImageFile] = useState(null);
  const [pushSending, setPushSending] = useState(false);
  const [pushError, setPushError] = useState('');
  const [pushInfo, setPushInfo] = useState('');
  const [pushCredits, setPushCredits] = useState(0);

  // Sélection pour match de groupe
  const [selectedProfileIds, setSelectedProfileIds] = useState([]);
  const [groupMatchLoading, setGroupMatchLoading] = useState(false);
  const [groupMatchError, setGroupMatchError] = useState('');
  const [groupMatchInfo, setGroupMatchInfo] = useState('');

  // Chargement de la liste principale
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

      const userId = userData.user.id;
      setCurrentUserId(userId);

      const {
        data: own,
        error: ownProfileError,
      } = await supabase
        .from('profiles')
        .select(
          'id, lat, lng, gender, looking_for_gender, push_eclair_credits'
        )
        .eq('user_id', userId)
        .maybeSingle();

      if (ownProfileError) {
        setErrorMsg(ownProfileError.message);
        setLoading(false);
        return;
      }

      if (!own) {
        setLoading(false);
        router.push('/onboarding');
        return;
      }

      setOwnProfile(own);
      setPushCredits(own.push_eclair_credits || 0);

      const myLat = own.lat;
      const myLng = own.lng;

      let list = [];
      let listError = null;

      if (myLat != null && myLng != null) {
        const { data: nearby, error: nearbyError } = await supabase.rpc(
          'nearby_profiles',
          {
            p_lat: myLat,
            p_lng: myLng,
            p_radius_km: radiusKm,
            p_user_id: userId,
          }
        );

        if (nearbyError) {
          listError = nearbyError;
        } else {
          list = nearby || [];
        }
      } else {
        let query = supabase
          .from('profiles')
          .select(
            'id, user_id, display_name, gender, main_intent, city, main_photo_url, looking_for_gender, lat, lng'
          )
          .neq('user_id', userId);

        const { data: fallbackList, error: fallbackError } = await query.order(
          'created_at',
          { ascending: false }
        );

        if (fallbackError) {
          listError = fallbackError;
        } else {
          list = fallbackList || [];
        }
      }

      if (listError) {
        setErrorMsg(listError.message);
        setLoading(false);
        return;
      }

      list = (list || []).filter((p) => {
        const byIntent = !filterIntent || p.main_intent === filterIntent;
        const byGenderFilter = !filterGender || p.gender === filterGender;

        let byMyPreference = true;
        if (own.looking_for_gender === 'men') {
          byMyPreference = p.gender === 'man';
        } else if (own.looking_for_gender === 'women') {
          byMyPreference = p.gender === 'woman';
        } else if (own.looking_for_gender === 'couples') {
          byMyPreference = p.gender === 'couple';
        }

        return byIntent && byGenderFilter && byMyPreference;
      });

      setProfiles(list);
      setLoading(false);
    }

    loadData();
  }, [router, filterIntent, filterGender, radiusKm]);

  // --- Mode Tornado ---

  async function openTornado() {
    if (!currentUserId || !ownProfile) return;

    setTornadoOpen(true);
    setTornadoLoading(true);
    setTornadoError('');
    setTornadoProfiles([]);
    setTornadoIndex(0);
    setTornadoSessionSwipes([]);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const { count, error: countError } = await supabase
      .from('tornado_swipes')
      .select('*', { head: true, count: 'exact' })
      .eq('user_id', currentUserId)
      .gte('created_at', startOfDay.toISOString());

    if (countError) {
      setTornadoLoading(false);
      setTornadoError(countError.message);
      return;
    }

    const remaining = Math.max(0, 10 - (count || 0));
    setTornadoRemaining(remaining);

    if (remaining <= 0) {
      setTornadoLoading(false);
      return;
    }

    const { data: nearby, error: nearbyError } = await supabase.rpc(
      'nearby_profiles',
      {
        p_lat: ownProfile.lat,
        p_lng: ownProfile.lng,
        p_radius_km: radiusKm,
        p_user_id: currentUserId,
      }
    );

    if (nearbyError) {
      setTornadoLoading(false);
      setTornadoError(nearbyError.message);
      return;
    }

    let candidates = (nearby || []).filter((p) => {
      const byIntent = !filterIntent || p.main_intent === filterIntent;
      const byGenderFilter = !filterGender || p.gender === filterGender;

      let byMyPreference = true;
      if (ownProfile.looking_for_gender === 'men') {
        byMyPreference = p.gender === 'man';
      } else if (ownProfile.looking_for_gender === 'women') {
        byMyPreference = p.gender === 'woman';
      } else if (ownProfile.looking_for_gender === 'couples') {
        byMyPreference = p.gender === 'couple';
      }

      return byIntent && byGenderFilter && byMyPreference;
    });

    candidates = candidates.sort(() => Math.random() - 0.5);

    setTornadoProfiles(candidates);
    setTornadoIndex(0);
    setTornadoLoading(false);
  }

  function closeTornado() {
    setTornadoOpen(false);
  }

  async function handleTornadoSwipe(decision) {
    if (!currentUserId) return;
    if (tornadoRemaining <= 0) return;

    const current = tornadoProfiles[tornadoIndex];
    if (!current) return;

    const { error } = await supabase.from('tornado_swipes').insert({
      user_id: currentUserId,
      target_profile_id: current.id,
      decision,
    });

    if (error) {
      setTornadoError(error.message);
      return;
    }

    setTornadoSessionSwipes((prev) => [
      ...prev,
      { profile: current, decision },
    ]);

    const nextRemaining = tornadoRemaining - 1;
    setTornadoRemaining(nextRemaining);

    if (tornadoIndex + 1 < tornadoProfiles.length && nextRemaining > 0) {
      setTornadoIndex(tornadoIndex + 1);
    } else {
      setTornadoIndex(tornadoIndex + 1);
    }
  }

  const totalSessionSwipes = tornadoSessionSwipes.length;
  const sessionLikes = tornadoSessionSwipes.filter(
    (s) => s.decision === 'like'
  );
  const sessionPasses = tornadoSessionSwipes.filter(
    (s) => s.decision === 'pass'
  );
  const hasSessionRecap =
    totalSessionSwipes > 0 &&
    (tornadoRemaining <= 0 ||
      tornadoIndex >= tornadoProfiles.length);

  // --- Push Éclair ---

  function openPush() {
    setPushError('');
    setPushInfo('');
    setPushImageFile(null);
    setPushOpen(true);
  }

  function closePush() {
    if (pushSending) return;
    setPushOpen(false);
  }

  async function handleSendPush() {
    if (!currentUserId || !ownProfile) return;
    if (!pushImageFile) {
      setPushError('Choisis une image avant d’envoyer ton Push Éclair.');
      return;
    }
    if (pushCredits <= 0) {
      setPushError(
        "Tu n'as pas de Push Éclair disponible pour le moment. Plus tard, tu pourras en acheter."
      );
      return;
    }

    setPushSending(true);
    setPushError('');
    setPushInfo('');

    const ext = pushImageFile.name.split('.').pop();
    const path = `pushes/${currentUserId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('push_eclair')
      .upload(path, pushImageFile, { upsert: true });

    if (uploadError) {
      setPushSending(false);
      setPushError(uploadError.message);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from('push_eclair')
      .getPublicUrl(path);

    const imageUrl = publicUrlData.publicUrl;

    const { data: nearby, error: nearErr } = await supabase.rpc(
      'nearby_profiles',
      {
        p_lat: ownProfile.lat,
        p_lng: ownProfile.lng,
        p_radius_km: 30,
        p_user_id: currentUserId,
      }
    );

    if (nearErr) {
      setPushSending(false);
      setPushError(nearErr.message);
      return;
    }

    let candidates = (nearby || []).slice(0, 100);

    if (!candidates.length) {
      setPushSending(false);
      setPushError(
        'Aucun profil compatible trouvé dans un rayon de 30 km pour ton Push Éclair.'
      );
      return;
    }

    const { data: broadcastRow, error: bErr } = await supabase
      .from('push_eclair_broadcasts')
      .insert({
        sender_id: currentUserId,
        image_url: imageUrl,
        radius_km: 30,
        recipients_count: candidates.length,
      })
      .select('id')
      .single();

    if (bErr || !broadcastRow) {
      setPushSending(false);
      setPushError(bErr?.message || 'Erreur lors de la création du Push.');
      return;
    }

    const broadcastId = broadcastRow.id;

    for (const p of candidates) {
      const otherUserId = p.user_id;

      const { data: blocks, error: blockErr } = await supabase
        .from('blocks')
        .select('id')
        .or(
          `blocker_id.eq.${currentUserId},blocked_id.eq.${currentUserId}`
        )
        .or(
          `blocker_id.eq.${otherUserId},blocked_id.eq.${otherUserId}`
        );

      if (!blockErr && blocks && blocks.length > 0) {
        continue;
      }

      let { data: conv1 } = await supabase
        .from('conversations')
        .select('id')
        .match({ user_id_1: currentUserId, user_id_2: otherUserId })
        .maybeSingle();

      if (!conv1) {
        const { data: conv2 } = await supabase
          .from('conversations')
          .select('id')
          .match({ user_id_1: otherUserId, user_id_2: currentUserId })
          .maybeSingle();
        conv1 = conv2;
      }

      let conversationId = conv1?.id;

      if (!conversationId) {
        const { data: newConv, error: cErr } = await supabase
          .from('conversations')
          .insert({
            user_id_1: currentUserId,
            user_id_2: otherUserId,
            is_group: false,
          })
          .select('id')
          .single();

        if (cErr || !newConv) {
          continue;
        }
        conversationId = newConv.id;

        // Créer les entrées dans conversation_participants pour les deux utilisateurs
        await supabase.from('conversation_participants').insert([
          {
            conversation_id: conversationId,
            user_id: currentUserId,
            active: true,
          },
          {
            conversation_id: conversationId,
            user_id: otherUserId,
            active: true,
          },
        ]);
      }

      const { data: msgRow, error: msgErr } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: currentUserId,
          content: 'Push Éclair 💥',
          image_url: imageUrl,
        })
        .select('id')
        .single();

      if (msgErr || !msgRow) {
        continue;
      }

      await supabase.from('push_eclair_deliveries').insert({
        broadcast_id: broadcastId,
        receiver_id: otherUserId,
        conversation_id: conversationId,
        message_id: msgRow.id,
      });
    }

    const { error: updErr } = await supabase
      .from('profiles')
      .update({
        push_eclair_credits: pushCredits - 1,
      })
      .eq('id', ownProfile.id);

    if (!updErr) {
      setPushCredits((c) => c - 1);
    }

    setPushSending(false);
    setPushInfo(
      `Ton Push Éclair a été envoyé à ${candidates.length} personnes dans un rayon de 30 km.`
    );
  }

  // --- Sélection pour match de groupe ---

  function toggleSelectProfile(profileId) {
    setGroupMatchError('');
    setGroupMatchInfo('');
    setSelectedProfileIds((prev) => {
      if (prev.includes(profileId)) {
        return prev.filter((id) => id !== profileId);
      }
      const maxOthers = MAX_GROUP_SIZE - 1;
      if (prev.length >= maxOthers) {
        return prev;
      }
      return [...prev, profileId];
    });
  }

  async function handleCreateGroupMatch() {
    if (!currentUserId || !selectedProfileIds.length) return;
    setGroupMatchError('');
    setGroupMatchInfo('');
    setGroupMatchLoading(true);

    try {
      const { data: selectedProfiles, error: selErr } = await supabase
        .from('profiles')
        .select('id, user_id, display_name')
        .in('id', selectedProfileIds);

      if (selErr) {
        setGroupMatchLoading(false);
        setGroupMatchError(selErr.message);
        return;
      }

      const names = (selectedProfiles || [])
        .map((p) => p.display_name)
        .filter(Boolean);
      const title =
        names.length > 0
          ? `Ménage avec ${names.join(', ')}`
          : 'Match de groupe ManyLovr';

      const { data: propRow, error: propErr } = await supabase
        .from('group_match_proposals')
        .insert({
          creator_user_id: currentUserId,
          title,
          max_size: MAX_GROUP_SIZE,
        })
        .select('id')
        .single();

      if (propErr || !propRow) {
        setGroupMatchLoading(false);
        setGroupMatchError(
          propErr?.message || 'Erreur lors de la création de la proposition.'
        );
        return;
      }

      const proposalId = propRow.id;

      const membersUserIds =
        selectedProfiles?.map((p) => p.user_id).filter(Boolean) || [];

      const rows = [
        {
          proposal_id: proposalId,
          user_id: currentUserId,
          status: 'accepted',
        },
        ...membersUserIds.map((uid) => ({
          proposal_id: proposalId,
          user_id: uid,
          status: 'invited',
        })),
      ];

      const { error: candErr } = await supabase
        .from('group_match_candidates')
        .insert(rows);

      if (candErr) {
        setGroupMatchLoading(false);
        setGroupMatchError(candErr.message);
        return;
      }

      setGroupMatchLoading(false);
      setSelectedProfileIds([]);
      setGroupMatchInfo(
        "Proposition envoyée. Chaque personne pourra voir les candidats du groupe et accepter ou refuser."
      );
    } catch (err) {
      console.error(err);
      setGroupMatchLoading(false);
      setGroupMatchError('Erreur inconnue lors de la création du groupe.');
    }
  }

  if (loading) {
    return <main>Chargement…</main>;
  }

  return (
    <main>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 10,
          alignItems: 'center',
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        <h1>Profils proches</h1>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" onClick={openTornado}>
            Mode Tornado
          </button>
          <button
            type="button"
            onClick={openPush}
            style={{
              backgroundImage: 'linear-gradient(135deg, #facc15, #fb7185)',
            }}
          >
            Push Éclair ({pushCredits})
          </button>
        </div>
      </div>

      {/* Barre de filtres */}
      <div
        className="card"
        style={{
          marginBottom: 16,
          padding: '12px 12px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
        }}
      >
        <div>
          <label style={{ fontSize: 13, color: '#9ca3af' }}>
            Type de rencontre
          </label>
          <select
            value={filterIntent}
            onChange={(e) => setFilterIntent(e.target.value)}
            style={{ marginTop: 4, width: '100%' }}
          >
            <option value="">Tous</option>
            <option value="friendly">Amical</option>
            <option value="sexy">Coquin</option>
            <option value="both">Amical & Coquin</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: 13, color: '#9ca3af' }}>
            Genre du profil
          </label>
          <select
            value={filterGender}
            onChange={(e) => setFilterGender(e.target.value)}
            style={{ marginTop: 4, width: '100%' }}
          >
            <option value="">Tous</option>
            <option value="man">Hommes</option>
            <option value="woman">Femmes</option>
            <option value="couple">Couples</option>
            <option value="other">Autres</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: 13, color: '#9ca3af' }}>
            Rayon de recherche
          </label>
          <select
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            style={{ marginTop: 4, width: '100%' }}
          >
            <option value={10}>≈ 10 km</option>
            <option value={25}>≈ 25 km</option>
            <option value={50}>≈ 50 km</option>
          </select>
        </div>
      </div>

      {/* Barre de match de groupe */}
      <div
        className="card"
        style={{
          marginBottom: 16,
          padding: '10px 12px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ fontSize: 13 }}>
          <strong>Ménage de groupe</strong>
          <p style={{ fontSize: 12, color: '#9ca3af' }}>
            Sélectionne jusqu’à {MAX_GROUP_SIZE - 1} profils. Ils recevront une
            proposition de tchat à plusieurs et pourront valider leur
            participation.
          </p>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 4,
          }}
        >
          <p style={{ fontSize: 12, color: '#e5e7eb' }}>
            Sélectionnés : {selectedProfileIds.length} / {MAX_GROUP_SIZE - 1}
          </p>
          <button
            type="button"
            disabled={
              groupMatchLoading || selectedProfileIds.length === 0
            }
            onClick={handleCreateGroupMatch}
          >
            {groupMatchLoading
              ? 'Création…'
              : 'Proposer un match de groupe'}
          </button>
        </div>
      </div>

      {groupMatchError && (
        <p style={{ color: 'tomato', marginBottom: 8, fontSize: 13 }}>
          {groupMatchError}
        </p>
      )}
      {groupMatchInfo && (
        <p style={{ color: '#a3e635', marginBottom: 8, fontSize: 13 }}>
          {groupMatchInfo}
        </p>
      )}

      {errorMsg && <p style={{ color: 'tomato' }}>{errorMsg}</p>}

      {profiles.length === 0 && !errorMsg && (
        <p>
          Aucun profil ne correspond à ces critères (ou personne n’a encore
          activé la géolocalisation).
        </p>
      )}

      <ul className="list-card">
        {profiles.map((p) => {
          const isSelected = selectedProfileIds.includes(p.id);
          return (
            <li key={p.id} className="list-card-item">
              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  alignItems: 'center',
                }}
              >
                <Link
                  href={`/profiles/${p.id}`}
                  style={{
                    color: 'inherit',
                    textDecoration: 'none',
                    flex: 1,
                    display: 'flex',
                    gap: 12,
                    alignItems: 'center',
                  }}
                >
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
                      {(p.display_name || '?')
                        .charAt(0)
                        .toUpperCase()}
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
                    </div>
                    <div style={{ textAlign: 'right', fontSize: 11 }}>
                      <div>Genre : {p.gender || '-'}</div>
                      <div>Intention : {p.main_intent || '-'}</div>
                    </div>
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={() => toggleSelectProfile(p.id)}
                  style={{
                    padding: '6px 10px',
                    fontSize: 11,
                    backgroundImage: isSelected
                      ? 'linear-gradient(135deg,#22c55e,#16a34a)'
                      : 'linear-gradient(135deg,#4b5563,#020617)',
                    color: '#e5e7eb',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {isSelected ? 'Sélectionné' : 'Ajouter au groupe'}
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Overlay Tornado */}
      {tornadoOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            zIndex: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'clamp(12px, 3vw, 16px)',
            overflowY: 'auto',
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: 'min(460px, 100%)',
              width: '100%',
              maxHeight: '95vh',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              margin: 'auto',
            }}
          >
            <button
              type="button"
              onClick={closeTornado}
              style={{
                position: 'absolute',
                top: 'clamp(8px, 2vw, 12px)',
                right: 'clamp(8px, 2vw, 12px)',
                padding: '8px 12px',
                fontSize: 'clamp(12px, 2.5vw, 14px)',
                backgroundImage:
                  'linear-gradient(135deg, #6b7280, #111827)',
                color: '#e5e7eb',
                minHeight: '36px',
                zIndex: 10,
              }}
            >
              Fermer
            </button>

            <h2 style={{ fontSize: 18, marginBottom: 6 }}>Mode Tornado</h2>
            <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 10 }}>
              Swipe jusqu’à 10 profils par jour. Plus tard, un abonnement
              ManyLovr te permettra d'en voir davantage.
            </p>

            <p
              style={{
                fontSize: 13,
                marginBottom: 10,
                color: tornadoRemaining > 0 ? '#a3e635' : '#fca5a5',
              }}
            >
              Swipes restants aujourd’hui : {tornadoRemaining}
            </p>

            {tornadoLoading && <p>Chargement des profils…</p>}

            {!tornadoLoading &&
              tornadoRemaining <= 0 &&
              !hasSessionRecap && (
                <p style={{ fontSize: 13 }}>
                  Tu as utilisé tes 10 swipes pour aujourd’hui. Reviens demain,
                  ou plus tard on te proposera une option pour en avoir plus.
                </p>
              )}

            {!tornadoLoading &&
              tornadoRemaining > 0 &&
              tornadoProfiles.length > 0 &&
              tornadoIndex < tornadoProfiles.length && (
                <>
                  {(() => {
                    const p = tornadoProfiles[tornadoIndex];
                    return (
                      <div
                        style={{
                          marginTop: 6,
                          marginBottom: 12,
                          textAlign: 'center',
                        }}
                      >
                        {p.main_photo_url ? (
                          <img
                            src={p.main_photo_url}
                            alt={p.display_name || 'Photo de profil'}
                            style={{
                              width: '100%',
                              maxHeight: 260,
                              objectFit: 'cover',
                              borderRadius: 14,
                              marginBottom: 10,
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '100%',
                              height: 220,
                              borderRadius: 14,
                              background:
                                'radial-gradient(circle at top, #111827, #020617)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 40,
                            }}
                          >
                            {(p.display_name || '?')
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                        )}

                        <h3 style={{ fontSize: 18 }}>
                          {p.display_name || 'Sans pseudo'}
                        </h3>
                        <p
                          style={{
                            fontSize: 13,
                            color: '#e5e7eb',
                            marginTop: 4,
                          }}
                        >
                          {p.city || 'Quelque part près de toi'} •{' '}
                          {p.gender || 'Genre ?'}
                        </p>
                        <p
                          style={{
                            fontSize: 12,
                            color: '#9ca3af',
                            marginTop: 4,
                          }}
                        >
                          Intention : {p.main_intent || 'Non précisée'}
                        </p>
                      </div>
                    );
                  })()}

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 10,
                      marginTop: 'auto',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handleTornadoSwipe('pass')}
                      disabled={tornadoRemaining <= 0}
                      style={{
                        flex: 1,
                        backgroundImage:
                          'linear-gradient(135deg,#4b5563,#020617)',
                        color: '#e5e7eb',
                      }}
                    >
                      ❌ Passer
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTornadoSwipe('like')}
                      disabled={tornadoRemaining <= 0}
                      style={{ flex: 1 }}
                    >
                      💘 J’aime
                    </button>
                  </div>
                </>
              )}

            {hasSessionRecap && (
              <div
                style={{
                  marginTop: 10,
                  paddingTop: 10,
                  borderTop: '1px solid #1f2937',
                  fontSize: 13,
                }}
              >
                <h3 style={{ fontSize: 15, marginBottom: 4 }}>
                  Bilan de cette tornade
                </h3>
                <p style={{ color: '#e5e7eb', marginBottom: 4 }}>
                  Tu as swipé {totalSessionSwipes} profil
                  {totalSessionSwipes > 1 ? 's' : ''}, dont{' '}
                  {sessionLikes.length} like
                  {sessionLikes.length > 1 ? 's' : ''} et{' '}
                  {sessionPasses.length} pass.
                </p>
                {sessionLikes.length > 0 ? (
                  <>
                    <p
                      style={{
                        color: '#9ca3af',
                        marginBottom: 4,
                      }}
                    >
                      Profils que tu as likés pendant cette session :
                    </p>
                    <ul
                      style={{
                        listStyle: 'none',
                        padding: 0,
                        maxHeight: 150,
                        overflowY: 'auto',
                      }}
                    >
                      {sessionLikes.map((item, idx) => (
                        <li
                          key={`${item.profile.id}-${idx}`}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 8,
                            padding: '4px 0',
                          }}
                        >
                          <span>
                            {item.profile.display_name ||
                              'Sans pseudo'}{' '}
                            <span
                              style={{
                                fontSize: 11,
                                color: '#9ca3af',
                              }}
                            >
                              ({item.profile.city || 'Ville ?'})
                            </span>
                          </span>
                          <Link
                            href={`/profiles/${item.profile.id}`}
                            style={{
                              fontSize: 11,
                              color: '#fda4af',
                            }}
                          >
                            Voir
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p style={{ color: '#9ca3af' }}>
                    Tu n’as liké personne cette fois‑ci. Tu pourras toujours
                    retenter une tornade demain.
                  </p>
                )}
              </div>
            )}

            {tornadoError && (
              <p style={{ color: 'tomato', marginTop: 10, fontSize: 13 }}>
                {tornadoError}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Overlay Push Éclair */}
      {pushOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            zIndex: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'clamp(12px, 3vw, 16px)',
            overflowY: 'auto',
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: 'min(420px, 100%)',
              width: '100%',
              maxHeight: '95vh',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              margin: 'auto',
            }}
          >
            <button
              type="button"
              onClick={closePush}
              style={{
                position: 'absolute',
                top: 'clamp(8px, 2vw, 12px)',
                right: 'clamp(8px, 2vw, 12px)',
                padding: '8px 12px',
                fontSize: 'clamp(12px, 2.5vw, 14px)',
                backgroundImage:
                  'linear-gradient(135deg, #6b7280, #111827)',
                color: '#e5e7eb',
                minHeight: '36px',
                zIndex: 10,
              }}
              disabled={pushSending}
            >
              Fermer
            </button>

            <h2 style={{ fontSize: 18, marginBottom: 6 }}>Push Éclair</h2>
            <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 8 }}>
              Dépense 1 Push Éclair pour envoyer une photo à jusqu’à 100
              personnes dans un rayon de 30 km autour de toi. Plus tard, tu
              pourras acheter des Push supplémentaires.
            </p>

            <p
              style={{
                fontSize: 13,
                marginBottom: 10,
                color: pushCredits > 0 ? '#a3e635' : '#fca5a5',
              }}
            >
              Crédits Push Éclair disponibles : {pushCredits}
            </p>

            <label
              style={{
                fontSize: 13,
                marginBottom: 10,
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              Choisis la photo à envoyer
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setPushImageFile(e.target.files?.[0] || null)
                }
              />
            </label>

            {pushError && (
              <p style={{ color: 'tomato', fontSize: 13, marginBottom: 6 }}>
                {pushError}
              </p>
            )}
            {pushInfo && (
              <p style={{ color: '#a3e635', fontSize: 13, marginBottom: 6 }}>
                {pushInfo}
              </p>
            )}

            <button
              type="button"
              onClick={handleSendPush}
              disabled={pushSending}
              style={{
                marginTop: 'auto',
                backgroundImage:
                  'linear-gradient(135deg, #facc15, #fb7185)',
              }}
            >
              {pushSending ? 'Envoi en cours…' : 'Envoyer mon Push Éclair'}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

