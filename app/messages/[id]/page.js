'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id;

  const [currentUserId, setCurrentUserId] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [banError, setBanError] = useState('');
  const [banInfo, setBanInfo] = useState('');

  useEffect(() => {
    if (!conversationId) return;

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

      // Vérifier que l'utilisateur fait partie de la conv (et qu'il n'est pas banni)
      const { data: partRows, error: partErr } = await supabase
        .from('conversation_participants')
        .select(
          `
          id,
          role,
          active,
          user_id,
          conversations (
            id,
            is_group,
            name,
            user_id_1,
            user_id_2
          )
        `
        )
        .eq('conversation_id', conversationId);

      if (partErr) {
        setErrorMsg(partErr.message);
        setLoading(false);
        return;
      }

      const myPart = partRows.find((p) => p.user_id === userId);
      if (!myPart || !myPart.active) {
        setErrorMsg(
          "Tu ne fais pas (ou plus) partie de cette conversation."
        );
        setLoading(false);
        return;
      }

      const conv = myPart.conversations;
      if (!conv) {
        setErrorMsg('Conversation introuvable.');
        setLoading(false);
        return;
      }

      // Charger les profils des participants
      const memberIds = Array.from(
        new Set(partRows.map((p) => p.user_id))
      );
      let profilesByUserId = {};

      if (memberIds.length > 0) {
        const { data: profiles, error: profErr } = await supabase
          .from('profiles')
          .select('user_id, display_name, main_photo_url, city')
          .in('user_id', memberIds);

        if (!profErr && profiles) {
          profilesByUserId = profiles.reduce((acc, p) => {
            acc[p.user_id] = p;
            return acc;
          }, {});
        }
      }

      const enrichedParts = partRows.map((p) => {
        const profile = profilesByUserId[p.user_id];
        return {
          ...p,
          profile,
        };
      });

      setConversation(conv);
      setParticipants(enrichedParts);

      // Charger les messages
      const { data: msgs, error: msgErr } = await supabase
        .from('messages')
        .select('id, sender_id, content, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (msgErr) {
        setErrorMsg(msgErr.message);
        setLoading(false);
        return;
      }

      setMessages(msgs || []);
      setLoading(false);

      // Optionnel : abonnement Realtime pour les nouveaux messages
      const channel = supabase
        .channel(`conv-${conversationId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload) => {
            setMessages((prev) => [...prev, payload.new]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }

    load();
  }, [conversationId, router]);

  async function handleSend(e) {
    e.preventDefault();
    if (!newMessage.trim() || !currentUserId) return;

    setSending(true);
    setErrorMsg('');

    const { error } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: currentUserId,
      content: newMessage.trim(),
    });

    setSending(false);

    if (error) {
      setErrorMsg(error.message);
    } else {
      setNewMessage('');
    }
  }

  async function handleBanVote(targetUserId) {
    if (!currentUserId || !conversation) return;
    setBanError('');
    setBanInfo('');

    if (!conversation.is_group) {
      return;
    }
    if (targetUserId === currentUserId) {
      return;
    }

    try {
      const confirmVote = window.confirm(
        "Tu veux demander l'exclusion de cette personne du groupe ? Si assez de membres votent, elle sera retirée sans notification directe."
      );
      if (!confirmVote) return;

      const { error } = await supabase.from('group_ban_votes').insert({
        conversation_id: conversationId,
        target_user_id: targetUserId,
        voter_id: currentUserId,
      });

      if (error) {
        setBanError(error.message);
      } else {
        setBanInfo(
          "Ton vote a été pris en compte. Si assez de membres votent aussi, cette personne sera retirée du groupe."
        );
      }
    } catch (err) {
      setBanError('Erreur lors du vote.');
    }
  }

  if (loading) {
    return <main>Chargement…</main>;
  }

  if (errorMsg) {
    return (
      <main>
        <p style={{ color: 'tomato', marginBottom: 12 }}>{errorMsg}</p>
        <button onClick={() => router.push('/messages')}>← Retour</button>
      </main>
    );
  }

  const isGroup = conversation.is_group;
  const me = participants.find((p) => p.user_id === currentUserId);
  const others = participants.filter((p) => p.user_id !== currentUserId);

  let title = 'Conversation';
  if (isGroup) {
    title = conversation.name || 'Groupe CupidWave';
  } else {
    const other =
      conversation.user_id_1 === currentUserId
        ? conversation.user_id_2
        : conversation.user_id_1;
    const otherProfile = participants.find((p) => p.user_id === other)?.profile;
    title = otherProfile?.display_name || 'Conversation privée';
  }

  return (
    <main>
      <button
        onClick={() => router.push('/messages')}
        style={{
          marginBottom: 10,
          backgroundImage:
            'linear-gradient(135deg,#4b5563,#020617)',
          color: '#e5e7eb',
          padding: '6px 12px',
          fontSize: 12,
        }}
      >
        ← Retour aux conversations
      </button>

      <div className="card">
        <h1 style={{ fontSize: 18, marginBottom: 4 }}>{title}</h1>

        {isGroup && (
          <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8 }}>
            Groupe de {participants.length} personne
            {participants.length > 1 ? 's' : ''}. Tu peux voter pour exclure
            quelqu’un si l’ambiance ne te convient pas.
          </p>
        )}

        {isGroup && (
          <section
            style={{
              marginBottom: 12,
              padding: '8px 10px',
              borderRadius: 10,
              border: '1px solid #1f2937',
              backgroundColor: '#020617',
            }}
          >
            <h2 style={{ fontSize: 13, marginBottom: 6 }}>
              Participants
            </h2>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                display: 'flex',
                flexWrap: 'wrap',
                gap: 6,
              }}
            >
              {participants.map((p) => {
                const isMe = p.user_id === currentUserId;
                const label =
                  p.profile?.display_name || (isMe ? 'Moi' : 'Membre');
                const city = p.profile?.city || '';
                return (
                  <li
                    key={p.user_id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 12,
                      backgroundColor: '#020617',
                      padding: '4px 8px',
                      borderRadius: 999,
                      border: '1px solid #1f2937',
                    }}
                  >
                    <span>
                      {label}
                      {city ? (
                        <span
                          style={{
                            color: '#9ca3af',
                            marginLeft: 4,
                            fontSize: 11,
                          }}
                        >
                          ({city})
                        </span>
                      ) : null}
                      {isMe && (
                        <span
                          style={{
                            marginLeft: 4,
                            fontSize: 11,
                            color: '#a3e635',
                          }}
                        >
                          moi
                        </span>
                      )}
                    </span>
                    {!isMe && (
                      <button
                        type="button"
                        onClick={() => handleBanVote(p.user_id)}
                        style={{
                          marginLeft: 4,
                          padding: '2px 8px',
                          fontSize: 11,
                          backgroundImage:
                            'linear-gradient(135deg,#f97373,#b91c1c)',
                          color: '#fef2f2',
                        }}
                      >
                        Exclure
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
            {banError && (
              <p style={{ color: 'tomato', marginTop: 6, fontSize: 12 }}>
                {banError}
              </p>
            )}
            {banInfo && (
              <p style={{ color: '#a3e635', marginTop: 6, fontSize: 12 }}>
                {banInfo}
              </p>
            )}
          </section>
        )}

        <section className="chat-box" style={{ marginBottom: 10 }}>
          {messages.length === 0 ? (
            <p style={{ fontSize: 13, color: '#9ca3af' }}>
              Aucun message pour le moment. Lance la discussion.
            </p>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                maxHeight: '50vh',
                overflowY: 'auto',
              }}
            >
              {messages.map((m) => {
                const isMine = m.sender_id === currentUserId;
                const senderPart = participants.find(
                  (p) => p.user_id === m.sender_id
                );
                const senderName =
                  senderPart?.profile?.display_name ||
                  (isMine ? 'Toi' : 'Membre');
                return (
                  <div
                    key={m.id}
                    style={{
                      alignSelf: isMine ? 'flex-end' : 'flex-start',
                      maxWidth: '75%',
                    }}
                  >
                    {isGroup && !isMine && (
                      <div
                        style={{
                          fontSize: 11,
                          color: '#9ca3af',
                          marginBottom: 2,
                        }}
                      >
                        {senderName}
                      </div>
                    )}
                    <div
                      style={{
                        backgroundColor: isMine ? '#f97316' : '#111827',
                        color: isMine ? '#111827' : '#f9fafb',
                        borderRadius: 14,
                        padding: '6px 10px',
                        fontSize: 14,
                      }}
                    >
                      {m.content}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <form
          onSubmit={handleSend}
          style={{ display: 'flex', gap: 8, alignItems: 'center' }}
        >
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Écris un message…"
            style={{ flex: 1 }}
          />
          <button type="submit" disabled={sending}>
            {sending ? 'Envoi…' : 'Envoyer'}
          </button>
        </form>
      </div>
    </main>
  );
}

