'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

// Force le rendu côté client (évite le prerender avec des query params dynamiques)
export const dynamic = 'force-dynamic';

export default function PushSuccessPage() {
  const [pack, setPack] = useState('1x');
  const [countdown, setCountdown] = useState(5);
  const [autoClose, setAutoClose] = useState(true);

  useEffect(() => {
    // Récupérer le pack depuis l'URL côté client (évite useSearchParams / Suspense)
    const params = new URLSearchParams(window.location.search);
    const packParam = params.get('pack');
    setPack(packParam === '3x' ? '3x' : '1x');
  }, []);

  const quantity = pack === '3x' ? 3 : 1;

  useEffect(() => {
    // Compte à rebours avant fermeture automatique
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (autoClose && window.opener) {
            window.close();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoClose]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      textAlign: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)',
      color: '#f8fafc',
    }}>
      <div style={{
        padding: '40px',
        borderRadius: '24px',
        background: 'rgba(26, 26, 46, 0.9)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        boxShadow: '0 0 40px rgba(16, 185, 129, 0.2)',
        maxWidth: '400px',
        width: '100%',
      }}>
        <div style={{
          fontSize: '64px',
          marginBottom: '20px',
          animation: 'bounce 0.5s ease-out',
        }}>✅</div>
        
        <h1 style={{
          fontSize: '24px',
          marginBottom: '10px',
          color: '#22c55e',
          fontWeight: 700,
        }}>Paiement réussi !</h1>
        
        <div style={{
          padding: '16px',
          borderRadius: '12px',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          marginBottom: '20px',
        }}>
          <p style={{
            fontSize: '18px',
            fontWeight: 600,
            color: '#10b981',
            margin: 0,
          }}>
            +{quantity} crédit{quantity > 1 ? 's' : ''} Push Éclair ⚡
          </p>
          <p style={{
            fontSize: '13px',
            color: '#9ca3af',
            marginTop: '8px',
          }}>
            Tes crédits seront disponibles dans quelques secondes.
          </p>
        </div>
        
        {autoClose && countdown > 0 ? (
          <p style={{
            fontSize: '14px',
            color: '#9ca3af',
            marginBottom: '16px',
          }}>
            Fermeture automatique dans {countdown}s...
          </p>
        ) : (
          <p style={{
            fontSize: '14px',
            color: '#9ca3af',
            marginBottom: '16px',
          }}>
            Tu peux fermer cette fenêtre.
          </p>
        )}
        
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              setAutoClose(false);
              if (window.opener) {
                window.close();
              } else {
                window.location.href = '/profiles';
              }
            }}
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #a855f7, #f472b6)',
              border: 'none',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Fermer maintenant
          </button>
          
          <Link
            href="/profiles"
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              background: 'rgba(168, 85, 247, 0.1)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              color: '#c084fc',
              fontSize: '14px',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Voir les profils
          </Link>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes bounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
