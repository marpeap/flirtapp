'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

export default function MeetupReminders({ userId }) {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    let isMounted = true;
    setLoading(true);

    async function load() {
      const result = await loadReminders();
      if (isMounted) {
        setReminders(result);
        setLoading(false);
      }
    }

    load();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function loadReminders() {
    if (!userId) return [];

    // Récupérer les rendez-vous confirmés à venir où l'utilisateur est participant
    const { data, error } = await supabase
      .from('group_meetups')
      .select(
        `
        id,
        conversation_id,
        confirmed_date,
        confirmed_location,
        confirmed_location_details,
        conversations (
          id,
          name,
          is_group
        )
      `
      )
      .eq('status', 'confirmed')
      .gte('confirmed_date', new Date().toISOString())
      .order('confirmed_date', { ascending: true });

    if (error) {
      // Si les tables n'existent pas, retourner un tableau vide silencieusement
      return [];
    }

    // Filtrer pour ne garder que ceux où l'utilisateur est participant actif
    const conversationIds = (data || []).map((m) => m.conversation_id);
    
    if (conversationIds.length === 0) {
      return [];
    }

    const { data: participants } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .in('conversation_id', conversationIds)
      .eq('user_id', userId)
      .eq('active', true);

    const myConversationIds = new Set(
      (participants || []).map((p) => p.conversation_id)
    );

    return (data || []).filter((m) => myConversationIds.has(m.conversation_id));
  }

  if (!userId) return null;

  if (loading) {
    return (
      <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
        Chargement des rendez-vous…
      </div>
    );
  }

  if (reminders.length === 0) {
    return null;
  }

  return (
    <section
      style={{
        marginTop: 20,
        padding: '16px',
        borderRadius: '12px',
        border: '1px solid rgba(168, 85, 247, 0.3)',
        background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(244, 114, 182, 0.08))',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 12,
        }}
      >
        <span style={{ fontSize: 20 }}>📅</span>
        <h2 style={{ fontSize: 16, margin: 0 }}>Mes prochains rendez-vous</h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {reminders.map((reminder) => {
          const date = new Date(reminder.confirmed_date);
          const isToday = date.toDateString() === new Date().toDateString();
          const isTomorrow =
            date.toDateString() ===
            new Date(Date.now() + 86400000).toDateString();

          return (
            <Link
              key={reminder.id}
              href={`/messages/${reminder.conversation_id}`}
              style={{
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <div
                className="card"
                style={{
                  padding: '12px',
                  border: '1px solid rgba(168, 85, 247, 0.2)',
                  background: 'var(--color-bg-card)',
                  transition: 'all 0.25s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.4)';
                  e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.2)';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 12,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        marginBottom: 4,
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      {reminder.conversations?.name || 'Groupe ManyLovr'}
                    </div>

                    <div style={{ fontSize: 12, marginBottom: 4 }}>
                      <span style={{ fontWeight: 500 }}>📅</span>{' '}
                      {isToday
                        ? "Aujourd'hui"
                        : isTomorrow
                        ? 'Demain'
                        : date.toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                          })}{' '}
                      à {date.toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>

                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                      <span style={{ fontWeight: 500 }}>📍</span>{' '}
                      {reminder.confirmed_location}
                    </div>

                    {reminder.confirmed_location_details && (
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--color-text-muted)',
                          marginTop: 4,
                        }}
                      >
                        {reminder.confirmed_location_details}
                      </div>
                    )}
                  </div>

                  <span style={{ fontSize: 18 }}>→</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}


