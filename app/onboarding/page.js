'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function OnboardingPage() {
  const router = useRouter();
  const [loadingUser, setLoadingUser] = useState(true);
  const [userId, setUserId] = useState(null);

  const [displayName, setDisplayName] = useState('');
  const [gender, setGender] = useState('');
  const [mainIntent, setMainIntent] = useState('');
  const [city, setCity] = useState('');
  const [existingPhotoUrl, setExistingPhotoUrl] = useState(null);

  const [avatarFile, setAvatarFile] = useState(null);

  const [errorMsg, setErrorMsg] = useState('');
  const [saving, setSaving] = useState(false);

  // Charger l'utilisateur et son profil existant
  useEffect(() => {
    async function loadUserAndProfile() {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
        router.push('/login');
        return;
      }
      const user = data.user;
      setUserId(user.id);

      // Chercher un profil existant
      const { data: profileRows, error: profileError } = await supabase
        .from('profiles')
        .select('display_name, gender, main_intent, city, main_photo_url')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!profileError && profileRows) {
        setDisplayName(profileRows.display_name || '');
        setGender(profileRows.gender || '');
        setMainIntent(profileRows.main_intent || '');
        setCity(profileRows.city || '');
        setExistingPhotoUrl(profileRows.main_photo_url || null);
      }

      setLoadingUser(false);
    }

    loadUserAndProfile();
  }, [router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');
    setSaving(true);

    let mainPhotoUrl = existingPhotoUrl;

    // 1. Upload d'une nouvelle photo si choisi
    if (avatarFile && userId) {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile, { upsert: true });

      if (uploadError) {
        setSaving(false);
        setErrorMsg(uploadError.message);
        return;
      }

      const { data: publicData } = supabase.storage
        .from('avatars')
        .getPublicUrl(uploadData.path);

      mainPhotoUrl = publicData.publicUrl;
    }

    // 2. Upsert sur user_id (1 profil par utilisateur)
    const { error } = await supabase
      .from('profiles')
      .upsert(
        {
          user_id: userId,
          display_name: displayName,
          gender,
          main_intent: mainIntent,
          city,
          main_photo_url: mainPhotoUrl,
        },
        { onConflict: 'user_id' } // important : se base sur la contrainte unique user_id
      );

    setSaving(false);

    if (error) {
      setErrorMsg(error.message);
    } else {
      router.push('/profiles');
    }
  }

  if (loadingUser) {
    return <main>Chargement…</main>;
  }

  return (
    <main>
      <h1>Mon profil</h1>

      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        <label>
          Pseudo
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />
        </label>

        <label>
          Genre
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            required
          >
            <option value="">Choisir…</option>
            <option value="man">Homme</option>
            <option value="woman">Femme</option>
            <option value="couple">Couple</option>
            <option value="other">Autre</option>
          </select>
        </label>

        <label>
          Ce que tu cherches
          <select
            value={mainIntent}
            onChange={(e) => setMainIntent(e.target.value)}
            required
          >
            <option value="">Choisir…</option>
            <option value="friendly">Rencontres amicales</option>
            <option value="sexy">Rencontres coquines</option>
            <option value="both">Les deux</option>
          </select>
        </label>

        <label>
          Ville
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
          />
        </label>

        {existingPhotoUrl && (
          <div style={{ marginTop: 8 }}>
            <p>Photo actuelle :</p>
            <img
              src={existingPhotoUrl}
              alt="Photo actuelle"
              style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover' }}
            />
          </div>
        )}

        <label>
          Nouvelle photo (optionnel)
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              setAvatarFile(file || null);
            }}
          />
        </label>

        <button type="submit" disabled={saving}>
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </form>

      {errorMsg && (
        <p style={{ color: 'red', marginTop: 16 }}>{errorMsg}</p>
      )}
    </main>
  );
}

