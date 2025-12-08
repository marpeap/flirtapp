'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

const ADMIN_EMAIL = 'azajbs@gmail.com';

export default function AdminPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [stats, setStats] = useState({
    profilesCount: null,
    conversationsCount: null,
  });
  const [latestProfiles, setLatestProfiles] = useState([]);

  // Gestion des crédits Push Éclair
  const [pushEclairSection, setPushEclairSection] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [creditsToAdd, setCreditsToAdd] = useState(1);
  const [creditsAction, setCreditsAction] = useState('add'); // 'add' ou 'set'
  const [creditsLoading, setCreditsLoading] = useState(false);
  const [creditsMessage, setCreditsMessage] = useState('');

  // Section création de profils bash
  const [bashProfileSection, setBashProfileSection] = useState(false);
  const [bashProfiles, setBashProfiles] = useState([]);
  const [bashLoading, setBashLoading] = useState(false);
  const [bashMessage, setBashMessage] = useState('');
  const [bashForm, setBashForm] = useState({
    display_name: '',
    gender: 'woman',
    city: 'Paris',
    main_intent: 'casual',
    bio: '',
    age: 25,
    lat: 48.8566,
    lng: 2.3522,
  });
  const [selectedBashProfile, setSelectedBashProfile] = useState(null);
  const [bashMessages, setBashMessages] = useState([]);
  const [bashMessagesLoading, setBashMessagesLoading] = useState(false);

  useEffect(() => {
    async function init() {
      setLoading(true);
      setErrorMsg('');

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setLoading(false);
        router.replace('/login');
        return;
      }

      if (user.email !== ADMIN_EMAIL) {
        setLoading(false);
        router.replace('/');
        return;
      }

      setIsAdmin(true);

      try {
        const [
          { count: profilesCount, error: profErr },
          { count: convCount, error: convErr },
          { data: latest, error: latestErr },
        ] = await Promise.all([
          supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true }),
          supabase
            .from('conversations')
            .select('id', { count: 'exact', head: true }),
          supabase
            .from('profiles')
            .select('id, display_name, city, gender, main_intent, created_at, push_eclair_credits')
            .order('created_at', { ascending: false })
            .limit(10),
        ]);

        if (profErr || convErr || latestErr) {
          setErrorMsg(
            profErr?.message || convErr?.message || latestErr?.message
          );
        }

        setStats({
          profilesCount: profilesCount ?? 0,
          conversationsCount: convCount ?? 0,
        });
        setLatestProfiles(latest || []);
      } catch (err) {
        console.error(err);
        setErrorMsg('Erreur lors du chargement des données admin.');
      }

      setLoading(false);
    }

    init();
  }, [router]);

  async function handleSearchUsers() {
    if (!searchQuery.trim()) return;

    setSearchLoading(true);
    setSearchResults([]);
    setSelectedProfile(null);
    setCreditsMessage('');

    try {
      const query = searchQuery.trim();
      
      // Rechercher par display_name
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, display_name, city, push_eclair_credits, user_id')
        .ilike('display_name', `%${query}%`)
        .limit(20);

      if (error) {
        setCreditsMessage('Erreur : ' + error.message);
        setSearchLoading(false);
        return;
      }

      setSearchResults(profiles || []);
      
      if ((profiles || []).length === 0) {
        setCreditsMessage('Aucun profil trouvé avec ce pseudo.');
      }
    } catch (err) {
      setCreditsMessage('Erreur lors de la recherche : ' + err.message);
    }

    setSearchLoading(false);
  }

  // === Fonctions Profils Bash ===
  async function loadBashProfiles() {
    setBashLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, user_id, display_name, city, gender, main_intent, created_at, bio, is_bash_profile')
      .eq('is_bash_profile', true)
      .order('created_at', { ascending: false });
    
    if (error) {
      setBashMessage('Erreur: ' + error.message);
    } else {
      setBashProfiles(data || []);
    }
    setBashLoading(false);
  }

  async function createBashProfile() {
    if (!bashForm.display_name.trim()) {
      setBashMessage('Le pseudo est obligatoire.');
      return;
    }
    
    setBashLoading(true);
    setBashMessage('');
    
    try {
      // Créer un UUID fictif pour le user_id (pas de compte auth réel)
      const fakeUserId = crypto.randomUUID();
      
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          user_id: fakeUserId,
          display_name: bashForm.display_name.trim(),
          gender: bashForm.gender,
          city: bashForm.city,
          main_intent: bashForm.main_intent,
          bio: bashForm.bio,
          age: bashForm.age,
          lat: bashForm.lat,
          lng: bashForm.lng,
          is_bash_profile: true,
          is_online: false,
          push_eclair_credits: 0,
        })
        .select()
        .single();
      
      if (error) {
        setBashMessage('Erreur création: ' + error.message);
      } else {
        setBashMessage(`✅ Profil "${bashForm.display_name}" créé avec succès !`);
        setBashProfiles(prev => [data, ...prev]);
        setBashForm({
          display_name: '',
          gender: 'woman',
          city: 'Paris',
          main_intent: 'casual',
          bio: '',
          age: 25,
          lat: 48.8566,
          lng: 2.3522,
        });
      }
    } catch (err) {
      setBashMessage('Erreur: ' + err.message);
    }
    
    setBashLoading(false);
  }

  async function deleteBashProfile(profileId) {
    if (!confirm('Supprimer ce profil bash ?')) return;
    
    setBashLoading(true);
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', profileId)
      .eq('is_bash_profile', true);
    
    if (error) {
      setBashMessage('Erreur suppression: ' + error.message);
    } else {
      setBashProfiles(prev => prev.filter(p => p.id !== profileId));
      setBashMessage('✅ Profil supprimé.');
      if (selectedBashProfile?.id === profileId) {
        setSelectedBashProfile(null);
        setBashMessages([]);
      }
    }
    setBashLoading(false);
  }

  async function loadBashProfileMessages(profile) {
    setSelectedBashProfile(profile);
    setBashMessagesLoading(true);
    setBashMessages([]);
    
    // Récupérer les conversations où ce profil est participant
    const { data: convs, error: convErr } = await supabase
      .from('conversations')
      .select('id, user_id_1, user_id_2, is_group, name')
      .or(`user_id_1.eq.${profile.user_id},user_id_2.eq.${profile.user_id}`);
    
    if (convErr || !convs || convs.length === 0) {
      setBashMessagesLoading(false);
      return;
    }
    
    // Récupérer les messages de ces conversations
    const convIds = convs.map(c => c.id);
    const { data: msgs, error: msgsErr } = await supabase
      .from('messages')
      .select('id, conversation_id, sender_id, content, created_at')
      .in('conversation_id', convIds)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (!msgsErr && msgs) {
      // Enrichir avec les infos de l'autre utilisateur
      const enrichedMsgs = await Promise.all(msgs.map(async (msg) => {
        const conv = convs.find(c => c.id === msg.conversation_id);
        const otherUserId = conv?.user_id_1 === profile.user_id 
          ? conv?.user_id_2 
          : conv?.user_id_1;
        
        let otherProfile = null;
        if (otherUserId) {
          const { data: op } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('user_id', otherUserId)
            .maybeSingle();
          otherProfile = op;
        }
        
        return {
          ...msg,
          isMine: msg.sender_id === profile.user_id,
          otherDisplayName: otherProfile?.display_name || 'Inconnu',
        };
      }));
      
      setBashMessages(enrichedMsgs);
    }
    
    setBashMessagesLoading(false);
  }

  async function sendBashMessage(conversationId, content) {
    if (!selectedBashProfile || !content.trim()) return;
    
    const { error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: selectedBashProfile.user_id,
        content: content.trim(),
      });
    
    if (error) {
      setBashMessage('Erreur envoi: ' + error.message);
    } else {
      // Recharger les messages
      loadBashProfileMessages(selectedBashProfile);
    }
  }

  async function handleUpdateCredits() {
    if (!selectedProfile || creditsToAdd < 0) return;

    setCreditsLoading(true);
    setCreditsMessage('');

    try {
      const currentCredits = selectedProfile.push_eclair_credits || 0;
      const newCredits =
        creditsAction === 'add'
          ? currentCredits + creditsToAdd
          : creditsToAdd;

      const { error } = await supabase
        .from('profiles')
        .update({ push_eclair_credits: newCredits })
        .eq('id', selectedProfile.id);

      if (error) {
        setCreditsMessage('Erreur : ' + error.message);
        setCreditsLoading(false);
        return;
      }

      // Mettre à jour le profil sélectionné
      setSelectedProfile({
        ...selectedProfile,
        push_eclair_credits: newCredits,
      });

      // Mettre à jour aussi dans la liste des résultats
      setSearchResults((prev) =>
        prev.map((p) =>
          p.id === selectedProfile.id
            ? { ...p, push_eclair_credits: newCredits }
            : p
        )
      );

      // Mettre à jour dans latestProfiles si présent
      setLatestProfiles((prev) =>
        prev.map((p) =>
          p.id === selectedProfile.id
            ? { ...p, push_eclair_credits: newCredits }
            : p
        )
      );

      setCreditsMessage(
        `✅ ${creditsAction === 'add' ? 'Ajout' : 'Mise à jour'} effectué ! Nouveau total : ${newCredits} crédit(s)`
      );
    } catch (err) {
      setCreditsMessage('Erreur : ' + err.message);
    }

    setCreditsLoading(false);
  }

  if (loading) {
    return <main>Chargement de l’espace admin…</main>;
  }

  if (!isAdmin) {
    return (
      <main>
        <p>Accès refusé.</p>
      </main>
    );
  }

  return (
    <main
      style={{
        maxWidth: 960,
        margin: '0 auto',
        padding: '16px 12px 40px',
      }}
    >
      <button
        type="button"
        onClick={() => router.push('/')}
        style={{
          marginBottom: 12,
          fontSize: 13,
          padding: '4px 10px',
          backgroundImage: 'linear-gradient(135deg,#4b5563,#020617)',
          color: '#e5e7eb',
        }}
      >
        ← Retour à l’app
      </button>

      <h1 style={{ marginBottom: 6 }}>Admin ManyLovr</h1>
      <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 16 }}>
        Cet espace est visible uniquement pour le compte {ADMIN_EMAIL}. De
        nouvelles fonctionnalités (modération, statistiques détaillées, gestion
        des groupes et des chats en ligne à plusieurs) seront ajoutées ici plus
        tard.
      </p>

      {errorMsg && (
        <p style={{ color: 'tomato', marginBottom: 12, fontSize: 13 }}>
          {errorMsg}
        </p>
      )}

      {/* Bloc stats globales */}
      <section
        className="card"
        style={{
          marginBottom: 16,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
        }}
      >
        <div
          style={{
            padding: '10px 12px',
            borderRadius: 10,
            border: '1px solid #1f2937',
            backgroundColor: '#020617',
          }}
        >
          <h2 style={{ fontSize: 14, marginBottom: 4 }}>Profils</h2>
          <p style={{ fontSize: 24, fontWeight: 'bold' }}>
            {stats.profilesCount ?? '—'}
          </p>
          <p style={{ fontSize: 12, color: '#9ca3af' }}>
            Nombre total de profils dans la table profiles.
          </p>
        </div>

        <div
          style={{
            padding: '10px 12px',
            borderRadius: 10,
            border: '1px solid #1f2937',
            backgroundColor: '#020617',
          }}
        >
          <h2 style={{ fontSize: 14, marginBottom: 4 }}>Conversations</h2>
          <p style={{ fontSize: 24, fontWeight: 'bold' }}>
            {stats.conversationsCount ?? '—'}
          </p>
          <p style={{ fontSize: 12, color: '#9ca3af' }}>
            Nombre total de conversations dans la table conversations.
          </p>
        </div>
      </section>

      {/* Section gestion Push Éclair */}
      <section className="card" style={{ marginBottom: 16 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <h2 style={{ fontSize: 15, margin: 0 }}>
            💥 Gestion des crédits Push Éclair
          </h2>
          <button
            type="button"
            onClick={() => setPushEclairSection(!pushEclairSection)}
            className="btn-primary"
            style={{ fontSize: 12, padding: '6px 12px' }}
          >
            {pushEclairSection ? 'Masquer' : 'Afficher'}
          </button>
        </div>

        {pushEclairSection && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Recherche d'utilisateur */}
            <div>
              <label style={{ fontSize: 13, marginBottom: 6, display: 'block' }}>
                Rechercher un utilisateur par pseudo
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Entrer un pseudo..."
                  style={{ flex: 1 }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearchUsers();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleSearchUsers}
                  disabled={searchLoading || !searchQuery.trim()}
                  className="btn-primary"
                  style={{ fontSize: 12, padding: '6px 12px' }}
                >
                  {searchLoading ? 'Recherche…' : 'Rechercher'}
                </button>
              </div>
            </div>

            {/* Message de recherche */}
            {creditsMessage && !creditsMessage.startsWith('✅') && (
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                {creditsMessage}
              </p>
            )}

            {/* Résultats de recherche */}
            {searchResults.length > 0 && (
              <div
                style={{
                  maxHeight: '200px',
                  overflowY: 'auto',
                  border: '1px solid var(--color-border)',
                  borderRadius: 8,
                  padding: 8,
                }}
              >
                {searchResults.map((profile) => (
                  <div
                    key={profile.id}
                    style={{
                      padding: '8px',
                      borderRadius: 6,
                      marginBottom: 4,
                      border: '1px solid var(--color-border)',
                      background:
                        selectedProfile?.id === profile.id
                          ? 'rgba(168, 85, 247, 0.1)'
                          : 'var(--color-bg-card)',
                      cursor: 'pointer',
                    }}
                    onClick={() => setSelectedProfile(profile)}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600 }}>
                      {profile.display_name || 'Sans pseudo'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                      {profile.city || 'Ville non renseignée'} • Crédits actuels: <strong>{profile.push_eclair_credits || 0}</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Gestion des crédits pour le profil sélectionné */}
            {selectedProfile && (
              <div
                className="card"
                style={{
                  padding: '16px',
                  background: 'rgba(168, 85, 247, 0.05)',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                }}
              >
                <h3 style={{ fontSize: 14, marginBottom: 12 }}>
                  Gérer les crédits de {selectedProfile.display_name || 'cet utilisateur'}
                </h3>

                <div style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                    Crédits actuels : <strong>{selectedProfile.push_eclair_credits || 0}</strong>
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 13, marginBottom: 6, display: 'block' }}>
                      Action
                    </label>
                    <select
                      value={creditsAction}
                      onChange={(e) => setCreditsAction(e.target.value)}
                      style={{ width: '100%' }}
                    >
                      <option value="add">Ajouter des crédits</option>
                      <option value="set">Définir le nombre exact</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 13, marginBottom: 6, display: 'block' }}>
                      {creditsAction === 'add' ? 'Nombre de crédits à ajouter' : 'Nombre de crédits'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={creditsToAdd}
                      onChange={(e) => setCreditsToAdd(Number(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </div>

                  {creditsAction === 'add' && (
                    <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                      Nouveau total : {selectedProfile.push_eclair_credits || 0} + {creditsToAdd} ={' '}
                      {(selectedProfile.push_eclair_credits || 0) + creditsToAdd}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={handleUpdateCredits}
                    disabled={creditsLoading || creditsToAdd < 0}
                    className="btn-primary"
                    style={{ alignSelf: 'flex-start' }}
                  >
                    {creditsLoading
                      ? 'Mise à jour…'
                      : creditsAction === 'add'
                      ? `Ajouter ${creditsToAdd} crédit(s)`
                      : `Définir à ${creditsToAdd} crédit(s)`}
                  </button>
                </div>

                {creditsMessage && (
                  <p
                    style={{
                      marginTop: 12,
                      fontSize: 13,
                      color: creditsMessage.startsWith('✅') ? '#10b981' : 'tomato',
                    }}
                  >
                    {creditsMessage}
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setSelectedProfile(null);
                    setCreditsMessage('');
                    setCreditsToAdd(1);
                  }}
                  className="btn-outline"
                  style={{ marginTop: 12, fontSize: 12, padding: '6px 12px' }}
                >
                  Choisir un autre utilisateur
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Section création de profils bash */}
      <section className="card" style={{ marginBottom: 16 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <h2 style={{ fontSize: 15, margin: 0 }}>
            🤖 Création de profils Bash
          </h2>
          <button
            type="button"
            onClick={() => {
              setBashProfileSection(!bashProfileSection);
              if (!bashProfileSection) loadBashProfiles();
            }}
            className="btn-primary"
            style={{ fontSize: 12, padding: '6px 12px' }}
          >
            {bashProfileSection ? 'Masquer' : 'Afficher'}
          </button>
        </div>

        {bashProfileSection && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Formulaire de création */}
            <div
              style={{
                padding: 16,
                borderRadius: 12,
                background: 'rgba(16, 185, 129, 0.05)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
              }}
            >
              <h3 style={{ fontSize: 14, marginBottom: 12 }}>Créer un nouveau profil</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Pseudo *</label>
                  <input
                    type="text"
                    value={bashForm.display_name}
                    onChange={(e) => setBashForm(prev => ({ ...prev, display_name: e.target.value }))}
                    placeholder="Ex: Sophie_Paris"
                    style={{ width: '100%' }}
                  />
                </div>
                
                <div>
                  <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Genre</label>
                  <select
                    value={bashForm.gender}
                    onChange={(e) => setBashForm(prev => ({ ...prev, gender: e.target.value }))}
                    style={{ width: '100%' }}
                  >
                    <option value="woman">Femme</option>
                    <option value="man">Homme</option>
                    <option value="couple">Couple</option>
                    <option value="other">Autre</option>
                  </select>
                </div>
                
                <div>
                  <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Ville</label>
                  <input
                    type="text"
                    value={bashForm.city}
                    onChange={(e) => setBashForm(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Ex: Paris"
                    style={{ width: '100%' }}
                  />
                </div>
                
                <div>
                  <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Âge</label>
                  <input
                    type="number"
                    min={18}
                    max={99}
                    value={bashForm.age}
                    onChange={(e) => setBashForm(prev => ({ ...prev, age: Number(e.target.value) }))}
                    style={{ width: '100%' }}
                  />
                </div>
                
                <div>
                  <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Intention</label>
                  <select
                    value={bashForm.main_intent}
                    onChange={(e) => setBashForm(prev => ({ ...prev, main_intent: e.target.value }))}
                    style={{ width: '100%' }}
                  >
                    <option value="casual">Casual</option>
                    <option value="serious">Sérieux</option>
                    <option value="friendship">Amitié</option>
                    <option value="open">Ouvert</option>
                  </select>
                </div>
                
                <div>
                  <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={bashForm.lat}
                    onChange={(e) => setBashForm(prev => ({ ...prev, lat: parseFloat(e.target.value) }))}
                    style={{ width: '100%' }}
                  />
                </div>
                
                <div>
                  <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={bashForm.lng}
                    onChange={(e) => setBashForm(prev => ({ ...prev, lng: parseFloat(e.target.value) }))}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
              
              <div style={{ marginTop: 12 }}>
                <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Bio</label>
                <textarea
                  value={bashForm.bio}
                  onChange={(e) => setBashForm(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Description du profil..."
                  rows={3}
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>
              
              <button
                type="button"
                onClick={createBashProfile}
                disabled={bashLoading || !bashForm.display_name.trim()}
                className="btn-success"
                style={{ marginTop: 12, fontSize: 13 }}
              >
                {bashLoading ? 'Création...' : '+ Créer le profil bash'}
              </button>
            </div>

            {bashMessage && (
              <p style={{
                fontSize: 13,
                color: bashMessage.startsWith('✅') ? '#10b981' : 'tomato',
              }}>
                {bashMessage}
              </p>
            )}

            {/* Liste des profils bash existants */}
            <div>
              <h3 style={{ fontSize: 14, marginBottom: 8 }}>
                Profils bash existants ({bashProfiles.length})
              </h3>
              
              {bashProfiles.length === 0 ? (
                <p style={{ fontSize: 13, color: '#9ca3af' }}>Aucun profil bash créé.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {bashProfiles.map((bp) => (
                    <div
                      key={bp.id}
                      style={{
                        padding: 12,
                        borderRadius: 8,
                        background: selectedBashProfile?.id === bp.id
                          ? 'rgba(168, 85, 247, 0.1)'
                          : 'var(--color-bg-card)',
                        border: '1px solid var(--color-border)',
                        cursor: 'pointer',
                      }}
                      onClick={() => loadBashProfileMessages(bp)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong style={{ fontSize: 14 }}>{bp.display_name}</strong>
                          <span style={{
                            marginLeft: 8,
                            padding: '2px 6px',
                            borderRadius: 4,
                            background: 'rgba(16, 185, 129, 0.2)',
                            color: '#10b981',
                            fontSize: 10,
                          }}>
                            BASH
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteBashProfile(bp.id);
                          }}
                          className="btn-danger"
                          style={{ fontSize: 11, padding: '4px 8px' }}
                        >
                          Supprimer
                        </button>
                      </div>
                      <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                        {bp.city} • {bp.gender} • {bp.main_intent}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Messages reçus par le profil bash sélectionné */}
            {selectedBashProfile && (
              <div
                style={{
                  padding: 16,
                  borderRadius: 12,
                  background: 'rgba(59, 130, 246, 0.05)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                }}
              >
                <h3 style={{ fontSize: 14, marginBottom: 12 }}>
                  📬 Messages de {selectedBashProfile.display_name}
                </h3>
                
                {bashMessagesLoading ? (
                  <p style={{ fontSize: 13, color: '#9ca3af' }}>Chargement...</p>
                ) : bashMessages.length === 0 ? (
                  <p style={{ fontSize: 13, color: '#9ca3af' }}>Aucun message.</p>
                ) : (
                  <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {bashMessages.map((msg) => (
                      <div
                        key={msg.id}
                        style={{
                          padding: 10,
                          borderRadius: 8,
                          background: msg.isMine
                            ? 'rgba(168, 85, 247, 0.1)'
                            : 'rgba(255, 255, 255, 0.05)',
                          borderLeft: msg.isMine
                            ? '3px solid #a855f7'
                            : '3px solid #3b82f6',
                        }}
                      >
                        <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>
                          {msg.isMine ? `→ Envoyé à ${msg.otherDisplayName}` : `← Reçu de ${msg.otherDisplayName}`}
                          <span style={{ marginLeft: 8 }}>
                            {new Date(msg.created_at).toLocaleString('fr-FR')}
                          </span>
                        </div>
                        <p style={{ fontSize: 13, margin: 0 }}>{msg.content}</p>
                        
                        {!msg.isMine && (
                          <div style={{ marginTop: 8 }}>
                            <input
                              type="text"
                              placeholder="Répondre..."
                              style={{ fontSize: 12, padding: '6px 10px', width: '70%' }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && e.target.value.trim()) {
                                  sendBashMessage(msg.conversation_id, e.target.value);
                                  e.target.value = '';
                                }
                              }}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Bloc derniers profils */}
      <section className="card">
        <h2 style={{ fontSize: 15, marginBottom: 8 }}>
          Derniers profils créés
        </h2>
        {latestProfiles.length === 0 ? (
          <p style={{ fontSize: 13, color: '#9ca3af' }}>
            Aucun profil trouvé pour le moment.
          </p>
        ) : (
          <div
            style={{
              maxHeight: '50vh',
              overflowY: 'auto',
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 12,
              }}
            >
              <thead>
                <tr
                  style={{
                    textAlign: 'left',
                    borderBottom: '1px solid #1f2937',
                  }}
                >
                  <th style={{ padding: '6px 4px' }}>Pseudo</th>
                  <th style={{ padding: '6px 4px' }}>Ville</th>
                  <th style={{ padding: '6px 4px' }}>Genre</th>
                  <th style={{ padding: '6px 4px' }}>Intention</th>
                  <th style={{ padding: '6px 4px' }}>Push Éclair</th>
                  <th style={{ padding: '6px 4px' }}>Créé le</th>
                </tr>
              </thead>
              <tbody>
                {latestProfiles.map((p) => (
                  <tr
                    key={p.id}
                    style={{
                      borderBottom: '1px solid #0f172a',
                    }}
                  >
                    <td style={{ padding: '6px 4px' }}>
                      {p.display_name || 'Sans pseudo'}
                    </td>
                    <td style={{ padding: '6px 4px' }}>{p.city || '—'}</td>
                    <td style={{ padding: '6px 4px' }}>{p.gender || '—'}</td>
                    <td style={{ padding: '6px 4px' }}>
                      {p.main_intent || '—'}
                    </td>
                    <td style={{ padding: '6px 4px' }}>
                      {p.push_eclair_credits ?? 0}
                    </td>
                    <td style={{ padding: '6px 4px', whiteSpace: 'nowrap' }}>
                      {p.created_at
                        ? new Date(p.created_at).toLocaleString()
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

