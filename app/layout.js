// app/layout.js
import './globals.css';
import MainNav from './_components/MainNav';

export const metadata = {
  title: {
    template: '%s | ManyLovr',
    default: 'ManyLovr',
  },
  description:
    "ManyLovr est une app de rencontres pensée pour les connexions à plusieurs, les groupes affinitaires et les rencontres qualitatives.",
  metadataBase: new URL('https://manylovr.com'),
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

