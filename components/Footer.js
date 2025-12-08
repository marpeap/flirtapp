'use client';

import Link from 'next/link';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      style={{
        borderTop: '1px solid #111827',
        marginTop: 32,
        padding: '14px 16px',
        background:
          'linear-gradient(to right, rgba(15,23,42,0.96), rgba(17,24,39,0.96))',
      }}
    >
      <div
        style={{
          maxWidth: 960,
          margin: '0 auto',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          gap: 12,
          fontSize: 12,
          color: '#9ca3af',
        }}
      >
        <div>
          <div>© {year} ManyLovr</div>
        <div>Fais en caleçon depuis mon PC</div>
          <div>Contact : Marpeap au 0649710370</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Link href="/legal" style={{ color: '#7dd3fc', textDecoration: 'none' }}>
            Conditions d’utilisation
          </Link>
          <Link href="/contact" style={{ color: '#6ee7b7', textDecoration: 'none', fontSize: 11 }}>
            Suggérer une amélioration, ou proposer de boire un café à Saint-Anne
          </Link>
          <span style={{ fontSize: 11 }}>
            Projet en bêta, dédié au chat en ligne et à la création de groupes.
          </span>
        </div>
      </div>
    </footer>
  );
}

