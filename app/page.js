'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  const [userEmail, setUserEmail] = useState(null);

  useEffect(() => {
    async function loadUser() {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user) {
        setUserEmail(data.user.email);
      }
    }
    loadUser();
  }, []);

  return (
    <main style={{ color: 'white', padding: 24 }}>
      <h1>Mon futur site de rencontres</h1>
      {userEmail ? (
        <p>Connecté en tant que {userEmail}</p>
      ) : (
        <p>Tu n&apos;es pas connecté.</p>
      )}
    </main>
  );
<p>
  <a href="/profiles" style={{ color: 'lightblue' }}>
    Voir les profils
  </a>
</p>

}

