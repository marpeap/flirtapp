'use client';

import { useEffect } from 'react';
import { supabase } from '../supabaseClient';

/**
 * Hook pour mettre à jour automatiquement le statut en ligne de l'utilisateur
 */
export function useOnlineStatus() {
  useEffect(() => {
    let intervalId;

    async function updateOnlineStatus() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Mettre à jour last_seen_at et is_online
      await supabase
        .from('profiles')
        .update({
          last_seen_at: new Date().toISOString(),
          is_online: true,
        })
        .eq('user_id', user.id);
    }

    // Mettre à jour immédiatement
    updateOnlineStatus();

    // Mettre à jour toutes les 2 minutes
    intervalId = setInterval(updateOnlineStatus, 2 * 60 * 1000);

    // Mettre à jour quand la page devient visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        updateOnlineStatus();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
}

