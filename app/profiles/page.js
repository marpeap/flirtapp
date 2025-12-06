'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';
import RadiusMapSelector from './_components/RadiusMapSelector';

const MAX_GROUP_SIZE = 7; // toi + 6 autres

export default function ProfilesListPage() {
  const router = useRouter();
  // Mettre à jour le statut en ligne automatiquement
  useOnlineStatus();
  
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [filterIntent, setFilterIntent] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [radiusKm, setRadiusKm] = useState(25);
  const [filterActive, setFilterActive] = useState(''); // 'online', 'recent', 'new'
  const [filterVibes, setFilterVibes] = useState([]);

  const [currentUserId, setCurrentUserId] = useState(null);
  const [ownProfile, setOwnProfile] = useState(null);

  // Tornado
  const [tornadoOpen, setTornadoOpen] = useState(false);
  const [tornadoProfiles, setTornadoProfiles] = useState([]);
  const [tornadoIndex, setTornadoIndex] = useState(0);
  const [tornadoLoading, setTornadoLoading] = useState(false);
  const [tornadoError, setTornadoError] = useState('');
  const [tornadoRemaining, setTornadoRemaining] = useState(10);
  const [tornadoSessionSwipes, setTornadoSessionSwipes] = useState([]);
  const [tornadoCardAnimation, setTornadoCardAnimation] = useState(''); // 'swipe-left', 'swipe-right', 'like', 'pass'
  const [tornadoShowMatch, setTornadoShowMatch] = useState(false);
  const [tornadoMutualMatch, setTornadoMutualMatch] = useState(null); // { profile, isMutual }

  // Push Éclair
  const [pushOpen, setPushOpen] = useState(false);
  const [pushImageFile, setPushImageFile] = useState(null);
  const [pushSending, setPushSending] = useState(false);
  const [pushError, setPushError] = useState('');
  const [pushInfo, setPushInfo] = useState('');
  const [pushCredits, setPushCredits] = useState(0);
  const [selectedPack, setSelectedPack] = useState('1x'); // '1x' ou '3x'

  // Sélection pour match de groupe
  const [selectedProfileIds, setSelectedProfileIds] = useState([]);
  const [groupMatchLoading, setGroupMatchLoading] = useState(false);
  const [groupMatchError, setGroupMatchError] = useState('');
  const [groupMatchInfo, setGroupMatchInfo] = useState('');

  // Gestion des retours depuis Stripe (success/cancel)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('push_success') === 'true') {
      setPushInfo('✅ Paiement réussi ! Tes crédits ont été ajoutés.');
      // Recharger les crédits
      async function reloadCredits() {
        if (!currentUserId) return;
        const {
          data: own,
          error: ownProfileError,
        } = await supabase
          .from('profiles')
          .select('push_eclair_credits')
          .eq('user_id', currentUserId)
          .maybeSingle();
        if (!ownProfileError && own) {
          setPushCredits(own.push_eclair_credits || 0);
        }
      }
      reloadCredits();
      // Nettoyer l'URL
      router.replace('/profiles');
    }
    if (params.get('push_canceled') === 'true') {
      setPushError('Paiement annulé.');
      router.replace('/profiles');
    }
  }, [currentUserId, router]);

  // Chargement de la liste principale
  useEffect(() => {
    async function loadData() {
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

      const {
        data: own,
        error: ownProfileError,
      } = await supabase
        .from('profiles')
        .select(
          'id, lat, lng, gender, looking_for_gender, push_eclair_credits'
        )
        .eq('user_id', userId)
        .maybeSingle();

      if (ownProfileError) {
        setErrorMsg(ownProfileError.message);
        setLoading(false);
        return;
      }

      if (!own) {
        setLoading(false);
        router.push('/onboarding');
        return;
      }

      setOwnProfile(own);
      setPushCredits(own.push_eclair_credits || 0);

      const myLat = own.lat;
      const myLng = own.lng;

      let list = [];
      let listError = null;

      if (myLat != null && myLng != null) {
        const { data: nearby, error: nearbyError } = await supabase.rpc(
          'nearby_profiles',
          {
            p_lat: myLat,
            p_lng: myLng,
            p_radius_km: radiusKm,
            p_user_id: userId,
          }
        );

        if (nearbyError) {
          listError = nearbyError;
        } else {
          list = nearby || [];
        }
      } else {
        let query = supabase
          .from('profiles')
          .select(
            'id, user_id, display_name, gender, main_intent, city, main_photo_url, looking_for_gender, lat, lng, is_online, last_seen_at, created_at, vibes'
          )
          .neq('user_id', userId);

        // Appliquer les filtres avancés
        if (filterActive === 'online') {
          query = query.eq('is_online', true);
        } else if (filterActive === 'recent') {
          query = query.gte('last_seen_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
        } else if (filterActive === 'new') {
          const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
          query = query.gte('created_at', sevenDaysAgo);
        }

        const { data: fallbackList, error: fallbackError } = await query.order(
          filterActive === 'online' ? 'last_seen_at' : 'created_at',
          { ascending: false }
        );

        if (fallbackError) {
          listError = fallbackError;
        } else {
          list = fallbackList || [];
        }
      }

      if (listError) {
        setErrorMsg(listError.message);
        setLoading(false);
        return;
      }

      list = (list || []).filter((p) => {
        const byIntent = !filterIntent || p.main_intent === filterIntent;
        const byGenderFilter = !filterGender || p.gender === filterGender;

        let byMyPreference = true;
        if (own.looking_for_gender === 'men') {
          byMyPreference = p.gender === 'man';
        } else if (own.looking_for_gender === 'women') {
          byMyPreference = p.gender === 'woman';
        } else if (own.looking_for_gender === 'couples') {
          byMyPreference = p.gender === 'couple';
        }

        // Filtre par vibes
        const byVibes = filterVibes.length === 0 || 
          (p.vibes && filterVibes.some(vibe => p.vibes.includes(vibe)));

        // Filtre actif (si pas déjà appliqué dans la requête)
        let byActive = true;
        if (filterActive === 'online' && myLat != null && myLng != null) {
          byActive = p.is_online === true;
        } else if (filterActive === 'recent' && myLat != null && myLng != null) {
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          byActive = p.last_seen_at && new Date(p.last_seen_at) >= oneDayAgo;
        } else if (filterActive === 'new' && myLat != null && myLng != null) {
          const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          byActive = p.created_at && new Date(p.created_at) >= sevenDaysAgo;
        }

        return byIntent && byGenderFilter && byMyPreference && byVibes && byActive;
      });

      setProfiles(list);
      setLoading(false);
    }

    loadData();
  }, [router, filterIntent, filterGender, radiusKm, filterActive, filterVibes]);

  // --- Mode Tornado ---

  async function openTornado() {
    if (!currentUserId || !ownProfile) return;

    setTornadoOpen(true);
    setTornadoLoading(true);
    setTornadoError('');
    setTornadoProfiles([]);
    setTornadoIndex(0);
    setTornadoSessionSwipes([]);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const { count, error: countError } = await supabase
      .from('tornado_swipes')
      .select('*', { head: true, count: 'exact' })
      .eq('user_id', currentUserId)
      .gte('created_at', startOfDay.toISOString());

    if (countError) {
      setTornadoLoading(false);
      setTornadoError(countError.message);
      return;
    }

    const remaining = Math.max(0, 10 - (count || 0));
    setTornadoRemaining(remaining);

    if (remaining <= 0) {
      setTornadoLoading(false);
      return;
    }

    const { data: nearby, error: nearbyError } = await supabase.rpc(
      'nearby_profiles',
      {
        p_lat: ownProfile.lat,
        p_lng: ownProfile.lng,
        p_radius_km: radiusKm,
        p_user_id: currentUserId,
      }
    );

    if (nearbyError) {
      setTornadoLoading(false);
      setTornadoError(nearbyError.message);
      return;
    }

    let candidates = (nearby || []).filter((p) => {
      const byIntent = !filterIntent || p.main_intent === filterIntent;
      const byGenderFilter = !filterGender || p.gender === filterGender;

      let byMyPreference = true;
      if (ownProfile.looking_for_gender === 'men') {
        byMyPreference = p.gender === 'man';
      } else if (ownProfile.looking_for_gender === 'women') {
        byMyPreference = p.gender === 'woman';
      } else if (ownProfile.looking_for_gender === 'couples') {
        byMyPreference = p.gender === 'couple';
      }

      return byIntent && byGenderFilter && byMyPreference;
    });

    candidates = candidates.sort(() => Math.random() - 0.5);

    setTornadoProfiles(candidates);
    setTornadoIndex(0);
    setTornadoLoading(false);
  }

  function closeTornado() {
    setTornadoOpen(false);
  }

  async function handleTornadoSwipe(decision) {
    if (!currentUserId) return;
    if (tornadoRemaining <= 0) return;

    const current = tornadoProfiles[tornadoIndex];
    if (!current) return;

    // Animation
    setTornadoCardAnimation(decision === 'like' ? 'swipe-right' : 'swipe-left');
    
    // Si c'est un like, montrer l'effet "match" brièvement
    if (decision === 'like') {
      setTornadoShowMatch(true);
      setTimeout(() => setTornadoShowMatch(false), 1500);
    }

    // Attendre un peu pour l'animation
    setTimeout(async () => {
      // Enregistrer le swipe
      const { error } = await supabase.from('tornado_swipes').insert({
        user_id: currentUserId,
        target_profile_id: current.id,
        decision,
      });

      if (error) {
        setTornadoError(error.message);
        setTornadoCardAnimation('');
        return;
      }

      // Si c'est un like, notifier la personne et vérifier le match mutuel
      if (decision === 'like') {
        await handleTornadoLike(current);
      }

      setTornadoSessionSwipes((prev) => [
        ...prev,
        { profile: current, decision },
      ]);

      const nextRemaining = tornadoRemaining - 1;
      setTornadoRemaining(nextRemaining);

      // Réinitialiser l'animation
      setTornadoCardAnimation('');

      if (tornadoIndex + 1 < tornadoProfiles.length && nextRemaining > 0) {
        setTornadoIndex(tornadoIndex + 1);
      } else {
        setTornadoIndex(tornadoIndex + 1);
      }
    }, 300);
  }

  // Gérer le like Tornado : vérifier match mutuel et notifier
  async function handleTornadoLike(likedProfile) {
    if (!currentUserId || !likedProfile) return;

    const otherUserId = likedProfile.user_id;
    
    // Récupérer mon profil pour le message
    const { data: myProfile } = await supabase
      .from('profiles')
      .select('id, display_name')
      .eq('user_id', currentUserId)
      .maybeSingle();

    // Vérifier si l'autre personne m'a aussi liké (match mutuel)
    const { data: mutualLike } = await supabase
      .from('tornado_swipes')
      .select('id')
      .eq('user_id', otherUserId)
      .eq('target_profile_id', myProfile?.id)
      .eq('decision', 'like')
      .maybeSingle();

    const isMutualMatch = !!mutualLike;

    // Si match mutuel, afficher l'effet spécial
    if (isMutualMatch) {
      setTornadoMutualMatch({ profile: likedProfile, isMutual: true });
      // Masquer après 4 secondes
      setTimeout(() => setTornadoMutualMatch(null), 4000);
    }

    // Chercher ou créer une conversation
    let conversationId = null;
    
    let { data: conv1 } = await supabase
      .from('conversations')
      .select('id')
      .match({ user_id_1: currentUserId, user_id_2: otherUserId })
      .maybeSingle();

    if (!conv1) {
      const { data: conv2 } = await supabase
        .from('conversations')
        .select('id')
        .match({ user_id_1: otherUserId, user_id_2: currentUserId })
        .maybeSingle();
      conv1 = conv2;
    }

    conversationId = conv1?.id;

    // Créer la conversation si elle n'existe pas
    if (!conversationId) {
      const { data: newConv, error: convErr } = await supabase
        .from('conversations')
        .insert({
          user_id_1: currentUserId,
          user_id_2: otherUserId,
          is_group: false,
        })
        .select('id')
        .single();

      if (convErr || !newConv) {
        console.error('Erreur création conversation Tornado:', convErr);
        return;
      }
      
      conversationId = newConv.id;

      // Créer les participants
      await supabase
        .from('conversation_participants')
        .insert([
          { conversation_id: conversationId, user_id: currentUserId, active: true },
          { conversation_id: conversationId, user_id: otherUserId, active: true },
        ]);
    }

    // Envoyer le message approprié
    const myName = myProfile?.display_name || 'Quelqu\'un';
    let messageContent;
    
    if (isMutualMatch) {
      // Match mutuel ! Message spécial
      messageContent = `🌪️💕 C'est un Match Tornado ! ${myName} et toi vous êtes mutuellement likés. Le courant passe visiblement... Lancez-vous !`;
    } else {
      // Like simple - notification discrète
      messageContent = `🌪️ ${myName} t'a liké dans le Mode Tornado ! Si tu l'aimes aussi, ce sera un match.`;
    }

    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: currentUserId,
      content: messageContent,
    });
  }

  const totalSessionSwipes = tornadoSessionSwipes.length;
  const sessionLikes = tornadoSessionSwipes.filter(
    (s) => s.decision === 'like'
  );
  const sessionPasses = tornadoSessionSwipes.filter(
    (s) => s.decision === 'pass'
  );
  const hasSessionRecap =
    totalSessionSwipes > 0 &&
    (tornadoRemaining <= 0 ||
      tornadoIndex >= tornadoProfiles.length);

  // --- Push Éclair ---

  function openPush() {
    setPushError('');
    setPushInfo('');
    setPushImageFile(null);
    setPushOpen(true);
  }

  function closePush() {
    if (pushSending) return;
    setPushOpen(false);
  }

  async function handleBuyPushCredits() {
    setPushError('');
    setPushInfo('');
    
    try {
      // Récupérer le token d'authentification
      const {
        data: { session },
      } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        setPushError('Tu dois être connecté pour acheter des crédits.');
        return;
      }

      const response = await fetch('/api/checkout/push-eclair', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ packId: selectedPack }),
      });

      const data = await response.json();
      
      if (!response.ok || data.error) {
        const errorMsg = data.error || `Erreur ${response.status}: ${response.statusText}`;
        console.error('Erreur achat crédits:', errorMsg, data);
        setPushError(errorMsg);
        return;
      }

      // Ouvrir Stripe Checkout dans une popup
      if (data.url) {
        const width = 600;
        const height = 700;
        const left = (window.screen.width - width) / 2;
        const top = (window.screen.height - height) / 2;
        
        const popup = window.open(
          data.url,
          'Stripe Checkout',
          `width=${width},height=${height},left=${left},top=${top},toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes`
        );

        if (!popup) {
          setPushError('La popup a été bloquée. Autorise les popups pour ce site.');
          return;
        }

        // Sauvegarder le nombre de crédits avant l'achat
        const creditsBefore = pushCredits;
        const expectedCredits = selectedPack === '3x' ? 3 : 1;

        // Fonction de polling pour vérifier les crédits
        async function pollCredits(attempts = 0, maxAttempts = 10) {
          if (!currentUserId) return;
          
          const { data: own, error: ownProfileError } = await supabase
            .from('profiles')
            .select('push_eclair_credits')
            .eq('user_id', currentUserId)
            .maybeSingle();
          
          if (!ownProfileError && own) {
            const newCredits = own.push_eclair_credits || 0;
            setPushCredits(newCredits);
            
            // Si les crédits ont augmenté, le paiement a réussi
            if (newCredits > creditsBefore) {
              const addedCredits = newCredits - creditsBefore;
              setPushInfo(`✅ Paiement réussi ! +${addedCredits} crédit(s) ajouté(s). Total : ${newCredits}`);
              return true;
            }
          }
          
          // Continuer le polling si on n'a pas encore atteint le max
          if (attempts < maxAttempts) {
            setTimeout(() => pollCredits(attempts + 1, maxAttempts), 2000);
          }
          return false;
        }

        // Surveiller la popup pour détecter quand elle se ferme
        const checkPopup = setInterval(async () => {
          try {
            // Vérifier si la popup est fermée
            if (popup.closed) {
              clearInterval(checkPopup);
              
              // Lancer le polling avec un délai initial
              setPushInfo('⏳ Vérification du paiement...');
              setTimeout(() => pollCredits(0, 15), 1500);
            }
          } catch (e) {
            // Erreur si la popup est fermée ou inaccessible
            if (popup.closed) {
              clearInterval(checkPopup);
              setPushInfo('⏳ Vérification du paiement...');
              setTimeout(() => pollCredits(0, 15), 1500);
            }
          }
        }, 500); // Vérifier toutes les 500ms

        // Nettoyer l'intervalle après 10 minutes (timeout de sécurité)
        setTimeout(() => {
          clearInterval(checkPopup);
        }, 10 * 60 * 1000);
      } else {
        setPushError('Erreur : URL de paiement non reçue.');
      }
    } catch (err) {
      console.error('Erreur achat crédits:', err);
      setPushError('Erreur lors de la création du paiement.');
    }
  }

  async function handleSendPush() {
    if (!currentUserId || !ownProfile) return;
    if (!pushImageFile) {
      setPushError('Choisis une image avant d’envoyer ton Push Éclair.');
      return;
    }
    if (pushCredits <= 0) {
      setPushError(
        "Tu n'as pas de Push Éclair disponible pour le moment. Plus tard, tu pourras en acheter."
      );
      return;
    }

    setPushSending(true);
    setPushError('');
    setPushInfo('');

    const ext = pushImageFile.name.split('.').pop();
    const path = `pushes/${currentUserId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('push_eclair')
      .upload(path, pushImageFile, { upsert: true });

    if (uploadError) {
      setPushSending(false);
      setPushError(uploadError.message);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from('push_eclair')
      .getPublicUrl(path);

    const imageUrl = publicUrlData.publicUrl;

    const { data: nearby, error: nearErr } = await supabase.rpc(
      'nearby_profiles',
      {
        p_lat: ownProfile.lat,
        p_lng: ownProfile.lng,
        p_radius_km: 30,
        p_user_id: currentUserId,
      }
    );

    if (nearErr) {
      setPushSending(false);
      setPushError(nearErr.message);
      return;
    }

    let candidates = (nearby || []).slice(0, 100);

    if (!candidates.length) {
      setPushSending(false);
      setPushError(
        'Aucun profil compatible trouvé dans un rayon de 30 km pour ton Push Éclair.'
      );
      return;
    }

    const { data: broadcastRow, error: bErr } = await supabase
      .from('push_eclair_broadcasts')
      .insert({
        sender_id: currentUserId,
        image_url: imageUrl,
        radius_km: 30,
        recipients_count: candidates.length,
      })
      .select('id')
      .single();

    if (bErr || !broadcastRow) {
      setPushSending(false);
      setPushError(bErr?.message || 'Erreur lors de la création du Push.');
      return;
    }

    const broadcastId = broadcastRow.id;

    for (const p of candidates) {
      const otherUserId = p.user_id;

      // Vérifier s'il existe un blocage entre currentUserId et otherUserId
      const { data: blocks, error: blockErr } = await supabase
        .from('blocks')
        .select('id')
        .or(
          `and(blocker_id.eq.${currentUserId},blocked_id.eq.${otherUserId}),and(blocker_id.eq.${otherUserId},blocked_id.eq.${currentUserId})`
        );

      if (!blockErr && blocks && blocks.length > 0) {
        continue;
      }

      let { data: conv1 } = await supabase
        .from('conversations')
        .select('id')
        .match({ user_id_1: currentUserId, user_id_2: otherUserId })
        .maybeSingle();

      if (!conv1) {
        const { data: conv2 } = await supabase
          .from('conversations')
          .select('id')
          .match({ user_id_1: otherUserId, user_id_2: currentUserId })
          .maybeSingle();
        conv1 = conv2;
      }

      let conversationId = conv1?.id;

      if (!conversationId) {
        const { data: newConv, error: cErr } = await supabase
          .from('conversations')
          .insert({
            user_id_1: currentUserId,
            user_id_2: otherUserId,
            is_group: false,
          })
          .select('id')
          .single();

        if (cErr || !newConv) {
          continue;
        }
        conversationId = newConv.id;

        // Créer les entrées dans conversation_participants pour les deux utilisateurs
        const { error: partError } = await supabase
          .from('conversation_participants')
          .insert([
            {
              conversation_id: conversationId,
              user_id: currentUserId,
              active: true,
            },
            {
              conversation_id: conversationId,
              user_id: otherUserId,
              active: true,
            },
          ]);

        if (partError) {
          console.error('Erreur création participants Push Éclair:', partError);
          // On continue quand même car la conversation existe
        }
      }

      const { data: msgRow, error: msgErr } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: currentUserId,
          content: 'Push Éclair 💥',
          image_url: imageUrl,
        })
        .select('id')
        .single();

      if (msgErr || !msgRow) {
        continue;
      }

      await supabase.from('push_eclair_deliveries').insert({
        broadcast_id: broadcastId,
        receiver_id: otherUserId,
        conversation_id: conversationId,
        message_id: msgRow.id,
      });
    }

    const { error: updErr } = await supabase
      .from('profiles')
      .update({
        push_eclair_credits: pushCredits - 1,
      })
      .eq('id', ownProfile.id);

    if (!updErr) {
      setPushCredits((c) => c - 1);
    }

    setPushSending(false);
    setPushInfo(
      `Ton Push Éclair a été envoyé à ${candidates.length} personnes dans un rayon de 30 km.`
    );
  }

  // --- Sélection pour match de groupe ---

  function toggleSelectProfile(profileId) {
    setGroupMatchError('');
    setGroupMatchInfo('');
    setSelectedProfileIds((prev) => {
      if (prev.includes(profileId)) {
        return prev.filter((id) => id !== profileId);
      }
      const maxOthers = MAX_GROUP_SIZE - 1;
      if (prev.length >= maxOthers) {
        return prev;
      }
      return [...prev, profileId];
    });
  }

  async function handleCreateGroupMatch() {
    if (!currentUserId || !selectedProfileIds.length) return;
    setGroupMatchError('');
    setGroupMatchInfo('');
    setGroupMatchLoading(true);

    try {
      const { data: selectedProfiles, error: selErr } = await supabase
        .from('profiles')
        .select('id, user_id, display_name')
        .in('id', selectedProfileIds);

      if (selErr) {
        setGroupMatchLoading(false);
        setGroupMatchError(selErr.message);
        return;
      }

      const names = (selectedProfiles || [])
        .map((p) => p.display_name)
        .filter(Boolean);
      const title =
        names.length > 0
          ? `Ménage avec ${names.join(', ')}`
          : 'Match de groupe ManyLovr';

      const { data: propRow, error: propErr } = await supabase
        .from('group_match_proposals')
        .insert({
          creator_user_id: currentUserId,
          title,
          max_size: MAX_GROUP_SIZE,
        })
        .select('id')
        .single();

      if (propErr || !propRow) {
        setGroupMatchLoading(false);
        setGroupMatchError(
          propErr?.message || 'Erreur lors de la création de la proposition.'
        );
        return;
      }

      const proposalId = propRow.id;

      const membersUserIds =
        selectedProfiles?.map((p) => p.user_id).filter(Boolean) || [];

      const rows = [
        {
          proposal_id: proposalId,
          user_id: currentUserId,
          status: 'accepted',
        },
        ...membersUserIds.map((uid) => ({
          proposal_id: proposalId,
          user_id: uid,
          status: 'invited',
        })),
      ];

      const { error: candErr } = await supabase
        .from('group_match_candidates')
        .insert(rows);

      if (candErr) {
        setGroupMatchLoading(false);
        setGroupMatchError(candErr.message);
        return;
      }

      setGroupMatchLoading(false);
      setSelectedProfileIds([]);
      setGroupMatchInfo(
        "✓ Proposition envoyée ! Les personnes invitées peuvent maintenant accepter ou refuser. Suis l'avancement dans la page Groupes."
      );
      
      // Rediriger vers la page des groupes après 2 secondes
      setTimeout(() => {
        router.push('/groups');
      }, 2500);
    } catch (err) {
      console.error(err);
      setGroupMatchLoading(false);
      setGroupMatchError('Erreur inconnue lors de la création du groupe.');
    }
  }

  if (loading) {
    return <main>Chargement…</main>;
  }

  return (
    <main>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 10,
          alignItems: 'center',
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        <h1 style={{
          background: 'linear-gradient(135deg, #f472b6, #a855f7)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Profils proches
        </h1>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button 
            type="button" 
            onClick={openTornado}
            style={{
              padding: '12px 20px',
              borderRadius: '14px',
              background: 'rgba(168, 85, 247, 0.1)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              backdropFilter: 'blur(8px)',
              color: '#e5e7eb',
              fontSize: 14,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(168, 85, 247, 0.2)';
              e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.5)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(168, 85, 247, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(168, 85, 247, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.3)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <span style={{ fontSize: 18 }}>🌪️</span>
            <span>Mode Tornado</span>
          </button>
          <button
            type="button"
            onClick={openPush}
            style={{
              padding: '12px 20px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(250, 204, 21, 0.15), rgba(251, 113, 133, 0.15))',
              border: '1px solid rgba(251, 113, 133, 0.4)',
              backdropFilter: 'blur(8px)',
              color: '#fcd34d',
              fontSize: 14,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(250, 204, 21, 0.25), rgba(251, 113, 133, 0.25))';
              e.currentTarget.style.borderColor = 'rgba(251, 113, 133, 0.6)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(251, 113, 133, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(250, 204, 21, 0.15), rgba(251, 113, 133, 0.15))';
              e.currentTarget.style.borderColor = 'rgba(251, 113, 133, 0.4)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <span style={{ fontSize: 18 }}>⚡</span>
            <span>Push Éclair</span>
            <span style={{
              padding: '2px 8px',
              borderRadius: '10px',
              background: 'rgba(250, 204, 21, 0.2)',
              border: '1px solid rgba(250, 204, 21, 0.4)',
              fontSize: 12,
              fontWeight: 700,
              color: '#fcd34d',
            }}>
              {pushCredits}
            </span>
          </button>
        </div>
      </div>

      {/* Barre de filtres */}
      <div
        style={{
          marginBottom: 16,
          padding: '16px',
          borderRadius: '16px',
          background: 'rgba(168, 85, 247, 0.05)',
          border: '1px solid rgba(168, 85, 247, 0.15)',
          backdropFilter: 'blur(8px)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 14,
        }}
      >
        <div>
          <label style={{ 
            fontSize: 12, 
            color: '#9ca3af',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 6,
          }}>
            <span>🎯</span>
            Type de rencontre
          </label>
          <select
            value={filterIntent}
            onChange={(e) => setFilterIntent(e.target.value)}
            style={{ 
              width: '100%',
              padding: '10px 12px',
              borderRadius: '10px',
              background: 'rgba(26, 26, 46, 0.6)',
              border: '1px solid rgba(168, 85, 247, 0.2)',
              color: '#e5e7eb',
              fontSize: 14,
            }}
          >
            <option value="">Tous</option>
            <option value="friendly">🤝 Amical</option>
            <option value="sexy">🔥 Coquin</option>
            <option value="both">✨ Amical & Coquin</option>
          </select>
        </div>

        <div>
          <label style={{ 
            fontSize: 12, 
            color: '#9ca3af',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 6,
          }}>
            <span>👤</span>
            Genre du profil
          </label>
          <select
            value={filterGender}
            onChange={(e) => setFilterGender(e.target.value)}
            style={{ 
              width: '100%',
              padding: '10px 12px',
              borderRadius: '10px',
              background: 'rgba(26, 26, 46, 0.6)',
              border: '1px solid rgba(168, 85, 247, 0.2)',
              color: '#e5e7eb',
              fontSize: 14,
            }}
          >
            <option value="">Tous</option>
            <option value="man">Hommes</option>
            <option value="woman">Femmes</option>
            <option value="couple">Couples</option>
            <option value="other">Autres</option>
          </select>
        </div>

      </div>

      {/* Carte de rayon de recherche */}
      <RadiusMapSelector
        lat={ownProfile?.lat}
        lng={ownProfile?.lng}
        radiusKm={radiusKm}
        onRadiusChange={setRadiusKm}
        profilesCount={profiles.length}
      />

      {/* Barre de match de groupe */}
      <div
        className="card"
        style={{
          marginBottom: 16,
          padding: '14px 16px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(168, 85, 247, 0.05)',
          border: '1px solid rgba(168, 85, 247, 0.2)',
        }}
      >
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 8, 
            marginBottom: 4 
          }}>
            <span style={{ fontSize: 18 }}>👥</span>
            <strong style={{ fontSize: 14 }}>Créer un groupe</strong>
          </div>
          <p style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.5 }}>
            Sélectionne jusqu'à {MAX_GROUP_SIZE - 1} profils pour proposer un tchat de groupe.
            Chaque personne pourra accepter ou refuser l'invitation.
          </p>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          {/* Compteur visuel */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            borderRadius: '20px',
            background: selectedProfileIds.length > 0 
              ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(244, 114, 182, 0.15))'
              : 'rgba(26, 26, 46, 0.6)',
            border: selectedProfileIds.length > 0 
              ? '1px solid rgba(168, 85, 247, 0.4)'
              : '1px solid var(--color-border)',
          }}>
            <span style={{ 
              fontSize: 20, 
              fontWeight: 700,
              color: selectedProfileIds.length > 0 ? '#c084fc' : '#6b7280',
            }}>
              {selectedProfileIds.length}
            </span>
            <span style={{ fontSize: 13, color: '#9ca3af' }}>
              / {MAX_GROUP_SIZE - 1}
            </span>
          </div>
          
          <button
            type="button"
            disabled={groupMatchLoading || selectedProfileIds.length === 0}
            onClick={handleCreateGroupMatch}
            style={{
              padding: '10px 20px',
              borderRadius: '12px',
              background: selectedProfileIds.length > 0
                ? 'linear-gradient(135deg, #a855f7, #f472b6)'
                : 'rgba(107, 114, 128, 0.3)',
              border: 'none',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: groupMatchLoading || selectedProfileIds.length === 0 ? 'not-allowed' : 'pointer',
              opacity: selectedProfileIds.length === 0 ? 0.6 : 1,
            }}
          >
            {groupMatchLoading ? '⏳ Création…' : '✓ Proposer le groupe'}
          </button>
        </div>
      </div>

      {groupMatchError && (
        <div style={{ 
          padding: '12px 16px',
          borderRadius: '12px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <span style={{ fontSize: 18 }}>❌</span>
          <p style={{ color: '#fca5a5', fontSize: 13, margin: 0 }}>
            {groupMatchError}
          </p>
        </div>
      )}
      {groupMatchInfo && (
        <div style={{ 
          padding: '12px 16px',
          borderRadius: '12px',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <span style={{ fontSize: 18 }}>🎉</span>
          <div>
            <p style={{ color: '#a3e635', fontSize: 13, margin: 0 }}>
              {groupMatchInfo}
            </p>
            <p style={{ color: '#6b7280', fontSize: 12, marginTop: 4 }}>
              Redirection vers la page Groupes…
            </p>
          </div>
        </div>
      )}

      {errorMsg && <p style={{ color: 'tomato' }}>{errorMsg}</p>}

      {profiles.length === 0 && !errorMsg && (
        <p>
          Aucun profil ne correspond à ces critères (ou personne n’a encore
          activé la géolocalisation).
        </p>
      )}

      <ul style={{ 
        listStyle: 'none', 
        padding: 0, 
        margin: 0, 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 10 
      }}>
        {profiles.map((p) => {
          const isSelected = selectedProfileIds.includes(p.id);
          return (
            <li 
              key={p.id} 
              style={{
                padding: '16px',
                borderRadius: '16px',
                background: isSelected 
                  ? 'rgba(16, 185, 129, 0.08)'
                  : 'rgba(168, 85, 247, 0.05)',
                border: isSelected 
                  ? '1px solid rgba(16, 185, 129, 0.3)'
                  : '1px solid rgba(168, 85, 247, 0.15)',
                backdropFilter: 'blur(8px)',
                transition: 'all 0.25s ease',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: 14,
                  alignItems: 'center',
                }}
              >
                <Link
                  href={`/profiles/${p.id}`}
                  style={{
                    color: 'inherit',
                    textDecoration: 'none',
                    flex: 1,
                    display: 'flex',
                    gap: 14,
                    alignItems: 'center',
                  }}
                >
                  {/* Avatar avec pastille de statut en ligne */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    {p.main_photo_url ? (
                      <img
                        src={p.main_photo_url}
                        alt={p.display_name || 'Photo de profil'}
                        style={{
                          width: 60,
                          height: 60,
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '2px solid rgba(168, 85, 247, 0.3)',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 60,
                          height: 60,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.3), rgba(244, 114, 182, 0.3))',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 22,
                          fontWeight: 600,
                          border: '2px solid rgba(168, 85, 247, 0.3)',
                        }}
                      >
                        {(p.display_name || '?')
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                    )}
                    
                    {/* Pastille verte - En ligne */}
                    {(p.is_online || (p.last_seen_at && new Date(p.last_seen_at) > new Date(Date.now() - 5 * 60 * 1000))) && (
                      <span
                        style={{
                          position: 'absolute',
                          bottom: 2,
                          right: 2,
                          width: 14,
                          height: 14,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #10b981, #059669)',
                          border: '2px solid var(--color-bg-primary)',
                          boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)',
                        }}
                        title="En ligne"
                      />
                    )}
                  </div>

                  <div
                    style={{
                      flex: 1,
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 10,
                    }}
                  >
                    <div>
                      <strong style={{ 
                        fontSize: 15, 
                        display: 'block',
                        marginBottom: 4,
                      }}>
                        {p.display_name || 'Sans pseudo'}
                      </strong>
                      <div style={{ 
                        fontSize: 13, 
                        color: '#9ca3af',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}>
                        <span>📍</span>
                        {p.city || 'Ville ?'}
                      </div>
                    </div>
                    <div style={{ 
                      textAlign: 'right', 
                      fontSize: 12,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                    }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '8px',
                        background: 'rgba(168, 85, 247, 0.1)',
                        color: '#c084fc',
                      }}>
                        {p.gender || '-'}
                      </span>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '8px',
                        background: p.main_intent === 'friendly' 
                          ? 'rgba(16, 185, 129, 0.1)'
                          : p.main_intent === 'sexy'
                          ? 'rgba(244, 114, 182, 0.1)'
                          : 'rgba(245, 158, 11, 0.1)',
                        color: p.main_intent === 'friendly' 
                          ? '#10b981'
                          : p.main_intent === 'sexy'
                          ? '#f472b6'
                          : '#f59e0b',
                      }}>
                        {p.main_intent === 'friendly' && '🤝 Amical'}
                        {p.main_intent === 'sexy' && '🔥 Coquin'}
                        {p.main_intent === 'wild' && '⚡ Sauvage'}
                        {!p.main_intent && '-'}
                      </span>
                    </div>
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={() => toggleSelectProfile(p.id)}
                  style={{
                    padding: '10px 14px',
                    fontSize: 12,
                    background: isSelected
                      ? 'linear-gradient(135deg, #10b981, #059669)'
                      : 'rgba(168, 85, 247, 0.15)',
                    color: isSelected ? '#fff' : '#c084fc',
                    whiteSpace: 'nowrap',
                    borderRadius: '10px',
                    border: isSelected 
                      ? 'none'
                      : '1px solid rgba(168, 85, 247, 0.3)',
                    cursor: 'pointer',
                    fontWeight: 600,
                    minWidth: 'fit-content',
                    flexShrink: 0,
                    transition: 'all 0.2s ease',
                  }}
                  className="group-button"
                >
                  <span className="group-button-text">
                    {isSelected ? '✓ Sélectionné' : '+ Groupe'}
                  </span>
                  <span className="group-button-icon">
                    {isSelected ? '✓' : '+'}
                  </span>
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Overlay Tornado */}
      {tornadoOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'radial-gradient(circle at center, rgba(168, 85, 247, 0.15), rgba(0,0,0,0.95))',
            zIndex: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'clamp(12px, 3vw, 16px)',
            overflowY: 'auto',
          }}
          className="tornado-overlay"
        >
          <div
            className="card"
            style={{
              maxWidth: 'min(460px, 100%)',
              width: '100%',
              maxHeight: '95vh',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              margin: 'auto',
            }}
          >
            <button
              type="button"
              onClick={closeTornado}
              style={{
                position: 'absolute',
                top: 'clamp(8px, 2vw, 12px)',
                right: 'clamp(8px, 2vw, 12px)',
                padding: '8px 12px',
                fontSize: 'clamp(12px, 2.5vw, 14px)',
                backgroundImage:
                  'linear-gradient(135deg, #6b7280, #111827)',
                color: '#e5e7eb',
                minHeight: '36px',
                zIndex: 10,
              }}
            >
              Fermer
            </button>

            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <h2 style={{ 
                fontSize: 24, 
                marginBottom: 4,
                background: 'linear-gradient(135deg, #f472b6, #a855f7)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 700,
              }}>
                🌪️ Mode Tornado
              </h2>
              <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8 }}>
                Swipe jusqu'à 10 profils par jour
              </p>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 12px',
                  borderRadius: '20px',
                  background: tornadoRemaining > 0 
                    ? 'linear-gradient(135deg, rgba(163, 230, 53, 0.2), rgba(163, 230, 53, 0.1))'
                    : 'linear-gradient(135deg, rgba(252, 165, 165, 0.2), rgba(252, 165, 165, 0.1))',
                  border: `1px solid ${tornadoRemaining > 0 ? '#a3e635' : '#fca5a5'}`,
                }}
              >
                <span style={{ fontSize: 16 }}>
                  {tornadoRemaining > 0 ? '⚡' : '💤'}
                </span>
                <span style={{
                  fontSize: 13,
                  color: tornadoRemaining > 0 ? '#a3e635' : '#fca5a5',
                  fontWeight: 600,
                }}>
                  {tornadoRemaining} swipes restants
                </span>
              </div>
            </div>

            {tornadoLoading && <p>Chargement des profils…</p>}

            {!tornadoLoading &&
              tornadoRemaining <= 0 &&
              !hasSessionRecap && (
                <p style={{ fontSize: 13 }}>
                  Tu as utilisé tes 10 swipes pour aujourd’hui. Reviens demain,
                  ou plus tard on te proposera une option pour en avoir plus.
                </p>
              )}

            {/* Effet Like simple */}
            {tornadoShowMatch && !tornadoMutualMatch && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 100,
                  pointerEvents: 'none',
                }}
                className="tornado-match-effect"
              >
                <div
                  style={{
                    fontSize: 72,
                    animation: 'pulse 0.6s ease-out',
                    filter: 'drop-shadow(0 0 20px rgba(244, 114, 182, 0.8))',
                  }}
                >
                  💖
                </div>
              </div>
            )}

            {/* Effet Match Mutuel ! */}
            {tornadoMutualMatch && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 100,
                  background: 'radial-gradient(circle, rgba(244, 114, 182, 0.3) 0%, rgba(168, 85, 247, 0.4) 50%, rgba(0,0,0,0.9) 100%)',
                  backdropFilter: 'blur(8px)',
                  animation: 'fadeIn 0.3s ease-out',
                }}
              >
                <div
                  style={{
                    fontSize: 80,
                    marginBottom: 16,
                    animation: 'pulse 0.8s ease-out infinite',
                    filter: 'drop-shadow(0 0 30px rgba(244, 114, 182, 0.9))',
                  }}
                >
                  🌪️💕
                </div>
                <h3 style={{
                  fontSize: 28,
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #f472b6, #a855f7)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  marginBottom: 8,
                  textAlign: 'center',
                }}>
                  C'est un Match !
                </h3>
                <p style={{
                  fontSize: 16,
                  color: '#e5e7eb',
                  textAlign: 'center',
                  maxWidth: 300,
                  lineHeight: 1.5,
                }}>
                  {tornadoMutualMatch.profile?.display_name || 'Cette personne'} t'a aussi liké !
                </p>
                <p style={{
                  fontSize: 13,
                  color: '#9ca3af',
                  marginTop: 8,
                  textAlign: 'center',
                }}>
                  Une conversation a été créée 💬
                </p>
                <button
                  type="button"
                  onClick={() => setTornadoMutualMatch(null)}
                  style={{
                    marginTop: 20,
                    padding: '12px 24px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #f472b6, #a855f7)',
                    border: 'none',
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Continuer à swiper
                </button>
              </div>
            )}

            {!tornadoLoading &&
              tornadoRemaining > 0 &&
              tornadoProfiles.length > 0 &&
              tornadoIndex < tornadoProfiles.length && (
                <>
                  {(() => {
                    const p = tornadoProfiles[tornadoIndex];
                    return (
                      <div
                        className={`tornado-card ${tornadoCardAnimation}`}
                        style={{
                          marginTop: 6,
                          marginBottom: 12,
                          textAlign: 'center',
                          position: 'relative',
                          transition: 'transform 0.3s ease-out, opacity 0.3s ease-out',
                        }}
                      >
                        <div
                          style={{
                            position: 'relative',
                            borderRadius: 20,
                            overflow: 'hidden',
                            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(244, 114, 182, 0.1))',
                            padding: 2,
                            marginBottom: 16,
                          }}
                        >
                          {p.main_photo_url ? (
                            <img
                              src={p.main_photo_url}
                              alt={p.display_name || 'Photo de profil'}
                              style={{
                                width: '100%',
                                maxHeight: '60vh',
                                minHeight: 300,
                                objectFit: 'cover',
                                borderRadius: 18,
                                display: 'block',
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: '100%',
                                minHeight: 300,
                                maxHeight: '60vh',
                                borderRadius: 18,
                                background:
                                  'linear-gradient(135deg, rgba(168, 85, 247, 0.3), rgba(244, 114, 182, 0.3))',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 64,
                              }}
                            >
                              {(p.display_name || '?')
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                          )}
                        </div>

                        <h3 style={{ 
                          fontSize: 22, 
                          fontWeight: 700,
                          marginBottom: 8,
                          background: 'linear-gradient(135deg, #f472b6, #a855f7)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                        }}>
                          {p.display_name || 'Sans pseudo'}
                        </h3>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 12,
                            marginBottom: 8,
                            flexWrap: 'wrap',
                          }}
                        >
                          <span style={{
                            fontSize: 13,
                            color: '#e5e7eb',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}>
                            📍 {p.city || 'Quelque part près de toi'}
                          </span>
                          <span style={{
                            fontSize: 13,
                            color: '#cbd5e1',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}>
                            {p.gender || 'Genre ?'}
                          </span>
                        </div>
                        {p.main_intent && (
                          <div
                            style={{
                              display: 'inline-block',
                              padding: '4px 12px',
                              borderRadius: '12px',
                              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(244, 114, 182, 0.2))',
                              border: '1px solid rgba(168, 85, 247, 0.3)',
                              fontSize: 12,
                              color: '#e5e7eb',
                              marginTop: 4,
                            }}
                          >
                            {p.main_intent === 'friendly' && '🤝 Rencontres amicales'}
                            {p.main_intent === 'sexy' && '🔥 Rencontres coquines'}
                            {p.main_intent === 'wild' && '⚡ Rencontres sauvages'}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      gap: 16,
                      marginTop: 'auto',
                      paddingTop: 16,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handleTornadoSwipe('pass')}
                      disabled={tornadoRemaining <= 0}
                      className="tornado-button tornado-button-pass"
                      style={{
                        width: 70,
                        height: 70,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #4b5563, #1f2937)',
                        border: '2px solid #6b7280',
                        color: '#e5e7eb',
                        fontSize: 28,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: tornadoRemaining <= 0 ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                      }}
                      onMouseEnter={(e) => {
                        if (tornadoRemaining > 0) {
                          e.currentTarget.style.transform = 'scale(1.1)';
                          e.currentTarget.style.background = 'linear-gradient(135deg, #6b7280, #4b5563)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.background = 'linear-gradient(135deg, #4b5563, #1f2937)';
                      }}
                    >
                      ✕
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTornadoSwipe('like')}
                      disabled={tornadoRemaining <= 0}
                      className="tornado-button tornado-button-like"
                      style={{
                        width: 70,
                        height: 70,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #f472b6, #a855f7)',
                        border: '2px solid #c084fc',
                        color: '#fff',
                        fontSize: 32,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: tornadoRemaining <= 0 ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: '0 4px 20px rgba(168, 85, 247, 0.4)',
                      }}
                      onMouseEnter={(e) => {
                        if (tornadoRemaining > 0) {
                          e.currentTarget.style.transform = 'scale(1.15)';
                          e.currentTarget.style.boxShadow = '0 6px 25px rgba(244, 114, 182, 0.6)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = '0 4px 20px rgba(168, 85, 247, 0.4)';
                      }}
                    >
                      💖
                    </button>
                  </div>
                </>
              )}

            {hasSessionRecap && (
              <div
                style={{
                  marginTop: 10,
                  paddingTop: 10,
                  borderTop: '1px solid #1f2937',
                  fontSize: 13,
                }}
              >
                <h3 style={{ fontSize: 15, marginBottom: 4 }}>
                  Bilan de cette tornade
                </h3>
                <p style={{ color: '#e5e7eb', marginBottom: 4 }}>
                  Tu as swipé {totalSessionSwipes} profil
                  {totalSessionSwipes > 1 ? 's' : ''}, dont{' '}
                  {sessionLikes.length} like
                  {sessionLikes.length > 1 ? 's' : ''} et{' '}
                  {sessionPasses.length} pass.
                </p>
                {sessionLikes.length > 0 ? (
                  <>
                    <p
                      style={{
                        color: '#9ca3af',
                        marginBottom: 4,
                      }}
                    >
                      Profils que tu as likés pendant cette session :
                    </p>
                    <ul
                      style={{
                        listStyle: 'none',
                        padding: 0,
                        maxHeight: 150,
                        overflowY: 'auto',
                      }}
                    >
                      {sessionLikes.map((item, idx) => (
                        <li
                          key={`${item.profile.id}-${idx}`}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 8,
                            padding: '4px 0',
                          }}
                        >
                          <span>
                            {item.profile.display_name ||
                              'Sans pseudo'}{' '}
                            <span
                              style={{
                                fontSize: 11,
                                color: '#9ca3af',
                              }}
                            >
                              ({item.profile.city || 'Ville ?'})
                            </span>
                          </span>
                          <Link
                            href={`/profiles/${item.profile.id}`}
                            style={{
                              fontSize: 11,
                              color: '#fda4af',
                            }}
                          >
                            Voir
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p style={{ color: '#9ca3af' }}>
                    Tu n’as liké personne cette fois‑ci. Tu pourras toujours
                    retenter une tornade demain.
                  </p>
                )}
              </div>
            )}

            {tornadoError && (
              <p style={{ color: 'tomato', marginTop: 10, fontSize: 13 }}>
                {tornadoError}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Overlay Push Éclair */}
      {pushOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            zIndex: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'clamp(12px, 3vw, 16px)',
            overflowY: 'auto',
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: 'min(420px, 100%)',
              width: '100%',
              maxHeight: '95vh',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              margin: 'auto',
            }}
          >
            <button
              type="button"
              onClick={closePush}
              style={{
                position: 'absolute',
                top: 'clamp(8px, 2vw, 12px)',
                right: 'clamp(8px, 2vw, 12px)',
                padding: '8px 12px',
                fontSize: 'clamp(12px, 2.5vw, 14px)',
                backgroundImage:
                  'linear-gradient(135deg, #6b7280, #111827)',
                color: '#e5e7eb',
                minHeight: '36px',
                zIndex: 10,
              }}
              disabled={pushSending}
            >
              Fermer
            </button>

            <h2 style={{ fontSize: 18, marginBottom: 6 }}>Push Éclair</h2>
            <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 8 }}>
              Dépense 1 Push Éclair pour envoyer une photo à jusqu'à 100
              personnes dans un rayon de 30 km autour de toi.
            </p>

            <div
              style={{
                marginBottom: 12,
                padding: '12px',
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                borderRadius: '8px',
              }}
            >
              <p
                style={{
                  fontSize: 13,
                  margin: '0 0 10px 0',
                  color: pushCredits > 0 ? '#a3e635' : '#fca5a5',
                }}
              >
                Crédits Push Éclair disponibles : <strong>{pushCredits}</strong>
              </p>
              
              <div style={{ marginBottom: 10 }}>
                <p style={{ fontSize: 12, marginBottom: 6, color: '#9ca3af' }}>
                  Choisis un pack :
                </p>
                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    marginBottom: 10,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedPack('1x')}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      fontSize: 12,
                      backgroundImage:
                        selectedPack === '1x'
                          ? 'linear-gradient(135deg, #8b5cf6, #ec4899)'
                          : 'linear-gradient(135deg, #374151, #1f2937)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    1x Push (2,29€)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPack('3x')}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      fontSize: 12,
                      backgroundImage:
                        selectedPack === '3x'
                          ? 'linear-gradient(135deg, #8b5cf6, #ec4899)'
                          : 'linear-gradient(135deg, #374151, #1f2937)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    3x Push (4,99€)
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleBuyPushCredits}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: 13,
                  backgroundImage: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Acheter {selectedPack === '1x' ? '1 crédit' : '3 crédits'}
              </button>
            </div>

            <label
              style={{
                fontSize: 13,
                marginBottom: 10,
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              Choisis la photo à envoyer
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setPushImageFile(e.target.files?.[0] || null)
                }
              />
            </label>

            {pushError && (
              <p style={{ color: 'tomato', fontSize: 13, marginBottom: 6 }}>
                {pushError}
              </p>
            )}
            {pushInfo && (
              <p style={{ color: '#a3e635', fontSize: 13, marginBottom: 6 }}>
                {pushInfo}
              </p>
            )}

            <button
              type="button"
              onClick={handleSendPush}
              disabled={pushSending}
              style={{
                marginTop: 'auto',
                backgroundImage:
                  'linear-gradient(135deg, #facc15, #fb7185)',
              }}
            >
              {pushSending ? 'Envoi en cours…' : 'Envoyer mon Push Éclair'}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

