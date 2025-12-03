'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function ProfilePhotoUploader({ userId, mainPhotoUrl, onPhotoChange }) {
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    setUploading(true);
    setErrorMsg('');

    try {
      const ext = file.name.split('.').pop();
      const path = `${userId}/${Date.now()}.${ext}`;

      // Upload dans le bucket "profile-photos" (doit exister et être public) [web:635][web:645]
      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        setErrorMsg(uploadError.message);
        setUploading(false);
        return;
      }

      // Récupérer l’URL publique de l’image [web:634][web:641]
      const { data } = supabase.storage.from('profile-photos').getPublicUrl(path);
      const publicUrl = data?.publicUrl;

      if (!publicUrl) {
        setErrorMsg("Impossible de récupérer l'URL publique de la photo.");
        setUploading(false);
        return;
      }

      onPhotoChange(publicUrl);
      setUploading(false);
    } catch (err) {
      console.error(err);
      setErrorMsg("Erreur lors du téléversement de l'image.");
      setUploading(false);
    }
  }

  return (
    <div style={{ marginTop: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {mainPhotoUrl ? (
          <img
            src={mainPhotoUrl}
            alt="Photo de profil"
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid #f97316',
            }}
          />
        ) : (
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              backgroundColor: '#111827',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              color: '#9ca3af',
            }}
          >
            Aucune photo
          </div>
        )}

        <label
          style={{
            fontSize: 13,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <span>Choisir une image de profil</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
          />
          <span style={{ fontSize: 11, color: '#9ca3af' }}>
            L’image sera stockée de manière sécurisée dans CupidWave.
          </span>
        </label>
      </div>

      {uploading && (
        <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
          Téléversement en cours…
        </p>
      )}
      {errorMsg && (
        <p style={{ fontSize: 12, color: 'tomato', marginTop: 4 }}>
          {errorMsg}
        </p>
      )}
    </div>
  );
}

