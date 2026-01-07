'use client';

import { useState, useEffect } from 'react';

// Composant Avatar de profil avec gestion d'erreur de chargement
export default function ProfileAvatar({ photoUrl, displayName, size = 60, showOnlineStatus = false, isOnline = false, className = '' }) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  
  // Réinitialiser l'état d'erreur si l'URL change
  useEffect(() => {
    if (photoUrl) {
      setImageError(false);
      setImageLoading(true);
    } else {
      setImageError(true);
      setImageLoading(false);
    }
  }, [photoUrl]);
  
  const handleImageError = (e) => {
    // #region agent log
    const img = e?.target;
    fetch('http://127.0.0.1:7244/ingest/b52ac800-6cee-4c21-a14d-e8a882350bc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'_components/ProfileAvatar.js:handleImageError',message:'Profile image failed to load',data:{photoUrl:photoUrl?.substring(0,100)||null,displayName:displayName?.substring(0,20)||null,photoUrlLength:photoUrl?.length,photoUrlType:typeof photoUrl,imgSrc:img?.src?.substring(0,100)||null,imgNaturalWidth:img?.naturalWidth,imgNaturalHeight:img?.naturalHeight,imgComplete:img?.complete},timestamp:Date.now(),sessionId:'debug-session',runId:'profile-avatar',hypothesisId:'IMG1'})}).catch(()=>{});
    // #endregion
    setImageError(true);
    setImageLoading(false);
  };
  
  const handleImageLoad = () => {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/b52ac800-6cee-4c21-a14d-e8a882350bc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'_components/ProfileAvatar.js:handleImageLoad',message:'Profile image loaded successfully',data:{photoUrl:photoUrl?.substring(0,100)||null,displayName:displayName?.substring(0,20)||null},timestamp:Date.now(),sessionId:'debug-session',runId:'profile-avatar',hypothesisId:'IMG2'})}).catch(()=>{});
    // #endregion
    setImageLoading(false);
  };

  // Vérifier si l'URL est valide (non vide, non null, et commence par http/https ou /)
  const hasValidPhoto = photoUrl && typeof photoUrl === 'string' && photoUrl.trim().length > 0 && !imageError && (photoUrl.startsWith('http') || photoUrl.startsWith('/'));

  return (
    <div style={{ position: 'relative', flexShrink: 0 }} className={className}>
      {hasValidPhoto && imageLoading && (
        <div
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(244, 114, 182, 0.2))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid rgba(168, 85, 247, 0.3)',
            position: 'absolute',
            zIndex: 1,
          }}
        >
          <div style={{
            width: 20,
            height: 20,
            border: '2px solid rgba(168, 85, 247, 0.5)',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
        </div>
      )}
      {hasValidPhoto ? (
        <img
          src={photoUrl}
          alt={displayName || 'Photo de profil'}
          onError={handleImageError}
          onLoad={handleImageLoad}
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            objectFit: 'cover',
            border: '2px solid rgba(168, 85, 247, 0.3)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            opacity: imageLoading ? 0 : 1,
            transition: 'opacity 0.3s ease',
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(244, 114, 182, 0.1))',
          }}
        />
      ) : (
        <div
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.4), rgba(244, 114, 182, 0.4))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: size * 0.4,
            fontWeight: 600,
            border: '2px solid rgba(168, 85, 247, 0.5)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            color: '#fff',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
          }}
        >
          {(displayName || '?')
            .charAt(0)
            .toUpperCase()}
        </div>
      )}
      
      {/* Pastille verte - En ligne */}
      {showOnlineStatus && (isOnline || false) && (
        <span
          style={{
            position: 'absolute',
            bottom: 2,
            right: 2,
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            border: '2px solid var(--color-bg-primary)',
            boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)',
            zIndex: 2,
          }}
          title="En ligne"
        />
      )}
    </div>
  );
}

