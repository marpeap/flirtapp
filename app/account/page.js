'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function AccountPage() {
  const router = useRouter();
  const [loadingUser, setLoadingUser] = useState(true);
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [prefsLoading, setPrefsLoading] = useState(false);

  // Préférences de confidentialité
  const [allowMessagesFrom, setAllowMessagesFrom] = useState('any');
  const [showDistance, setShowDistance] = useState(true);

  useEffect(() => {
    async function loadUserAndPrefs() {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
        router.push('/login');
        return;
      }
      const user = data.user;
      setUserId(user.id);
      setUserEmail(user.email || '');

      const { data: profile, error: profErr } = await supabase
        .from('profiles')
        .select('allow_messages_from, show_distance')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!profErr && profile) {
        setAllowMessagesFrom(profile.allow_messages_from || 'any');
        setShowDistance(profile.show_distance ?? true);
      }

      setLoadingUser(false);
    }
    loadUserAndPrefs();
  }, [router]);

  async function handleSavePrefs() {
    if (!userId) return;
    setPrefsLoading(true);
    setStatusMsg('');
    setErrorMsg('');

    const { error } = await supabase
      .from('profiles')
      .update({
        allow_messages_from: allowMessagesFrom,
        show_distance,
      })
      .eq('user_id', userId);

    setPrefsLoading(false);

    if (error) {
      setErrorMsg(error.message);
    } else {
      setStatusMsg('Tes préférences de confidentialité ont été mises à jour.');
    }
  }

  async function handleExportMessages() {
    if (!userId) return;
    setStatusMsg('');
    setErrorMsg('');
    setExportLoading(true);

    // Récupérer toutes les conversations où l'utilisateur est participant
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('id')
      .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`);

    if (convError) {
      setExportLoading(false);
      setErrorMsg(convError.message);
      return;
    }

    const conversationIds = (conversations || []).map((c) => c.id);

    if (conversationIds.length === 0) {
      setExportLoading(false);
      setStatusMsg('Tu n\'as pas encore de messages à exporter.');
      return;
    }

    // Récupérer tous les messages de ces conversations
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .in('conversation_id', conversationIds)
      .order('created_at', { ascending: true });

    if (error) {
      setExportLoading(false);
      setErrorMsg(error.message);
      return;
    }

    const blob = new Blob([JSON.stringify(messages || [], null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'manylovr-messages.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    await supabase.from('message_exports').insert({
      user_id: userId,
      email: userEmail,
      payload: messages || [],
    });

    setExportLoading(false);
    setStatusMsg(
      'Tes messages ont été téléchargés. Une copie est aussi enregistrée côté serveur pour un éventuel envoi par mail.'
    );
  }

  async function handleDeleteAccount() {
    if (!userId) return;
    setStatusMsg('');
    setErrorMsg('');

    const confirmDelete = window.confirm(
      "Cette action va supprimer ton profil, tes réactions, tes conversations et messages sur ManyLovr. Elle n'est pas réversible. Continuer ?"
    );
    if (!confirmDelete) return;

    setDeleteLoading(true);

    const { data: myProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    const profileId = myProfile?.id || null;

    await supabase.from('reactions').delete().eq('from_user_id', userId);
    if (profileId) {
      await supabase.from('reactions').delete().eq('to_profile_id', profileId);
    }

    // Récupérer toutes les conversations de l'utilisateur pour supprimer les messages
    const { data: userConversations } = await supabase
      .from('conversations')
      .select('id')
      .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`);

    const conversationIds = (userConversations || []).map((c) => c.id);

    if (conversationIds.length > 0) {
      await supabase
        .from('messages')
        .delete()
        .in('conversation_id', conversationIds);
    }

    // Supprimer aussi les messages où l'utilisateur est l'expéditeur (au cas où)
    await supabase.from('messages').delete().eq('sender_id', userId);

    await supabase
      .from('conversations')
      .delete()
      .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`);

    await supabase.from('blocks').delete().or(
      `blocker_id.eq.${userId},blocked_id.eq.${userId}`
    );

    await supabase.from('profiles').delete().eq('user_id', userId);

    await supabase.from('contact_requests').insert({
      user_id: userId,
      phone: 'N/A',
      message:
        'Demande de suppression complète du compte (auth.user à supprimer côté admin).',
      source_page: '/account',
    });

    await supabase.auth.signOut();

    setDeleteLoading(false);
    alert(
      'Ton profil et tes données principales ont été supprimés. Le compte d’authentification sera nettoyé côté administrateur.'
    );
    router.push('/');
  }

  if (loadingUser) {
    return <main>Chargement…</main>;
  }

  return (
    <main>
      <div className="card" style={{ maxWidth: 640, margin: '0 auto' }}>
        <h1>Mon compte ManyLovr</h1>
        <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 8 }}>
          Connecté comme : {userEmail}
        </p>

        <section style={{ marginBottom: 18 }}>
          <h2 style={{ fontSize: 16, marginBottom: 6 }}>
            Confidentialité & sécurité
          </h2>
          <p
            style={{
              fontSize: 13,
              color: '#9ca3af',
              marginBottom: 10,
            }}
          >
            Ici tu règles qui peut te contacter, et ce que les autres voient
            sur toi (distance approximative, etc.). Ces choix servent surtout à
            te donner du contrôle, comme recommandé sur les apps de rencontre
            modernes.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 1fr)',
              gap: 14,
              marginBottom: 10,
            }}
          >
            <div>
              <label style={{ fontSize: 13 }}>
                Qui peut t’envoyer un premier message ?
                <select
                  value={allowMessagesFrom}
                  onChange={(e) => setAllowMessagesFrom(e.target.value)}
                  style={{ marginTop: 4, width: '100%' }}
                >
                  <option value="any">
                    N’importe quel profil compatible
                  </option>
                  <option value="matches_only">
                    Uniquement les personnes que tu as likées (ou match)
                  </option>
                </select>
              </label>
              <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                Limiter aux “matches” peut réduire les messages indésirables,
                mais aussi les opportunités.
              </p>
            </div>

            <div>
              <label
                style={{
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center',
                  fontSize: 13,
                }}
              >
                <input
                  type="checkbox"
                  checked={showDistance}
                  onChange={(e) => setShowDistance(e.target.checked)}
                />
                Afficher ma distance approximative
              </label>
              <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                Si décoché, les autres verront ta ville mais pas le nombre de
                kilomètres estimé.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSavePrefs}
            disabled={prefsLoading}
          >
            {prefsLoading
              ? 'Enregistrement…'
              : 'Enregistrer mes préférences'}
          </button>
        </section>

        <section style={{ marginBottom: 18 }}>
          <h2 style={{ fontSize: 16, marginBottom: 6 }}>Exporter mes messages</h2>
          <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 8 }}>
            Tu peux télécharger tous les messages envoyés et reçus au format
            JSON. Une copie est aussi enregistrée côté serveur pour permettre
            un envoi ultérieur par e‑mail si nécessaire.
          </p>
          <button
            type="button"
            onClick={handleExportMessages}
            disabled={exportLoading}
          >
            {exportLoading
              ? 'Préparation de l’export…'
              : 'Télécharger mes messages (.json)'}
          </button>
        </section>

        <section style={{ marginBottom: 18 }}>
          <h2 style={{ fontSize: 16, marginBottom: 6 }}>Supprimer mon compte</h2>
          <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 8 }}>
            Cette action supprime ton profil, tes réactions, tes conversations
            et tes messages sur ManyLovr. Elle n'est pas réversible. Ton
            compte d’authentification sera ensuite nettoyé côté administrateur.
          </p>
          <button
            type="button"
            onClick={handleDeleteAccount}
            disabled={deleteLoading}
            style={{
              backgroundImage: 'linear-gradient(135deg,#f97373,#b91c1c)',
            }}
          >
            {deleteLoading ? 'Suppression en cours…' : 'Supprimer définitivement'}
          </button>
        </section>

        <section>
          <h2 style={{ fontSize: 16, marginBottom: 6 }}>Rappels de sécurité</h2>
          <ul
            style={{
              listStyle: 'disc',
              paddingLeft: 18,
              fontSize: 12,
              color: '#9ca3af',
              lineHeight: 1.5,
            }}
          >
            <li>Ne partage jamais ton adresse exacte ou des infos bancaires.</li>
            <li>Privilégie les lieux publics pour une première rencontre.</li>
            <li>
              Utilise le blocage et le signalement dès que quelqu’un dépasse
              tes limites.
            </li>
          </ul>
        </section>

        {errorMsg && (
          <p style={{ color: 'tomato', marginTop: 14, fontSize: 13 }}>
            {errorMsg}
          </p>
        )}
        {statusMsg && (
          <p style={{ color: '#a3e635', marginTop: 14, fontSize: 13 }}>
            {statusMsg}
          </p>
        )}
      </div>
    </main>
  );
}

