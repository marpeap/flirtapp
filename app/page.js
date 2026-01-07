'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import StatsWidget from './_components/StatsWidget';

export default function HomePage() {
  const router = useRouter();
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportAmount, setSupportAmount] = useState(0.99);

  const supportOptions = [0.49, 0.99, 1.49, 1.99, 2.99, 3.99, 4.99, 5.99, 7.99, 9.99];

  const openSupport = () => setSupportOpen(true);
  const closeSupport = () => setSupportOpen(false);
  const confirmSupport = () => {
    closeSupport();
    alert(`Merci pour ton soutien de ${supportAmount.toFixed(2)} € 💜`);
  };

  return (
    <main
      style={{
        minHeight: 'calc(100vh - 80px)',
        padding: 'clamp(32px, 5vw, 64px) clamp(16px, 4vw, 32px)',
        position: 'relative',
        overflow: 'hidden',
      }}
      className="fade-in"
    >
      {/* Effets de fond élégants */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 20% 30%, rgba(168, 85, 247, 0.08) 0%, transparent 60%), radial-gradient(circle at 80% 70%, rgba(244, 114, 182, 0.06) 0%, transparent 60%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      
      {/* Grille de points subtile */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(168, 85, 247, 0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div
        style={{
          maxWidth: 1400,
          width: '100%',
          margin: '0 auto',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Section Hero - Centrée et élégante */}
        <section
          style={{
            textAlign: 'center',
            marginBottom: 'clamp(48px, 8vw, 96px)',
            padding: 'clamp(24px, 4vw, 48px) 0',
          }}
        >
          <div
            className="card card-elevated"
            style={{
              padding: 'clamp(32px, 6vw, 56px) clamp(24px, 5vw, 48px)',
              maxWidth: 900,
              margin: '0 auto',
              background: 'rgba(26, 26, 46, 0.75)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(168, 85, 247, 0.15)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(168, 85, 247, 0.05)',
            }}
          >
            {/* Badge élégant */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                borderRadius: '9999px',
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(244, 114, 182, 0.15))',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                marginBottom: 24,
                boxShadow: '0 4px 12px rgba(168, 85, 247, 0.1)',
              }}
            >
              <span style={{ fontSize: 16 }}>💜</span>
              <span
                style={{
                  fontSize: 12,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  color: 'var(--color-primary-light)',
                  fontWeight: 600,
                }}
              >
                Chats en ligne de groupe • Vibes choisies
              </span>
            </div>

            <h1
              style={{
                fontSize: 'clamp(2rem, 6vw, 4rem)',
                lineHeight: 1.1,
                marginBottom: 'clamp(20px, 4vw, 32px)',
                fontWeight: 700,
                letterSpacing: '-0.02em',
              }}
            >
              <span className="text-gradient" style={{ display: 'block', marginBottom: 8 }}>
                Chats en ligne qui respectent
              </span>
              <span style={{ color: 'var(--color-text-primary)', display: 'block' }}>
                ton rythme et tes limites
              </span>
            </h1>

            <p
              style={{
                fontSize: 'clamp(16px, 2.5vw, 20px)',
                lineHeight: 1.7,
                color: 'var(--color-text-secondary)',
                maxWidth: 680,
                margin: '0 auto clamp(32px, 5vw, 48px)',
              }}
            >
              ManyLovr t'aide à créer des connexions authentiques, en duo ou à
              plusieurs, sans spam ni swipe infini. Tu poses ton cadre, tes envies,
              tes groupes ; on t'aide à matcher et flirter en ligne avec les bonnes personnes.
            </p>

            {/* Boutons d'action élégants */}
            <div
              style={{
                display: 'flex',
                gap: 16,
                justifyContent: 'center',
                flexWrap: 'wrap',
                marginBottom: 'clamp(32px, 5vw, 48px)',
              }}
            >
              <button
                type="button"
                onClick={() => router.push('/onboarding')}
                className="btn-primary"
                style={{
                  padding: '16px 32px',
                  fontSize: 'clamp(15px, 2vw, 17px)',
                  fontWeight: 600,
                  minWidth: 180,
                  boxShadow: '0 4px 16px rgba(168, 85, 247, 0.3)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(168, 85, 247, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(168, 85, 247, 0.3)';
                }}
              >
                Créer mon profil
              </button>

              <button
                type="button"
                onClick={() => router.push('/profiles')}
                className="btn-outline"
                style={{
                  padding: '16px 32px',
                  fontSize: 'clamp(15px, 2vw, 17px)',
                  fontWeight: 500,
                  minWidth: 180,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.borderColor = 'var(--color-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                }}
              >
                Explorer les profils
              </button>
            </div>

            {/* Caractéristiques principales */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 20,
                paddingTop: 'clamp(32px, 5vw, 48px)',
                borderTop: '1px solid rgba(168, 85, 247, 0.15)',
              }}
            >
              {[
                {
                  icon: '👥',
                  title: 'Groupes privés',
                  text: 'Organise des chats en ligne à plusieurs',
                },
                {
                  icon: '🎯',
                  title: 'Matchmaking guidé',
                  text: 'Par ton style de vie et tes limites',
                },
                {
                  icon: '🛡️',
                  title: 'Sécurité renforcée',
                  text: 'Signalements, blocages et règles claires',
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '20px',
                    borderRadius: '16px',
                    background: 'rgba(168, 85, 247, 0.05)',
                    border: '1px solid rgba(168, 85, 247, 0.1)',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(168, 85, 247, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.2)';
                    e.currentTarget.style.transform = 'translateY(-4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(168, 85, 247, 0.05)';
                    e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.1)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ fontSize: 32, marginBottom: 12 }}>{item.icon}</div>
                  <h3
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: 'var(--color-text-primary)',
                      marginBottom: 8,
                    }}
                  >
                    {item.title}
                  </h3>
                  <p
                    style={{
                      fontSize: 14,
                      color: 'var(--color-text-secondary)',
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section contenu secondaire - Grille élégante */}
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 'clamp(24px, 4vw, 32px)',
            marginBottom: 'clamp(48px, 8vw, 96px)',
          }}
        >
          {/* Widget Stats */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <StatsWidget />
          </div>

          {/* Carte groupes actifs */}
          <div
            className="card"
            style={{
              padding: 'clamp(24px, 4vw, 32px)',
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.08), rgba(244, 114, 182, 0.05))',
              border: '1px solid rgba(168, 85, 247, 0.2)',
              backdropFilter: 'blur(12px)',
              display: 'flex',
              flexDirection: 'column',
              gap: 24,
            }}
          >
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: '9999px',
                  background: 'rgba(168, 85, 247, 0.15)',
                  marginBottom: 16,
                }}
              >
                <span style={{ fontSize: 14 }}>✨</span>
                <span
                  style={{
                    fontSize: 11,
                    color: 'var(--color-primary-light)',
                    fontWeight: 500,
                  }}
                >
                  En ce moment sur ManyLovr
                </span>
              </div>
              <h2
                style={{
                  fontSize: 'clamp(20px, 3vw, 24px)',
                  marginBottom: 12,
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                }}
              >
                Soirées, afterworks,
                <br />
                salons complices en ligne
              </h2>
              <p
                style={{
                  fontSize: 14,
                  color: 'var(--color-text-secondary)',
                  lineHeight: 1.6,
                }}
              >
                Rejoins des groupes affinitaires pour sortir, discuter, explorer à
                ton rythme. Pas d'algos opaques, pas de pression.
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              {[
                {
                  title: 'Groupe [Soirée chill mixte]',
                  details: '5 membres • Paris • ce week‑end',
                  color: 'var(--color-primary)',
                },
                {
                  title: 'Cercle [poly & queer friendly]',
                  details: '8 membres • chats longs en ligne',
                  color: 'var(--color-accent)',
                },
              ].map((group, idx) => (
                <div
                  key={idx}
                  className="card"
                  style={{
                    padding: '16px',
                    border: `1px solid ${group.color}25`,
                    background: `${group.color}10`,
                    borderRadius: '12px',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = `${group.color}40`;
                    e.currentTarget.style.background = `${group.color}15`;
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = `${group.color}25`;
                    e.currentTarget.style.background = `${group.color}10`;
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: 14,
                      fontWeight: 500,
                      color: 'var(--color-text-primary)',
                      marginBottom: 6,
                    }}
                  >
                    {group.title}
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 12,
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    {group.details}
                  </p>
                </div>
              ))}
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                paddingTop: 20,
                borderTop: '1px solid rgba(168, 85, 247, 0.15)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                }}
              >
                <span style={{ fontSize: 20, flexShrink: 0 }}>🛡️</span>
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    color: 'var(--color-text-secondary)',
                    lineHeight: 1.6,
                  }}
                >
                  Tu peux bloquer, signaler ou quitter un groupe à tout moment.
                </p>
              </div>

              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                }}
              >
                <p
                  style={{
                    margin: '0 0 6px 0',
                    fontSize: 13,
                    fontWeight: 500,
                    color: 'var(--color-success)',
                  }}
                >
                  ✓ Accès gratuit en bêta fermée
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                    color: 'var(--color-text-muted)',
                  }}
                >
                  L'app ne partage jamais ton identité réelle sans ton accord.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer élégant */}
        <footer
          style={{
            marginTop: 'clamp(48px, 8vw, 96px)',
            padding: 'clamp(32px, 5vw, 48px) clamp(24px, 4vw, 32px)',
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.85), rgba(17, 24, 39, 0.85))',
            borderTop: '1px solid rgba(168, 85, 247, 0.15)',
            borderRadius: '24px 24px 0 0',
            backdropFilter: 'blur(20px)',
            color: '#9ca3af',
            fontSize: 13,
          }}
        >
          <div
            style={{
              maxWidth: 900,
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 32,
            }}
          >
            <div
              className="card"
              style={{
                padding: 'clamp(24px, 4vw, 32px)',
                background: 'rgba(168, 85, 247, 0.08)',
                border: '1px solid rgba(168, 85, 247, 0.2)',
                borderRadius: '16px',
              }}
            >
              <p style={{ margin: '0 0 20px 0', fontSize: 15, color: '#e5e7eb', textAlign: 'center' }}>
                💜 ManyLovr est un réseau social inclusif développé avec passion par des Rennais engagés.
              </p>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 16,
                  flexWrap: 'wrap',
                  marginBottom: 24,
                }}
              >
                <button
                  type="button"
                  onClick={openSupport}
                  className="btn-primary"
                  style={{
                    padding: '12px 24px',
                    fontSize: 14,
                    fontWeight: 600,
                    boxShadow: '0 4px 12px rgba(168, 85, 247, 0.3)',
                  }}
                >
                  <span>💖</span> Soutenir le projet
                </button>
              </div>

              <h3
                style={{
                  fontSize: 16,
                  margin: '0 0 16px 0',
                  color: '#e5e7eb',
                  textAlign: 'center',
                }}
              >
                Contactez-nous
              </h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  alert('Message envoyé ! Merci de votre intérêt.');
                  e.target.reset();
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  maxWidth: 500,
                  margin: '0 auto',
                }}
              >
                <input
                  type="email"
                  placeholder="Votre email"
                  required
                  style={{
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                    background: 'rgba(15, 15, 35, 0.6)',
                    color: '#e5e7eb',
                    fontSize: 14,
                  }}
                />
                <textarea
                  placeholder="Votre message"
                  rows="4"
                  required
                  style={{
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                    background: 'rgba(15, 15, 35, 0.6)',
                    color: '#e5e7eb',
                    fontSize: 14,
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                />
                <button
                  type="submit"
                  className="btn-primary"
                  style={{
                    padding: '12px 24px',
                    fontSize: 14,
                    fontWeight: 600,
                    alignSelf: 'center',
                    minWidth: 150,
                  }}
                >
                  Envoyer
                </button>
              </form>
            </div>

            <p style={{ margin: 0, textAlign: 'center', fontSize: 12, color: 'var(--color-text-muted)' }}>
              © {new Date().getFullYear()} ManyLovr. Tous droits réservés.
            </p>
          </div>
        </footer>
      </div>

      {/* Modal de support élégante */}
      {supportOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            padding: 16,
          }}
          onClick={closeSupport}
        >
          <div
            className="card card-elevated"
            style={{
              padding: 32,
              maxWidth: 400,
              width: '100%',
              background: 'rgba(26, 26, 46, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              boxShadow: '0 16px 48px rgba(0, 0, 0, 0.6)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              style={{
                margin: '0 0 12px 0',
                fontSize: 22,
                fontWeight: 700,
                color: '#fff',
                textAlign: 'center',
              }}
            >
              💜 Soutenir ManyLovr
            </h2>
            <p
              style={{
                margin: '0 0 24px 0',
                fontSize: 14,
                color: '#9ca3af',
                textAlign: 'center',
              }}
            >
              Choisis le montant de ton soutien
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 12,
                marginBottom: 24,
              }}
            >
              {supportOptions.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setSupportAmount(amount)}
                  style={{
                    padding: '14px 12px',
                    borderRadius: 12,
                    border: supportAmount === amount
                      ? '2px solid var(--color-primary)'
                      : '1px solid rgba(168, 85, 247, 0.2)',
                    background: supportAmount === amount
                      ? 'rgba(168, 85, 247, 0.2)'
                      : 'rgba(26, 26, 46, 0.6)',
                    color: supportAmount === amount ? 'var(--color-primary-light)' : '#e5e7eb',
                    fontSize: 15,
                    fontWeight: supportAmount === amount ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (supportAmount !== amount) {
                      e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.4)';
                      e.currentTarget.style.background = 'rgba(168, 85, 247, 0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (supportAmount !== amount) {
                      e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.2)';
                      e.currentTarget.style.background = 'rgba(26, 26, 46, 0.6)';
                    }
                  }}
                >
                  {amount.toFixed(2)} €
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                type="button"
                onClick={closeSupport}
                className="btn-outline"
                style={{
                  flex: 1,
                  padding: '14px 20px',
                }}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmSupport}
                className="btn-primary"
                style={{
                  flex: 1,
                  padding: '14px 20px',
                }}
              >
                Confirmer 💖
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
