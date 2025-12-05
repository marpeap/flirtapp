'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import GroupMeetupsSection from './_components/GroupMeetupsSection';

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id;

  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [userId, setUserId] = useState(null);

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);

  const [errorMsg, setErrorMsg] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);

  const bottomRef = useRef(null);

  useEffect(() => {
    async function init() {
      if (!conversationId) return;

      setLoading(true);
      setErrorMsg('');

      // 1) Utilisateur connecté
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setLoading(false);
        router.replace('/login');
        return;
      }

      setUserId(user.id);

      // 2) Charger la conversation
      const { data: conv, error: convErr } = await supabase
        .from('conversations')
        .select('id, user_id_1, user_id_2, is_group, name')
        .eq('id', conversationId)
        .maybeSingle();

      if (convErr || !conv) {
        setErrorMsg("Conversation introuvable. " + (convErr?.message || ''));
        setLoading(false);
        return;
      }

      // 3) Vérifier que l'utilisateur a accès à cette conversation
      if (!conv.is_group) {
        // Pour les conversations 1-à-1, vérifier que l'utilisateur est un des participants
        const hasAccess = conv.user_id_1 === user.id || conv.user_id_2 === user.id;
        
        if (!hasAccess) {
          // Vérifier aussi dans conversation_participants (pour les nouvelles conversations)
          const { data: participant } = await supabase
            .from('conversation_participants')
            .select('id')
            .eq('conversation_id', conversationId)
            .eq('user_id', user.id)
            .eq('active', true)
            .maybeSingle();

          if (!participant) {
            setErrorMsg("Tu n'as pas accès à cette conversation.");
            setLoading(false);
            return;
          }
        }
      } else {
        // Pour les groupes, vérifier via conversation_participants
        const { data: participant } = await supabase
          .from('conversation_participants')
          .select('id')
          .eq('conversation_id', conversationId)
          .eq('user_id', user.id)
          .eq('active', true)
          .maybeSingle();

        if (!participant) {
          setErrorMsg("Tu n'as pas accès à cette conversation de groupe.");
          setLoading(false);
          return;
        }
      }

      setConversation(conv);

      // 3) Charger les messages
      await loadMessages(conv.id);
      
      // 4) Marquer comme lu
      await markConversationAsRead(conv.id, user.id);
      
      setLoading(false);
    }
    
    async function markConversationAsRead(convId, uId) {
      // Mettre à jour last_read_at dans conversation_participants
      const { error } = await supabase
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', convId)
        .eq('user_id', uId);
      
      if (error) {
        // Si la ligne n'existe pas, la créer
        await supabase
          .from('conversation_participants')
          .upsert({
            conversation_id: convId,
            user_id: uId,
            active: true,
            last_read_at: new Date().toISOString(),
          }, { onConflict: 'conversation_id, user_id' });
      }
    }

    async function loadMessages(convId) {
      setLoadingMessages(true);
      const { data: msgs, error: msgErr } = await supabase
        .from('messages')
        .select('id, sender_id, content, image_url, created_at')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      if (msgErr) {
        setErrorMsg(msgErr.message);
        setMessages([]);
      } else {
        setMessages(msgs || []);
      }
      setLoadingMessages(false);
      scrollToBottom();
    }

    init();
  }, [conversationId, router]);

  function scrollToBottom() {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!userId || !conversation || !inputValue.trim()) return;

    setSending(true);
    setErrorMsg('');

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        sender_id: userId,
        content: inputValue.trim(),
      })
      .select('id, sender_id, content, image_url, created_at')
      .single();

    setSending(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    setMessages((prev) => [...prev, data]);
    setInputValue('');
    scrollToBottom();
  }

  if (loading) {
    return <main>Chargement de la conversation…</main>;
  }

  if (!conversation) {
    return (
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '16px 12px 40px' }}>
        <div className="card">
          <p>{errorMsg || 'Conversation introuvable.'}</p>
          <button type="button" onClick={() => router.push('/profiles')}>
            ← Retour aux profils
          </button>
        </div>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '16px 12px 40px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <button
        type="button"
        onClick={() => router.push('/messages')}
        className="btn-outline"
        style={{ fontSize: 13, padding: '6px 12px', alignSelf: 'flex-start' }}
      >
        ← Retour aux conversations
      </button>

      {/* Section rendez-vous pour les groupes */}
      {conversation?.is_group && (
        <GroupMeetupsSection
          conversationId={conversation.id}
          userId={userId}
          isGroup={conversation.is_group}
        />
      )}

      <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '70vh' }}>
        <h1 style={{ fontSize: 16, marginBottom: 8 }}>
          {conversation?.is_group ? conversation.name || 'Groupe ManyLovr' : 'Conversation privée'}
        </h1>

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '6px 4px',
            borderRadius: 8,
            border: '1px solid #0f172a',
            backgroundColor: 'rgba(15,23,42,0.8)',
          }}
        >
          {loadingMessages ? (
            <p style={{ fontSize: 13, color: '#9ca3af' }}>Chargement des messages…</p>
          ) : messages.length === 0 ? (
            <p style={{ fontSize: 13, color: '#9ca3af' }}>Aucun message pour le moment. Ouvre le bal avec un premier mot.</p>
          ) : (
            messages.map((m) => {
              const isMine = m.sender_id === userId;
              return (
                <div key={m.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', marginBottom: 6 }}>
                  <div
                    style={{
                      maxWidth: '70%',
                      padding: '6px 10px',
                      borderRadius: 12,
                      backgroundColor: isMine ? '#4b5563' : '#111827',
                      color: '#e5e7eb',
                      fontSize: 13,
                      textAlign: 'left',
                    }}
                  >
                    {m.image_url && (
                      <img
                        src={m.image_url}
                        alt="Image partagée"
                        style={{
                          maxWidth: '100%',
                          borderRadius: 8,
                          marginBottom: m.content ? 6 : 0,
                        }}
                      />
                    )}
                    {m.content && (
                      <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{m.content}</p>
                    )}
                    <p style={{ margin: 0, marginTop: 4, fontSize: 10, color: '#9ca3af', textAlign: 'right' }}>
                      {new Date(m.created_at).toLocaleString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {errorMsg && <p style={{ marginTop: 6, fontSize: 12, color: 'tomato' }}>{errorMsg}</p>}

        <form onSubmit={handleSend} style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            rows={2}
            placeholder="Écris ton message…"
            style={{ flex: 1, resize: 'none' }}
          />
          <button type="submit" disabled={sending || !inputValue.trim()}>
            {sending ? 'Envoi…' : 'Envoyer'}
          </button>
        </form>
      </div>
    </main>
  );
}

