'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id;

  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Charger les messages
  useEffect(() => {
    async function loadMessages() {
      setErrorMsg('');
      setLoading(true);

      const { data, error } = await supabase
        .from('messages')
        .select('id, sender_id, content, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setMessages(data || []);
      }
      setLoading(false);
    }

    if (conversationId) {
      loadMessages();
    }
  }, [conversationId]);

  async function handleSend(e) {
    e.preventDefault();
    if (!content.trim()) return;

    setSending(true);
    setErrorMsg('');

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      setSending(false);
      router.push('/login');
      return;
    }

    const { error: insertError } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: userData.user.id,
      content,
      is_read: false,
    });
    if (!insertError) {
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);
    }

    setSending(false);

    if (insertError) {
      setErrorMsg(insertError.message);
    } else {
      setContent('');
      // recharger rapidement la liste
      const { data } = await supabase
        .from('messages')
        .select('id, sender_id, content, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      setMessages(data || []);
    }
  }

  if (loading) {
    return <main style={{ color: 'white', padding: 24 }}>Chargement…</main>;
  }

  return (
    <main style={{ color: 'white', padding: 24 }}>
      <button onClick={() => router.back()}>← Retour</button>
      <h1>Conversation</h1>

      {errorMsg && <p style={{ color: 'red' }}>{errorMsg}</p>}

      <div style={{ border: '1px solid #444', padding: 12, minHeight: 200, marginBottom: 12 }}>
        {messages.length === 0 && <p>Aucun message pour l&apos;instant.</p>}
        {messages.map((m) => (
          <p key={m.id} style={{ marginBottom: 4 }}>
            {m.content}
          </p>
        ))}
      </div>

      <form onSubmit={handleSend} style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{ flex: 1, padding: 8 }}
          placeholder="Écris ton message…"
        />
        <button type="submit" disabled={sending}>
          {sending ? 'Envoi…' : 'Envoyer'}
        </button>
      </form>
    </main>
  );
}

