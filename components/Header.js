'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [userEmail, setUserEmail] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user) {
        setUserEmail(data.user.email || null);
      } else {
        setUserEmail(null);
      }
    }
    loadUser();
    setMenuOpen(false);
  }, [pathname]);

  async function handleLogout() {
    await supabase.auth.signOut();
    setUserEmail(null);
    router.push('/login');
  }

  const navItems = [
    { href: '/profiles', label: 'Profils' },
    { href: '/matches', label: 'Matchs' },
    { href: '/messages', label: 'Messages' },
    { href: '/onboarding', label: 'Mon profil' },
    { href: '/account', label: 'Compte' }, // <- NOUVEAU
  ];

  function isActive(href) {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  }

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        backdropFilter: 'blur(18px)',
        background:
          'linear-gradient(to right, rgba(15,23,42,0.96), rgba(17,24,39,0.96))',
        borderBottom: '1px solid #111827',
      }}
    >
      <div
        style={{
          maxWidth: 960,
          margin: '0 auto',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        {/* Logo + burger */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 4,
              textDecoration: 'none',
              color: '#f9fafb',
            }}
          >
            <span
              style={{
                width: 26,
                height: 26,
                borderRadius: 999,
                background:
                  'radial-gradient(circle at 30% 20%, #fb7185, #be123c)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                fontWeight: 700,
                animation: 'cw-pulse 2.4s ease-in-out infinite',
              }}
            >
              ♥
            </span>
            <span style={{ fontWeight: 600, fontSize: 15 }}>
              CupidWave
            </span>
          </Link>

          {/* Burger mobile */}
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Menu"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: 999,
              border: '1px solid #1f2937',
              backgroundColor: 'transparent',
              color: '#e5e7eb',
              padding: 0,
              marginLeft: 6,
            }}
            className="only-mobile"
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Nav desktop */}
        <nav
          className="only-desktop"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  textDecoration: 'none',
                  fontSize: 14,
                  padding: '6px 11px',
                  borderRadius: 999,
                  color: active ? '#f9fafb' : '#fda4af',
                  backgroundColor: active ? '#111827' : 'transparent',
                  transition:
                    'background-color 0.15s ease, color 0.15s ease',
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Zone utilisateur desktop */}
        <div
          className="only-desktop"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 12,
          }}
        >
          {userEmail ? (
            <>
              <span
                style={{
                  maxWidth: 160,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  color: '#fecaca',
                }}
                title={userEmail}
              >
                {userEmail}
              </span>
              <button
                onClick={handleLogout}
                style={{
                  padding: '6px 12px',
                  fontSize: 12,
                }}
              >
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                style={{
                  textDecoration: 'none',
                  fontSize: 12,
                  padding: '6px 11px',
                  borderRadius: 999,
                  color: '#fde68a',
                  border: '1px solid #374151',
                }}
              >
                Connexion
              </Link>
              <Link href="/signup">
                <button
                  style={{
                    padding: '6px 14px',
                    fontSize: 12,
                  }}
                >
                  Inscription
                </button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Menu mobile */}
      {menuOpen && (
        <div
          className="only-mobile"
          style={{
            borderTop: '1px solid #111827',
            padding: '6px 12px 10px 12px',
            backgroundColor: '#020617',
          }}
        >
          <nav
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              marginBottom: 8,
            }}
          >
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    textDecoration: 'none',
                    fontSize: 14,
                    padding: '6px 8px',
                    borderRadius: 8,
                    color: active ? '#f9fafb' : '#fef2f2',
                    backgroundColor: active ? '#111827' : 'transparent',
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              fontSize: 13,
            }}
          >
            {userEmail ? (
              <>
                <span
                  style={{
                    color: '#fecaca',
                    maxWidth: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Connecté : {userEmail}
                </span>
                <button
                  onClick={handleLogout}
                  style={{
                    padding: '6px 12px',
                    fontSize: 13,
                    alignSelf: 'flex-start',
                  }}
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  style={{
                    textDecoration: 'none',
                    color: '#fef2f2',
                  }}
                >
                  Se connecter
                </Link>
                <Link href="/signup">
                  <button
                    style={{
                      padding: '6px 14px',
                      fontSize: 13,
                      marginTop: 2,
                    }}
                  >
                    Créer un compte
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      <style jsx global>{`
        @media (max-width: 720px) {
          .only-desktop {
            display: none !important;
          }
        }
        @media (min-width: 721px) {
          .only-mobile {
            display: none !important;
          }
        }
        @keyframes cw-pulse {
          0% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(251, 113, 133, 0.5);
          }
          70% {
            transform: scale(1.06);
            box-shadow: 0 0 0 12px rgba(251, 113, 133, 0);
          }
          100% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(251, 113, 133, 0);
          }
        }
      `}</style>
    </header>
  );
}

