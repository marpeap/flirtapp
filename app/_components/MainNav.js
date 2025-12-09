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
      } = await supabase.auth.getUser();
      if (!mounted) return;
      setUserEmail(user?.email ?? null);
      setCurrentUserId(user?.id ?? null);
      
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
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function loadGroupInvitesCount(userId) {
    if (!userId) return;
    
    const { data: myCandidatures, error: candError } = await supabase
      .from('group_match_candidates')
      .select('id, proposal_id')
      .eq('user_id', userId)
      .eq('status', 'invited');
    
    if (candError || !myCandidatures || myCandidatures.length === 0) {
      setGroupInvitesCount(0);
      return;
    }

    const proposalIds = myCandidatures.map(c => c.proposal_id);
    const { data: proposals, error: propError } = await supabase
      .from('group_match_proposals')
      .select('id, creator_user_id')
      .in('id', proposalIds);
    
    if (propError || !proposals) {
      setGroupInvitesCount(0);
      return;
    }

    const realInvitesCount = myCandidatures.filter(cand => {
      const proposal = proposals.find(p => p.id === cand.proposal_id);
      return proposal && proposal.creator_user_id !== userId;
    }).length;
    
    setGroupInvitesCount(realInvitesCount);
  }

  async function loadUnreadMessagesCount(userId) {
    if (!userId) return;
    
    try {
      const { data: parts, error: partErr } = await supabase
        .from('conversation_participants')
        .select('conversation_id, last_read_at')
        .eq('user_id', userId)
        .eq('active', true);
      
      if (partErr || !parts || parts.length === 0) {
        const { data: convs } = await supabase
          .from('conversations')
          .select('id')
          .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`);
        
        if (!convs || convs.length === 0) {
          setUnreadMessagesCount(0);
          return;
        }
        
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

  useEffect(() => {
    if (!currentUserId) return;
    
    loadGroupInvitesCount(currentUserId);
    loadUnreadMessagesCount(currentUserId);
    
    const interval = setInterval(() => {
      loadGroupInvitesCount(currentUserId);
      loadUnreadMessagesCount(currentUserId);
    }, 30000);
    
    return () => clearInterval(interval);
  }, [currentUserId, pathname]);

  async function handleLogout() {
    setSigningOut(true);
    await supabase.auth.signOut();
    setSigningOut(false);
    setUserEmail(null);
    router.push('/login');
  }

  const navLinks = userEmail ? links : [{ href: '/', label: 'Accueil' }];
  const showBadges = Boolean(userEmail);

  return (
    <header className="app-header">
      <nav className="app-nav">
        <div className="app-nav-left">
          <Link href="/" className="app-logo-link fade-in">
            <span className="app-logo-mark">
              <span style={{ fontSize: 18 }}>💜</span>
            </span>
            <span className="text-gradient" style={{ fontSize: 18 }}>
              ManyLovr
            </span>
          </Link>

          <div className="app-nav-links">
            {navLinks.map((link) => {
              const active =
                pathname === link.href ||
                (link.href !== '/' && pathname.startsWith(link.href));

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
                  className={`app-nav-link ${active ? 'active' : ''}`}
                >
                  {link.label}
                  {showBadge && (
                    <span
                      className={`app-nav-badge ${link.badgeType === 'messages' ? 'success' : ''}`}
                      style={{ background: badgeColor }}
                    >
                      {badgeCount > 9 ? '9+' : badgeCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="app-nav-actions">
          {userEmail ? (
            <div className="app-nav-user">
              <span className="app-nav-user-mail" title={userEmail}>
                {userEmail}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                disabled={signingOut}
                className="btn-danger"
              >
                {signingOut ? 'Déconnexion…' : 'Déconnexion'}
              </button>
            </div>
          ) : (
            <Link href="/login" className="btn-primary">
              Connexion
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
