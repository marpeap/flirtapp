  return (
    <main>
      <button onClick={() => router.push('/profiles')}>← Retour</button>

      <div className="list-card-item" style={{ marginTop: 16 }}>
        <h1 style={{ marginBottom: 12 }}>{profile.display_name}</h1>
        <p>Ville : {profile.city || 'Non renseignée'}</p>
        <p>Genre : {profile.gender || '-'}</p>
        <p>Intention : {profile.main_intent || '-'}</p>
        {profile.bio && <p style={{ marginTop: 8 }}>À propos : {profile.bio}</p>}
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

