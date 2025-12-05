'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import GroupInvitesSection from './_components/GroupInvitesSection';
import MatchmakingQuestionnaire from './_components/MatchmakingQuestionnaire';
import MeetupReminders from '../../onboarding/_components/MeetupReminders';
import CupidProfileCard from './_components/CupidProfileCard';

const REACTION_LEVELS = [
  { level: 1, emoji: '😐', label: 'Bof' },
  { level: 2, emoji: '🙂', label: 'Sympa' },
  { level: 3, emoji: '😍', label: 'J’aime bien' },
  { level: 4, emoji: '🔥', label: 'Très chaud' },
  { level: 5, emoji: '💘', label: 'Coup de cœur' },
];

function getIcebreakersForProfile(p, myProfile) {
  if (!p) return [];

  const icebreakers = [];

  // Icebreakers basés sur l'intention principale
  if (p.main_intent === 'friendly') {
    icebreakers.push(
      'Tu serais partant·e pour organiser un groupe de sortie ensemble ?',
      'Quelle activité tu aimerais faire en groupe ? (soirée, rando, resto, etc.)',
      'Tu préfères les petits groupes (3-4) ou les groupes plus larges ?',
      'On pourrait créer un cercle autour de [intérêt commun] ?'
    );
  } else if (p.main_intent === 'sexy') {
    icebreakers.push(
      'Tu es ouvert·e aux rencontres à plusieurs ou tu préfères en solo d\'abord ?',
      'Qu\'est-ce qui t\'attire dans les rencontres coquines ?',
      'Tu aimes les ambiances intimistes ou plutôt les soirées plus animées ?',
      'On pourrait explorer ensemble si le feeling passe ?'
    );
  } else if (p.main_intent === 'wild') {
    icebreakers.push(
      'Tu es plutôt team spontanéité ou tu préfères planifier un peu ?',
      'Qu\'est-ce qui te fait vibrer dans les rencontres sauvages ?',
      'Tu aimes les expériences intenses et directes ?',
      'On pourrait créer une vibe électrique ensemble ?'
    );
  }

  // Icebreakers basés sur le genre
  if (p.gender === 'couple') {
    icebreakers.push(
      'Vous cherchez plutôt d\'autres couples ou des personnes solo ?',
      'Comment vous voyez une rencontre réussie à plusieurs ?',
      'Vous êtes ouverts à quoi comme dynamique de groupe ?'
    );
  }

  // Icebreakers basés sur la ville
  if (p.city) {
    icebreakers.push(
      `Tu connais des bons spots à ${p.city} pour organiser quelque chose ?`,
      `On pourrait se retrouver à ${p.city} pour voir ce qui se passe ?`,
      `Tu es plutôt sorties en ville ou activités plus calmes à ${p.city} ?`
    );
  }

  // Icebreakers génériques adaptés au concept
  icebreakers.push(
    'Tu préfères les rencontres en groupe ou en tête-à-tête d\'abord ?',
    'Qu\'est-ce qui t\'a attiré sur ManyLovr ?',
    'Tu as déjà testé les rencontres à plusieurs ou ce serait une première ?',
    'On pourrait créer un groupe autour d\'un intérêt commun ?'
  );

  // Mélanger et retourner 5-6 icebreakers variés
  const shuffled = [...icebreakers].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 6);
}

