'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import GroupInvitesSection from './_components/GroupInvitesSection';
import MatchmakingQuestionnaire from './_components/MatchmakingQuestionnaire';

const REACTION_LEVELS = [
  { level: 1, emoji: '😐', label: 'Bof' },
  { level: 2, emoji: '🙂', label: 'Sympa' },
  { level: 3, emoji: '😍', label: 'J’aime bien' },
  { level: 4, emoji: '🔥', label: 'Très chaud' },
  { level: 5, emoji: '💘', label: 'Coup de cœur' },
];

function getIcebreakersForProfile(p) {
  const generic = [
    "Qu’est-ce qui t’a donné envie de t’inscrire sur ManyLovr ?",
    "C’est quoi pour toi une rencontre réussie ?",
  ];

  if (!p) return generic;

  const list = [...generic];

  if (p.main_intent === 'friendly') {
    list.push(
      'Tu cherches plutôt des potes de sortie ou des gens avec qui vraiment te confier ?',
      'Si on devait faire une activité amicale ensemble, ce serait quoi ?'
    );
  } else if (p.main_intent === 'sexy') {
    list.push(
      'Qu’est-ce qui compte le plus pour toi dans une rencontre charnelle réussie ?',
      'Tu es plus team slow burn ou feeling instantané ?'
    );
  } else if (p.main_intent === 'both') {
    list.push(
      'Tu préfères qu’on commence chill/amical ou tu aimes quand ça devient vite plus intense ?',
      'Tu imagines quoi comme vibe idéale entre nous si le feeling passe ?'
    );
  }

  if (p.city) {
    list.push(
      `Si on se voyait dans ${p.city}, ce serait plutôt café, bar discret ou balade nocturne ?`
    );
  }

  return list.slice(0, 4);
}

