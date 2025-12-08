'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

const links = [
  { href: '/', label: 'Accueil' },
  { href: '/profiles', label: 'Profils' },
  { href: '/groups', label: 'Groupes', badgeType: 'groups' },
  { href: '/messages', label: 'Messages', badgeType: 'messages' },
  { href: '/onboarding', label: 'Mon profil' },
];

export default function MainNav() {
  const pathname = usePathname();
  const router = useRouter();

  const [userEmail, setUserEmail] = useState(null);
  const [signingOut, setSigningOut] = useState(false);
  const [groupInvitesCount, setGroupInvitesCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser(); // lecture initiale [web:965]
      if (!mounted) return;
      setUserEmail(user?.email ?? null);
      setCurrentUserId(user?.id ?? null);
      
      // Charger le nombre d'invitations de groupe et messages non lus
      if (user?.id) {
        loadGroupInvitesCount(user.id);
        loadUnreadMessagesCount(user.id);
      }
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      setUserEmail(session?.user?.email ?? null);
      setCurrentUserId(session?.user?.id ?? null);
      
      if (session?.user?.id) {
        loadGroupInvitesCount(session.user.id);
        loadUnreadMessagesCount(session.user.id);
      } else {
        setGroupInvitesCount(0);
        setUnreadMessagesCount(0);
      }
    }); // se met à jour à chaque login/logout [web:959]

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function loadGroupInvitesCount(userId) {
    if (!userId) return;
    
    // Étape 1: Récupérer mes candidatures avec status 'invited'
    const { data: myCandidatures, error: candError } = await supabase
      .from('group_match_candidates')
      .select('id, proposal_id')
      .eq('user_id', userId)
      .eq('status', 'invited');
    
    if (candError || !myCandidatures || myCandidatures.length === 0) {
      setGroupInvitesCount(0);
      return;
    }

    // Étape 2: Récupérer les propositions pour vérifier qui est le créateur
    const proposalIds = myCandidatures.map(c => c.proposal_id);
    const { data: proposals, error: propError } = await supabase
      .from('group_match_proposals')
      .select('id, creator_user_id')
      .in('id', proposalIds);
    
    if (propError || !proposals) {
      setGroupInvitesCount(0);
      return;
    }

    // Étape 3: Compter uniquement les invitations où je NE suis PAS le créateur
    const realInvitesCount = myCandidatures.filter(cand => {
      const proposal = proposals.find(p => p.id === cand.proposal_id);
      return proposal && proposal.creator_user_id !== userId;
    }).length;
    
    setGroupInvitesCount(realInvitesCount);
  }

  async function loadUnreadMessagesCount(userId) {
    if (!userId) return;
    
    try {
      // Récupérer les conversations où l'utilisateur est participant
      const { data: parts, error: partErr } = await supabase
        .from('conversation_participants')
        .select('conversation_id, last_read_at')
        .eq('user_id', userId)
        .eq('active', true);
      
      if (partErr || !parts || parts.length === 0) {
        // Fallback: chercher dans conversations directement
        const { data: convs } = await supabase
          .from('conversations')
          .select('id')
          .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`);
        
        if (!convs || convs.length === 0) {
          setUnreadMessagesCount(0);
          return;
        }
        
        // Compter les messages non lus (messages des autres utilisateurs récents)
        const convIds = convs.map(c => c.id);
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        
        const { count } = await supabase
          .from('messages')
          .select('*', { head: true, count: 'exact' })
          .in('conversation_id', convIds)
          .neq('sender_id', userId)
          .gte('created_at', oneDayAgo);
        
        setUnreadMessagesCount(Math.min(count || 0, 99));
        return;
      }
      
      // Compter les messages non lus par conversation
      let totalUnread = 0;
      
      for (const part of parts) {
        const lastRead = part.last_read_at || new Date(0).toISOString();
        
        const { count } = await supabase
          .from('messages')
          .select('*', { head: true, count: 'exact' })
          .eq('conversation_id', part.conversation_id)
          .neq('sender_id', userId)
          .gt('created_at', lastRead);
        
        totalUnread += count || 0;
      }
      
      setUnreadMessagesCount(Math.min(totalUnread, 99));
    } catch (err) {
      console.error('Erreur chargement messages non lus:', err);
      setUnreadMessagesCount(0);
    }
  }

  // Recharger les compteurs quand le pathname change (navigation) ou périodiquement
  useEffect(() => {
    if (!currentUserId) return;
    
    // Recharger immédiatement quand on change de page
    loadGroupInvitesCount(currentUserId);
    loadUnreadMessagesCount(currentUserId);
    
    const interval = setInterval(() => {
      loadGroupInvitesCount(currentUserId);
      loadUnreadMessagesCount(currentUserId);
    }, 30000); // Toutes les 30 secondes
    
    return () => clearInterval(interval);
  }, [currentUserId, pathname]); // Ajout de pathname comme dépendance

  async function handleLogout() {
    setSigningOut(true);
    await supabase.auth.signOut(); // [web:962]
    setSigningOut(false);
    setUserEmail(null);
    router.push('/login');
  }

  // Navigation affichée : si non connecté, uniquement Accueil
  const navLinks = userEmail ? links : [{ href: '/', label: 'Accueil' }];
  const showBadges = Boolean(userEmail);

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(16px)',
        backgroundColor: 'rgba(24, 24, 48, 0.72)',
        borderBottom: '1px solid rgba(168, 85, 247, 0.08)',
        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.06)',
      }}
    >
      <nav
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '10px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            fontWeight: 700,
            letterSpacing: 0.5,
            fontSize: 18,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            textDecoration: 'none',
            color: 'var(--color-text-primary)',
            transition: 'all 0.25s ease',
          }}
          className="fade-in"
        >
          <span
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(168, 85, 247, 0.4)',
            }}
          >
            <span style={{ fontSize: 18 }}>💜</span>
          </span>
          <span className="text-gradient" style={{ fontSize: 18 }}>
            ManyLovr
          </span>
        </Link>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          {navLinks.map((link) => {
            const active =
              pathname === link.href ||
              (link.href !== '/' && pathname.startsWith(link.href));
            
            // Déterminer le badge à afficher
            let badgeCount = 0;
            let badgeColor = 'linear-gradient(135deg, #f472b6, #a855f7)';
            
            if (showBadges && link.badgeType === 'groups' && groupInvitesCount > 0) {
              badgeCount = groupInvitesCount;
            } else if (showBadges && link.badgeType === 'messages' && unreadMessagesCount > 0) {
              badgeCount = unreadMessagesCount;
              badgeColor = 'linear-gradient(135deg, #10b981, #059669)';
            }
            
            const showBadge = badgeCount > 0;
            
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  fontSize: 'clamp(12px, 2.5vw, 14px)',
                  padding: '6px 12px',
                  borderRadius: '9999px',
                  border: active
                    ? '1px solid rgba(168, 85, 247, 0.4)'
                    : '1px solid transparent',
                  background: active
                    ? 'rgba(168, 85, 247, 0.15)'
                    : 'transparent',
                  color: active
                    ? 'var(--color-primary-light)'
                    : 'var(--color-text-secondary)',
                  textDecoration: 'none',
                  transition: 'all 0.25s ease',
                  fontWeight: active ? 500 : 400,
                  minHeight: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = 'rgba(168, 85, 247, 0.1)';
                    e.currentTarget.style.color = 'var(--color-primary-light)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--color-text-secondary)';
                  }
                }}
              >
                {link.label}
                {showBadge && (
                  <span
                    style={{
                      minWidth: 18,
                      height: 18,
                      padding: '0 5px',
                      borderRadius: '9px',
                      background: badgeColor,
                      color: '#fff',
                      fontSize: 11,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: link.badgeType === 'messages' 
                        ? '0 2px 8px rgba(16, 185, 129, 0.4)'
                        : '0 2px 8px rgba(244, 114, 182, 0.4)',
                    }}
                  >
                    {badgeCount > 9 ? '9+' : badgeCount}
                  </span>
                )}
              </Link>
            );
          })}

          {userEmail ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                paddingLeft: 8,
                borderLeft: '1px solid rgba(168, 85, 247, 0.2)',
                flexWrap: 'wrap',
              }}
            >
              <span
                style={{
                  fontSize: 'clamp(10px, 2vw, 12px)',
                  color: 'var(--color-text-muted)',
                  maxWidth: 'clamp(100px, 20vw, 180px)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={userEmail}
              >
                {userEmail}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                disabled={signingOut}
                className="btn-danger"
                style={{
                  fontSize: 'clamp(11px, 2.5vw, 12px)',
                  padding: '6px 12px',
                  minHeight: '36px',
                }}
              >
                {signingOut ? 'Déconnexion…' : 'Déconnexion'}
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="btn-primary"
              style={{
                fontSize: 'clamp(12px, 2.5vw, 14px)',
                padding: '6px 16px',
                textDecoration: 'none',
                minHeight: '36px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              Connexion
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}

