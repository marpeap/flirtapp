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
        backdropFilter: 'blur(10px)',
        backgroundColor: 'rgba(15,23,42,0.92)',
        borderBottom: '1px solid #1f2937',
      }}
    >
      <nav
        style={{
          maxWidth: 960,
          margin: '0 auto',
          padding: '10px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            fontWeight: 700,
            letterSpacing: 0.08,
            textTransform: 'uppercase',
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            textDecoration: 'none',
            color: '#e5e7eb',
          }}
        >
          <span
            style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              backgroundImage:
                'radial-gradient(circle at 30% 30%, #f97316, #7c2d12)',
            }}
          />
          <span>ManyLovr</span>
        </Link>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
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
                  fontSize: 13,
                  padding: '4px 10px',
                  borderRadius: 999,
                  border: active ? '1px solid #f97316' : '1px solid transparent',
                  backgroundColor: active ? 'rgba(15,23,42,0.9)' : 'transparent',
                  color: '#e5e7eb',
                  textDecoration: 'none',
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
                gap: 6,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  color: '#9ca3af',
                  maxWidth: 160,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={userEmail}
              >
                Connecté : {userEmail}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                disabled={signingOut}
                style={{
                  fontSize: 12,
                  padding: '4px 10px',
                  borderRadius: 999,
                  border: '1px solid #b91c1c',
                  backgroundImage:
                    'linear-gradient(135deg,#ef4444,#7f1d1d)',
                  color: '#fef2f2',
                }}
              >
                {signingOut ? 'Déconnexion…' : 'Déconnexion'}
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              style={{
                fontSize: 12,
                padding: '4px 10px',
                borderRadius: 999,
                border: '1px solid #4ade80',
                backgroundColor: '#022c22',
                color: '#bbf7d0',
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

