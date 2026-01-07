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
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
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
          'id, user_id, display_name, city, lat, lng, gender, looking_for_gender, main_intent, bio, main_photo_url'
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
        setLat(prof.lat || null);
        setLng(prof.lng || null);
        setGender(prof.gender || '');
        // Convertir le tableau looking_for_gender en valeur scalaire pour le select
        const lookingForGenderValue = Array.isArray(prof.looking_for_gender) 
          ? (prof.looking_for_gender[0] || 'any')
          : (prof.looking_for_gender || 'any');
        setLookingForGender(lookingForGenderValue);
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
            looking_for_gender: [], // Initialiser avec un tableau vide pour éviter les erreurs
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

  // Fonction pour mapper les valeurs de genre du formulaire vers les valeurs attendues par la base de données
  function mapGenderToDatabase(genderValue) {
    if (!genderValue) return null;
    
    const genderMap = {
      'man': 'homme',
      'woman': 'femme',
      'non_binary': 'non-binaire',
      'trans_mtf': 'femme',
      'trans_ftm': 'homme',
      'couple': 'autre',
      'fluid': 'non-binaire',
      'other': 'autre',
      // Valeurs déjà correctes (au cas où)
      'homme': 'homme',
      'femme': 'femme',
      'non-binaire': 'non-binaire',
      'autre': 'autre',
    };
    
    return genderMap[genderValue] || 'autre';
  }

  // Fonction pour mapper les valeurs de main_intent du formulaire vers les valeurs attendues par la base de données
  function mapMainIntentToDatabase(mainIntentValue) {
    if (!mainIntentValue) return null;
    
    const mainIntentMap = {
      'friendly': 'amitié',  // Chats amicaux en ligne
      'sexy': 'amour',       // Chats coquins en ligne
      'wild': 'amour',       // Chats intenses en ligne
      'both': 'les_deux',
      'other': 'autre',
      // Valeurs déjà correctes (au cas où)
      'amour': 'amour',
      'amitié': 'amitié',
      'les_deux': 'les_deux',
      'autre': 'autre',
    };
    
    return mainIntentMap[mainIntentValue] || 'autre';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!userId) return;

    setSaving(true);
    setErrorMsg('');
    setInfoMsg('');

    // Convertir looking_for_gender en tableau si nécessaire
    // La base de données attend un TEXT[] mais le formulaire envoie une string
    let lookingForGenderArray = [];
    if (lookingForGender) {
      if (Array.isArray(lookingForGender)) {
        lookingForGenderArray = lookingForGender;
      } else if (lookingForGender === 'any') {
        // "any" signifie tous les genres, on peut laisser vide ou mettre tous les genres
        lookingForGenderArray = [];
      } else {
        // Convertir la string en tableau avec un seul élément
        lookingForGenderArray = [lookingForGender];
      }
    }

    // Mapper le genre vers les valeurs attendues par la base de données
    const mappedGender = mapGenderToDatabase(gender);
    const mappedMainIntent = mapMainIntentToDatabase(mainIntent);
    
    const payload = {
      id: profileId || undefined,
      user_id: userId,
      display_name: displayName || null,
      city: city || null,
      lat: lat || null,
      lng: lng || null,
      gender: mappedGender,
      looking_for_gender: lookingForGenderArray,
      main_intent: mappedMainIntent,
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
          chats en ligne de groupe.
        </p>

        <ProfileForm
          userId={userId}
          profileId={profileId}
          displayName={displayName}
          setDisplayName={setDisplayName}
          city={city}
          setCity={setCity}
          lat={lat}
          setLat={setLat}
          lng={lng}
          setLng={setLng}
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

