'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default function GroupInvitesSection({ userId }) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [invites, setInvites] = useState([]);
  const [myProposals, setMyProposals] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [actingId, setActingId] = useState(null);

  useEffect(() => {
    if (!userId) return;
    loadData();
  }, [userId]);

  async function loadData() {
    setLoading(true);
    setErrorMsg('');
    
    await Promise.all([
      loadInvites(),
      loadMyProposals(),
    ]);
    
    setLoading(false);
  }

  async function loadInvites() {
    // Étape 1: Récupérer mes candidatures avec status 'invited'
    const { data: myCandidatures, error: candError } = await supabase
      .from('group_match_candidates')
      .select('id, proposal_id, status, created_at')
      .eq('user_id', userId)
      .eq('status', 'invited');

    if (candError) {
      setErrorMsg(candError.message);
      setInvites([]);
      return;
    }

    if (!myCandidatures || myCandidatures.length === 0) {
      setInvites([]);
      return;
    }

    // Étape 2: Récupérer les propositions associées
    const proposalIds = myCandidatures.map(c => c.proposal_id);
    const { data: proposals, error: propError } = await supabase
      .from('group_match_proposals')
      .select('id, title, created_at, creator_user_id, max_size, status, conversation_id')
      .in('id', proposalIds);

    if (propError) {
      setErrorMsg(propError.message);
      setInvites([]);
      return;
    }

    // Étape 3: Filtrer pour ne garder que les invitations où JE NE SUIS PAS le créateur
    const invitesFromOthers = myCandidatures.filter(cand => {
      const proposal = proposals?.find(p => p.id === cand.proposal_id);
      return proposal && proposal.creator_user_id !== userId;
    });

    // Étape 4: Enrichir avec les infos du créateur
    const enrichedInvites = await Promise.all(
      invitesFromOthers.map(async (cand) => {
        const proposal = proposals.find(p => p.id === cand.proposal_id);
        
        const { data: creatorProfile } = await supabase
          .from('profiles')
          .select('id, display_name, main_photo_url')
          .eq('user_id', proposal.creator_user_id)
          .maybeSingle();
        
        // Compter les autres membres
        const { data: otherCandidates } = await supabase
          .from('group_match_candidates')
          .select('id, status')
          .eq('proposal_id', proposal.id)
          .neq('user_id', userId);
        
        const acceptedCount = (otherCandidates || []).filter(c => c.status === 'accepted').length;
        const pendingCount = (otherCandidates || []).filter(c => c.status === 'invited').length;
        
        return {
          ...cand,
          proposal,
          creator: creatorProfile,
          acceptedCount: acceptedCount + 1, // +1 pour le créateur
          pendingCount,
          totalInvited: (otherCandidates || []).length + 1,
        };
      })
    );
    
    setInvites(enrichedInvites);
  }

  async function loadMyProposals() {
    // Récupérer mes propositions récentes
    const { data, error } = await supabase
      .from('group_match_proposals')
      .select(`
        id,
        title,
        created_at,
        max_size,
        status,
        conversation_id
      `)
      .eq('creator_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(3);

    if (error) {
      setMyProposals([]);
      return;
    }

    // Enrichir avec les stats des candidats
    const enrichedProposals = await Promise.all(
      (data || []).map(async (proposal) => {
        const { data: candidates } = await supabase
          .from('group_match_candidates')
          .select('id, status')
          .eq('proposal_id', proposal.id)
          .neq('user_id', userId);
        
        const acceptedCount = (candidates || []).filter(c => c.status === 'accepted').length;
        const pendingCount = (candidates || []).filter(c => c.status === 'invited').length;
        const declinedCount = (candidates || []).filter(c => c.status === 'declined').length;
        
        return {
          ...proposal,
          acceptedCount,
          pendingCount,
          declinedCount,
          totalMembers: (candidates || []).length,
        };
      })
    );
    
    setMyProposals(enrichedProposals);
  }

  async function handleAccept(candidate) {
    if (!userId) return;
    // #region agent log
    const acceptStartTime = Date.now();
    fetch('http://127.0.0.1:7244/ingest/b52ac800-6cee-4c21-a14d-e8a882350bc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GroupInvitesSection.js:154',message:'Accepting group invite from profile page',data:{candidateId:candidate.id,proposalId:candidate.proposal?.id,userId:userId?.substring(0,8)||null},timestamp:acceptStartTime,sessionId:'debug-session',runId:'groups',hypothesisId:'G8'})}).catch(()=>{});
    // #endregion
    setActingId(candidate.id);
    setErrorMsg('');

    const { data, error } = await supabase.rpc('accept_group_match', {
      p_proposal_id: candidate.proposal.id,
      p_user_id: userId,
    });

    // #region agent log
    const acceptEndTime = Date.now();
    if (error) {
      fetch('http://127.0.0.1:7244/ingest/b52ac800-6cee-4c21-a14d-e8a882350bc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GroupInvitesSection.js:164',message:'Error accepting group invite from profile',data:{errorCode:error.code,errorMessage:error.message,errorDetails:error.details||null,proposalId:candidate.proposal?.id,duration:acceptEndTime-acceptStartTime},timestamp:acceptEndTime,sessionId:'debug-session',runId:'groups',hypothesisId:'G8'})}).catch(()=>{});
    } else {
      fetch('http://127.0.0.1:7244/ingest/b52ac800-6cee-4c21-a14d-e8a882350bc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GroupInvitesSection.js:164',message:'Group invite accepted from profile successfully',data:{proposalId:candidate.proposal?.id,conversationId:data||null,hasConversation:!!data,duration:acceptEndTime-acceptStartTime},timestamp:acceptEndTime,sessionId:'debug-session',runId:'groups',hypothesisId:'G8'})}).catch(()=>{});
    }
    // #endregion
    setActingId(null);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    // Rafraîchir les données après acceptation
    await loadData();

    // Afficher un message de succès
    setErrorMsg(''); // Effacer les erreurs précédentes
    // Note: setInfoMsg n'existe pas dans ce composant, on pourrait l'ajouter si nécessaire

    // Rediriger vers la conversation si elle existe
    if (data) {
      // Attendre un peu pour que l'UI se mette à jour avant la redirection
      setTimeout(() => {
        router.push(`/messages/${data}`);
      }, 500);
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

  const hasInvites = invites.length > 0;
  const hasProposals = myProposals.length > 0;

  return (
    <section
      style={{
        marginTop: 16,
        padding: 16,
        borderRadius: 16,
        border: '1px solid rgba(168, 85, 247, 0.2)',
        background: 'rgba(168, 85, 247, 0.05)',
      }}
    >
      {/* En-tête avec lien vers page groupes */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
      }}>
        <h2 style={{ 
          fontSize: 16, 
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span>👥</span>
          <span>Mes groupes</span>
          {hasInvites && (
            <span style={{
              padding: '2px 8px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #f472b6, #a855f7)',
              color: '#fff',
              fontSize: 11,
              fontWeight: 700,
            }}>
              {invites.length} nouvelle{invites.length > 1 ? 's' : ''}
            </span>
          )}
        </h2>
        <Link
          href="/groups"
          style={{
            fontSize: 13,
            color: 'var(--color-primary-light)',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          Voir tout →
        </Link>
      </div>

      {loading ? (
        <p style={{ fontSize: 13, color: '#9ca3af' }}>
          Chargement…
        </p>
      ) : (
        <>
          {/* Invitations reçues */}
          {hasInvites && (
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 13, color: '#9ca3af', marginBottom: 10 }}>
                📩 Invitations en attente
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {invites.slice(0, 2).map((cand) => {
                  const p = cand.proposal;
                  return (
                    <div
                      key={cand.id}
                      style={{
                        padding: '14px',
                        borderRadius: 12,
                        border: '1px solid rgba(168, 85, 247, 0.3)',
                        background: 'rgba(26, 26, 46, 0.6)',
                      }}
                    >
                      {/* Créateur */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        marginBottom: 10,
                      }}>
                        {cand.creator?.main_photo_url ? (
                          <img
                            src={cand.creator.main_photo_url}
                            alt={cand.creator.display_name}
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: '2px solid var(--color-primary)',
                            }}
                          />
                        ) : (
                          <div style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #a855f7, #f472b6)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 14,
                            fontWeight: 600,
                          }}>
                            {(cand.creator?.display_name || '?').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 2 }}>
                            {cand.creator?.display_name || 'Quelqu\'un'} t'invite
                          </p>
                          <p style={{ fontSize: 12, color: '#9ca3af' }}>
                            {p.title || 'Groupe ManyLovr'}
                          </p>
                        </div>
                      </div>

                      {/* Stats */}
                      <div style={{
                        display: 'flex',
                        gap: 12,
                        marginBottom: 12,
                        fontSize: 12,
                      }}>
                        <span style={{ color: '#10b981' }}>
                          ✓ {cand.acceptedCount} accepté{cand.acceptedCount > 1 ? 's' : ''}
                        </span>
                        {cand.pendingCount > 0 && (
                          <span style={{ color: '#f59e0b' }}>
                            ⏳ {cand.pendingCount} en attente
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          type="button"
                          disabled={actingId === cand.id}
                          onClick={() => handleAccept(cand)}
                          style={{
                            flex: 1,
                            padding: '10px 14px',
                            borderRadius: 10,
                            border: 'none',
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            color: '#fff',
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: actingId === cand.id ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {actingId === cand.id ? 'Validation…' : '✓ Rejoindre'}
                        </button>
                        <button
                          type="button"
                          disabled={actingId === cand.id}
                          onClick={() => handleDecline(cand)}
                          style={{
                            padding: '10px 14px',
                            borderRadius: 10,
                            border: '1px solid var(--color-border)',
                            background: 'transparent',
                            color: '#9ca3af',
                            fontSize: 13,
                            cursor: actingId === cand.id ? 'not-allowed' : 'pointer',
                          }}
                        >
                          Ignorer
                        </button>
                      </div>
                    </div>
                  );
                })}
                {invites.length > 2 && (
                  <Link
                    href="/groups"
                    style={{
                      display: 'block',
                      padding: '10px',
                      textAlign: 'center',
                      fontSize: 13,
                      color: 'var(--color-primary-light)',
                      textDecoration: 'none',
                    }}
                  >
                    Voir les {invites.length - 2} autres invitations →
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Mes propositions récentes */}
          {hasProposals && (
            <div>
              <h3 style={{ fontSize: 13, color: '#9ca3af', marginBottom: 10 }}>
                📤 Mes propositions récentes
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {myProposals.slice(0, 2).map((proposal) => {
                  const hasConversation = !!proposal.conversation_id;
                  return (
                    <div
                      key={proposal.id}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 10,
                        border: hasConversation 
                          ? '1px solid rgba(16, 185, 129, 0.3)'
                          : '1px solid var(--color-border)',
                        background: hasConversation 
                          ? 'rgba(16, 185, 129, 0.1)'
                          : 'rgba(26, 26, 46, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
                          {proposal.title || 'Groupe ManyLovr'}
                        </p>
                        <div style={{ display: 'flex', gap: 10, fontSize: 11 }}>
                          <span style={{ color: '#10b981' }}>
                            ✓ {proposal.acceptedCount}
                          </span>
                          {proposal.pendingCount > 0 && (
                            <span style={{ color: '#f59e0b' }}>
                              ⏳ {proposal.pendingCount}
                            </span>
                          )}
                          {proposal.declinedCount > 0 && (
                            <span style={{ color: '#ef4444' }}>
                              ✗ {proposal.declinedCount}
                            </span>
                          )}
                        </div>
                      </div>
                      {hasConversation ? (
                        <Link
                          href={`/messages/${proposal.conversation_id}`}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 8,
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            color: '#fff',
                            fontSize: 12,
                            fontWeight: 500,
                            textDecoration: 'none',
                          }}
                        >
                          💬 Ouvrir
                        </Link>
                      ) : (
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: 8,
                          background: 'rgba(245, 158, 11, 0.15)',
                          color: '#f59e0b',
                          fontSize: 11,
                        }}>
                          En cours
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Message si vide */}
          {!hasInvites && !hasProposals && (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 12 }}>
                Tu n'as aucune invitation ni proposition de groupe.
              </p>
              <Link
                href="/profiles"
                style={{
                  display: 'inline-block',
                  padding: '10px 20px',
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #a855f7, #f472b6)',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Créer un groupe
              </Link>
            </div>
          )}
        </>
      )}

      {errorMsg && (
        <p style={{ marginTop: 8, fontSize: 12, color: 'tomato' }}>
          {errorMsg}
        </p>
      )}
    </section>
  );
}
