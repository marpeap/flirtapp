'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Link from 'next/link';
import { getRandomCupidAvatarPath } from '../../lib/cupidAvatars';

export default function StatsWidget() {
  const [totalUsers, setTotalUsers] = useState(0);
  const [newProfiles, setNewProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        // Récupérer le nombre total d'inscrits
        const { count, error: countError } = await supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true });

        if (countError) {
          console.error('Erreur chargement stats:', countError);
          return;
        }

        setTotalUsers(count || 0);

        // Récupérer les 3 derniers profils
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, display_name, city, main_photo_url, created_at')
          .order('created_at', { ascending: false })
          .limit(3);

        if (profilesError) {
          console.error('Erreur chargement nouveaux profils:', profilesError);
          return;
        }

        setNewProfiles(profiles || []);
      } catch (err) {
        console.error('Erreur chargement widget stats:', err);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  // Fonction pour obtenir un avatar Cupid déterministe basé sur l'ID du profil
  function getAvatarForProfile(profileId, mainPhotoUrl) {
    if (mainPhotoUrl) {
      return mainPhotoUrl;
    }
    // Générer un avatar de manière déterministe basé sur l'ID
    // Utiliser l'ID comme seed pour avoir toujours le même avatar pour le même profil
    const seed = profileId ? profileId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 0;
    const avatarIndex = (seed % 263) + 1;
    return `/cupids/${avatarIndex}.png`;
  }

  // Fonction pour formater la date
  function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }

  if (loading) {
    return (
      <div
        className="card"
        style={{
          padding: '20px',
          background: 'rgba(168, 85, 247, 0.05)',
          border: '1px solid rgba(168, 85, 247, 0.15)',
        }}
      >
        <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: 14 }}>
          Chargement...
        </p>
      </div>
    );
  }

  return (
    <div
      className="card"
      style={{
        padding: '20px',
        background: 'rgba(168, 85, 247, 0.05)',
        border: '1px solid rgba(168, 85, 247, 0.15)',
      }}
    >
      {/* Compteur total */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          paddingBottom: '16px',
          borderBottom: '1px solid rgba(168, 85, 247, 0.15)',
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              fontSize: 12,
              color: 'var(--color-text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              fontWeight: 500,
              marginBottom: 4,
            }}
          >
            Membres inscrits
          </p>
          <p
            style={{
              margin: 0,
              fontSize: 32,
              fontWeight: 700,
              color: 'var(--color-primary)',
              lineHeight: 1,
            }}
          >
            {totalUsers.toLocaleString('fr-FR')}
          </p>
        </div>
        <div
          style={{
            fontSize: 32,
            opacity: 0.3,
          }}
        >
          👥
        </div>
      </div>

      {/* Nouveaux profils */}
      <div>
        <p
          style={{
            margin: 0,
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            marginBottom: 12,
          }}
        >
          Derniers inscrits
        </p>
        {newProfiles.length === 0 ? (
          <p
            style={{
              margin: 0,
              fontSize: 12,
              color: 'var(--color-text-secondary)',
              fontStyle: 'italic',
            }}
          >
            Aucun profil récent
          </p>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {newProfiles.map((profile) => (
              <Link
                key={profile.id}
                href={`/profiles/${profile.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(168, 85, 247, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    overflow: 'hidden',
                    flexShrink: 0,
                    background: 'rgba(168, 85, 247, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <img
                    src={getAvatarForProfile(profile.id, profile.main_photo_url)}
                    alt={profile.display_name || 'Profil'}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                    onError={(e) => {
                      // Si l'image ne charge pas, utiliser un avatar Cupid par défaut
                      e.target.src = getRandomCupidAvatarPath();
                    }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                      fontWeight: 500,
                      color: 'var(--color-text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {profile.display_name || 'Sans nom'}
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      marginTop: 2,
                    }}
                  >
                    {profile.city && (
                      <span
                        style={{
                          fontSize: 11,
                          color: 'var(--color-text-secondary)',
                        }}
                      >
                        {profile.city}
                      </span>
                    )}
                    {profile.city && profile.created_at && (
                      <span
                        style={{
                          fontSize: 11,
                          color: 'var(--color-text-muted)',
                        }}
                      >
                        •
                      </span>
                    )}
                    {profile.created_at && (
                      <span
                        style={{
                          fontSize: 11,
                          color: 'var(--color-text-secondary)',
                        }}
                      >
                        {formatDate(profile.created_at)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Lien vers tous les profils */}
      {newProfiles.length > 0 && (
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(168, 85, 247, 0.15)' }}>
          <Link
            href="/profiles"
            style={{
              display: 'inline-block',
              fontSize: 12,
              color: 'var(--color-primary)',
              textDecoration: 'none',
              fontWeight: 500,
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = 0.7;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = 1;
            }}
          >
            Voir tous les profils →
          </Link>
        </div>
      )}
    </div>
  );
}

