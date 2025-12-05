'use client';

import { useEffect } from 'react';

export default function PushCanceledPage() {
  useEffect(() => {
    // Fermer la popup après un court délai
    setTimeout(() => {
      if (window.opener) {
        window.close();
      }
    }, 1500);
  }, []);

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
    }}>
      <div style={{
        fontSize: '48px',
        marginBottom: '20px',
      }}>❌</div>
      <h1 style={{
        fontSize: '24px',
        marginBottom: '10px',
        color: '#ef4444',
      }}>Paiement annulé</h1>
      <p style={{
        color: '#666',
        marginBottom: '20px',
      }}>Tu peux réessayer quand tu veux.</p>
      <p style={{
        fontSize: '14px',
        color: '#999',
      }}>Cette fenêtre va se fermer automatiquement...</p>
    </div>
  );
}

