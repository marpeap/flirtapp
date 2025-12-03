'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';

export default function ProfileDetailPage() {
  const params = useParams();
  const router = useRouter();
  const profileId = params.id;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [contactLoading, setContactLoading] = useState(false);
  const [contactError, setContactError] = useState('');

  // Charger le profil
  useEffect(() => {
    async function loadProfile() {
      setErrorMsg('');
      setLoading(true);

      const { data, error } = await supabase
        .from('profiles')
        .select(
          'id, user_id, display_name, gender, main_intent, city, bio, main_photo_url'
        )
        .eq('id', profileId)
        .single();

      if (error) {
        setErrorMsg(error.message);
      } else {
        setProfile(data);
      }
      setLoading(false);
    }

    if (profileId) {
      loadProfile();
    }
  }, [profileId]);

  // Clic sur "Entrer en contact"
  async function handleContactClick() {
    if (!profile) return;

    setContactError('');
    setContactLoading(true);

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      setContactLoading(false);
      router.push('/login');
      return;
    }

    const currentUserId = userData.user.id;
    const otherUserId = profile.user_id;

    if (currentUserId === otherUserId) {
      setContactLoading(false);
      setContactError("Tu ne peux pas discuter avec toi‑même.");
      return;
    }

    let { data: conv1, error: convError1 } = await supabase
      .from('conversations')
      .select('id')
      .match({ user_id_1: currentUserId, user_id_2: otherUserId })
      .maybeSingle();

    if (!conv1 && !convError1) {
      const { data: conv2, error: convError2 } = await supabase
        .from('conversations')
        .select('id')
        .match({ user_id_1: otherUserId, user_id_2: currentUserId })
        .maybeSingle();
      conv1 = conv2;
      convError1 = convError2;
    }

    let conversationId = conv1?.id;

    if (!conversationId && !convError1) {
      const { data: newConv, error: insertError } = await supabase
        .from('conversations')
        .insert({
          user_id_1: currentUserId,
          user_id_2: otherUserId,
        })
        .select('id')
        .single();

      if (insertError) {
        setContactLoading(false);
        setContactError(insertError.message);
        return;
      }
      conversationId = newConv.id;
    }

    setContactLoading(false);

    if (!conversationId) {
      setContactError("Impossible d'ouvrir la conversation.");
      return;
    }

    router.push(`/messages/${conversationId}`);
  }

  if (loading) {
    return <main>Chargement…</main>;
  }

  if (errorMsg || !profile) {
    return (
      <main>
        <p>Profil introuvable.</p>
        <button onClick={() => router.push('/profiles')}>
          ← Retour aux profils
        </button>
      </main>
    );
  }

  return (
    <main>
      <button onClick={() => router.push('/profiles')}>← Retour</button>

      <div className="list-card-item" style={{ marginTop: 16 }}>
        {profile.main_photo_url && (
          <img
            src={profile.main_photo_url}
            alt={profile.display_name || 'Photo de profil'}
            style={{
              width: 96,
              height: 96,
              borderRadius: '50%',
              objectFit: 'cover',
              marginBottom: 12,
            }}
          />
        )}
        <h1 style={{ marginBottom: 12 }}>{profile.display_name}</h1>
        <p>Ville : {profile.city || 'Non renseignée'}</p>
        <p>Genre : {profile.gender || '-'}</p>
        <p>Intention : {profile.main_intent || '-'}</p>
        {profile.bio && (
          <p style={{ marginTop: 8 }}>À propos : {profile.bio}</p>
        )}
      </div>

      <button
        style={{ marginTop: 20 }}
        onClick={handleContactClick}
        disabled={contactLoading}
      >
        {contactLoading ? 'Ouverture…' : 'Entrer en contact'}
      </button>

      {contactError && (
        <p style={{ color: 'red', marginTop: 12 }}>{contactError}</p>
      )}
    </main>
  );
}

