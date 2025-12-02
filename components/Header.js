'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [userEmail, setUserEmail] = useState(null);

  useEffect(() => {
    async function loadUser() {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user) {
        setUserEmail(data.user.email);
      } else {
        setUserEmail(null);
      }
    }
    loadUser();
  }, [pathname]); // re-vérifie quand on change de page

  async function handleLogout() {
    await supabase.auth.signOut();
    setUserEmail(null);
    router.push('/login');
  }

  const linkStyle = { color: 'white', textDecoration: 'none', marginRight: 16 };
  const activeStyle = { ...linkStyle, textDecoration: 'underline' };

  function navLink(href, label) {
    const isActive = pathname === href;
    return (
      <Link href={href} style={isActive ? activeStyle : linkStyle}>
        {label}
      </Link>
    );
  }

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
        borderBottom: '1px solid #333',
        backgroundColor: '#000',
      }}
    >
      <div style={{ fontWeight: 'bold' }}>
        <Link href="/" style={{ color: 'white', textDecoration: 'none' }}>
          Mon site de rencontres
        </Link>
      </div>

      <nav>
        {navLink('/profiles', 'Profils')}
        {navLink('/messages', 'Messages')}
        {navLink('/onboarding', 'Mon profil')}
      </nav>

      <div>
        {userEmail ? (
          <>
            <span style={{ marginRight: 12, fontSize: 12 }}>
              Connecté : {userEmail}
            </span>
            <button onClick={handleLogout} style={{ padding: '4px 8px' }}>
              Se déconnecter
            </button>
          </>
        ) : (
          <>
            {navLink('/login', 'Connexion')}
            {navLink('/signup', 'Inscription')}
          </>
        )}
      </div>
    </header>
  );
}

