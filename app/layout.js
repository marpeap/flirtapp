// app/layout.js
import './globals.css';
import MainNav from './_components/MainNav';

export const metadata = {
  title: {
    template: '%s | ManyLovr',
    default: 'ManyLovr',
  },
  description:
    "ManyLovr est une app de chat en ligne pensée pour les connexions à plusieurs, les groupes affinitaires et les échanges qualitatifs.",
  metadataBase: new URL('https://manylovr.com'),
};

// Viewport (export dédié Next.js)
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <MainNav />
        <main>{children}</main>
      </body>
    </html>
  );
}

