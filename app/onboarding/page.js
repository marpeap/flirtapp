'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import ProfileForm from './_components/ProfileForm';
import MatchmakingQuestionnaire from '../profiles/[id]/_components/MatchmakingQuestionnaire';
import MeetupReminders from './_components/MeetupReminders';
import { getRandomCupidAvatarPath } from '@/lib/cupidAvatars';

const ADMIN_EMAIL = 'azajbs@gmail.com';

export default function OnboardingPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [profileId, setProfileId] = useState(null);

  const [displayName, setDisplayName] = useState('');
  const [city, setCity] = useState('');
  const [gender, setGender] = useState('');
  const [lookingForGender, setLookingForGender] = useState('any');
  const [mainIntent, setMainIntent] = useState('');
  const [bio, setBio] = useState('');
  const [mainPhotoUrl, setMainPhotoUrl] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setErrorMsg('');
      setInfoMsg('');

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setLoading(false);
        router.replace('/login');
        return;
      }

      setUserId(user.id);
      setUserEmail(user.email || null);

      const { data: prof, error: profErr } = await supabase
        .from('profiles')
        .select(
          'id, user_id, display_name, city, gender, looking_for_gender, main_intent, bio, main_photo_url'
        )
        .eq('user_id', user.id)
        .maybeSingle();

      if (profErr) {
        setErrorMsg(profErr.message);
        setLoading(false);
        return;
      }

      if (prof) {
        setProfileId(prof.id);
        setDisplayName(prof.display_name || '');
        setCity(prof.city || '');
        setGender(prof.gender || '');
        setLookingForGender(prof.looking_for_gender || 'any');
        setMainIntent(prof.main_intent || '');
        setBio(prof.bio || '');

        if (prof.main_photo_url) {
          setMainPhotoUrl(prof.main_photo_url);
        } else {
          const randomAvatar = getRandomCupidAvatarPath();
          setMainPhotoUrl(randomAvatar);

          await supabase
            .from('profiles')
            .update({ main_photo_url: randomAvatar })
            .eq('id', prof.id);
        }
      } else {
        const randomAvatar = getRandomCupidAvatarPath();
        setMainPhotoUrl(randomAvatar);

        const { data: newProf, error: newProfErr } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            main_photo_url: randomAvatar,
          })
          .select('id')
          .single();

        if (!newProfErr && newProf) {
          setProfileId(newProf.id);
        }
      }

      setLoading(false);
    }

    load();
  }, [router]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!userId) return;

    setSaving(true);
    setErrorMsg('');
    setInfoMsg('');

    const payload = {
      id: profileId || undefined,
      user_id: userId,
      display_name: displayName || null,
      city: city || null,
      gender: gender || null,
      looking_for_gender: lookingForGender || 'any',
      main_intent: mainIntent || null,
      bio: bio || null,
      main_photo_url: mainPhotoUrl || null,
    };

    const { data, error } = await supabase
      .from('profiles')
      .upsert(payload)
      .select('id')
      .maybeSingle();

    setSaving(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    if (data?.id) {
      setProfileId(data.id);
    }
    setInfoMsg('Profil enregistré. Tu peux maintenant profiter de ManyLovr.');
  }

  if (loading) {
    return <main>Chargement de ton profil…</main>;
  }

  const isAdmin = userEmail === ADMIN_EMAIL;

  return (
    <main
      style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: '16px 12px 40px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 10,
          alignItems: 'center',
          marginBottom: 12,
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          onClick={() => router.push('/')}
          style={{
            fontSize: 13,
            padding: '4px 10px',
            backgroundImage: 'linear-gradient(135deg,#4b5563,#020617)',
            color: '#e5e7eb',
          }}
        >
          ← Retour à l’accueil
        </button>

        {isAdmin && (
          <a
            href="/admin"
            style={{
              fontSize: 12,
              padding: '4px 10px',
              borderRadius: 999,
              border: '1px solid #4ade80',
              backgroundColor: '#022c22',
              color: '#bbf7d0',
              textDecoration: 'none',
              textTransform: 'uppercase',
              letterSpacing: 0.04,
            }}
          >
            Accès Admin
          </a>
        )}
      </div>

      <div className="card">
        <h1 style={{ marginBottom: 6 }}>Mon profil</h1>
        <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 12 }}>
          À la création du compte, un avatar ManyLovr est choisi au hasard pour
          représenter ton profil. Tu peux ensuite le remplacer par ta propre
          photo et enrichir ton profil pour améliorer le matchmaking et les
          rencontres à plusieurs.
        </p>

        <ProfileForm
          userId={userId}
          profileId={profileId}
          displayName={displayName}
          setDisplayName={setDisplayName}
          city={city}
          setCity={setCity}
          gender={gender}
          setGender={setGender}
          lookingForGender={lookingForGender}
          setLookingForGender={setLookingForGender}
          mainIntent={mainIntent}
          setMainIntent={setMainIntent}
          bio={bio}
          setBio={setBio}
          mainPhotoUrl={mainPhotoUrl}
          setMainPhotoUrl={setMainPhotoUrl}
          saving={saving}
          onSubmit={handleSubmit}
        />

        {errorMsg && (
          <p
            style={{
              color: 'tomato',
              marginTop: 10,
              fontSize: 13,
            }}
          >
            {errorMsg}
          </p>
        )}
        {infoMsg && (
          <p
            style={{
              color: '#a3e635',
              marginTop: 10,
              fontSize: 13,
            }}
          >
            {infoMsg}
          </p>
        )}

        {userId && (
          <div
            style={{
              marginTop: 18,
              paddingTop: 10,
              borderTop: '1px solid rgba(168, 85, 247, 0.15)',
            }}
          >
            <MatchmakingQuestionnaire userId={userId} />
          </div>
        )}

        {userId && (
          <div
            style={{
              marginTop: 18,
              paddingTop: 10,
              borderTop: '1px solid rgba(168, 85, 247, 0.15)',
            }}
          >
            <MeetupReminders userId={userId} />
          </div>
        )}
      </div>
    </main>
  );
}

