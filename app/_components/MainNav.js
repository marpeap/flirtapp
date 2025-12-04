'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

const links = [
  { href: '/', label: 'Accueil' },
  { href: '/profiles', label: 'Profils' },
  { href: '/messages', label: 'Messages' },
  { href: '/onboarding', label: 'Mon profil' },
];

export default function MainNav() {
  const pathname = usePathname();
  const router = useRouter();

  const [userEmail, setUserEmail] = useState(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser(); // lecture initiale [web:965]
      if (!mounted) return;
      setUserEmail(user?.email ?? null);
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      setUserEmail(session?.user?.email ?? null);
    }); // se met à jour à chaque login/logout [web:959]

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    setSigningOut(true);
    await supabase.auth.signOut(); // [web:962]
    setSigningOut(false);
    setUserEmail(null);
    router.push('/login');
  }

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(20px)',
        backgroundColor: 'rgba(15, 15, 35, 0.85)',
        borderBottom: '1px solid rgba(168, 85, 247, 0.15)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
      }}
    >
      <nav
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            fontWeight: 700,
            letterSpacing: 0.5,
            fontSize: 18,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            textDecoration: 'none',
            color: 'var(--color-text-primary)',
            transition: 'all 0.25s ease',
          }}
          className="fade-in"
        >
          <span
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(168, 85, 247, 0.4)',
            }}
          >
            <span style={{ fontSize: 18 }}>💜</span>
          </span>
          <span className="text-gradient" style={{ fontSize: 18 }}>
            ManyLovr
          </span>
        </Link>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          {links.map((link) => {
            const active =
              pathname === link.href ||
              (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  fontSize: 14,
                  padding: '8px 16px',
                  borderRadius: '9999px',
                  border: active
                    ? '1px solid rgba(168, 85, 247, 0.4)'
                    : '1px solid transparent',
                  background: active
                    ? 'rgba(168, 85, 247, 0.15)'
                    : 'transparent',
                  color: active
                    ? 'var(--color-primary-light)'
                    : 'var(--color-text-secondary)',
                  textDecoration: 'none',
                  transition: 'all 0.25s ease',
                  fontWeight: active ? 500 : 400,
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = 'rgba(168, 85, 247, 0.1)';
                    e.currentTarget.style.color = 'var(--color-primary-light)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--color-text-secondary)';
                  }
                }}
              >
                {link.label}
              </Link>
            );
          })}

          {userEmail ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                paddingLeft: 12,
                borderLeft: '1px solid rgba(168, 85, 247, 0.2)',
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  color: 'var(--color-text-muted)',
                  maxWidth: 180,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={userEmail}
              >
                {userEmail}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                disabled={signingOut}
                className="btn-danger"
                style={{
                  fontSize: 12,
                  padding: '6px 14px',
                }}
              >
                {signingOut ? 'Déconnexion…' : 'Déconnexion'}
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="btn-primary"
              style={{
                fontSize: 14,
                padding: '8px 20px',
                textDecoration: 'none',
              }}
            >
              Connexion
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}