export default function ProfileDetailPage() {
  const params = useParams();
  const router = useRouter();
  const profileId = params.id;

  const [profile, setProfile] = useState(null);
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
          'id, user_id, display_name, gender, main_intent, city, bio, main_photo_url, looking_for_gender'
        )
        .eq('id', profileId)
        .maybeSingle();

      if (profileError || !profileData) {
        setErrorMsg(profileError?.message || 'Profil introuvable.');
        setLoading(false);
        return;
      }

      setProfile(profileData);

      // 3) Vérifier s’il existe un blocage entre CES DEUX comptes (et pas d’autres)
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
        })
        .select('id')
        .single();

      if (insertError) {
        setContactLoading(false);
        setContactError(insertError.message);
        return;
      }
      conversationId = newConv.id;
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

  async function handleBlock() {
    if (!profile || !currentUserId) return;
    const confirmBlock = window.confirm(
      'Bloquer cette personne ? Vous ne pourrez plus voir vos profils ni échanger de messages.'
    );
    if (!confirmBlock) return;

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
    } else {
      setIsBlocked(true);
      setBlockInfo(
        'Tu as bloqué cette personne. Vous ne pouvez plus interagir sur ManyLovr.'
      );
    }
  }

  async function handleReport() {
    if (!profile || !currentUserId) return;

    const category = window.prompt(
      "Pourquoi veux‑tu signaler ce profil ?\nExemples : harcèlement, faux profil, contenu inapproprié, spam…"
    );
    if (!category) return;

    const details = window.prompt(
      'Tu peux ajouter des détails (facultatif). Ils resteront privés et ne seront pas visibles par l’autre personne.'
    );

    setReportLoading(true);
    setErrorMsg('');

    const { error } = await supabase.from('reports').insert({
      reporter_id: currentUserId,
      reported_user_id: profile.user_id,
      target_type: 'profile',
      target_id: profile.id,
      category: category.slice(0, 100),
      details: details || null,
    });

    setReportLoading(false);

    if (error) {
      setErrorMsg(error.message);
    } else {
      alert(
        'Merci pour ton signalement. Il sera examiné. N’hésite pas à bloquer ce profil si tu ne veux plus le voir.'
      );
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
        maxWidth: 960,
        margin: '0 auto',
        padding: '16px 12px 40px',
      }}
    >
      <button
        onClick={() => router.push('/profiles')}
        style={{
          fontSize: 13,
          padding: '4px 10px',
          backgroundImage: 'linear-gradient(135deg,#4b5563,#020617)',
          color: '#e5e7eb',
        }}
      >
        ← Retour
      </button>

      <div
        className="card"
        style={{
          marginTop: 16,
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 1.2fr)',
          gap: 18,
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
          {profile.main_photo_url && (
            <img
              src={profile.main_photo_url}
              alt={profile.display_name || 'Photo de profil'}
              style={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                objectFit: 'cover',
                marginBottom: 12,
                border: '2px solid #f97316',
                boxShadow: '0 0 0 3px rgba(249,115,22,0.25)',
              }}
            />
          )}
          <h1 style={{ marginBottom: 6 }}>
            {profile.display_name || 'Sans pseudo'}
          </h1>
          <p style={{ fontSize: 13, color: '#9ca3af' }}>
            {profile.city || 'Ville ?'} • {profile.gender || 'Genre ?'}
          </p>
          <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
            Intention : {profile.main_intent || 'Non précisée'}
          </p>

          {isOwnProfile && (
            <MatchmakingQuestionnaire userId={currentUserId} />
          )}
        </div>

        {/* Colonne droite */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {profile.bio && (
            <section>
              <h2 style={{ fontSize: 15, marginBottom: 4 }}>À propos</h2>
              <p style={{ fontSize: 14 }}>{profile.bio}</p>
            </section>
          )}

          {!isOwnProfile && !isBlocked && (
            <section>
              <h2 style={{ fontSize: 15, marginBottom: 6 }}>
                Ce que tu penses de ce profil
              </h2>
              <p
                style={{
                  fontSize: 12,
                  color: '#9ca3af',
                  marginBottom: 6,
                }}
              >
                Choisis un emoji pour exprimer ton niveau d’intérêt. Tu peux le
                changer à tout moment.
              </p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
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
                        padding: '6px 10px',
                        borderRadius: 999,
                        border: active
                          ? '1px solid #f97316'
                          : '1px solid #1f2937',
                        backgroundColor: active ? '#111827' : '#020617',
                        fontSize: 16,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <span>{r.emoji}</span>
                      <span style={{ fontSize: 12 }}>{r.label}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {!isOwnProfile && !isBlocked && (
            <section style={{ marginTop: 6 }}>
              <h2 style={{ fontSize: 14, marginBottom: 4 }}>
                Idées de premier message
              </h2>
              <p
                style={{
                  fontSize: 12,
                  color: '#9ca3af',
                  marginBottom: 6,
                }}
              >
                Ces phrases ne sont jamais envoyées automatiquement. Tu peux t’en
                inspirer ou les copier/coller dans la discussion.
              </p>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                {getIcebreakersForProfile(profile).map((txt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      navigator.clipboard
                        .writeText(txt)
                        .then(() =>
                          alert(
                            'Icebreaker copié dans le presse‑papiers. Tu peux le coller dans le chat.'
                          )
                        )
                        .catch(() => {});
                    }}
                    style={{
                      fontSize: 12,
                      padding: '6px 10px',
                      borderRadius: 999,
                      border: '1px solid #1f2937',
                      backgroundColor: '#020617',
                      textAlign: 'left',
                      color: '#e5e7eb',
                      whiteSpace: 'normal',
                    }}
                  >
                    {txt}
                  </button>
                ))}
              </div>
            </section>
          )}

          {isOwnProfile && (
            <GroupInvitesSection userId={currentUserId} />
          )}

          {!isOwnProfile && (
            <section
              style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
            >
              {!isBlocked && (
                <button
                  style={{ marginTop: 4 }}
                  onClick={handleContactClick}
                  disabled={contactLoading}
                >
                  {contactLoading ? 'Ouverture…' : 'Entrer en contact'}
                </button>
              )}

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                  marginTop: 4,
                }}
              >
                <button
                  type="button"
                  onClick={handleBlock}
                  disabled={blockLoading}
                  style={{
                    backgroundImage:
                      'linear-gradient(135deg,#4b5563,#111827)',
                    color: '#e5e7eb',
                    padding: '6px 12px',
                    fontSize: 12,
                  }}
                >
                  {blockLoading ? 'Blocage…' : 'Bloquer ce profil'}
                </button>
                <button
                  type="button"
                  onClick={handleReport}
                  disabled={reportLoading}
                  style={{
                    backgroundImage:
                      'linear-gradient(135deg,#f97373,#b91c1c)',
                    color: '#fef2f2',
                    padding: '6px 12px',
                    fontSize: 12,
                  }}
                >
                  {reportLoading ? 'Envoi…' : 'Signaler'}
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
    </main>
  );
}

