'use client';

import { useState, useEffect } from 'react';

export default function CityGeolocation({ city, setCity, onLocationUpdate, lat, lng, setLat, setLng }) {
  const [locationStatus, setLocationStatus] = useState('idle'); // idle, requesting, success, error
  const [errorMsg, setErrorMsg] = useState('');

  async function requestLocation() {
    if (!navigator.geolocation) {
      setErrorMsg('La géolocalisation n\'est pas disponible sur ton appareil.');
      setLocationStatus('error');
      return;
    }

    setLocationStatus('requesting');
    setErrorMsg('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Utiliser l'API de géocodage inverse pour obtenir la ville
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=fr`
          );
          
          if (!response.ok) {
            throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
          }
          
          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            // #region agent log
            const text = await response.text();
            fetch('http://127.0.0.1:7244/ingest/b52ac800-6cee-4c21-a14d-e8a882350bc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CityGeolocation.js:29',message:'Geocoding API non-JSON response',data:{contentType,responseStart:text?.substring(0,200),isHtml:text?.startsWith('<!DOCTYPE')},timestamp:Date.now(),sessionId:'debug-session',runId:'geolocation',hypothesisId:'GEO2'})}).catch(()=>{});
            // #endregion
            throw new Error('La réponse de l\'API de géocodage n\'est pas au format JSON');
          }
          
          const data = await response.json();
          const cityName = data.city || data.locality || data.principalSubdivision || 'Ville inconnue';
          
          setCity(cityName);
          if (setLat) setLat(latitude);
          if (setLng) setLng(longitude);
          setLocationStatus('success');
          
          // Appeler le callback pour mettre à jour la position dans le profil
          if (onLocationUpdate) {
            onLocationUpdate(latitude, longitude, cityName);
          }
        } catch (err) {
          // #region agent log
          fetch('http://127.0.0.1:7244/ingest/b52ac800-6cee-4c21-a14d-e8a882350bc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CityGeolocation.js:45',message:'Geocoding error',data:{errorMessage:err?.message,errorName:err?.name,hasError:!!err},timestamp:Date.now(),sessionId:'debug-session',runId:'geolocation',hypothesisId:'GEO1'})}).catch(()=>{});
          // #endregion
          console.error('Erreur géocodage:', err);
          setErrorMsg('Impossible de déterminer ta ville. Tu peux la saisir manuellement.');
          setLocationStatus('error');
        }
      },
      (error) => {
        // Extraire les détails de l'erreur de manière sécurisée
        // L'objet error peut être vide ou avoir des propriétés non énumérables
        const errorCode = error?.code ?? null;
        const errorMessage = error?.message || 'Erreur de géolocalisation inconnue';
        const errorName = error?.name || 'GeolocationPositionError';
        
        const errorDetails = {
          code: errorCode,
          message: errorMessage,
          name: errorName,
          hasError: !!error,
          errorType: typeof error,
          errorString: String(error),
          errorKeys: error && typeof error === 'object' ? Object.keys(error) : [],
        };
        
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/b52ac800-6cee-4c21-a14d-e8a882350bc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CityGeolocation.js:63',message:'Geolocation error',data:errorDetails,timestamp:Date.now(),sessionId:'debug-session',runId:'geolocation',hypothesisId:'GEO1'})}).catch(()=>{});
        // #endregion
        
        // Logger avec plus de détails
        if (errorCode !== null && errorCode !== undefined) {
          console.error('Erreur géolocalisation:', {
            code: errorCode,
            message: errorMessage,
            name: errorName,
          });
        } else {
          console.error('Erreur géolocalisation (détails manquants):', errorDetails);
        }
        
        let message = 'Impossible d\'obtenir ta position.';
        if (errorCode === 1) {
          message = 'Permission de géolocalisation refusée. Tu peux saisir ta ville manuellement.';
        } else if (errorCode === 2) {
          message = 'Position indisponible. Tu peux saisir ta ville manuellement.';
        } else if (errorCode === 3) {
          message = 'Délai d\'attente dépassé. Tu peux saisir ta ville manuellement.';
        }
        setErrorMsg(message);
        setLocationStatus('error');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Ex : Lyon, Marseille, Bruxelles…"
          style={{ 
            flex: 1,
            marginTop: 4,
            width: '100%',
            padding: '8px 12px',
            fontSize: 14,
            borderRadius: '8px',
            border: '1px solid rgba(168, 85, 247, 0.2)',
            background: 'rgba(26, 26, 46, 0.5)',
            color: 'var(--color-text-primary)',
          }}
        />
        <button
          type="button"
          onClick={requestLocation}
          disabled={locationStatus === 'requesting'}
          style={{
            padding: '8px 16px',
            fontSize: 12,
            fontWeight: 500,
            borderRadius: '8px',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            background: locationStatus === 'requesting' 
              ? 'rgba(168, 85, 247, 0.3)' 
              : 'rgba(168, 85, 247, 0.15)',
            color: 'var(--color-text-primary)',
            cursor: locationStatus === 'requesting' ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            if (locationStatus !== 'requesting') {
              e.currentTarget.style.background = 'rgba(168, 85, 247, 0.25)';
            }
          }}
          onMouseLeave={(e) => {
            if (locationStatus !== 'requesting') {
              e.currentTarget.style.background = 'rgba(168, 85, 247, 0.15)';
            }
          }}
        >
          {locationStatus === 'requesting' ? '📍' : '📍 Localiser'}
        </button>
      </div>
      
      {locationStatus === 'success' && (
        <p style={{ margin: 0, fontSize: 12, color: 'var(--color-success)' }}>
          ✓ Ville détectée automatiquement
        </p>
      )}
      
      {errorMsg && (
        <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-secondary)' }}>
          {errorMsg}
        </p>
      )}
    </div>
  );
}

