import './globals.css';
import Header from '../components/Header';
import Footer from '../components/Footer';

export const metadata = {
  title: 'CupidWave',
  description: 'CupidWave — rencontres proches, simples et assumées.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <Header />
        <div style={{ minHeight: 'calc(100vh - 120px)' }}>{children}</div>
        <Footer />
      </body>
    </html>
  );
}

