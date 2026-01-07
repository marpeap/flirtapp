'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import ProfileAvatar from '../_components/ProfileAvatar';

export default function ConversationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [conversations, setConversations] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [unreadCounts, setUnreadCounts] = useState({});

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
          
          // #region agent log
          fetch('http://127.0.0.1:7244/ingest/b52ac800-6cee-4c21-a14d-e8a882350bc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'messages/page.js:133',message:'Enriching conversation with profile',data:{conversationId:c.id,otherUserId:other,hasProfile:!!p,mainPhotoUrl:p?.main_photo_url?.substring(0,100)||null,mainPhotoUrlType:typeof p?.main_photo_url,mainPhotoUrlLength:p?.main_photo_url?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'messages-load',hypothesisId:'H1'})}).catch(()=>{});
          // #endregion
          
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
      
      // Charger les statuts en ligne
      if (otherUserIds.length > 0) {
        await loadOnlineStatus(otherUserIds);
      }
      
      // Charger les messages non lus par conversation
      await loadUnreadCounts(userId, enriched);
      
      setLoading(false);
    }
    
    async function loadOnlineStatus(userIds) {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      const { data: onlineProfiles } = await supabase
        .from('profiles')
        .select('user_id')
        .in('user_id', userIds)
        .gte('last_seen_at', fiveMinutesAgo);
      
      if (onlineProfiles) {
        setOnlineUsers(new Set(onlineProfiles.map(p => p.user_id)));
      }
    }
    
    async function loadUnreadCounts(userId, convsList) {
      const counts = {};
      
      // Récupérer les last_read_at pour chaque conversation
      const { data: participants } = await supabase
        .from('conversation_participants')
        .select('conversation_id, last_read_at')
        .eq('user_id', userId)
        .eq('active', true);
      
      const lastReadMap = {};
      if (participants) {
        participants.forEach(p => {
          lastReadMap[p.conversation_id] = p.last_read_at || new Date(0).toISOString();
        });
      }
      
      // Compter les messages non lus pour chaque conversation
      for (const conv of convsList) {
        const lastRead = lastReadMap[conv.id] || new Date(0).toISOString();
        
        const { count } = await supabase
          .from('messages')
          .select('*', { head: true, count: 'exact' })
          .eq('conversation_id', conv.id)
          .neq('sender_id', userId)
          .gt('created_at', lastRead);
        
        if (count > 0) {
          counts[conv.id] = count;
        }
      }
      
      setUnreadCounts(counts);
    }

    load();
    
    // Rafraîchir le statut en ligne toutes les 30 secondes
    const interval = setInterval(() => {
      load();
    }, 30000);
    
    return () => clearInterval(interval);
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
        {conversations.map((c) => {
          // Déterminer si l'interlocuteur est en ligne (pour les conversations 1-à-1)
          const otherUserId = !c.is_group 
            ? (c.user_id_1 === currentUserId ? c.user_id_2 : c.user_id_1)
            : null;
          const isOnline = otherUserId && onlineUsers.has(otherUserId);
          const unreadCount = unreadCounts[c.id] || 0;
          
          return (
            <li key={c.id} className="list-card-item" style={{
              position: 'relative',
              background: unreadCount > 0 
                ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(26, 26, 46, 0.85))'
                : 'var(--color-bg-card)',
              borderColor: unreadCount > 0 ? 'rgba(59, 130, 246, 0.3)' : undefined,
            }}>
              <Link
                href={`/messages/${c.id}`}
                style={{ color: 'inherit', textDecoration: 'none' }}
              >
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  {/* Avatar avec pastille de statut */}
                  <ProfileAvatar
                    photoUrl={c.avatarUrl}
                    displayName={c.displayName}
                    size={48}
                    showOnlineStatus={true}
                    isOnline={onlineUsers.has(c.user_id_1 === currentUserId ? c.user_id_2 : c.user_id_1)}
                  />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <strong style={{ 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap',
                        fontWeight: unreadCount > 0 ? 700 : 600,
                      }}>
                        {c.displayName}
                      </strong>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {c.is_group && (
                          <span
                            style={{
                              fontSize: 11,
                              color: '#facc15',
                              textTransform: 'uppercase',
                              fontWeight: 600,
                            }}
                          >
                            Groupe
                          </span>
                        )}
                        
                        {/* Pastille bleue - Messages non lus */}
                        {unreadCount > 0 && (
                          <span
                            style={{
                              minWidth: 20,
                              height: 20,
                              padding: '0 6px',
                              borderRadius: '10px',
                              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                              color: '#fff',
                              fontSize: 11,
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 2px 8px rgba(59, 130, 246, 0.4)',
                            }}
                          >
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                    <p
                      style={{
                        fontSize: 12,
                        color: unreadCount > 0 ? '#93c5fd' : '#9ca3af',
                        marginTop: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      {isOnline && (
                        <span style={{ color: '#10b981', fontSize: 11 }}>● En ligne</span>
                      )}
                      {!isOnline && c.subtitle}
                      {isOnline && c.subtitle && ` • ${c.subtitle}`}
                    </p>
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}

