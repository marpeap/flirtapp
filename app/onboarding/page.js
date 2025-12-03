'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function OnboardingPage() {
  const router = useRouter();

  const [loadingUser, setLoadingUser] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState('');

  const [displayName, setDisplayName] = useState('');
  const [gender, setGender] = useState('');
  const [genderLocked, setGenderLocked] = useState(false);
  const [mainIntent, setMainIntent] = useState('');
  const [city, setCity] = useState('');
  const [bio, setBio] = useState('');
  const [lookingForGender, setLookingForGender] = useState('any');
  const [existingPhotoUrl, setExistingPhotoUrl] = useState(null);

  const [avatarFile, setAvatarFile] = useState(null);

  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [geoStatus, setGeoStatus] = useState('');
  const [geoLoading, setGeoLoading] = useState(false);

  useEffect(() => {
    async function loadUserAndProfile() {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
        router.push('/login');
        return;
      }
      const user = data.user;
      setUserId(user.id);
      setUserEmail(user.email || '');
      setLoadingUser(false);

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(
          'id, display_name, gender, main_intent, city, bio, looking_for_gender, main_photo_url, lat, lng'
        )
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) {
        setErrorMsg(profileError.message);
        return;
      }

      if (profile) {
        setDisplayName(profile.display_name || '');
        setGender(profile.gender || '');
        setGenderLocked(!!profile.gender); // lock si déjà choisi
        setMainIntent(profile.main_intent || '');
        setCity(profile.city || '');
        setBio(profile.bio || '');
        setLookingForGender(profile.looking_for_gender || 'any');
        setExistingPhotoUrl(profile.main_photo_url || null);
        setLat(profile.lat);
        setLng(profile.lng);
      }
    }

    loadUserAndProfile();
  }, [router]);

  async function handleUseGeolocation() {
    if (!navigator.geolocation) {
      setGeoStatus("La géolocalisation n'est pas disponible sur cet appareil.");
      return;
    }
    setGeoLoading(true);
    setGeoStatus('Récupération de ta position…');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setGeoLoading(false);
        setGeoStatus('Position mise à jour ✔');
      },
      (err) => {
        setGeoLoading(false);
        setGeoStatus(`Échec de la géolocalisation : ${err.message}`);
      }
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!userId) return;

    setSaving(true);
    setErrorMsg('');

    let main_photo_url = existingPhotoUrl;

    if (avatarFile) {
      const fileExt = avatarFile.name.split('.').pop();
      const path = `avatars/${userId}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, avatarFile, {
          upsert: true,
        });

      if (uploadError) {
        setSaving(false);
        setErrorMsg(uploadError.message);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(path);

      main_photo_url = publicUrlData.publicUrl;
    }

    const profilePayload = {
      user_id: userId,
      display_name: displayName || null,
      gender: gender || null,
      main_intent: mainIntent || null,
      city: city || null,
      bio: bio || null,
      looking_for_gender: lookingForGender || 'any',
      main_photo_url: main_photo_url || null,
      lat,
      lng,
    };

    const { data: existing, error: existingError } = await supabase
      .from('profiles')
      .select('id, gender')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingError) {
      setSaving(false);
      setErrorMsg(existingError.message);
      return;
    }

    let dbError = null;

    if (existing) {
      // Si le genre est déjà défini, on garde celui en base (au cas où)
      if (existing.gender && existing.gender !== gender) {
        profilePayload.gender = existing.gender;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update(profilePayload)
        .eq('user_id', userId);

      dbError = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('profiles')
        .insert(profilePayload);

      dbError = insertError;
    }

    if (dbError) {
      setSaving(false);
      setErrorMsg(dbError.message);
      return;
    }

    setSaving(false);
    router.push('/profiles');
  }

  if (loadingUser) {
    return <main>Chargement…</main>;
  }

  return (
    <main>
      <form onSubmit={handleSubmit}>
        {/* Bloc identité visuelle */}
        <div
          className="card"
          style={{
            marginBottom: 20,
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.4fr)',
            gap: 18,
            alignItems: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                border: '2px solid #fb7185',
                boxShadow: '0 0 0 3px rgba(251,113,133,0.25)',
                overflow: 'hidden',
                marginBottom: 10,
                backgroundColor: '#020617',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 34,
              }}
            >
              {existingPhotoUrl ? (
                <img
                  src={existingPhotoUrl}
                  alt="Photo de profil"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span>{(displayName || '🙂').charAt(0).toUpperCase()}</span>
              )}
            </div>

            <label
              style={{
                fontSize: 13,
                cursor: 'pointer',
                color: '#fda4af',
                textDecoration: 'underline',
              }}
            >
              Changer / ajouter une photo
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  setAvatarFile(file || null);
                }}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          <div>
            <h1>Mon profil CupidWave</h1>
            <p
              style={{
                fontSize: 13,
                color: '#9ca3af',
                marginBottom: 12,
              }}
            >
              Quelques infos suffisent pour que les autres sachent qui tu es et
              ce que tu cherches. Tu peux tout modifier sauf ton genre une fois
              choisi.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: 10,
              }}
            >
              <label style={{ fontSize: 13 }}>
                Pseudo
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ton pseudo"
                  style={{ marginTop: 4, width: '100%' }}
                  required
                />
              </label>

              <label style={{ fontSize: 13 }}>
                Ville
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Où tu es basé·e"
                  style={{ marginTop: 4, width: '100%' }}
                />
              </label>

              <label style={{ fontSize: 13 }}>
                Ton genre
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  required
                  style={{ marginTop: 4, width: '100%' }}
                  disabled={genderLocked}
                >
                  <option value="">Choisir…</option>
                  <option value="man">Homme</option>
                  <option value="woman">Femme</option>
                  <option value="couple">Couple</option>
                  <option value="other">Autre / je précise</option>
                </select>
              </label>

              <label style={{ fontSize: 13 }}>
                Tu cherches plutôt
                <select
                  value={lookingForGender}
                  onChange={(e) => setLookingForGender(e.target.value)}
                  style={{ marginTop: 4, width: '100%' }}
                >
                  <option value="any">Tout le monde</option>
                  <option value="men">Des hommes</option>
                  <option value="women">Des femmes</option>
                  <option value="couples">Des couples</option>
                </select>
              </label>
            </div>

            {genderLocked && (
              <p
                style={{
                  fontSize: 11,
                  color: '#9ca3af',
                  marginTop: 6,
                }}
              >
                Pour garder la logique de matching cohérente, ton genre ne peut
                plus être modifié. Si tu t’es trompé, contacte l’admin.
              </p>
            )}
          </div>
        </div>

        {/* Bloc intentions + bio */}
        <div
          className="card"
          style={{
            marginBottom: 20,
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 1.2fr)',
            gap: 18,
          }}
        >
          <div>
            <h2 style={{ fontSize: 16, marginBottom: 8 }}>Ce que tu cherches</h2>
            <label style={{ fontSize: 13, display: 'block', marginBottom: 10 }}>
              Type de rencontres
              <select
                value={mainIntent}
                onChange={(e) => setMainIntent(e.target.value)}
                required
                style={{ marginTop: 4, width: '100%' }}
              >
                <option value="">Choisir…</option>
                <option value="friendly">Surtout amical</option>
                <option value="sexy">Surtout charnel / coquin</option>
                <option value="both">Un mélange des deux</option>
              </select>
            </label>

            <p style={{ fontSize: 12, color: '#9ca3af' }}>
              Ces infos aident CupidWave à suggérer des matchs cohérents avec
              tes envies du moment.
            </p>
          </div>

          <div>
            <h2 style={{ fontSize: 16, marginBottom: 8 }}>Parle un peu de toi</h2>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={6}
              placeholder="Tes envies, tes limites, ce que tu as envie de vivre ici…"
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>
        </div>

        {/* Bloc géoloc */}
        <div className="card" style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, marginBottom: 8 }}>Ta position approx.</h2>
          <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 8 }}>
            CupidWave utilise ta position pour trier les profils par proximité.
            La ville seule peut suffire, mais la géolocalisation donne de
            meilleurs résultats.
          </p>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 10,
              alignItems: 'center',
            }}
          >
            <button
              type="button"
              onClick={handleUseGeolocation}
              disabled={geoLoading}
            >
              {geoLoading ? 'Recherche en cours…' : 'Utiliser ma position actuelle'}
            </button>
            {(lat != null || lng != null) && (
              <span style={{ fontSize: 12, color: '#a3e635' }}>
                Coordonnées enregistrées ✔
              </span>
            )}
          </div>

          {geoStatus && (
            <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>
              {geoStatus}
            </p>
          )}
        </div>

        {/* Actions */}
        {errorMsg && (
          <p style={{ color: 'tomato', marginBottom: 10 }}>{errorMsg}</p>
        )}

        <button type="submit" disabled={saving}>
          {saving ? 'Enregistrement…' : 'Enregistrer mon profil'}
        </button>
      </form>
    </main>
  );
}

