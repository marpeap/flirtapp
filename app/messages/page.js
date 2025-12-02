'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function MessagesListPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [items, setItems] = useState([]);

  useEffect(() => {
    async function loadConversations() {
      setLoading(true);
      setErrorMsg('');

      // 1. Utilisateur connecté
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        setLoading(false);
        router.push('/login');
        return;
      }

      const currentUserId = userData.user.id;

      // 2. Récupérer les conversations où il est user_id_1 ou user_id_2
      const { data: convs, error: convError } = await supabase
        .from('conversations')
        .select('id, user_id_1, user_id_2, created_at, last_message_at')
        .or(
          `user_id_1.eq.${currentUserId},user_id_2.eq.${currentUserId}`
        )
        .order('last_message_at', { ascending: false })
        .order('created_at', { ascending: false });

      if (convError) {
        setErrorMsg(convError.message);
        setLoading(false);
        return;
      }

      if (!convs || convs.length === 0) {
        setItems([]);
        setLoading(false);
        return;
      }

      // 3. Identifier les "autres" utilisateurs pour chaque conversation
      const otherUserIds = Array.from(
        new Set(
          convs.map((c) =>
            c.user_id_1 === currentUserId ? c.user_id_2 : c.user_id_1
          )
        )
      );

      // 4. Récupérer les profils correspondants
      const { data: otherProfiles, error: profError } = await supabase
        .from('profiles')
        .select('user_id, display_name, city')
        .in('user_id', otherUserIds);

      if (profError) {
        setErrorMsg(profError.message);
        setLoading(false);
        return;
      }

      const profileByUserId = {};
      (otherProfiles || []).forEach((p) => {
        profileByUserId[p.user_id] = p;
      });

      // 5. Construire la liste à afficher
      const result = convs.map((c) => {
        const otherId =
          c.user_id_1 === currentUserId ? c.user_id_2 : c.user_id_1;
        const otherProfile = profileByUserId[otherId] || {};
        return {
          conversationId: c.id,
          displayName: otherProfile.display_name || 'Profil',
          city: otherProfile.city || '',
        };
      });

      setItems(result);
      setLoading(false);
    }

    loadConversations();
  }, [router]);

  if (loading) {
    return <main style={{ color: 'white', padding: 24 }}>Chargement…</main>;
  }

  return (
    <main style={{ color: 'white', padding: 24 }}>
      <h1>Messages</h1>

      {errorMsg && <p style={{ color: 'red' }}>{errorMsg}</p>}

      {items.length === 0 && !errorMsg && (
        <p>Aucune conversation pour le moment.</p>
      )}

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {items.map((item) => (
          <li
            key={item.conversationId}
            style={{
              border: '1px solid #444',
              padding: 12,
              marginBottom: 8,
            }}
          >
            <Link
              href={`/messages/${item.conversationId}`}
              style={{ color: 'lightblue', textDecoration: 'none' }}
            >
              <strong>{item.displayName}</strong>
              {item.city ? ` — ${item.city}` : ''}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}

