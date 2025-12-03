'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import { useRouter } from 'next/navigation';


export default function GroupInvitesSection({ userId }) {
  const router = useRouter();
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  useEffect(() => {
    if (!userId) return;
    loadInvites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function loadInvites() {
    setLoading(true);
    setErrorMsg('');
    setInfoMsg('');

    const { data: invitesRaw, error: invErr } = await supabase
      .from('group_match_candidates')
      .select(
        `
        id,
        status,
        proposal_id,
        group_match_proposals (
          id,
          title,
          max_size,
          status,
          created_at,
          creator_user_id
        )
      `
      )
      .eq('user_id', userId)
      .in('status', ['invited', 'accepted']);

    if (invErr) {
      setErrorMsg(invErr.message);
      setLoading(false);
      return;
    }

    if (!invitesRaw || invitesRaw.length === 0) {
      setInvites([]);
      setLoading(false);
      return;
    }

    const proposalIds = Array.from(
      new Set(invitesRaw.map((i) => i.proposal_id))
    );

    const { data: candRaw, error: candErr } = await supabase
      .from('group_match_candidates')
      .select('proposal_id, user_id, status')
      .in('proposal_id', proposalIds);

    if (candErr) {
      setErrorMsg(candErr.message);
      setLoading(false);
      return;
    }

    const allUserIds = Array.from(
      new Set((candRaw || []).map((c) => c.user_id))
    );

    let profilesByUserId = {};
    if (allUserIds.length > 0) {
      const { data: profs, error: profErr } = await supabase
        .from('profiles')
        .select('user_id, display_name, city')
        .in('user_id', allUserIds);

      if (!profErr && profs) {
        profilesByUserId = profs.reduce((acc, p) => {
          acc[p.user_id] = p;
          return acc;
        }, {});
      }
    }

    const candidatesByProposal = {};
    (candRaw || []).forEach((c) => {
      if (!candidatesByProposal[c.proposal_id]) {
        candidatesByProposal[c.proposal_id] = [];
      }
      candidatesByProposal[c.proposal_id].push({
        user_id: c.user_id,
        status: c.status,
        profile: profilesByUserId[c.user_id] || null,
      });
    });

    const invitesEnriched = invitesRaw.map((inv) => {
      const prop = inv.group_match_proposals;
      return {
        id: inv.id,
        myStatus: inv.status,
        proposal: prop,
        candidates: candidatesByProposal[inv.proposal_id] || [],
      };
    });

    setInvites(invitesEnriched);
    setLoading(false);
  }

  async function handleAction(proposalId, action) {
    if (!userId) return;
    setErrorMsg('');
    setInfoMsg('');

    if (action === 'accept') {
      try {
        const { data, error } = await supabase.rpc('accept_group_match', {
          p_proposal_id: proposalId,
          p_user_id: userId,
        });

        if (error) {
          setErrorMsg(error.message);
          return;
        }

        const convId = data;
        if (convId) {
          setInfoMsg(
            'Tu as accepté. Le groupe est actif, tu es redirigé vers le tchat.'
          );
          router.push(`/messages/${convId}`);
        } else {
          setInfoMsg(
            'Ton accord a été pris en compte. Quand assez de personnes auront accepté, le groupe sera ouvert.'
          );
        }

        setInvites((prev) =>
          prev.map((inv) =>
            inv.proposal.id === proposalId
              ? { ...inv, myStatus: 'accepted' }
              : inv
          )
        );
      } catch (err) {
        setErrorMsg('Erreur lors de la validation.');
      }
    } else if (action === 'decline') {
      const confirmRefuse = window.confirm(
        'Refuser cette proposition de groupe ? Tu pourras être invité dans d’autres plus tard.'
      );
      if (!confirmRefuse) return;

      const { error } = await supabase
        .from('group_match_candidates')
        .update({ status: 'declined' })
        .eq('proposal_id', proposalId)
        .eq('user_id', userId);

      if (error) {
        setErrorMsg(error.message);
        return;
      }

      setInvites((prev) =>
        prev.filter((inv) => inv.proposal.id !== proposalId)
      );
      setInfoMsg('Tu as refusé cette proposition de groupe.');
    }
  }

  return (
    <section
      style={{
        marginTop: 4,
        padding: '8px 10px',
        borderRadius: 10,
        border: '1px solid #1f2937',
        backgroundColor: '#020617',
      }}
    >
      <h2 style={{ fontSize: 14, marginBottom: 4 }}>Invitations de groupe</h2>

      {loading ? (
        <p style={{ fontSize: 12, color: '#9ca3af' }}>
          Chargement de tes invitations…
        </p>
      ) : invites.length === 0 ? (
        <p style={{ fontSize: 12, color: '#9ca3af' }}>
          Tu n’as pas d’invitation de groupe en attente pour le moment.
        </p>
      ) : (
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {invites.map((inv) => {
            const acceptedCount = inv.candidates.filter(
              (c) => c.status === 'accepted'
            ).length;
            const total = inv.candidates.length;
            return (
              <li
                key={inv.proposal.id}
                style={{
                  borderRadius: 8,
                  border: '1px solid #1f2937',
                  padding: '6px 8px',
                  backgroundColor: '#020617',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 6,
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <strong style={{ fontSize: 13 }}>
                      {inv.proposal.title ||
                        'Proposition de groupe CupidWave'}
                    </strong>
                    <p
                      style={{
                        fontSize: 11,
                        color: '#9ca3af',
                        marginTop: 2,
                      }}
                    >
                      {acceptedCount} accepté(s) / {total} invité(s)
                    </p>
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 4,
                        marginTop: 4,
                      }}
                    >
                      {inv.candidates.map((c) => {
                        const label =
                          c.profile?.display_name || 'Membre';
                        const city = c.profile?.city || '';
                        const isMe = c.user_id === userId;
                        const meText = isMe ? ' (toi)' : '';
                        const statusText =
                          c.status === 'accepted' ? '✅' : '…';
                        return (
                          <span
                            key={`${inv.proposal.id}-${c.user_id}`}
                            style={{
                              fontSize: 11,
                              padding: '2px 6px',
                              borderRadius: 999,
                              border: '1px solid #1f2937',
                              backgroundColor: '#020617',
                              color: '#e5e7eb',
                            }}
                          >
                            {label}
                            {city ? ` (${city})` : ''}
                            {meText} {statusText}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      alignItems: 'flex-end',
                    }}
                  >
                    {inv.myStatus === 'accepted' ? (
                      <span
                        style={{
                          fontSize: 11,
                          color: '#a3e635',
                        }}
                      >
                        Tu as accepté
                      </span>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            handleAction(inv.proposal.id, 'accept')
                          }
                          style={{
                            padding: '4px 10px',
                            fontSize: 11,
                          }}
                        >
                          Rejoindre
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleAction(inv.proposal.id, 'decline')
                          }
                          style={{
                            padding: '4px 10px',
                            fontSize: 11,
                            backgroundImage:
                              'linear-gradient(135deg,#4b5563,#020617)',
                            color: '#e5e7eb',
                          }}
                        >
                          Refuser
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {errorMsg && (
        <p
          style={{ color: 'tomato', fontSize: 12, marginTop: 6 }}
        >
          {errorMsg}
        </p>
      )}
      {infoMsg && (
        <p
          style={{
            color: '#a3e635',
            fontSize: 12,
            marginTop: 6,
          }}
        >
          {infoMsg}
        </p>
      )}
    </section>
  );
}

