'use client';

import { useEffect, useState } from 'react';

export default function Loading() {
  const [isLoading, setIsLoading] = useState(true);
  const [showSpinner, setShowSpinner] = useState(false);

  useEffect(() => {
    // Simuler un chargement initial
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    // Fallback si le favicon ne charge pas après 200ms
    const spinnerTimer = setTimeout(() => {
      setShowSpinner(true);
    }, 200);

    return () => {
      clearTimeout(timer);
      clearTimeout(spinnerTimer);
    };
  }, []);

  if (!isLoading) return null;

  return (
    <>
      <style jsx>{`
        .loading-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 15, 35, 0.98);
          backdrop-filter: blur(10px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 1;
          transition: opacity 0.3s ease-out;
        }
        .loading-overlay.fade-out {
          opacity: 0;
          pointer-events: none;
        }
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
        }
        .loading-favicon {
          width: 80px;
          height: 80px;
          animation: pulse-rotate 2s ease-in-out infinite;
          filter: drop-shadow(0 0 20px rgba(168, 85, 247, 0.5));
          object-fit: contain;
        }
        .loading-favicon.hidden {
          display: none;
        }
        .loading-spinner {
          width: 60px;
          height: 60px;
          border: 3px solid rgba(168, 85, 247, 0.2);
          border-top-color: #a855f7;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        .loading-spinner.hidden {
          display: none;
        }
        .loading-text {
          color: #c084fc;
          font-size: 16px;
          font-weight: 500;
          letter-spacing: 0.5px;
          animation: fade-in-out 2s ease-in-out infinite;
        }
        @keyframes pulse-rotate {
          0%, 100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
          50% {
            transform: scale(1.1) rotate(180deg);
            opacity: 0.9;
          }
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes fade-in-out {
          0%, 100% {
            opacity: 0.5;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
      <div className={`loading-overlay ${!isLoading ? 'fade-out' : ''}`}>
        <div className="loading-container">
          <img
            src="/favicon.ico"
            alt="Loading"
            className={`loading-favicon ${showSpinner ? 'hidden' : ''}`}
            onError={() => setShowSpinner(true)}
          />
          <div className={`loading-spinner ${!showSpinner ? 'hidden' : ''}`} />
          <div className="loading-text">Chargement...</div>
        </div>
      </div>
    </>
  );
}

