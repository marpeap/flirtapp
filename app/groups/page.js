'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function GroupsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  
  // Invitations reçues
  const [invites, setInvites] = useState([]);
  const [invitesLoading, setInvitesLoading] = useState(false);
  
  // Mes propositions (groupes que j'ai créés)
  const [myProposals, setMyProposals] = useState([]);
  const [proposalsLoading, setProposalsLoading] = useState(false);
  
  // Groupes actifs (conversations de groupe)
  const [activeGroups, setActiveGroups] = useState([]);
  
  const [errorMsg, setErrorMsg] = useState('');
  const [actingId, setActingId] = useState(null);
  const [expandedProposal, setExpandedProposal] = useState(null);

  useEffect(() => {
    async function loadAll() {
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

      // Charger tout en parallèle
      await Promise.all([
        loadInvites(userId),
        loadMyProposals(userId),
        loadActiveGroups(userId),
      ]);

      setLoading(false);
    }

    loadAll();
  }, [router]);

  async function loadInvites(userId) {
    setInvitesLoading(true);
    
    // Étape 1: Récupérer mes candidatures avec status 'invited'
    const { data: myCandidatures, error: candError } = await supabase
      .from('group_match_candidates')
      .select('id, proposal_id, status, created_at')
      .eq('user_id', userId)
      .eq('status', 'invited');

    if (candError) {
      console.error('Erreur chargement candidatures:', candError);
      setInvites([]);
      setInvitesLoading(false);
      return;
    }

    if (!myCandidatures || myCandidatures.length === 0) {
      setInvites([]);
      setInvitesLoading(false);
      return;
    }

    // Étape 2: Récupérer les propositions associées
    const proposalIds = myCandidatures.map(c => c.proposal_id);
    const { data: proposals, error: propError } = await supabase
      .from('group_match_proposals')
      .select('id, title, created_at, creator_user_id, max_size, status, conversation_id')
      .in('id', proposalIds);

    if (propError) {
      console.error('Erreur chargement propositions:', propError);
      setInvites([]);
      setInvitesLoading(false);
      return;
    }

    // Étape 3: Filtrer pour ne garder que les propositions où JE NE SUIS PAS le créateur
    const invitesFromOthers = myCandidatures.filter(cand => {
      const proposal = proposals?.find(p => p.id === cand.proposal_id);
      return proposal && proposal.creator_user_id !== userId;
    });

    // Étape 4: Enrichir avec les infos du créateur et des autres membres
    const enrichedInvites = await Promise.all(
      invitesFromOthers.map(async (cand) => {
        const proposal = proposals.find(p => p.id === cand.proposal_id);
        
        // Info du créateur
        const { data: creatorProfile } = await supabase
          .from('profiles')
          .select('id, display_name, main_photo_url, city')
          .eq('user_id', proposal.creator_user_id)
          .maybeSingle();
        
        // Autres candidats du groupe (exclure moi-même)
        const { data: otherCandidates } = await supabase
          .from('group_match_candidates')
          .select('id, user_id, status')
          .eq('proposal_id', proposal.id)
          .neq('user_id', userId);
        
        // Récupérer les profils des autres candidats
        let otherMembers = [];
        if (otherCandidates && otherCandidates.length > 0) {
          const otherUserIds = otherCandidates.map(c => c.user_id);
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, display_name, main_photo_url')
            .in('user_id', otherUserIds);
          
          otherMembers = otherCandidates.map(c => {
            const profile = profiles?.find(p => p.user_id === c.user_id);
            return {
              ...c,
              display_name: profile?.display_name || 'Anonyme',
              main_photo_url: profile?.main_photo_url,
            };
          });
        }
        
        return {
          ...cand,
          proposal,
          creator: creatorProfile,
          otherMembers,
          acceptedCount: otherMembers.filter(m => m.status === 'accepted').length + 1, // +1 pour le créateur
          pendingCount: otherMembers.filter(m => m.status === 'invited').length,
        };
      })
    );
    
    setInvites(enrichedInvites);
    setInvitesLoading(false);
  }

  async function loadMyProposals(userId) {
    setProposalsLoading(true);
    
    // Étape 1: Récupérer les propositions que J'AI CRÉÉES (creator_user_id = moi)
    const { data: myCreatedProposals, error } = await supabase
      .from('group_match_proposals')
      .select('id, title, created_at, creator_user_id, max_size, status, conversation_id')
      .eq('creator_user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur chargement propositions:', error);
      setMyProposals([]);
      setProposalsLoading(false);
      return;
    }

    if (!myCreatedProposals || myCreatedProposals.length === 0) {
      setMyProposals([]);
      setProposalsLoading(false);
      return;
    }

    // Étape 2: Enrichir avec les candidats de chaque proposition
    const enrichedProposals = await Promise.all(
      myCreatedProposals.map(async (proposal) => {
        // Récupérer les candidats (exclure le créateur = moi)
        const { data: candidates } = await supabase
          .from('group_match_candidates')
          .select('id, user_id, status')
          .eq('proposal_id', proposal.id)
          .neq('user_id', userId);
        
        // Récupérer les profils
        let members = [];
        if (candidates && candidates.length > 0) {
          const userIds = candidates.map(c => c.user_id);
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, display_name, main_photo_url')
            .in('user_id', userIds);
          
          members = candidates.map(c => {
            const profile = profiles?.find(p => p.user_id === c.user_id);
            return {
              ...c,
              display_name: profile?.display_name || 'Anonyme',
              main_photo_url: profile?.main_photo_url,
            };
          });
        }
        
        return {
          ...proposal,
          isCreator: true, // Marquer que je suis le créateur
          members,
          acceptedCount: members.filter(m => m.status === 'accepted').length,
          pendingCount: members.filter(m => m.status === 'invited').length,
          declinedCount: members.filter(m => m.status === 'declined').length,
        };
      })
    );
    
    setMyProposals(enrichedProposals);
    setProposalsLoading(false);
  }

  async function loadActiveGroups(userId) {
    // Récupérer les conversations de groupe actives
    const { data: parts, error } = await supabase
      .from('conversation_participants')
      .select(`
        conversation_id,
        conversations (
          id,
          is_group,
          name,
          created_at
        )
      `)
      .eq('user_id', userId)
      .eq('active', true);

    if (error) {
      console.error('Erreur chargement groupes actifs:', error);
      setActiveGroups([]);
      return;
    }

    const groupConvs = parts
      .map(p => p.conversations)
      .filter(c => c && c.is_group);

    // Enrichir avec le nombre de membres
    const enrichedGroups = await Promise.all(
      groupConvs.map(async (group) => {
        const { data: members } = await supabase
          .from('conversation_participants')
          .select('user_id')
          .eq('conversation_id', group.id)
          .eq('active', true);
        
        return {
          ...group,
          membersCount: members?.length || 0,
        };
      })
    );

    setActiveGroups(enrichedGroups);
  }

  async function handleAcceptInvite(invite) {
    if (!currentUserId) return;
    setActingId(invite.id);
    setErrorMsg('');

    const { data, error } = await supabase.rpc('accept_group_match', {
      p_proposal_id: invite.proposal.id,
      p_user_id: currentUserId,
    });

    setActingId(null);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    // Recharger les données
    await Promise.all([
      loadInvites(currentUserId),
      loadActiveGroups(currentUserId),
    ]);

    // Rediriger vers la conversation si elle existe
    if (data) {
      router.push(`/messages/${data}`);
    }
  }

  async function handleDeclineInvite(invite) {
    if (!currentUserId) return;
    setActingId(invite.id);
    setErrorMsg('');

    const { error } = await supabase
      .from('group_match_candidates')
      .update({ status: 'declined' })
      .eq('id', invite.id)
      .eq('user_id', currentUserId);

    setActingId(null);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    await loadInvites(currentUserId);
  }

  async function handleCancelProposal(proposalId) {
    if (!currentUserId) return;
    setActingId(proposalId);
    setErrorMsg('');

    const { error } = await supabase
      .from('group_match_proposals')
      .update({ status: 'cancelled' })
      .eq('id', proposalId)
      .eq('creator_user_id', currentUserId);

    setActingId(null);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    await loadMyProposals(currentUserId);
  }

  function getStatusBadge(status) {
    switch (status) {
      case 'accepted':
        return { bg: 'rgba(16, 185, 129, 0.2)', color: '#10b981', text: '✓ Accepté' };
      case 'invited':
        return { bg: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', text: '⏳ En attente' };
      case 'declined':
        return { bg: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', text: '✗ Refusé' };
      default:
        return { bg: 'rgba(107, 114, 128, 0.2)', color: '#9ca3af', text: status };
    }
  }

  if (loading) {
    return (
      <main>
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>👥</div>
          <p style={{ color: '#9ca3af' }}>Chargement de tes groupes…</p>
        </div>
      </main>
    );
  }

  const hasInvites = invites.length > 0;
  const hasProposals = myProposals.length > 0;
  const hasActiveGroups = activeGroups.length > 0;

  return (
    <main>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: 24,
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <div>
          <h1 style={{ 
            fontSize: 'clamp(1.75rem, 5vw, 2.5rem)',
            background: 'linear-gradient(135deg, #f472b6, #a855f7)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: 4,
          }}>
            👥 Mes Groupes
          </h1>
          <p style={{ fontSize: 14, color: '#9ca3af' }}>
            Gère tes invitations et groupes de rencontres
          </p>
        </div>
        <Link
          href="/profiles"
          style={{
            padding: '10px 20px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #a855f7, #f472b6)',
            color: '#fff',
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span>+</span>
          <span>Créer un groupe</span>
        </Link>
      </div>

      {errorMsg && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '12px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#fca5a5',
          marginBottom: 20,
          fontSize: 14,
        }}>
          {errorMsg}
        </div>
      )}

      {/* Section Invitations reçues */}
      <section style={{ marginBottom: 32 }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 10, 
          marginBottom: 16,
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>
            📩 Invitations reçues
          </h2>
          {hasInvites && (
            <span style={{
              padding: '4px 10px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #f472b6, #a855f7)',
              color: '#fff',
              fontSize: 12,
              fontWeight: 600,
            }}>
              {invites.length}
            </span>
          )}
        </div>

        {invitesLoading ? (
          <p style={{ color: '#9ca3af', fontSize: 14 }}>Chargement…</p>
        ) : !hasInvites ? (
          <div className="card" style={{ 
            padding: '24px', 
            textAlign: 'center',
            background: 'rgba(168, 85, 247, 0.05)',
          }}>
            <p style={{ fontSize: 14, color: '#9ca3af' }}>
              Tu n'as aucune invitation de groupe en attente pour le moment.
            </p>
            <p style={{ fontSize: 13, color: '#6b7280', marginTop: 8 }}>
              Les invitations apparaîtront ici quand quelqu'un te proposera de rejoindre un groupe.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {invites.map((invite) => (
              <div
                key={invite.id}
                className="card"
                style={{
                  padding: '20px',
                  background: 'rgba(168, 85, 247, 0.05)',
                  border: '1px solid rgba(168, 85, 247, 0.2)',
                }}
              >
                {/* En-tête avec créateur */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 12, 
                  marginBottom: 16,
                }}>
                  {invite.creator?.main_photo_url ? (
                    <img
                      src={invite.creator.main_photo_url}
                      alt={invite.creator.display_name}
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2px solid var(--color-primary)',
                      }}
                    />
                  ) : (
                    <div style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #a855f7, #f472b6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 20,
                      fontWeight: 600,
                    }}>
                      {(invite.creator?.display_name || '?').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, marginBottom: 2 }}>
                      {invite.creator?.display_name || 'Quelqu\'un'} t'invite
                    </p>
                    <p style={{ fontSize: 13, color: '#9ca3af' }}>
                      {invite.proposal.title || 'Groupe ManyLovr'}
                    </p>
                  </div>
                  <div style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    background: 'rgba(245, 158, 11, 0.15)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    fontSize: 12,
                    color: '#f59e0b',
                  }}>
                    Nouveau
                  </div>
                </div>

                {/* Autres membres */}
                {invite.otherMembers.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 8 }}>
                      Autres personnes invitées :
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {invite.otherMembers.map((member) => {
                        const badge = getStatusBadge(member.status);
                        return (
                          <div
                            key={member.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              padding: '6px 12px',
                              borderRadius: '20px',
                              background: 'rgba(26, 26, 46, 0.6)',
                              border: '1px solid var(--color-border)',
                            }}
                          >
                            {member.main_photo_url ? (
                              <img
                                src={member.main_photo_url}
                                alt={member.display_name}
                                style={{
                                  width: 24,
                                  height: 24,
                                  borderRadius: '50%',
                                  objectFit: 'cover',
                                }}
                              />
                            ) : (
                              <div style={{
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                background: 'rgba(168, 85, 247, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 11,
                              }}>
                                {member.display_name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span style={{ fontSize: 13 }}>{member.display_name}</span>
                            <span style={{
                              fontSize: 10,
                              padding: '2px 6px',
                              borderRadius: '10px',
                              background: badge.bg,
                              color: badge.color,
                            }}>
                              {member.status === 'accepted' ? '✓' : member.status === 'declined' ? '✗' : '⏳'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div style={{ 
                  display: 'flex', 
                  gap: 16, 
                  marginBottom: 16,
                  flexWrap: 'wrap',
                }}>
                  <div style={{ fontSize: 13 }}>
                    <span style={{ color: '#10b981' }}>✓ {invite.acceptedCount + 1}</span>
                    <span style={{ color: '#6b7280' }}> ont accepté</span>
                  </div>
                  <div style={{ fontSize: 13 }}>
                    <span style={{ color: '#f59e0b' }}>⏳ {invite.pendingCount}</span>
                    <span style={{ color: '#6b7280' }}> en attente</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#6b7280' }}>
                    Taille max : {invite.proposal.max_size} personnes
                  </div>
                </div>

                {/* Boutons d'action */}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    disabled={actingId === invite.id}
                    onClick={() => handleAcceptInvite(invite)}
                    style={{
                      flex: 1,
                      minWidth: '140px',
                      padding: '12px 20px',
                      borderRadius: '12px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: '#fff',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: actingId === invite.id ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {actingId === invite.id ? 'Validation…' : '✓ Rejoindre le groupe'}
                  </button>
                  <button
                    type="button"
                    disabled={actingId === invite.id}
                    onClick={() => handleDeclineInvite(invite)}
                    style={{
                      padding: '12px 20px',
                      borderRadius: '12px',
                      border: '1px solid var(--color-border)',
                      background: 'rgba(26, 26, 46, 0.6)',
                      color: '#e5e7eb',
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: actingId === invite.id ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Décliner
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Section Mes propositions */}
      <section style={{ marginBottom: 32 }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 10, 
          marginBottom: 16,
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>
            📤 Mes propositions
          </h2>
          {hasProposals && (
            <span style={{
              padding: '4px 10px',
              borderRadius: '20px',
              background: 'rgba(168, 85, 247, 0.2)',
              color: '#c084fc',
              fontSize: 12,
              fontWeight: 600,
            }}>
              {myProposals.length}
            </span>
          )}
        </div>

        {proposalsLoading ? (
          <p style={{ color: '#9ca3af', fontSize: 14 }}>Chargement…</p>
        ) : !hasProposals ? (
          <div className="card" style={{ 
            padding: '24px', 
            textAlign: 'center',
            background: 'rgba(168, 85, 247, 0.05)',
          }}>
            <p style={{ fontSize: 14, color: '#9ca3af' }}>
              Tu n'as créé aucune proposition de groupe.
            </p>
            <Link
              href="/profiles"
              style={{
                display: 'inline-block',
                marginTop: 12,
                padding: '10px 20px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #a855f7, #f472b6)',
                color: '#fff',
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              Créer un groupe depuis les profils
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {myProposals.map((proposal) => {
              const isExpanded = expandedProposal === proposal.id;
              const allAccepted = proposal.pendingCount === 0 && proposal.members.length > 0;
              const hasConversation = !!proposal.conversation_id;
              
              return (
                <div
                  key={proposal.id}
                  className="card"
                  style={{
                    padding: '20px',
                    background: hasConversation 
                      ? 'rgba(16, 185, 129, 0.05)' 
                      : 'rgba(168, 85, 247, 0.05)',
                    border: hasConversation 
                      ? '1px solid rgba(16, 185, 129, 0.2)'
                      : '1px solid rgba(168, 85, 247, 0.2)',
                  }}
                >
                  {/* En-tête */}
                  <div 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      marginBottom: 12,
                      cursor: 'pointer',
                    }}
                    onClick={() => setExpandedProposal(isExpanded ? null : proposal.id)}
                  >
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
                        {proposal.title || 'Groupe ManyLovr'}
                      </h3>
                      <p style={{ fontSize: 12, color: '#6b7280' }}>
                        Créé le {new Date(proposal.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {hasConversation ? (
                        <span style={{
                          padding: '6px 12px',
                          borderRadius: '20px',
                          background: 'rgba(16, 185, 129, 0.15)',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          fontSize: 12,
                          color: '#10b981',
                        }}>
                          ✓ Groupe actif
                        </span>
                      ) : allAccepted ? (
                        <span style={{
                          padding: '6px 12px',
                          borderRadius: '20px',
                          background: 'rgba(16, 185, 129, 0.15)',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          fontSize: 12,
                          color: '#10b981',
                        }}>
                          Tous ont répondu
                        </span>
                      ) : (
                        <span style={{
                          padding: '6px 12px',
                          borderRadius: '20px',
                          background: 'rgba(245, 158, 11, 0.15)',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                          fontSize: 12,
                          color: '#f59e0b',
                        }}>
                          {proposal.pendingCount} en attente
                        </span>
                      )}
                      <span style={{ 
                        fontSize: 16, 
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s',
                      }}>
                        ▼
                      </span>
                    </div>
                  </div>

                  {/* Stats rapides */}
                  <div style={{ 
                    display: 'flex', 
                    gap: 16, 
                    marginBottom: isExpanded ? 16 : 0,
                    flexWrap: 'wrap',
                  }}>
                    <div style={{ fontSize: 13 }}>
                      <span style={{ color: '#10b981' }}>✓ {proposal.acceptedCount}</span>
                      <span style={{ color: '#6b7280' }}> accepté{proposal.acceptedCount > 1 ? 's' : ''}</span>
                    </div>
                    <div style={{ fontSize: 13 }}>
                      <span style={{ color: '#f59e0b' }}>⏳ {proposal.pendingCount}</span>
                      <span style={{ color: '#6b7280' }}> en attente</span>
                    </div>
                    {proposal.declinedCount > 0 && (
                      <div style={{ fontSize: 13 }}>
                        <span style={{ color: '#ef4444' }}>✗ {proposal.declinedCount}</span>
                        <span style={{ color: '#6b7280' }}> refusé{proposal.declinedCount > 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>

                  {/* Détail des membres (expanded) */}
                  {isExpanded && proposal.members.length > 0 && (
                    <div style={{ 
                      borderTop: '1px solid var(--color-border)',
                      paddingTop: 16,
                      marginTop: 8,
                    }}>
                      <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 12 }}>
                        Détail des invitations :
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {proposal.members.map((member) => {
                          const badge = getStatusBadge(member.status);
                          return (
                            <div
                              key={member.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '10px 14px',
                                borderRadius: '10px',
                                background: 'rgba(26, 26, 46, 0.4)',
                                border: '1px solid var(--color-border)',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                {member.main_photo_url ? (
                                  <img
                                    src={member.main_photo_url}
                                    alt={member.display_name}
                                    style={{
                                      width: 36,
                                      height: 36,
                                      borderRadius: '50%',
                                      objectFit: 'cover',
                                    }}
                                  />
                                ) : (
                                  <div style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: '50%',
                                    background: 'rgba(168, 85, 247, 0.3)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 14,
                                  }}>
                                    {member.display_name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <span style={{ fontSize: 14, fontWeight: 500 }}>
                                  {member.display_name}
                                </span>
                              </div>
                              <span style={{
                                padding: '4px 10px',
                                borderRadius: '12px',
                                background: badge.bg,
                                color: badge.color,
                                fontSize: 12,
                                fontWeight: 500,
                              }}>
                                {badge.text}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
                        {hasConversation && (
                          <Link
                            href={`/messages/${proposal.conversation_id}`}
                            style={{
                              flex: 1,
                              minWidth: '140px',
                              padding: '12px 20px',
                              borderRadius: '12px',
                              background: 'linear-gradient(135deg, #a855f7, #f472b6)',
                              color: '#fff',
                              textDecoration: 'none',
                              fontSize: 14,
                              fontWeight: 600,
                              textAlign: 'center',
                            }}
                          >
                            💬 Ouvrir la conversation
                          </Link>
                        )}
                        {!hasConversation && proposal.status !== 'cancelled' && proposal.isCreator && (
                          <button
                            type="button"
                            disabled={actingId === proposal.id}
                            onClick={() => handleCancelProposal(proposal.id)}
                            style={{
                              padding: '10px 20px',
                              borderRadius: '12px',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              background: 'rgba(239, 68, 68, 0.1)',
                              color: '#fca5a5',
                              fontSize: 13,
                              fontWeight: 500,
                              cursor: actingId === proposal.id ? 'not-allowed' : 'pointer',
                            }}
                          >
                            Annuler la proposition
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Section Groupes actifs */}
      <section>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 10, 
          marginBottom: 16,
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>
            💬 Groupes actifs
          </h2>
          {hasActiveGroups && (
            <span style={{
              padding: '4px 10px',
              borderRadius: '20px',
              background: 'rgba(16, 185, 129, 0.2)',
              color: '#10b981',
              fontSize: 12,
              fontWeight: 600,
            }}>
              {activeGroups.length}
            </span>
          )}
        </div>

        {!hasActiveGroups ? (
          <div className="card" style={{ 
            padding: '24px', 
            textAlign: 'center',
            background: 'rgba(168, 85, 247, 0.05)',
          }}>
            <p style={{ fontSize: 14, color: '#9ca3af' }}>
              Tu n'as pas encore de conversation de groupe active.
            </p>
            <p style={{ fontSize: 13, color: '#6b7280', marginTop: 8 }}>
              Les groupes apparaîtront ici une fois que tous les membres auront accepté.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {activeGroups.map((group) => (
              <Link
                key={group.id}
                href={`/messages/${group.id}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div
                  className="card"
                  style={{
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(16, 185, 129, 0.05)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 20,
                    }}>
                      👥
                    </div>
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 2 }}>
                        {group.name || 'Groupe ManyLovr'}
                      </h3>
                      <p style={{ fontSize: 13, color: '#9ca3af' }}>
                        {group.membersCount} participant{group.membersCount > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <span style={{ fontSize: 20, color: '#9ca3af' }}>→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

