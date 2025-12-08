'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { determineCupidProfile, getCupidAvatarByCategory } from '@/lib/cupidAvatars';

const PROFILE_DESCRIPTIONS = {
  Ghostz: {
    name: 'Ghostz',
    emoji: '👻',
    description: 'Mystérieux et discret, tu préfères garder une certaine distance et l\'anonymat.',
    traits: ['Discret', 'Indépendant', 'Mystérieux'],
  },
  Happyz: {
    name: 'Happyz',
    emoji: '😊',
    description: 'Positif et détendu, tu cherches des chats en ligne joyeux et sans prise de tête.',
    traits: ['Joyeux', 'Détendu', 'Optimiste'],
  },
  Lovers: {
    name: 'Lovers',
    emoji: '💕',
    description: 'Romantique et relationnel, tu privilégies les connexions émotionnelles profondes.',
    traits: ['Romantique', 'Émotionnel', 'Fidèle'],
  },
  Minderz: {
    name: 'Minderz',
    emoji: '🧠',
    description: 'Réfléchi et prudent, tu accordes une grande importance aux boundaries et à la sécurité.',
    traits: ['Réfléchi', 'Prudent', 'Respectueux'],
  },
  Powerz: {
    name: 'Powerz',
    emoji: '⚡',
    description: 'Confiant et expérimenté, tu sais ce que tu veux et tu n\'as pas peur de l\'exprimer.',
    traits: ['Confiant', 'Expérimenté', 'Direct'],
  },
  Sexyz: {
    name: 'Sexyz',
    emoji: '🔥',
    description: 'Sensuel et direct, tu cherches des chats en ligne intenses et sans fioritures.',
    traits: ['Sensuel', 'Direct', 'Aventureux'],
  },
};

export default function CupidProfileCard({ userId, profileId }) {
  const [cupidProfile, setCupidProfile] = useState(null);
  const [cupidAvatar, setCupidAvatar] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    loadCupidProfile();
  }, [userId]);

  async function loadCupidProfile() {
    setLoading(true);

    // Récupérer les réponses au questionnaire
    const { data: answersData } = await supabase
      .from('matchmaking_answers')
      .select('answers')
      .eq('user_id', userId)
      .maybeSingle();

    if (answersData?.answers && Object.keys(answersData.answers).length > 0) {
      const profile = determineCupidProfile(answersData.answers);
      const avatar = getCupidAvatarByCategory(profile);
      
      setCupidProfile(profile);
      setCupidAvatar(avatar);
    } else {
      // Si pas de réponses, ne rien afficher
      setCupidProfile(null);
      setCupidAvatar(null);
    }

    setLoading(false);
  }

  if (loading || !cupidProfile || !cupidAvatar) {
    return null;
  }

  const profileInfo = PROFILE_DESCRIPTIONS[cupidProfile] || PROFILE_DESCRIPTIONS.Happyz;

  return (
    <div
      className="card"
      style={{
        marginTop: 20,
        padding: '20px',
        background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(244, 114, 182, 0.08))',
        border: '1px solid rgba(168, 85, 247, 0.3)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            overflow: 'hidden',
            border: '2px solid rgba(168, 85, 247, 0.5)',
            flexShrink: 0,
          }}
        >
          <img
            src={cupidAvatar}
            alt={`Avatar ${cupidProfile}`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 4,
            }}
          >
            <span style={{ fontSize: 24 }}>{profileInfo.emoji}</span>
            <h3 style={{ fontSize: 18, margin: 0, fontWeight: 600 }}>
              Profil {profileInfo.name}
            </h3>
          </div>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0 }}>
            {profileInfo.description}
          </p>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        {profileInfo.traits.map((trait, index) => (
          <span
            key={index}
            style={{
              padding: '4px 10px',
              borderRadius: 999,
              fontSize: 11,
              background: 'rgba(168, 85, 247, 0.2)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              color: 'var(--color-text-primary)',
            }}
          >
            {trait}
          </span>
        ))}
      </div>
    </div>
  );
}

