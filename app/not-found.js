'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        textAlign: 'center',
        backgroundImage: 'url(/error-bg.png), linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #2d1b4e 100%)',
        backgroundSize: 'cover, cover',
        backgroundPosition: 'center, center',
        backgroundRepeat: 'no-repeat, no-repeat',
        position: 'relative',
      }}
    >
      {/* Overlay pour lisibilité */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(15, 15, 35, 0.7)',
          backdropFilter: 'blur(2px)',
        }}
      />
      
      {/* Contenu */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: '500px',
          width: '100%',
        }}
      >
        {/* Illustration 404 */}
        <div
          style={{
            fontSize: '120px',
            fontWeight: 800,
            background: 'linear-gradient(135deg, #a855f7 0%, #f472b6 50%, #ec4899 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            lineHeight: 1,
            marginBottom: '16px',
            textShadow: '0 0 60px rgba(168, 85, 247, 0.5)',
          }}
        >
          404
        </div>
        
        {/* Emoji */}
        <div style={{ fontSize: '64px', marginBottom: '24px' }}>
          💔
        </div>
        
        {/* Carte de contenu */}
        <div
          style={{
            padding: '32px',
            borderRadius: '24px',
            background: 'rgba(26, 26, 46, 0.9)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 40px rgba(168, 85, 247, 0.1)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: '#f8fafc',
              marginBottom: '12px',
            }}
          >
            Oups ! Page introuvable
          </h1>
          
          <p
            style={{
              fontSize: '15px',
              color: '#9ca3af',
              marginBottom: '28px',
              lineHeight: 1.6,
            }}
          >
            Cette page n'existe pas ou a été déplacée. 
            Pas de panique, tu peux retrouver ton chemin facilement !
          </p>
          
          {/* Boutons de navigation */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <Link
              href="/profiles"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                padding: '14px 24px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #a855f7, #f472b6)',
                color: '#fff',
                fontSize: '15px',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'all 0.2s',
                boxShadow: '0 4px 16px rgba(168, 85, 247, 0.3)',
              }}
            >
              <span style={{ fontSize: '20px' }}>👥</span>
              Découvrir les profils
            </Link>
            
            <Link
              href="/onboarding"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                padding: '14px 24px',
                borderRadius: '14px',
                background: 'rgba(168, 85, 247, 0.1)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                color: '#c084fc',
                fontSize: '15px',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'all 0.2s',
              }}
            >
              <span style={{ fontSize: '20px' }}>👤</span>
              Mon compte
            </Link>
            
            <Link
              href="/"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                padding: '14px 24px',
                borderRadius: '14px',
                background: 'transparent',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                color: '#94a3b8',
                fontSize: '14px',
                fontWeight: 500,
                textDecoration: 'none',
                transition: 'all 0.2s',
              }}
            >
              <span style={{ fontSize: '18px' }}>🏠</span>
              Retour à l'accueil
            </Link>
          </div>
        </div>
        
        {/* Message motivant */}
        <p
          style={{
            marginTop: '24px',
            fontSize: '13px',
            color: '#6b7280',
            fontStyle: 'italic',
          }}
        >
          "L'amour se trouve parfois là où on ne l'attend pas... mais pas ici 😅"
        </p>
      </div>
    </div>
  );
}

