'use client';

import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  return (
    <main
      style={{
        minHeight: 'calc(100vh - 80px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 16px',
        position: 'relative',
      }}
      className="fade-in"
    >
      {/* Effet de fond animé */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 30% 20%, rgba(168, 85, 247, 0.15) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(244, 114, 182, 0.12) 0%, transparent 50%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          maxWidth: 1200,
          width: '100%',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 0.9fr)',
          gap: 48,
          alignItems: 'center',
          position: 'relative',
          zIndex: 1,
        }}
        className="grid-responsive"
      >
        {/* Bloc texte principal (gauche) */}
        <section className="card card-elevated" style={{ padding: 'clamp(24px, 5vw, 40px)' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 12px',
              borderRadius: '9999px',
              background: 'rgba(168, 85, 247, 0.15)',
              border: '1px solid rgba(168, 85, 247, 0.2)',
              marginBottom: 20,
            }}
          >
            <span style={{ fontSize: 14 }}>💜</span>
            <span
              style={{
                fontSize: 12,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
                color: 'var(--color-primary-light)',
                fontWeight: 600,
              }}
            >
              Rencontres à plusieurs • Vibes choisies
            </span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(1.75rem, 8vw, 3.5rem)',
              lineHeight: 1.2,
              marginBottom: 'clamp(16px, 4vw, 20px)',
              fontWeight: 700,
            }}
          >
            <span className="text-gradient">
              Rencontres qui respectent
            </span>
            <br />
            <span style={{ color: 'var(--color-text-primary)' }}>
              ton rythme et tes limites
            </span>
          </h1>

          <p
            style={{
              fontSize: 'clamp(14px, 3vw, 18px)',
              lineHeight: 1.7,
              color: 'var(--color-text-secondary)',
              maxWidth: 520,
              marginBottom: 'clamp(20px, 4vw, 32px)',
            }}
          >
            ManyLovr t'aide à créer des connexions authentiques, en solo ou à
            plusieurs, sans spam ni swipe infini. Tu poses ton cadre, tes envies,
            tes groupes ; on s'occupe de te présenter les bonnes personnes.
          </p>

          <div
            style={{
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
              marginBottom: 'clamp(20px, 4vw, 32px)',
            }}
          >
            <button
              type="button"
              onClick={() => router.push('/onboarding')}
              className="btn-primary"
              style={{
                padding: 'clamp(12px, 3vw, 14px) clamp(20px, 4vw, 28px)',
                fontSize: 'clamp(14px, 3vw, 16px)',
                fontWeight: 600,
                flex: '1 1 auto',
                minWidth: '140px',
              }}
            >
              Créer mon profil
            </button>

            <button
              type="button"
              onClick={() => router.push('/profiles')}
              className="btn-outline"
              style={{
                padding: 'clamp(12px, 3vw, 14px) clamp(20px, 4vw, 28px)',
                fontSize: 'clamp(14px, 3vw, 16px)',
                fontWeight: 500,
                flex: '1 1 auto',
                minWidth: '140px',
              }}
            >
              Explorer les profils
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gap: 12,
              paddingTop: 24,
              borderTop: '1px solid rgba(168, 85, 247, 0.15)',
            }}
          >
            {[
              {
                icon: '👥',
                text: 'Groupes privés pour organiser des rencontres à plusieurs',
              },
              {
                icon: '🎯',
                text: 'Matchmaking guidé par ton style de vie et tes limites',
              },
              {
                icon: '🛡️',
                text: 'Signalements, blocages et règles claires pour rester safe',
              },
            ].map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                }}
              >
                <span style={{ fontSize: 20, flexShrink: 0 }}>{item.icon}</span>
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
        </section>

        {/* Bloc visuel (droite) */}
        <section
          className="card"
          style={{
            position: 'relative',
            padding: 'clamp(20px, 4vw, 32px)',
            background:
              'linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(244, 114, 182, 0.08))',
            border: '1px solid rgba(168, 85, 247, 0.2)',
          }}
        >
          <div
            style={{
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
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  background: 'rgba(168, 85, 247, 0.15)',
                  marginBottom: 16,
                }}
              >
                <span style={{ fontSize: 12 }}>✨</span>
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
                  fontSize: 24,
                  marginBottom: 12,
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                }}
              >
                Soirées, afterworks,
                <br />
                rencontres complices
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
                display: 'grid',
                gap: 10,
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
                  details: '8 membres • rencontres longues',
                  color: 'var(--color-accent)',
                },
              ].map((group, idx) => (
                <div
                  key={idx}
                  className="card"
                  style={{
                    padding: '14px 16px',
                    border: `1px solid ${group.color}20`,
                    background: `${group.color}08`,
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                      fontWeight: 500,
                      color: 'var(--color-text-primary)',
                      marginBottom: 4,
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
                  gap: 10,
                }}
              >
                <span style={{ fontSize: 20, flexShrink: 0 }}>🛡️</span>
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    color: 'var(--color-text-secondary)',
                    lineHeight: 1.5,
                  }}
                >
                  Tu peux bloquer, signaler ou quitter un groupe à tout moment.
                </p>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
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
      </div>
    </main>
  );
}
