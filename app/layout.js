import './globals.css';
import Header from '../components/Header';

export const metadata = {
  title: 'Mon site de rencontres',
  description: 'Rencontres rapides, amicales ou coquines.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          backgroundColor: '#000',
          color: '#fff',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
        }}
      >
        <Header />
        <div style={{ minHeight: '100vh' }}>{children}</div>
      </body>
    </html>
  );
}

