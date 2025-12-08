'use client';

import { useState } from 'react';
import MultiPhotoUploader from './MultiPhotoUploader';
import CityGeolocation from './CityGeolocation';

export default function ProfileForm({
  userId,
  profileId,
  displayName,
  setDisplayName,
  city,
  setCity,
  lat,
  setLat,
  lng,
  setLng,
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
        <CityGeolocation 
          city={city} 
          setCity={setCity}
          lat={lat}
          setLat={setLat}
          lng={lng}
          setLng={setLng}
          onLocationUpdate={(latitude, longitude, cityName) => {
            // La position est déjà mise à jour via setLat/setLng
          }}
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
          <option value="non_binary">Non-binaire</option>
          <option value="trans_mtf">Femme trans</option>
          <option value="trans_ftm">Homme trans</option>
          <option value="couple">Couple</option>
          <option value="fluid">Fluide / Queer</option>
          <option value="other">Autre</option>
        </select>
      </label>

      <label style={{ fontSize: 13 }}>
        Tu es ouvert·e à discuter en ligne…
        <select
          value={lookingForGender}
          onChange={(e) => setLookingForGender(e.target.value)}
          style={{ marginTop: 4, width: '100%' }}
        >
          <option value="any">Je mange de tout</option>
          <option value="men">Des hommes</option>
          <option value="women">Des femmes</option>
          <option value="non_binary">Des personnes non-binaires</option>
          <option value="trans">Des personnes trans</option>
          <option value="couples">Des couples</option>
          <option value="queer">Des personnes queer / fluides</option>
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
          <option value="friendly">Chats amicaux en ligne</option>
          <option value="sexy">Chats coquins en ligne</option>
          <option value="wild">Chats intenses en ligne</option>
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

