'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function GroupInvitesSection({ userId }) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [invites, setInvites] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [actingId, setActingId] = useState(null);

  useEffect(() => {
    if (!userId) return;
    loadInvites();
  }, [userId]);

  async function loadInvites() {
    setLoading(true);
    setErrorMsg('');

    // On récupère les candidatures "invited" de l'utilisateur,
    // avec la proposition associée. [web:978][web:991]
    const { data, error } = await supabase
      .from('group_match_candidates')
      .select(
        `
        id,
        status,
        proposal:group_match_proposals (
          id,
          title,
          created_at,
          creator_user_id,
          max_size,
          status,
          conversation_id
        )
      `
      )
      .eq('user_id', userId)
      .eq('status', 'invited')
      .order('created_at', {
        referencedTable: 'group_match_proposals',
        ascending: false,
      });

    if (error) {
      setErrorMsg(error.message);
      setInvites([]);
    } else {
      setInvites((data || []).filter((row) => row.proposal));
    }

    setLoading(false);
  }

  async function handleAccept(candidate) {
    if (!userId) return;
    setActingId(candidate.id);
    setErrorMsg('');

    // Appel de ta fonction SQL accept_group_match, qui renvoie l'id de la conversation de groupe. [web:988]
    const { data, error } = await supabase.rpc('accept_group_match', {
      p_proposal_id: candidate.proposal.id,
      p_user_id: userId,
    });

    setActingId(null);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    // On recharge les invitations (celle-ci passe en "accepted")
    await loadInvites();

    // Si une conversation est créée / existante, on y redirige l'utilisateur
    if (data) {
      router.push(`/messages/${data}`);
    }
  }

  async function handleDecline(candidate) {
    if (!userId) return;
    setActingId(candidate.id);
    setErrorMsg('');

    const { error } = await supabase
      .from('group_match_candidates')
      .update({ status: 'declined' })
      .eq('id', candidate.id)
      .eq('user_id', userId);

    setActingId(null);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    await loadInvites();
  }

  if (!userId) return null;

  return (
    <section
      style={{
        marginTop: 16,
        padding: 12,
        borderRadius: 12,
        border: '1px solid #1f2937',
        backgroundColor: '#020617',
      }}
    >
      <h2 style={{ fontSize: 15, marginBottom: 6 }}>Invitations de groupe</h2>

      {loading ? (
        <p style={{ fontSize: 13, color: '#9ca3af' }}>
          Chargement de tes invitations de groupe…
        </p>
      ) : invites.length === 0 ? (
        <p style={{ fontSize: 13, color: '#9ca3af' }}>
          Tu n’as aucune invitation de groupe en attente pour le moment.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {invites.map((cand) => {
            const p = cand.proposal;

            return (
              <div
                key={cand.id}
                style={{
                  padding: '8px 10px',
                  borderRadius: 10,
                  border: '1px solid #1f2937',
                  backgroundColor: '#020617',
                }}
              >
                <p
                  style={{
                    fontSize: 13,
                    marginBottom: 2,
                  }}
                >
                  {p.title || 'Groupe ManyLovr'}
                </p>
                <p
                  style={{
                    fontSize: 11,
                    color: '#9ca3af',
                    marginBottom: 6,
                  }}
                >
                  Invitation de groupe • Taille max : {p.max_size} personnes
                </p>

                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    flexWrap: 'wrap',
                  }}
                >
                  <button
                    type="button"
                    disabled={actingId === cand.id}
                    onClick={() => handleAccept(cand)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 999,
                      border: 'none',
                      backgroundImage:
                        'linear-gradient(135deg,#22c55e,#16a34a)',
                      color: '#052e16',
                      fontSize: 12,
                    }}
                  >
                    {actingId === cand.id
                      ? 'Validation…'
                      : 'Rejoindre le groupe'}
                  </button>

                  <button
                    type="button"
                    disabled={actingId === cand.id}
                    onClick={() => handleDecline(cand)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 999,
                      border: '1px solid #4b5563',
                      backgroundColor: '#020617',
                      color: '#e5e7eb',
                      fontSize: 12,
                    }}
                  >
                    Ignorer
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {errorMsg && (
        <p
          style={{
            marginTop: 8,
            fontSize: 12,
            color: 'tomato',
          }}
        >
          {errorMsg}
        </p>
      )}
    </section>
  );
}

