'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { getGoodieById } from '@/lib/goodies';
import GroupMeetupsSection from './_components/GroupMeetupsSection';
import GoodiesSelector from './_components/GoodiesSelector';
import VoiceRecorder from './_components/VoiceRecorder';

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationId = params.id;

  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [userId, setUserId] = useState(null);
  const [otherUserId, setOtherUserId] = useState(null);

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);

  const [errorMsg, setErrorMsg] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  
  // Goodies et Voice
  const [showGoodies, setShowGoodies] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [goodieSentMessage, setGoodieSentMessage] = useState('');

  const bottomRef = useRef(null);
  
  // Vérifier si un goodie vient d'être envoyé
  useEffect(() => {
    const goodieSent = searchParams.get('goodie_sent');
    if (goodieSent) {
      const goodie = getGoodieById(goodieSent);
      if (goodie) {
        setGoodieSentMessage(`${goodie.emoji} Ton ${goodie.name} a été envoyé !`);
        setTimeout(() => setGoodieSentMessage(''), 5000);
      }
      // Nettoyer l'URL
      router.replace(`/messages/${conversationId}`);
    }
  }, [searchParams, conversationId, router]);

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
      
      // Déterminer l'autre utilisateur (pour les goodies)
      if (!conv.is_group) {
        const other = conv.user_id_1 === user.id ? conv.user_id_2 : conv.user_id_1;
        setOtherUserId(other);
      }

      // 3) Charger les messages
      await loadMessages(conv.id);
      
      // 4) Marquer comme lu
      await markConversationAsRead(conv.id, user.id);
      
      setLoading(false);
    }
    
    async function markConversationAsRead(convId, uId) {
      const now = new Date().toISOString();
      
      // Vérifier si une entrée existe déjà
      const { data: existing } = await supabase
        .from('conversation_participants')
        .select('id')
        .eq('conversation_id', convId)
        .eq('user_id', uId)
        .maybeSingle();
      
      if (existing) {
        // Mettre à jour last_read_at
        await supabase
          .from('conversation_participants')
          .update({ last_read_at: now })
          .eq('conversation_id', convId)
          .eq('user_id', uId);
      } else {
        // Créer l'entrée
        await supabase
          .from('conversation_participants')
          .insert({
            conversation_id: convId,
            user_id: uId,
            active: true,
            last_read_at: now,
          });
      }
    }

    async function loadMessages(convId) {
      setLoadingMessages(true);
      const { data: msgs, error: msgErr } = await supabase
        .from('messages')
        .select('id, sender_id, content, image_url, created_at, message_type, goodie_id, voice_url, voice_duration')
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

      {/* Zone des messages */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '55vh', marginBottom: 0 }}>
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
              const isGoodie = m.message_type === 'goodie';
              const isVoice = m.message_type === 'voice';
              const goodie = isGoodie && m.goodie_id ? getGoodieById(m.goodie_id) : null;
              
              return (
                <div key={m.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
                  <div
                    style={{
                      maxWidth: '75%',
                      padding: isGoodie ? '12px 16px' : '8px 12px',
                      borderRadius: 16,
                      backgroundColor: isGoodie 
                        ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(244, 114, 182, 0.2))'
                        : isVoice
                          ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(16, 185, 129, 0.2))'
                          : isMine ? '#4b5563' : '#111827',
                      background: isGoodie 
                        ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(244, 114, 182, 0.15))'
                        : isVoice
                          ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(16, 185, 129, 0.15))'
                          : isMine ? '#4b5563' : '#111827',
                      border: isGoodie 
                        ? '1px solid rgba(168, 85, 247, 0.3)'
                        : isVoice
                          ? '1px solid rgba(59, 130, 246, 0.3)'
                          : 'none',
                      color: '#e5e7eb',
                      fontSize: 13,
                      textAlign: isGoodie ? 'center' : 'left',
                    }}
                  >
                    {/* Message Goodie */}
                    {isGoodie && goodie && (
                      <div>
                        <div style={{ fontSize: 48, marginBottom: 8 }}>{goodie.emoji}</div>
                        <p style={{ margin: 0, fontWeight: 600, color: '#c084fc' }}>
                          {isMine ? `Tu as offert un ${goodie.name}` : `Tu as reçu un ${goodie.name} !`}
                        </p>
                      </div>
                    )}
                    
                    {/* Message Vocal */}
                    {isVoice && m.voice_url && (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <span style={{ fontSize: 20 }}>🎤</span>
                          <span style={{ fontSize: 12, color: '#93c5fd' }}>
                            Message vocal ({m.voice_duration || '?'}s)
                          </span>
                        </div>
                        <audio 
                          controls 
                          src={m.voice_url}
                          style={{ 
                            width: '100%', 
                            height: 36,
                            borderRadius: 8,
                          }} 
                        />
                      </div>
                    )}
                    
                    {/* Image */}
                    {m.image_url && !isGoodie && !isVoice && (
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
                    
                    {/* Texte */}
                    {m.content && !isGoodie && !isVoice && (
                      <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{m.content}</p>
                    )}
                    
                    {/* Timestamp */}
                    <p style={{ margin: 0, marginTop: 6, fontSize: 10, color: '#9ca3af', textAlign: 'right' }}>
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
        
        {goodieSentMessage && (
          <p style={{ 
            marginTop: 6, 
            fontSize: 13, 
            color: '#10b981',
            background: 'rgba(16, 185, 129, 0.1)',
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid rgba(16, 185, 129, 0.3)',
          }}>
            {goodieSentMessage}
          </p>
        )}
      </div>

      {/* FORMULAIRE DE MESSAGE TEXTE (bloc séparé) */}
      <div
        style={{
          padding: '12px 16px',
          background: 'rgba(15, 23, 42, 0.78)',
          borderRadius: 16,
          border: '1px solid rgba(168, 85, 247, 0.25)',
        }}
      >
        <form onSubmit={handleSend} style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            rows={2}
            placeholder="Écris ton message…"
            style={{ 
              flex: 1, 
              resize: 'none',
              background: 'rgba(15, 15, 35, 0.85)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              borderRadius: 12,
              padding: '12px 16px',
              fontSize: 14,
              color: '#e5e7eb',
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
          />
          <button 
            type="submit" 
            disabled={sending || !inputValue.trim()}
            style={{
              padding: '14px 24px',
              borderRadius: 12,
              border: 'none',
              background: 'linear-gradient(135deg, #a855f7, #f472b6)',
              color: '#fff',
              fontSize: 16,
              fontWeight: 700,
              cursor: sending || !inputValue.trim() ? 'not-allowed' : 'pointer',
              opacity: sending || !inputValue.trim() ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 16px rgba(168, 85, 247, 0.3)',
            }}
          >
            {sending ? '⏳' : 'Envoyer 📤'}
          </button>
        </form>
      </div>

      {/* BOUTONS GOODIE / VOCAL (bloc séparé plus bas, privé uniquement) */}
      {!conversation?.is_group && (
        <div
          style={{
            padding: '14px 16px',
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.16), rgba(59, 130, 246, 0.16))',
            borderRadius: 16,
            border: '1px solid rgba(168, 85, 247, 0.35)',
            boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: 12,
              width: '100%',
            }}
          >
            <button
              type="button"
              onClick={() => setShowGoodies(true)}
              style={{
                flex: 1,
                padding: '14px 18px',
                borderRadius: 12,
                border: '2px solid rgba(168, 85, 247, 0.6)',
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.32), rgba(244, 114, 182, 0.32))',
                color: '#fff',
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                boxShadow: '0 6px 18px rgba(168, 85, 247, 0.26)',
                minHeight: 56,
              }}
            >
              <span style={{ fontSize: 22 }}>🎁</span>
              Offrir un Goodie
            </button>

            <button
              type="button"
              onClick={() => setShowVoiceRecorder(true)}
              style={{
                flex: 1,
                padding: '14px 18px',
                borderRadius: 12,
                border: '2px solid rgba(59, 130, 246, 0.6)',
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.32), rgba(16, 185, 129, 0.32))',
                color: '#fff',
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                boxShadow: '0 6px 18px rgba(59, 130, 246, 0.24)',
                minHeight: 56,
              }}
            >
              <span style={{ fontSize: 22 }}>🎤</span>
              Message Vocal
            </button>
          </div>
        </div>
      )}
      
      {/* Modal Goodies */}
      {showGoodies && (
        <GoodiesSelector
          conversationId={conversationId}
          recipientUserId={otherUserId || (conversation?.user_id_1 === userId ? conversation?.user_id_2 : conversation?.user_id_1)}
          onClose={() => setShowGoodies(false)}
        />
      )}
      
      {/* Modal Voice Recorder */}
      {showVoiceRecorder && (
        <VoiceRecorder
          conversationId={conversationId}
          userId={userId}
          onMessageSent={(msg) => {
            setMessages(prev => [...prev, msg]);
            scrollToBottom();
          }}
          onClose={() => setShowVoiceRecorder(false)}
        />
      )}
    </main>
  );
}


