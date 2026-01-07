'use client';

import { useState } from 'react';
import { GOODIES } from '@/lib/goodies';

export default function GoodiesSelector({ conversationId, recipientUserId, onClose }) {
  const [loading, setLoading] = useState(false);
  const [selectedGoodie, setSelectedGoodie] = useState(null);

  async function handlePurchase(goodie) {
    if (!recipientUserId || !conversationId) {
      alert('Erreur: destinataire ou conversation manquant');
      return;
    }
    
    setLoading(true);
    setSelectedGoodie(goodie.id);

    try {
      const res = await fetch('/api/checkout/goodies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goodieId: goodie.id,
          recipientUserId,
          conversationId,
        }),
      });

      // #region agent log
      const contentType = res.headers.get('content-type');
      fetch('http://127.0.0.1:7244/ingest/b52ac800-6cee-4c21-a14d-e8a882350bc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GoodiesSelector.js:20',message:'API response received',data:{status:res.status,statusText:res.statusText,contentType,isJson:contentType?.includes('application/json'),url:res.url},timestamp:Date.now(),sessionId:'debug-session',runId:'api',hypothesisId:'API1'})}).catch(()=>{});
      // #endregion

      if (!res.ok) {
        // #region agent log
        const errorText = await res.text();
        fetch('http://127.0.0.1:7244/ingest/b52ac800-6cee-4c21-a14d-e8a882350bc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GoodiesSelector.js:30',message:'API error response',data:{status:res.status,statusText:res.statusText,errorText:errorText?.substring(0,200),isHtml:errorText?.startsWith('<!DOCTYPE')},timestamp:Date.now(),sessionId:'debug-session',runId:'api',hypothesisId:'API1'})}).catch(()=>{});
        // #endregion
        throw new Error(`Erreur HTTP: ${res.status} ${res.statusText}`);
      }

      if (!contentType || !contentType.includes('application/json')) {
        // #region agent log
        const text = await res.text();
        fetch('http://127.0.0.1:7244/ingest/b52ac800-6cee-4c21-a14d-e8a882350bc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GoodiesSelector.js:30',message:'Non-JSON response received',data:{contentType,responseStart:text?.substring(0,200),isHtml:text?.startsWith('<!DOCTYPE')},timestamp:Date.now(),sessionId:'debug-session',runId:'api',hypothesisId:'API1'})}).catch(()=>{});
        // #endregion
        throw new Error('La réponse n\'est pas au format JSON');
      }

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Erreur lors de la création du paiement');
      }
    } catch (err) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/b52ac800-6cee-4c21-a14d-e8a882350bc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GoodiesSelector.js:37',message:'Exception in handlePurchase',data:{errorMessage:err?.message,errorName:err?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'api',hypothesisId:'API1'})}).catch(()=>{});
      // #endregion
      console.error(err);
      alert('Erreur réseau: ' + (err.message || 'Erreur inconnue'));
    } finally {
      setLoading(false);
      setSelectedGoodie(null);
    }
  }

  function formatPrice(cents) {
    return (cents / 100).toFixed(2).replace('.', ',') + ' €';
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #1a1a2e, #0f0f23)',
          borderRadius: 20,
          padding: 24,
          maxWidth: 400,
          width: '90%',
          border: '1px solid rgba(168, 85, 247, 0.3)',
          boxShadow: '0 8px 32px rgba(168, 85, 247, 0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#e5e7eb', margin: 0 }}>
            🎁 Offrir un Goodie
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: 8,
              padding: '6px 12px',
              color: '#fca5a5',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            ✕ Fermer
          </button>
        </div>

        <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 16 }}>
          Choisis un goodie à offrir 💕
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {GOODIES.map((goodie) => (
            <div
              key={goodie.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 16,
                borderRadius: 12,
                background: 'rgba(168, 85, 247, 0.1)',
                border: '1px solid rgba(168, 85, 247, 0.25)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 32 }}>{goodie.emoji}</span>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, color: '#e5e7eb' }}>{goodie.name}</p>
                  <p style={{ margin: 0, fontSize: 12, color: '#9ca3af' }}>{formatPrice(goodie.price)}</p>
                </div>
              </div>
              <button
                onClick={() => handlePurchase(goodie)}
                disabled={loading}
                style={{
                  padding: '10px 16px',
                  borderRadius: 10,
                  border: 'none',
                  background: 'linear-gradient(135deg, #a855f7, #f472b6)',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: loading ? 'wait' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading && selectedGoodie === goodie.id ? '...' : `Offrir ${formatPrice(goodie.price)}`}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
