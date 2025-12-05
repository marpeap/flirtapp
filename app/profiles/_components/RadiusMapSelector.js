'use client';

import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';

// Import dynamique pour éviter les erreurs SSR avec Leaflet
const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div style={{
      width: '100%',
      height: 300,
      borderRadius: 12,
      background: 'rgba(168, 85, 247, 0.1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#9ca3af',
      fontSize: 14,
    }}>
      Chargement de la carte…
    </div>
  ),
});

export default function RadiusMapSelector({ 
  lat, 
  lng, 
  radiusKm, 
  onRadiusChange,
  onLocationChange,
  profilesCount = 0,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localRadius, setLocalRadius] = useState(radiusKm);

  useEffect(() => {
    setLocalRadius(radiusKm);
  }, [radiusKm]);

  const handleRadiusSlider = (value) => {
    setLocalRadius(value);
  };

  const handleRadiusConfirm = () => {
    onRadiusChange(localRadius);
  };

  if (!lat || !lng) {
    return (
      <div
        style={{
          padding: '16px',
          borderRadius: '16px',
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 24 }}>📍</span>
          <div>
            <p style={{ fontSize: 14, color: '#fcd34d', fontWeight: 600, marginBottom: 4 }}>
              Position non définie
            </p>
            <p style={{ fontSize: 13, color: '#9ca3af' }}>
              Active la géolocalisation dans ton profil pour voir les profils proches sur la carte.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        marginBottom: 16,
        borderRadius: '16px',
        background: 'rgba(168, 85, 247, 0.05)',
        border: '1px solid rgba(168, 85, 247, 0.15)',
        overflow: 'hidden',
      }}
    >
      {/* En-tête cliquable */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          transition: 'background 0.2s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(168, 85, 247, 0.1)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 20 }}>🗺️</span>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>
              Rayon de recherche : {localRadius} km
            </p>
            <p style={{ fontSize: 12, color: '#9ca3af' }}>
              {profilesCount} profil{profilesCount > 1 ? 's' : ''} dans cette zone
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            padding: '4px 10px',
            borderRadius: '12px',
            background: 'rgba(168, 85, 247, 0.2)',
            color: '#c084fc',
            fontSize: 12,
            fontWeight: 600,
          }}>
            {isExpanded ? 'Réduire' : 'Voir la carte'}
          </span>
          <span style={{
            fontSize: 16,
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }}>
            ▼
          </span>
        </div>
      </div>

      {/* Carte et contrôles */}
      {isExpanded && (
        <div style={{ padding: '0 16px 16px' }}>
          {/* Carte */}
          <div style={{ 
            borderRadius: 12, 
            overflow: 'hidden',
            marginBottom: 16,
            border: '1px solid rgba(168, 85, 247, 0.2)',
          }}>
            <MapComponent
              lat={lat}
              lng={lng}
              radiusKm={localRadius}
              onLocationChange={onLocationChange}
            />
          </div>

          {/* Slider de rayon */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: 8,
            }}>
              <label style={{ fontSize: 13, color: '#9ca3af' }}>
                Ajuster le rayon
              </label>
              <span style={{
                padding: '4px 12px',
                borderRadius: '8px',
                background: 'rgba(168, 85, 247, 0.2)',
                color: '#c084fc',
                fontSize: 14,
                fontWeight: 700,
              }}>
                {localRadius} km
              </span>
            </div>
            <input
              type="range"
              min={5}
              max={100}
              step={5}
              value={localRadius}
              onChange={(e) => handleRadiusSlider(Number(e.target.value))}
              style={{
                width: '100%',
                height: 8,
                borderRadius: 4,
                appearance: 'none',
                background: `linear-gradient(to right, #a855f7 ${(localRadius - 5) / 95 * 100}%, rgba(168, 85, 247, 0.2) ${(localRadius - 5) / 95 * 100}%)`,
                cursor: 'pointer',
              }}
            />
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 4,
              fontSize: 11,
              color: '#6b7280',
            }}>
              <span>5 km</span>
              <span>50 km</span>
              <span>100 km</span>
            </div>
          </div>

          {/* Bouton appliquer */}
          {localRadius !== radiusKm && (
            <button
              type="button"
              onClick={handleRadiusConfirm}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #a855f7, #f472b6)',
                border: 'none',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Appliquer ({localRadius} km)
            </button>
          )}

          {/* Raccourcis */}
          <div style={{
            display: 'flex',
            gap: 8,
            marginTop: 12,
            flexWrap: 'wrap',
          }}>
            {[10, 25, 50, 100].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  setLocalRadius(r);
                  onRadiusChange(r);
                }}
                style={{
                  flex: 1,
                  minWidth: 60,
                  padding: '8px 12px',
                  borderRadius: '10px',
                  background: radiusKm === r 
                    ? 'linear-gradient(135deg, #a855f7, #f472b6)'
                    : 'rgba(168, 85, 247, 0.1)',
                  border: radiusKm === r 
                    ? 'none'
                    : '1px solid rgba(168, 85, 247, 0.3)',
                  color: radiusKm === r ? '#fff' : '#c084fc',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {r} km
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

