'use client';

import MultiPhotoUploader from './MultiPhotoUploader';

export default function ProfileForm({
  userId,
  profileId,
  displayName,
  setDisplayName,
  city,
  setCity,
  gender,
  setGender,
  lookingForGender,
  setLookingForGender,
  mainIntent,
  setMainIntent,
  bio,
  setBio,
  mainPhotoUrl,
  setMainPhotoUrl,
  saving,
  onSubmit,
}) {
  return (
    <form
      onSubmit={onSubmit}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <label style={{ fontSize: 13 }}>
        Photos de profil (jusqu'à 5)
        <MultiPhotoUploader
          userId={userId}
          profileId={profileId}
          onPhotosChange={(photos) => {
            // Mettre à jour mainPhotoUrl avec la photo principale
            const mainPhoto = photos.find(p => p.is_main);
            if (mainPhoto) {
              setMainPhotoUrl(mainPhoto.photo_url);
            }
          }}
        />
      </label>
      <label style={{ fontSize: 13 }}>

        Pseudo
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Ton pseudo visible"
          style={{ marginTop: 4, width: '100%' }}
        />
      </label>

      <label style={{ fontSize: 13 }}>
        Ville / zone
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Ex : Lyon, Marseille, Bruxelles…"
          style={{ marginTop: 4, width: '100%' }}
        />
      </label>

      <label style={{ fontSize: 13 }}>
        Genre
        <select
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          style={{ marginTop: 4, width: '100%' }}
        >
          <option value="">Choisir…</option>
          <option value="man">Homme</option>
          <option value="woman">Femme</option>
          <option value="couple">Couple</option>
          <option value="other">Autre / fluide</option>
        </select>
      </label>

      <label style={{ fontSize: 13 }}>
        Tu es ouvert·e à rencontrer…
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

      <label style={{ fontSize: 13 }}>
        Intention principale
        <select
          value={mainIntent}
          onChange={(e) => setMainIntent(e.target.value)}
          style={{ marginTop: 4, width: '100%' }}
        >
          <option value="">Choisir…</option>
          <option value="friendly">Rencontres amicales</option>
          <option value="sexy">Rencontres coquines</option>
          <option value="both">Un mélange des deux</option>
        </select>
      </label>

      <label style={{ fontSize: 13 }}>
        Bio
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={4}
          placeholder="Parle un peu de toi, de ce que tu cherches, de ce que tu aimes…"
          style={{ marginTop: 4, width: '100%', resize: 'vertical' }}
        />
      </label>



      <button type="submit" disabled={saving} style={{ marginTop: 4 }}>
        {saving ? 'Enregistrement…' : 'Enregistrer mon profil'}
      </button>
    </form>
  );
}