export default function ProfileDetailPage() {
  const params = useParams();
  const router = useRouter();
  const profileId = params.id;

  const [profile, setProfile] = useState(null);
  const [profilePhotos, setProfilePhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [contactLoading, setContactLoading] = useState(false);
  const [contactError, setContactError] = useState('');

  const [currentUserId, setCurrentUserId] = useState(null);
  const [myReactionLevel, setMyReactionLevel] = useState(null);
  const [reactionSaving, setReactionSaving] = useState(false);

  const [isBlocked, setIsBlocked] = useState(false);
  const [blockInfo, setBlockInfo] = useState('');
  const [blockLoading, setBlockLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [myProfile, setMyProfile] = useState(null);
  const [copiedIcebreaker, setCopiedIcebreaker] = useState(null);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportCategory, setReportCategory] = useState('');
  const [reportDetails, setReportDetails] = useState('');

  // Chargement profil + blocages + réaction
  useEffect(() => {
    async function loadAll() {
      if (!profileId) return;

      setLoading(true);
      setErrorMsg('');
      setIsBlocked(false);
      setBlockInfo('');
      setContactError('');

      // 1) Utilisateur connecté
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        setLoading(false);
        router.push('/login');
        return;
      }

      const userId = userData.user.id;
      setCurrentUserId(userId);

      // 2) Profil affiché
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(
          'id, user_id, display_name, gender, main_intent, city, bio, main_photo_url, looking_for_gender, lat, lng'
        )
        .eq('id', profileId)
        .maybeSingle();

      // 2b) Profil de l'utilisateur connecté (pour les icebreakers personnalisés)
      const { data: myProfileData } = await supabase
        .from('profiles')
        .select('id, display_name, gender, main_intent, city, looking_for_gender')
        .eq('user_id', userId)
        .maybeSingle();

      // 3) Charger les photos du profil
      const { data: photosData, error: photosError } = await supabase
        .from('profile_photos')
        .select('id, photo_url, is_main, display_order')
        .eq('profile_id', profileId)
        .order('display_order', { ascending: true });

      if (!photosError && photosData) {
        setProfilePhotos(photosData);
      } else {
        // Fallback : si pas de photos dans profile_photos, utiliser main_photo_url
        if (profileData?.main_photo_url) {
          setProfilePhotos([{
            id: 'fallback',
            photo_url: profileData.main_photo_url,
            is_main: true,
            display_order: 0,
          }]);
        } else {
          setProfilePhotos([]);
        }
      }

      if (profileError || !profileData) {
        setErrorMsg(profileError?.message || 'Profil introuvable.');
        setLoading(false);
        return;
      }

      setProfile(profileData);
      setMyProfile(myProfileData);
      setMyProfile(myProfileData);

      // 3) Vérifier s'il existe un blocage entre CES DEUX comptes (et pas d'autres)
      // Utilise .or() avec la syntaxe PostgREST pour ne matcher que :
      // (blocker_id = userId AND blocked_id = profileUserId)
      // OU (blocker_id = profileUserId AND blocked_id = userId) [web:970][web:977]
      const { data: blockRows, error: blockError } = await supabase
        .from('blocks')
        .select('blocker_id, blocked_id')
        .or(
          `and(blocker_id.eq.${userId},blocked_id.eq.${profileData.user_id}),and(blocker_id.eq.${profileData.user_id},blocked_id.eq.${userId})`
        );

      if (!blockError && blockRows && blockRows.length > 0) {
        setIsBlocked(true);
        const someoneBlockedMe = blockRows.some(
          (b) => b.blocker_id === profileData.user_id && b.blocked_id === userId
        );
        if (someoneBlockedMe) {
          setBlockInfo(
            'Cette personne t’a bloqué. Vous ne pouvez plus interagir sur ManyLovr.'
          );
        } else {
          setBlockInfo(
            'Tu as bloqué cette personne. Vous ne pouvez plus interagir sur ManyLovr.'
          );
        }
      }

      // 4) Réaction existante si ce n’est pas mon propre profil
      if (profileData.user_id !== userId) {
        const { data: reaction, error: reactionError } = await supabase
          .from('reactions')
          .select('level')
          .eq('from_user_id', userId)
          .eq('to_profile_id', profileData.id)
          .maybeSingle();

        if (!reactionError && reaction) {
          setMyReactionLevel(reaction.level);
        }
      }

      setLoading(false);
    }

    loadAll();
  }, [profileId, router]);

  async function handleContactClick() {
    if (!profile || !currentUserId || isBlocked) return;

    setContactError('');
    setContactLoading(true);

    // Vérifie encore qu’on est bien connecté
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      setContactLoading(false);
      router.push('/login');
      return;
    }

    const userId = userData.user.id;
    const otherUserId = profile.user_id;

    if (userId === otherUserId) {
      setContactLoading(false);
      setContactError("Tu ne peux pas discuter avec toi‑même.");
      return;
    }

    // Re-vérifie le blocage uniquement ENTRE ces deux comptes [web:970][web:977]
    const { data: blockRows, error: blockError } = await supabase
      .from('blocks')
      .select('blocker_id, blocked_id')
      .or(
        `and(blocker_id.eq.${userId},blocked_id.eq.${otherUserId}),and(blocker_id.eq.${otherUserId},blocked_id.eq.${userId})`
      );

    if (!blockError && blockRows && blockRows.length > 0) {
      setContactLoading(false);
      setContactError(
        'La conversation est impossible car un blocage existe entre vous.'
      );
      setIsBlocked(true);
      return;
    }

    // Cherche une conversation existante dans les deux sens
    let { data: conv1, error: convError1 } = await supabase
      .from('conversations')
      .select('id')
      .match({ user_id_1: userId, user_id_2: otherUserId })
      .maybeSingle();

    if (!conv1 && !convError1) {
      const { data: conv2, error: convError2 } = await supabase
        .from('conversations')
        .select('id')
        .match({ user_id_1: otherUserId, user_id_2: userId })
        .maybeSingle();
      conv1 = conv2;
      convError1 = convError2;
    }

    let conversationId = conv1?.id;

    // Si pas de conversation, on en crée une
    if (!conversationId && !convError1) {
      const { data: newConv, error: insertError } = await supabase
        .from('conversations')
        .insert({
          user_id_1: userId,
          user_id_2: otherUserId,
          is_group: false,
        })
        .select('id')
        .single();

      if (insertError) {
        setContactLoading(false);
        setContactError(insertError.message);
        return;
      }
      conversationId = newConv.id;

      // Créer les entrées dans conversation_participants pour les deux utilisateurs
      const { error: partError } = await supabase
        .from('conversation_participants')
        .insert([
          {
            conversation_id: conversationId,
            user_id: userId,
            active: true,
          },
          {
            conversation_id: conversationId,
            user_id: otherUserId,
            active: true,
          },
        ]);

      if (partError) {
        console.error('Erreur lors de la création des participants:', partError);
        // On continue quand même car la conversation existe
      }
    }

    setContactLoading(false);

    if (!conversationId) {
      setContactError("Impossible d'ouvrir la conversation.");
      return;
    }

    router.push(`/messages/${conversationId}`);
  }

  async function handleReaction(level) {
    if (!profile || !currentUserId || isBlocked) return;

    setReactionSaving(true);

    const { error } = await supabase
      .from('reactions')
      .upsert(
        {
          from_user_id: currentUserId,
          to_profile_id: profile.id,
          level,
        },
        { onConflict: 'from_user_id, to_profile_id' }
      );

    setReactionSaving(false);

    if (!error) {
      setMyReactionLevel(level);
    } else {
      console.error(error);
    }
  }

  function openBlockModal() {
    setShowBlockModal(true);
  }

  function closeBlockModal() {
    setShowBlockModal(false);
  }

  async function handleBlock() {
    if (!profile || !currentUserId) return;

    setBlockLoading(true);
    setErrorMsg('');

    const { error } = await supabase.from('blocks').upsert(
      {
        blocker_id: currentUserId,
        blocked_id: profile.user_id,
      },
      { onConflict: 'blocker_id, blocked_id' }
    );

    setBlockLoading(false);

    if (error) {
      setErrorMsg(error.message);
      setShowBlockModal(false);
    } else {
      setIsBlocked(true);
      setBlockInfo(
        'Tu as bloqué cette personne. Vous ne pouvez plus interagir sur ManyLovr.'
      );
      setShowBlockModal(false);
    }
  }

  function openReportModal() {
    setShowReportModal(true);
    setReportCategory('');
    setReportDetails('');
  }

  function closeReportModal() {
    setShowReportModal(false);
    setReportCategory('');
    setReportDetails('');
  }

  async function handleReport() {
    if (!profile || !currentUserId) return;
    if (!reportCategory.trim()) {
      setErrorMsg('Merci de préciser la raison du signalement.');
      return;
    }

    setReportLoading(true);
    setErrorMsg('');

    const { error } = await supabase.from('reports').insert({
      reporter_id: currentUserId,
      reported_user_id: profile.user_id,
      target_type: 'profile',
      target_id: profile.id,
      category: reportCategory.slice(0, 100),
      details: reportDetails || null,
    });

    setReportLoading(false);

    if (error) {
      setErrorMsg(error.message);
    } else {
      setShowReportModal(false);
      setReportCategory('');
      setReportDetails('');
      setErrorMsg('');
      // Afficher un message de succès
      const successMsg = 'Merci pour ton signalement. Il sera examiné. N\'hésite pas à bloquer ce profil si tu ne veux plus le voir.';
      setBlockInfo(successMsg);
      setTimeout(() => setBlockInfo(''), 5000);
    }
  }

  if (loading) {
    return <main>Chargement…</main>;
  }

  if (errorMsg || !profile) {
    return (
      <main>
        <p>Profil introuvable.</p>
        <button onClick={() => router.push('/profiles')}>
          ← Retour aux profils
        </button>
      </main>
    );
  }

  const isOwnProfile = currentUserId === profile.user_id;

  return (
    <main
      style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: 'clamp(16px, 4vw, 24px)',
      }}
    >
      <button
        onClick={() => router.push('/profiles')}
        style={{
          fontSize: 13,
          padding: '8px 16px',
          borderRadius: '8px',
          background: 'rgba(168, 85, 247, 0.1)',
          border: '1px solid rgba(168, 85, 247, 0.2)',
          color: '#e5e7eb',
          marginBottom: 20,
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(168, 85, 247, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(168, 85, 247, 0.1)';
        }}
      >
        ← Retour aux profils
      </button>

      <div
        className="card"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.2fr)',
          gap: 'clamp(20px, 4vw, 32px)',
          padding: 'clamp(20px, 4vw, 32px)',
        }}
      >
        {/* Colonne gauche */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          {/* Photo principale agrandie */}
          <div style={{ marginBottom: 20, width: '100%' }}>
            {(() => {
              const mainPhoto = profilePhotos.find(p => p.is_main)?.photo_url 
                || profilePhotos[0]?.photo_url 
                || profile.main_photo_url;
              
              if (mainPhoto) {
                return (
                  <img
                    src={mainPhoto}
                    alt={profile.display_name || 'Photo de profil'}
                    style={{
                      width: '100%',
                      maxWidth: 400,
                      height: 'auto',
                      aspectRatio: '4/5',
                      borderRadius: 20,
                      objectFit: 'cover',
                      border: '2px solid var(--color-border)',
                      boxShadow: 'var(--shadow-lg)',
                    }}
                  />
                );
              }
              
              // Fallback si pas de photo
              return (
                <div
                  style={{
                    width: '100%',
                    maxWidth: 400,
                    aspectRatio: '4/5',
                    borderRadius: 20,
                    background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.3), rgba(244, 114, 182, 0.3))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 64,
                    border: '2px solid var(--color-border)',
                    boxShadow: 'var(--shadow-lg)',
                  }}
                >
                  {(profile.display_name || '?').charAt(0).toUpperCase()}
                </div>
              );
            })()}
          </div>

          {/* Galerie de photos (si plusieurs) */}
          {profilePhotos.length > 1 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${Math.min(profilePhotos.length, 4)}, 1fr)`,
                gap: 8,
                width: '100%',
                marginBottom: 20,
              }}
            >
              {profilePhotos.slice(0, 4).map((photo) => (
                <img
                  key={photo.id}
                  src={photo.photo_url}
                  alt={`Photo ${photo.display_order + 1}`}
                  style={{
                    width: '100%',
                    aspectRatio: '1',
                    borderRadius: 12,
                    objectFit: 'cover',
                    border: photo.is_main
                      ? '2px solid var(--color-primary)'
                      : '1px solid var(--color-border)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.borderColor = photo.is_main
                      ? 'var(--color-primary)'
                      : 'var(--color-border)';
                  }}
                />
              ))}
            </div>
          )}

          <div style={{ width: '100%', marginTop: 16 }}>
            <h1 style={{ 
              marginBottom: 8, 
              fontSize: 'clamp(1.75rem, 5vw, 2.5rem)',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #f472b6, #a855f7)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              {profile.display_name || 'Sans pseudo'}
            </h1>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              flexWrap: 'wrap',
              marginBottom: 8,
            }}>
              {profile.city && (
                <span style={{
                  fontSize: 14,
                  color: 'var(--color-text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}>
                  📍 {profile.city}
                </span>
              )}
              {profile.gender && (
                <span style={{
                  fontSize: 14,
                  color: 'var(--color-text-secondary)',
                }}>
                  {profile.gender}
                </span>
              )}
            </div>
            {profile.main_intent && (
              <div style={{
                display: 'inline-block',
                padding: '6px 14px',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(244, 114, 182, 0.2))',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                fontSize: 12,
                color: '#e5e7eb',
                marginTop: 8,
              }}>
                {profile.main_intent === 'friendly' && '🤝 Rencontres amicales'}
                {profile.main_intent === 'sexy' && '🔥 Rencontres coquines'}
                {profile.main_intent === 'wild' && '⚡ Rencontres sauvages'}
              </div>
            )}
          </div>

          {isOwnProfile && (
            <>
              <MatchmakingQuestionnaire userId={currentUserId} />
              <CupidProfileCard userId={currentUserId} profileId={profile?.id} />
              <div style={{ marginTop: 20 }}>
                <MeetupReminders userId={currentUserId} />
              </div>
            </>
          )}
        </div>

        {/* Colonne droite */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {profile.bio && (
            <section
              style={{
                padding: '16px',
                borderRadius: '12px',
                background: 'rgba(168, 85, 247, 0.05)',
                border: '1px solid rgba(168, 85, 247, 0.15)',
              }}
            >
              <h2 style={{ 
                fontSize: 16, 
                marginBottom: 8,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <span>✨</span>
                <span>À propos</span>
              </h2>
              <p style={{ 
                fontSize: 14, 
                lineHeight: 1.6,
                color: 'var(--color-text-primary)',
              }}>
                {profile.bio}
              </p>
            </section>
          )}

          {!isOwnProfile && !isBlocked && (
            <section
              style={{
                padding: '16px',
                borderRadius: '12px',
                background: 'rgba(168, 85, 247, 0.05)',
                border: '1px solid rgba(168, 85, 247, 0.15)',
              }}
            >
              <h2 style={{ 
                fontSize: 16, 
                marginBottom: 8,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <span>💭</span>
                <span>Ton niveau d'intérêt</span>
              </h2>
              <p
                style={{
                  fontSize: 12,
                  color: '#9ca3af',
                  marginBottom: 12,
                  lineHeight: 1.5,
                }}
              >
                Exprime ton intérêt pour ce profil. Tu peux changer à tout moment.
              </p>
              <div style={{ 
                display: 'flex', 
                gap: 8, 
                flexWrap: 'wrap',
                justifyContent: 'flex-start',
              }}>
                {REACTION_LEVELS.map((r) => {
                  const active = myReactionLevel === r.level;
                  return (
                    <button
                      key={r.level}
                      type="button"
                      disabled={reactionSaving}
                      onClick={() => handleReaction(r.level)}
                      title={r.label}
                      style={{
                        padding: '10px 16px',
                        borderRadius: '12px',
                        border: active
                          ? '2px solid var(--color-primary)'
                          : '1px solid rgba(168, 85, 247, 0.2)',
                        background: active
                          ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(244, 114, 182, 0.15))'
                          : 'rgba(26, 26, 46, 0.6)',
                        fontSize: 18,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        if (!active) {
                          e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.4)';
                          e.currentTarget.style.background = 'rgba(168, 85, 247, 0.1)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!active) {
                          e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.2)';
                          e.currentTarget.style.background = 'rgba(26, 26, 46, 0.6)';
                        }
                      }}
                    >
                      <span>{r.emoji}</span>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{r.label}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {!isOwnProfile && !isBlocked && (
            <section
              style={{
                padding: '16px',
                borderRadius: '12px',
                background: 'rgba(168, 85, 247, 0.05)',
                border: '1px solid rgba(168, 85, 247, 0.15)',
              }}
            >
              <h2 style={{ 
                fontSize: 16, 
                marginBottom: 8,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <span>💬</span>
                <span>Idées pour briser la glace</span>
              </h2>
              <p
                style={{
                  fontSize: 12,
                  color: '#9ca3af',
                  marginBottom: 12,
                  lineHeight: 1.5,
                }}
              >
                Inspire-toi de ces suggestions adaptées au concept ManyLovr. Clique pour copier.
              </p>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                {getIcebreakersForProfile(profile, myProfile).map((txt, idx) => {
                  const isCopied = copiedIcebreaker === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(txt);
                          setCopiedIcebreaker(idx);
                          setTimeout(() => setCopiedIcebreaker(null), 2000);
                        } catch (err) {
                          console.error('Erreur copie:', err);
                        }
                      }}
                      style={{
                        fontSize: 13,
                        padding: '12px 16px',
                        borderRadius: '12px',
                        border: isCopied 
                          ? '2px solid var(--color-primary)' 
                          : '1px solid rgba(168, 85, 247, 0.2)',
                        background: isCopied
                          ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.25), rgba(244, 114, 182, 0.2))'
                          : 'rgba(26, 26, 46, 0.6)',
                        textAlign: 'left',
                        color: '#e5e7eb',
                        whiteSpace: 'normal',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        position: 'relative',
                        lineHeight: 1.5,
                      }}
                      onMouseEnter={(e) => {
                        if (!isCopied) {
                          e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.5)';
                          e.currentTarget.style.background = 'rgba(168, 85, 247, 0.15)';
                          e.currentTarget.style.transform = 'translateX(4px)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isCopied) {
                          e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.2)';
                          e.currentTarget.style.background = 'rgba(26, 26, 46, 0.6)';
                          e.currentTarget.style.transform = 'translateX(0)';
                        }
                      }}
                    >
                      {isCopied && (
                        <span style={{
                          position: 'absolute',
                          top: 10,
                          right: 12,
                          fontSize: 11,
                          color: 'var(--color-primary)',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}>
                          ✓ Copié
                        </span>
                      )}
                      {txt}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {isOwnProfile && (
            <GroupInvitesSection userId={currentUserId} />
          )}

          {!isOwnProfile && (
            <section
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 12,
                padding: '16px',
                borderRadius: '12px',
                background: 'rgba(168, 85, 247, 0.05)',
                border: '1px solid rgba(168, 85, 247, 0.15)',
              }}
            >
              {!isBlocked && (
                <button
                  style={{ 
                    padding: '12px 24px',
                    fontSize: 15,
                    fontWeight: 600,
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #f472b6, #a855f7)',
                    border: 'none',
                    color: '#fff',
                    cursor: contactLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 12px rgba(168, 85, 247, 0.3)',
                  }}
                  onClick={handleContactClick}
                  disabled={contactLoading}
                  onMouseEnter={(e) => {
                    if (!contactLoading) {
                      e.currentTarget.style.transform = 'scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(168, 85, 247, 0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(168, 85, 247, 0.3)';
                  }}
                >
                  {contactLoading ? 'Ouverture…' : '💬 Entrer en contact'}
                </button>
              )}

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 10,
                  marginTop: 8,
                }}
              >
                <button
                  type="button"
                  onClick={openBlockModal}
                  disabled={blockLoading}
                  style={{
                    flex: 1,
                    minWidth: '120px',
                    padding: '10px 16px',
                    fontSize: 13,
                    fontWeight: 500,
                    borderRadius: '10px',
                    background: 'rgba(107, 114, 128, 0.2)',
                    border: '1px solid rgba(107, 114, 128, 0.3)',
                    color: '#e5e7eb',
                    cursor: blockLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (!blockLoading) {
                      e.currentTarget.style.background = 'rgba(107, 114, 128, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(107, 114, 128, 0.2)';
                  }}
                >
                  {blockLoading ? '⏳ Blocage…' : '🚫 Bloquer'}
                </button>
                <button
                  type="button"
                  onClick={openReportModal}
                  disabled={reportLoading}
                  style={{
                    flex: 1,
                    minWidth: '120px',
                    padding: '10px 16px',
                    fontSize: 13,
                    fontWeight: 500,
                    borderRadius: '10px',
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#fca5a5',
                    cursor: reportLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (!reportLoading) {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                  }}
                >
                  {reportLoading ? '⏳ Envoi…' : '⚠️ Signaler'}
                </button>
              </div>

              {blockInfo && (
                <p
                  style={{
                    fontSize: 12,
                    color: '#fca5a5',
                    marginTop: 4,
                  }}
                >
                  {blockInfo}
                </p>
              )}
              {contactError && (
                <p style={{ color: 'tomato', marginTop: 4, fontSize: 12 }}>
                  {contactError}
                </p>
              )}
            </section>
          )}

          {errorMsg && (
            <p style={{ color: 'tomato', marginTop: 8, fontSize: 12 }}>
              {errorMsg}
            </p>
          )}
        </div>
      </div>

      {/* Modale de blocage */}
      {showBlockModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={closeBlockModal}
        >
          <div
            className="card"
            style={{
              maxWidth: 480,
              width: '100%',
              padding: '24px',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeBlockModal}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                padding: '8px',
                background: 'transparent',
                border: 'none',
                color: '#9ca3af',
                cursor: 'pointer',
                fontSize: 20,
              }}
            >
              ✕
            </button>
            <h2 style={{ fontSize: 20, marginBottom: 12, fontWeight: 600 }}>
              🚫 Bloquer ce profil
            </h2>
            <p style={{ fontSize: 14, color: '#9ca3af', marginBottom: 20, lineHeight: 1.6 }}>
              Bloquer cette personne ? Vous ne pourrez plus voir vos profils ni échanger de messages.
              Cette action peut être annulée plus tard depuis les paramètres.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={closeBlockModal}
                disabled={blockLoading}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  background: 'rgba(107, 114, 128, 0.2)',
                  border: '1px solid rgba(107, 114, 128, 0.3)',
                  color: '#e5e7eb',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleBlock}
                disabled={blockLoading}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  border: 'none',
                  color: '#fff',
                  cursor: blockLoading ? 'not-allowed' : 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                {blockLoading ? '⏳ Blocage…' : 'Bloquer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale de signalement */}
      {showReportModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={closeReportModal}
        >
          <div
            className="card"
            style={{
              maxWidth: 520,
              width: '100%',
              padding: '24px',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeReportModal}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                padding: '8px',
                background: 'transparent',
                border: 'none',
                color: '#9ca3af',
                cursor: 'pointer',
                fontSize: 20,
              }}
            >
              ✕
            </button>
            <h2 style={{ fontSize: 20, marginBottom: 12, fontWeight: 600 }}>
              ⚠️ Signaler ce profil
            </h2>
            <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 20, lineHeight: 1.6 }}>
              Ton signalement reste privé et ne sera pas visible par l'autre personne.
              Il sera examiné par notre équipe.
            </p>
            
            <label style={{ display: 'block', marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 500, marginBottom: 6, display: 'block' }}>
                Raison du signalement *
              </span>
              <input
                type="text"
                value={reportCategory}
                onChange={(e) => setReportCategory(e.target.value)}
                placeholder="Ex: harcèlement, faux profil, contenu inapproprié, spam…"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: 'rgba(26, 26, 46, 0.6)',
                  border: '1px solid rgba(168, 85, 247, 0.2)',
                  color: '#e5e7eb',
                  fontSize: 14,
                }}
              />
            </label>

            <label style={{ display: 'block', marginBottom: 20 }}>
              <span style={{ fontSize: 14, fontWeight: 500, marginBottom: 6, display: 'block' }}>
                Détails (facultatif)
              </span>
              <textarea
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="Ajoute des détails qui pourraient nous aider à comprendre la situation…"
                rows={4}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: 'rgba(26, 26, 46, 0.6)',
                  border: '1px solid rgba(168, 85, 247, 0.2)',
                  color: '#e5e7eb',
                  fontSize: 14,
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
              />
            </label>

            {errorMsg && (
              <p style={{ color: '#ef4444', fontSize: 12, marginBottom: 12 }}>
                {errorMsg}
              </p>
            )}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={closeReportModal}
                disabled={reportLoading}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  background: 'rgba(107, 114, 128, 0.2)',
                  border: '1px solid rgba(107, 114, 128, 0.3)',
                  color: '#e5e7eb',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleReport}
                disabled={reportLoading || !reportCategory.trim()}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  background: reportCategory.trim()
                    ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                    : 'rgba(107, 114, 128, 0.3)',
                  border: 'none',
                  color: '#fff',
                  cursor: reportLoading || !reportCategory.trim() ? 'not-allowed' : 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                {reportLoading ? '⏳ Envoi…' : 'Envoyer le signalement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

