'use client';

import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  return (
    <main
      style={{
        minHeight: 'calc(100vh - 56px)',
        backgroundImage:
          'radial-gradient(circle at top, #1f2937 0, #020617 55%, #000 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px 48px',
      }}
    >
      <div
        style={{
          maxWidth: 1040,
          width: '100%',
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1.2fr) minmax(0,1fr)',
          gap: 32,
        }}
      >
        {/* Bloc texte (gauche) */}
        <section
          style={{
            padding: 24,
            borderRadius: 24,
            border: '1px solid rgba(148,163,184,0.35)',
            background:
              'linear-gradient(135deg,rgba(15,23,42,0.94),rgba(15,23,42,0.7))',
            boxShadow: '0 24px 60px rgba(0,0,0,0.65)',
            backdropFilter: 'blur(18px)',
          }}
        >
          <p
            style={{
              fontSize: 12,
              letterSpacing: 0.18,
              textTransform: 'uppercase',
              color: '#9ca3af',
              marginBottom: 10,
            }}
          >
            Rencontres à plusieurs • vibes choisies
          </p>

          <h1
            style={{
              fontSize: 32,
              lineHeight: 1.1,
              marginBottom: 12,
            }}
          >
            Rencontres qui respectent
            <br />
            ton rythme et tes limites.
          </h1>

          <p
            style={{
              fontSize: 14,
              color: '#9ca3af',
              maxWidth: 460,
              marginBottom: 18,
            }}
          >
            ManyLovr t’aide à créer des connexions en solo ou à plusieurs,
            sans spam ni swipe infini. Tu poses ton cadre, tes envies, tes
            groupes ; on s’occupe de te présenter les bonnes personnes.
          </p>

          <div
            style={{
              display: 'flex',
              gap: 10,
              flexWrap: 'wrap',
              marginBottom: 16,
            }}
          >
            <button
              type="button"
              onClick={() => router.push('/onboarding')}
              style={{
                padding: '10px 18px',
                borderRadius: 999,
                border: 'none',
                backgroundImage:
                  'linear-gradient(135deg,#f97316,#fb7185)',
                color: '#0b1120',
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              Créer mon profil
            </button>

            <button
              type="button"
              onClick={() => router.push('/profiles')}
              style={{
                padding: '10px 18px',
                borderRadius: 999,
                border: '1px solid rgba(148,163,184,0.5)',
                backgroundColor: 'rgba(15,23,42,0.6)',
                color: '#e5e7eb',
                fontSize: 14,
              }}
            >
              Voir les profils
            </button>
          </div>

          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'grid',
              gap: 8,
              fontSize: 12,
              color: '#9ca3af',
            }}
          >
            <li>• Groupes privés pour organiser des rencontres à plusieurs.</li>
            <li>• Matchmaking guidé par ton style de vie et tes limites.</li>
            <li>• Signalements, blocages et règles claires pour rester safe.</li>
          </ul>
        </section>

        {/* Bloc visuel (droite) */}
        <section
          aria-hidden="true"
          style={{
            position: 'relative',
            borderRadius: 24,
            overflow: 'hidden',
            border: '1px solid rgba(55,65,81,0.7)',
            background:
              'radial-gradient(circle at 10% 0%,rgba(248,113,113,0.28),transparent 55%),radial-gradient(circle at 90% 100%,rgba(251,113,133,0.24),transparent 55%),linear-gradient(135deg,#020617,#020617)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(circle at 0 0,rgba(15,23,42,0.2),transparent 55%)',
              mixBlendMode: 'soft-light',
            }}
          />

          <div
            style={{
              position: 'relative',
              height: '100%',
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 12,
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: 11,
                    color: '#9ca3af',
                    marginBottom: 4,
                  }}
                >
                  En ce moment sur ManyLovr
                </p>
                <h2 style={{ fontSize: 18, marginBottom: 4 }}>
                  Soirées, afterworks,
                  <br />
                  rencontres complices.
                </h2>
                <p
                  style={{
                    fontSize: 12,
                    color: '#9ca3af',
                    maxWidth: 260,
                  }}
                >
                  Rejoins des groupes affinitaires pour sortir, discuter,
                  explorer à ton rythme. Pas d’algos opaques, pas de pression.
                </p>
              </div>

              <div
                style={{
                  display: 'grid',
                  gap: 6,
                  minWidth: 150,
                  fontSize: 11,
                }}
              >
                <div
                  style={{
                    padding: '6px 8px',
                    borderRadius: 12,
                    backgroundColor: 'rgba(15,23,42,0.9)',
                    border: '1px solid rgba(55,65,81,0.9)',
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: 11,
                      color: '#e5e7eb',
                    }}
                  >
                    Groupe [Soirée chill mixte]
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 10,
                      color: '#9ca3af',
                    }}
                  >
                    5 membres • Paris • ce week‑end
                  </p>
                </div>

                <div
                  style={{
                    padding: '6px 8px',
                    borderRadius: 12,
                    backgroundColor: 'rgba(15,23,42,0.9)',
                    border: '1px solid rgba(55,65,81,0.9)',
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: 11,
                      color: '#e5e7eb',
                    }}
                  >
                    Cercle [poly & queer friendly]
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 10,
                      color: '#9ca3af',
                    }}
                  >
                    8 membres • rencontres longues
                  </p>
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                gap: 12,
                marginTop: 20,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 30,
                    height: 30,
                    borderRadius: '999px',
                    border: '1px solid rgba(248,250,252,0.7)',
                    fontSize: 16,
                  }}
                >
                  💬
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 11,
                    color: '#9ca3af',
                    maxWidth: 200,
                  }}
                >
                  Tu peux bloquer, signaler ou quitter un groupe à tout moment.
                </p>
              </div>

              <div
                style={{
                  fontSize: 11,
                  color: '#94a3b8',
                  textAlign: 'right',
                }}
              >
                <p style={{ margin: 0 }}>Accès gratuit en bêta fermée.</p>
                <p style={{ margin: 0 }}>
                  L’app ne partage jamais ton identité réelle sans ton accord.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

