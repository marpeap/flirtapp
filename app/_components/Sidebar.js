'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

const links = [
  { href: '/', label: 'Accueil', icon: '🏠' },
  { href: '/profiles', label: 'Profils', icon: '👥' },
  { href: '/groups', label: 'Groupes', badgeType: 'groups', icon: '👫' },
  { href: '/messages', label: 'Messages', badgeType: 'messages', icon: '💬' },
  { href: '/onboarding', label: 'Mon profil', icon: '👤' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [userEmail, setUserEmail] = useState(null);
  const [signingOut, setSigningOut] = useState(false);
  const [groupInvitesCount, setGroupInvitesCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted) return;
      setUserEmail(user?.email ?? null);
      setCurrentUserId(user?.id ?? null);
      if (user?.id) {
        loadGroupInvitesCount(user.id);
        loadUnreadMessagesCount(user.id);
      }
    }
    loadUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
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
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  async function loadGroupInvitesCount(userId) {
    if (!userId) return;
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/b52ac800-6cee-4c21-a14d-e8a882350bc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Sidebar.js:54',message:'loadGroupInvitesCount entry',data:{userId},timestamp:Date.now(),sessionId:'debug-session',runId:'sidebar-groups',hypothesisId:'H2'})}).catch(()=>{});
    // #endregion
    const { data: myCandidatures, error: candidatesError } = await supabase
      .from('group_match_candidates')
      .select('id, proposal_id')
      .eq('user_id', userId)
      .eq('status', 'invited');
    
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/b52ac800-6cee-4c21-a14d-e8a882350bc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Sidebar.js:59',message:'group_match_candidates query result',data:{hasError:!!candidatesError,errorMessage:candidatesError?.message,errorCode:candidatesError?.code,errorDetails:candidatesError?.details,errorHint:candidatesError?.hint,hasData:!!myCandidatures,dataLength:myCandidatures?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'sidebar-groups',hypothesisId:'H2'})}).catch(()=>{});
    // #endregion
    
    if (candidatesError) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/b52ac800-6cee-4c21-a14d-e8a882350bc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Sidebar.js:61',message:'group_match_candidates error',data:{errorMessage:candidatesError.message,errorCode:candidatesError.code,errorDetails:candidatesError.details,errorHint:candidatesError.hint},timestamp:Date.now(),sessionId:'debug-session',runId:'sidebar-groups',hypothesisId:'H2'})}).catch(()=>{});
      // #endregion
      setGroupInvitesCount(0);
      return;
    }
    if (!myCandidatures || myCandidatures.length === 0) { setGroupInvitesCount(0); return; }
    const proposalIds = myCandidatures.map(c => c.proposal_id);
    const { data: proposals } = await supabase
      .from('group_match_proposals')
      .select('id, creator_user_id')
      .in('id', proposalIds);
    if (!proposals) { setGroupInvitesCount(0); return; }
    const realInvitesCount = myCandidatures.filter(cand => {
      const proposal = proposals.find(p => p.id === cand.proposal_id);
      return proposal && proposal.creator_user_id !== userId;
    }).length;
    setGroupInvitesCount(realInvitesCount);
  }

  async function loadUnreadMessagesCount(userId) {
    if (!userId) return;
    try {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/b52ac800-6cee-4c21-a14d-e8a882350bc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Sidebar.js:75',message:'loadUnreadMessagesCount entry',data:{userId},timestamp:Date.now(),sessionId:'debug-session',runId:'sidebar-unread',hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
      const { data: parts, error: partsError } = await supabase
        .from('conversation_participants')
        .select('conversation_id, last_read_at')
        .eq('user_id', userId)
        .eq('active', true);
      
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/b52ac800-6cee-4c21-a14d-e8a882350bc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Sidebar.js:80',message:'conversation_participants query result',data:{hasError:!!partsError,errorMessage:partsError?.message,errorCode:partsError?.code,errorDetails:partsError?.details,hasData:!!parts,dataLength:parts?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'sidebar-unread',hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
      
      if (partsError) {
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/b52ac800-6cee-4c21-a14d-e8a882350bc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Sidebar.js:85',message:'conversation_participants error',data:{errorMessage:partsError.message,errorCode:partsError.code,errorDetails:partsError.details,errorHint:partsError.hint},timestamp:Date.now(),sessionId:'debug-session',runId:'sidebar-unread',hypothesisId:'H1'})}).catch(()=>{});
        // #endregion
        setUnreadMessagesCount(0);
        return;
      }
      if (!parts || parts.length === 0) { setUnreadMessagesCount(0); return; }
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
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/b52ac800-6cee-4c21-a14d-e8a882350bc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Sidebar.js:96',message:'loadUnreadMessagesCount catch',data:{errorMessage:err?.message,errorName:err?.name,errorStack:err?.stack?.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'sidebar-unread',hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
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

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  async function handleLogout() {
    setSigningOut(true);
    await supabase.auth.signOut();
    setSigningOut(false);
    setUserEmail(null);
    router.push('/login');
  }

  const navLinks = userEmail ? links : [
    { href: '/', label: 'Accueil', icon: '🏠' },
    { href: '/login', label: 'Connexion', icon: '🔐' },
    { href: '/signup', label: 'Inscription', icon: '✨' },
  ];
  const showBadges = Boolean(userEmail);
  const totalBadges = groupInvitesCount + unreadMessagesCount;

  return (
    <>
      <style jsx>{`
        .sidebar-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          z-index: 998;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s ease;
        }
        .sidebar-overlay.open {
          opacity: 1;
          pointer-events: all;
        }
        .sidebar {
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          width: 220px;
          background: rgba(15, 15, 35, 0.95);
          backdrop-filter: blur(20px);
          border-right: 1px solid rgba(168, 85, 247, 0.15);
          box-shadow: 4px 0 24px rgba(0, 0, 0, 0.3);
          z-index: 999;
          transform: translateX(-100%);
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          overflow-y: auto;
        }
        .sidebar.open {
          transform: translateX(0);
        }
        .sidebar-header {
          padding: 16px 14px;
          border-bottom: 1px solid rgba(168, 85, 247, 0.1);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }
        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          color: #fff;
          font-weight: 700;
          font-size: 16px;
        }
        .sidebar-logo-icon {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, #a855f7, #f472b6);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          box-shadow: 0 2px 8px rgba(168, 85, 247, 0.3);
        }
        .sidebar-logo-text {
          background: linear-gradient(135deg, #c084fc, #f9a8d4);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .sidebar-close-btn {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          border: none;
          background: rgba(168, 85, 247, 0.1);
          color: #e2e8f0;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          z-index: 1000;
          position: relative;
        }
        .sidebar-close-btn:hover {
          background: rgba(168, 85, 247, 0.2);
          transform: rotate(90deg);
        }
        .sidebar-close-btn:active {
          transform: rotate(90deg) scale(0.95);
        }
        .sidebar-nav {
          flex: 1;
          padding: 12px 10px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .sidebar-link {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 8px;
          text-decoration: none;
          color: #e2e8f0;
          font-size: 14px;
          font-weight: 400;
          transition: all 0.2s ease;
          position: relative;
          border: 1px solid rgba(168, 85, 247, 0.08);
          background: rgba(168, 85, 247, 0.02);
        }
        .sidebar-link:hover {
          background: rgba(168, 85, 247, 0.08);
          color: #c084fc;
          border-color: rgba(168, 85, 247, 0.2);
          transform: translateX(2px);
        }
        .sidebar-link.active {
          background: rgba(168, 85, 247, 0.12);
          color: #c084fc;
          font-weight: 500;
          border-color: rgba(168, 85, 247, 0.3);
          box-shadow: 0 2px 8px rgba(168, 85, 247, 0.15);
        }
        .sidebar-link-icon {
          font-size: 18px;
          width: 20px;
          text-align: center;
          flex-shrink: 0;
        }
        .sidebar-link-badge {
          min-width: 18px;
          height: 18px;
          padding: 0 5px;
          border-radius: 9px;
          background: linear-gradient(135deg, #f472b6, #a855f7);
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-left: auto;
          flex-shrink: 0;
        }
        .sidebar-link-badge.success {
          background: linear-gradient(135deg, #10b981, #059669);
        }
        .sidebar-footer {
          padding: 14px 12px;
          border-top: 1px solid rgba(168, 85, 247, 0.1);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .sidebar-user-email {
          font-size: 11px;
          color: #9ca3af;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          padding: 0 2px;
        }
        .sidebar-logout-btn {
          width: 100%;
          padding: 8px 12px;
          border-radius: 8px;
          border: none;
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: #fff;
          font-weight: 500;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .sidebar-logout-btn:hover:not(:disabled) {
          opacity: 0.9;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
        }
        .sidebar-logout-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .sidebar-login-btn {
          width: 100%;
          padding: 8px 12px;
          border-radius: 8px;
          background: linear-gradient(135deg, #a855f7, #f472b6);
          color: #fff;
          font-weight: 600;
          font-size: 13px;
          text-decoration: none;
          text-align: center;
          transition: all 0.2s ease;
        }
        .sidebar-login-btn:hover {
          opacity: 0.9;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(168, 85, 247, 0.3);
        }
        .sidebar-toggle {
          position: fixed;
          top: 16px;
          left: 16px;
          z-index: 997;
          width: 48px;
          height: 48px;
          border-radius: 12px;
          border: none;
          background: rgba(15, 15, 35, 0.9);
          backdrop-filter: blur(10px);
          color: #e2e8f0;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          transition: all 0.2s ease;
        }
        .sidebar-toggle:hover {
          background: rgba(168, 85, 247, 0.2);
          transform: scale(1.05);
        }
        .sidebar-toggle-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #f472b6;
          border: 2px solid rgba(15, 15, 35, 0.9);
        }
        @media (min-width: 1024px) {
          .sidebar {
            transform: translateX(0) !important;
            width: 220px;
          }
          .sidebar-overlay {
            display: none !important;
          }
          .sidebar-toggle {
            display: none !important;
          }
          .sidebar-close-btn {
            display: none !important;
          }
        }
        @media (max-width: 1023px) {
          .sidebar.open ~ * {
            margin-left: 0;
          }
        }
      `}</style>

      {/* Bouton toggle pour mobile */}
      <button
        className="sidebar-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Menu"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {isOpen ? (
            <path d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path d="M3 12h18M3 6h18M3 18h18" />
          )}
        </svg>
        {totalBadges > 0 && !isOpen && <span className="sidebar-toggle-badge" />}
      </button>

      {/* Overlay pour mobile */}
      <div
        className={`sidebar-overlay ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="sidebar-header">
          <Link href="/" className="sidebar-logo" onClick={() => setIsOpen(false)}>
            <span className="sidebar-logo-icon">💜</span>
            <span className="sidebar-logo-text">ManyLovr</span>
          </Link>
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsOpen(false);
            }}
            aria-label="Fermer"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navLinks.map((link) => {
            const active = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
            let badgeCount = 0;
            if (showBadges && link.badgeType === 'groups' && groupInvitesCount > 0) badgeCount = groupInvitesCount;
            else if (showBadges && link.badgeType === 'messages' && unreadMessagesCount > 0) badgeCount = unreadMessagesCount;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`sidebar-link ${active ? 'active' : ''}`}
                onClick={() => setIsOpen(false)}
              >
                <span className="sidebar-link-icon">{link.icon}</span>
                <span>{link.label}</span>
                {badgeCount > 0 && (
                  <span className={`sidebar-link-badge ${link.badgeType === 'messages' ? 'success' : ''}`}>
                    {badgeCount > 9 ? '9+' : badgeCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          {userEmail ? (
            <>
              <span className="sidebar-user-email" title={userEmail}>
                {userEmail}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                disabled={signingOut}
                className="sidebar-logout-btn"
              >
                {signingOut ? 'Déconnexion...' : 'Déconnexion'}
              </button>
            </>
          ) : (
            <Link href="/login" className="sidebar-login-btn" onClick={() => setIsOpen(false)}>
              Connexion
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}

