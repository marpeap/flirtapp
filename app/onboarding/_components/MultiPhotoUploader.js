'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

const MAX_PHOTOS = 5;

export default function MultiPhotoUploader({ userId, profileId, onPhotosChange }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!profileId) {
      setLoading(false);
      return;
    }
    loadPhotos();
  }, [profileId]);

  async function loadPhotos() {
    if (!profileId) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('profile_photos')
      .select('id, photo_url, is_main, display_order')
      .eq('profile_id', profileId)
      .order('display_order', { ascending: true });

    if (error) {
      setErrorMsg('Erreur lors du chargement des photos : ' + error.message);
      setPhotos([]);
    } else {
      setPhotos(data || []);
      if (onPhotosChange) {
        onPhotosChange(data || []);
      }
    }
    setLoading(false);
  }

  async function handleFileChange(e, index = null) {
    const files = Array.from(e.target.files || []);
    if (!files.length || !userId || !profileId) return;

    // Vérifier qu'on ne dépasse pas la limite
    if (photos.length + files.length > MAX_PHOTOS) {
      setErrorMsg(`Tu ne peux avoir que ${MAX_PHOTOS} photos maximum.`);
      return;
    }

    setUploading(true);
    setErrorMsg('');

    const uploadedPhotos = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadingIndex(i);

      try {
        const ext = file.name.split('.').pop();
        const path = `${userId}/photos/${Date.now()}_${i}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from('profile-photos')
          .upload(path, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          setErrorMsg(`Erreur pour ${file.name}: ${uploadError.message}`);
          continue;
        }

        const { data } = supabase.storage.from('profile-photos').getPublicUrl(path);
        const publicUrl = data?.publicUrl;

        if (!publicUrl) {
          setErrorMsg(`Impossible de récupérer l'URL pour ${file.name}`);
          continue;
        }

        // Déterminer si c'est la photo principale (première photo ou si aucune photo principale)
        const isMain = photos.length === 0 && i === 0;

        // Insérer dans la table profile_photos
        const { data: photoData, error: insertError } = await supabase
          .from('profile_photos')
          .insert({
            profile_id: profileId,
            photo_url: publicUrl,
            is_main: isMain,
            display_order: photos.length + i,
          })
          .select('id, photo_url, is_main, display_order')
          .single();

        if (insertError) {
          setErrorMsg(`Erreur lors de l'enregistrement de ${file.name}: ${insertError.message}`);
          continue;
        }

        uploadedPhotos.push(photoData);

        // Si c'est la photo principale, mettre à jour aussi main_photo_url dans profiles
        if (isMain) {
          await supabase
            .from('profiles')
            .update({ main_photo_url: publicUrl })
            .eq('id', profileId);
        }
      } catch (err) {
        setErrorMsg(`Erreur pour ${file.name}: ${err.message}`);
      }
    }

    setUploading(false);
    setUploadingIndex(null);

    if (uploadedPhotos.length > 0) {
      await loadPhotos();
    }
  }

  async function handleDeletePhoto(photoId, isMain) {
    if (!confirm('Es-tu sûr de vouloir supprimer cette photo ?')) return;

    const { error } = await supabase
      .from('profile_photos')
      .delete()
      .eq('id', photoId);

    if (error) {
      setErrorMsg('Erreur lors de la suppression : ' + error.message);
      return;
    }

    // Si c'était la photo principale, définir la première photo restante comme principale
    if (isMain) {
      const remainingPhotos = photos.filter((p) => p.id !== photoId);
      if (remainingPhotos.length > 0) {
        await supabase.rpc('set_main_photo', {
          p_photo_id: remainingPhotos[0].id,
          p_profile_id: profileId,
        });
      } else {
        // Plus de photos, mettre à jour profiles
        await supabase
          .from('profiles')
          .update({ main_photo_url: null })
          .eq('id', profileId);
      }
    }

    await loadPhotos();
  }

  async function handleSetMain(photoId) {
    const { error } = await supabase.rpc('set_main_photo', {
      p_photo_id: photoId,
      p_profile_id: profileId,
    });

    if (error) {
      setErrorMsg('Erreur : ' + error.message);
      return;
    }

    await loadPhotos();
  }

  if (loading) {
    return (
      <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
        Chargement des photos…
      </div>
    );
  }

  const remainingSlots = MAX_PHOTOS - photos.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 500 }}>
            Photos de profil ({photos.length}/{MAX_PHOTOS})
          </label>
          {photos.length > 0 && (
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
              Clique sur une photo pour la définir comme principale
            </span>
          )}
        </div>

        {/* Grille de photos */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
            gap: 12,
            marginBottom: 12,
          }}
        >
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              style={{
                position: 'relative',
                aspectRatio: '1',
                borderRadius: 12,
                overflow: 'hidden',
                border: photo.is_main
                  ? '3px solid var(--color-primary)'
                  : '2px solid var(--color-border)',
                cursor: photo.is_main ? 'default' : 'pointer',
                transition: 'all 0.2s ease',
              }}
              onClick={() => !photo.is_main && handleSetMain(photo.id)}
              onMouseEnter={(e) => {
                if (!photo.is_main) {
                  e.currentTarget.style.borderColor = 'var(--color-primary)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (!photo.is_main) {
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                  e.currentTarget.style.transform = 'scale(1)';
                }
              }}
            >
              <img
                src={photo.photo_url}
                alt={`Photo ${index + 1}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
              {photo.is_main && (
                <div
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    background: 'var(--color-primary)',
                    color: 'white',
                    fontSize: 10,
                    padding: '2px 6px',
                    borderRadius: 4,
                    fontWeight: 600,
                  }}
                >
                  Principale
                </div>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeletePhoto(photo.id, photo.is_main);
                }}
                style={{
                  position: 'absolute',
                  bottom: 4,
                  right: 4,
                  background: 'rgba(239, 68, 68, 0.9)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: 24,
                  height: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                ×
              </button>
            </div>
          ))}

          {/* Slot pour ajouter une photo */}
          {remainingSlots > 0 && (
            <label
              style={{
                aspectRatio: '1',
                border: '2px dashed var(--color-border)',
                borderRadius: 12,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: 'var(--color-bg-card)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-primary)';
                e.currentTarget.style.background = 'rgba(168, 85, 247, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border)';
                e.currentTarget.style.background = 'var(--color-bg-card)';
              }}
            >
              <input
                type="file"
                accept="image/*"
                multiple={remainingSlots > 1}
                onChange={handleFileChange}
                disabled={uploading}
                style={{ display: 'none' }}
              />
              <span style={{ fontSize: 32, marginBottom: 4 }}>+</span>
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)', textAlign: 'center' }}>
                Ajouter ({remainingSlots} restant{remainingSlots > 1 ? 's' : ''})
              </span>
            </label>
          )}
        </div>

        {uploading && (
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
            Téléversement en cours… ({uploadingIndex !== null ? uploadingIndex + 1 : ''})
          </p>
        )}

        {errorMsg && (
          <p style={{ fontSize: 12, color: 'var(--color-error)', marginTop: 8 }}>
            {errorMsg}
          </p>
        )}

        {photos.length === 0 && (
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
            Aucune photo. Ajoute ta première photo pour commencer.
          </p>
        )}
      </div>
    </div>
  );
}


