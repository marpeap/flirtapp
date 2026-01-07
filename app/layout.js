// app/layout.js
import './globals.css';
import Sidebar from './_components/Sidebar';
import Loading from './_components/Loading';

export const metadata = {
  title: {
    template: '%s | ManyLovr',
    default: 'ManyLovr',
  },
  description:
    "ManyLovr est une app de chat en ligne pensée pour les connexions à plusieurs, les groupes affinitaires et les échanges qualitatifs.",
  metadataBase: new URL('https://manylovr.com'),
  // Note: CSP eval() warning en développement vient de Next.js hot reload
  // Ce n'est pas un problème de sécurité en développement
};

// Viewport (export dédié Next.js)
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Loading />
        <Sidebar />
        <main>{children}</main>
      </body>
    </html>
  );
}

