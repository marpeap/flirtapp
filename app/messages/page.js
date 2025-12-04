'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function ConversationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [conversations, setConversations] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setErrorMsg('');

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        setLoading(false);
        router.push('/login');
        return;
      }

      const userId = userData.user.id;
      setCurrentUserId(userId);

      // Récupérer les conversations où l'utilisateur est participant actif
      const { data: parts, error: partErr } = await supabase
        .from('conversation_participants')
        .select(
          `
          conversation_id,
          conversations (
            id,
            is_group,
            name,
            user_id_1,
            user_id_2
          )
        `
        )
        .eq('user_id', userId)
        .eq('active', true);

      if (partErr) {
        setErrorMsg(partErr.message);
        setLoading(false);
        return;
      }

      let convs = parts
        .map((p) => p.conversations)
        .filter(Boolean);

      // Fallback : récupérer aussi les conversations 1-à-1 qui n'ont pas d'entrée dans conversation_participants
      // (pour les anciennes conversations créées avant la correction)
      const { data: legacyConvs, error: legacyErr } = await supabase
        .from('conversations')
        .select('id, is_group, name, user_id_1, user_id_2')
        .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`)
        .eq('is_group', false);

      if (!legacyErr && legacyConvs) {
        // Filtrer celles qui ne sont pas déjà dans convs
        const existingIds = new Set(convs.map((c) => c.id));
        const newLegacy = legacyConvs.filter((c) => !existingIds.has(c.id));
        convs = [...convs, ...newLegacy];
      }

      // Charger les profils nécessaires pour nommer les 1‑à‑1
      const otherUserIds = [];
      convs.forEach((c) => {
        if (!c.is_group) {
          const other =
            c.user_id_1 === userId ? c.user_id_2 : c.user_id_1;
          if (other && !otherUserIds.includes(other)) {
            otherUserIds.push(other);
          }
        }
      });

      let profilesByUserId = {};
      if (otherUserIds.length > 0) {
        const { data: profiles, error: profErr } = await supabase
          .from('profiles')
          .select('user_id, display_name, main_photo_url, city')
          .in('user_id', otherUserIds);

        if (!profErr && profiles) {
          profilesByUserId = profiles.reduce((acc, p) => {
            acc[p.user_id] = p;
            return acc;
          }, {});
        }
      }

      // Pour les groupes, compter les membres
      const groupIds = convs.filter((c) => c.is_group).map((c) => c.id);
      let membersCountByConvId = {};
      if (groupIds.length > 0) {
        const { data: groupParts } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .in('conversation_id', groupIds)
          .eq('active', true);

        if (groupParts) {
          groupParts.forEach((gp) => {
            membersCountByConvId[gp.conversation_id] =
              (membersCountByConvId[gp.conversation_id] || 0) + 1;
          });
        }
      }

      const enriched = convs.map((c) => {
        if (c.is_group) {
          return {
            ...c,
            displayName: c.name || 'Groupe ManyLovr',
            subtitle: `${membersCountByConvId[c.id] || 0} participant(s)`,
            avatarLetter: 'G',
          };
        } else {
          const other =
            c.user_id_1 === userId ? c.user_id_2 : c.user_id_1;
          const p = other ? profilesByUserId[other] : null;
          const name = p?.display_name || 'Profil supprimé';
          const city = p?.city || '';
          return {
            ...c,
            displayName: name,
            subtitle: city,
            avatarLetter: name.charAt(0).toUpperCase(),
            avatarUrl: p?.main_photo_url || null,
          };
        }
      });

      setConversations(enriched);
      setLoading(false);
    }

    load();
  }, [router]);

  if (loading) {
    return <main>Chargement…</main>;
  }

  return (
    <main>
      <h1>Mes conversations</h1>

      {errorMsg && (
        <p style={{ color: 'tomato', marginBottom: 12 }}>{errorMsg}</p>
      )}

      {conversations.length === 0 && !errorMsg && (
        <p style={{ fontSize: 14 }}>
          Tu n’as pas encore de conversation. Lance‑toi depuis les profils ou
          crée bientôt un groupe.
        </p>
      )}

      <ul className="list-card">
        {conversations.map((c) => (
          <li key={c.id} className="list-card-item">
            <Link
              href={`/messages/${c.id}`}
              style={{ color: 'inherit', textDecoration: 'none' }}
            >
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                {c.avatarUrl ? (
                  <img
                    src={c.avatarUrl}
                    alt={c.displayName}
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      backgroundColor: '#111827',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                      flexShrink: 0,
                    }}
                  >
                    {c.avatarLetter}
                  </div>
                )}

                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 8,
                    }}
                  >
                    <strong>{c.displayName}</strong>
                    {c.is_group && (
                      <span
                        style={{
                          fontSize: 11,
                          color: '#facc15',
                          textTransform: 'uppercase',
                        }}
                      >
                        Groupe
                      </span>
                    )}
                  </div>
                  <p
                    style={{
                      fontSize: 12,
                      color: '#9ca3af',
                      marginTop: 2,
                    }}
                  >
                    {c.subtitle}
                  </p>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}

