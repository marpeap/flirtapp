'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function GroupMeetupsSection({ conversationId, userId, isGroup }) {
  const [meetups, setMeetups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [showProposeForm, setShowProposeForm] = useState(false);
  const [proposing, setProposing] = useState(false);

  // Formulaire de proposition
  const [proposedDate, setProposedDate] = useState('');
  const [proposedTime, setProposedTime] = useState('');
  const [proposedLocation, setProposedLocation] = useState('');
  const [proposedLocationDetails, setProposedLocationDetails] = useState('');

  useEffect(() => {
    if (!conversationId || !isGroup) return;
    loadMeetups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, isGroup]);

  async function loadMeetups() {
    if (!conversationId) return;
    // #region agent log
    const loadStartTime = Date.now();
    fetch('http://127.0.0.1:7244/ingest/b52ac800-6cee-4c21-a14d-e8a882350bc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GroupMeetupsSection.js:25',message:'Loading group meetups',data:{conversationId,isGroup},timestamp:loadStartTime,sessionId:'debug-session',runId:'groups',hypothesisId:'G4'})}).catch(()=>{});
    // #endregion
    setLoading(true);
    setErrorMsg('');

    const { data, error } = await supabase
      .from('group_meetups')
      .select(
        `
        *,
        responses:group_meetup_responses (
          id,
          user_id,
          response_type,
          counter_date,
          counter_location,
          counter_location_details,
          message,
          created_at
        )
      `
      )
      .eq('conversation_id', conversationId)
      .in('status', ['pending', 'confirmed'])
      .order('created_at', { ascending: false });

    // #region agent log
    const loadEndTime = Date.now();
    if (error) {
      fetch('http://127.0.0.1:7244/ingest/b52ac800-6cee-4c21-a14d-e8a882350bc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GroupMeetupsSection.js:51',message:'Error loading group meetups',data:{errorCode:error.code,errorMessage:error.message,errorDetails:error.details||null,conversationId,isTableMissing:error.code==='PGRST116'||error.message?.includes('does not exist'),duration:loadEndTime-loadStartTime},timestamp:loadEndTime,sessionId:'debug-session',runId:'groups',hypothesisId:'G4'})}).catch(()=>{});
    } else {
      fetch('http://127.0.0.1:7244/ingest/b52ac800-6cee-4c21-a14d-e8a882350bc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GroupMeetupsSection.js:51',message:'Group meetups loaded successfully',data:{meetupCount:data?.length||0,conversationId,duration:loadEndTime-loadStartTime},timestamp:loadEndTime,sessionId:'debug-session',runId:'groups',hypothesisId:'G4'})}).catch(()=>{});
    }
    // #endregion
    if (error) {
      // Si les tables n'existent pas encore, afficher un message clair
      if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
        setErrorMsg(
          'Les tables de rendez-vous ne sont pas encore configurées. Exécute le SQL_MEETUPS_RENDEZVOUS.sql dans Supabase.'
        );
      } else {
        setErrorMsg(error.message);
      }
      setMeetups([]);
    } else {
      // Trier : confirmés en premier, puis par date
      const sorted = (data || []).sort((a, b) => {
        if (a.status === 'confirmed' && b.status !== 'confirmed') return -1;
        if (a.status !== 'confirmed' && b.status === 'confirmed') return 1;
        const dateA = new Date(a.confirmed_date || a.proposed_date);
        const dateB = new Date(b.confirmed_date || b.proposed_date);
        return dateA - dateB;
      });
      setMeetups(sorted);
    }
    setLoading(false);
  }

  async function handleProposeMeetup(e) {
    e.preventDefault();
    if (!userId || !conversationId || !proposedDate || !proposedTime || !proposedLocation) {
      setErrorMsg('Remplis tous les champs obligatoires.');
      return;
    }

    // #region agent log
    const proposeStartTime = Date.now();
    const dateTime = new Date(`${proposedDate}T${proposedTime}`);
    fetch('http://127.0.0.1:7244/ingest/b52ac800-6cee-4c21-a14d-e8a882350bc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GroupMeetupsSection.js:75',message:'Proposing group meetup',data:{conversationId,userId:userId?.substring(0,8)||null,proposedDate:dateTime.toISOString(),hasLocation:!!proposedLocation},timestamp:proposeStartTime,sessionId:'debug-session',runId:'groups',hypothesisId:'G5'})}).catch(()=>{});
    // #endregion
    setProposing(true);
    setErrorMsg('');

    // Combiner date et heure
    const { data, error } = await supabase.rpc('propose_group_meetup', {
      p_conversation_id: conversationId,
      p_proposer_user_id: userId,
      p_proposed_date: dateTime.toISOString(),
      p_proposed_location: proposedLocation.trim(),
      p_proposed_location_details: proposedLocationDetails.trim() || null,
    });

    // #region agent log
    const proposeEndTime = Date.now();
    if (error) {
      fetch('http://127.0.0.1:7244/ingest/b52ac800-6cee-4c21-a14d-e8a882350bc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GroupMeetupsSection.js:98',message:'Error proposing group meetup',data:{errorCode:error.code,errorMessage:error.message,errorDetails:error.details||null,conversationId,duration:proposeEndTime-proposeStartTime},timestamp:proposeEndTime,sessionId:'debug-session',runId:'groups',hypothesisId:'G5'})}).catch(()=>{});
    } else {
      fetch('http://127.0.0.1:7244/ingest/b52ac800-6cee-4c21-a14d-e8a882350bc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GroupMeetupsSection.js:98',message:'Group meetup proposed successfully',data:{meetupId:data||null,conversationId,duration:proposeEndTime-proposeStartTime},timestamp:proposeEndTime,sessionId:'debug-session',runId:'groups',hypothesisId:'G5'})}).catch(()=>{});
    }
    // #endregion
    setProposing(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    // Réinitialiser le formulaire
    setProposedDate('');
    setProposedTime('');
    setProposedLocation('');
    setProposedLocationDetails('');
    setShowProposeForm(false);

    // Recharger les rendez-vous
    await loadMeetups();
  }

  if (!isGroup) return null;

  return (
    <div
      className="card"
      style={{
        marginBottom: 16,
        padding: '16px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <h2 style={{ fontSize: 16, margin: 0 }}>Rendez-vous du groupe</h2>
        <button
          type="button"
          onClick={() => setShowProposeForm(!showProposeForm)}
          className="btn-primary"
          style={{ fontSize: 12, padding: '6px 12px' }}
        >
          {showProposeForm ? 'Annuler' : '+ Proposer un rendez-vous'}
        </button>
      </div>

      {showProposeForm && (
        <form
          onSubmit={handleProposeMeetup}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            padding: '12px',
            borderRadius: '12px',
            border: '1px solid rgba(168, 85, 247, 0.2)',
            background: 'rgba(168, 85, 247, 0.05)',
            marginBottom: 16,
          }}
        >
          <div>
            <label style={{ fontSize: 13, marginBottom: 4, display: 'block' }}>
              Date <span style={{ color: 'var(--color-error)' }}>*</span>
            </label>
            <input
              type="date"
              value={proposedDate}
              onChange={(e) => setProposedDate(e.target.value)}
              required
              min={new Date().toISOString().split('T')[0]}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ fontSize: 13, marginBottom: 4, display: 'block' }}>
              Heure <span style={{ color: 'var(--color-error)' }}>*</span>
            </label>
            <input
              type="time"
              value={proposedTime}
              onChange={(e) => setProposedTime(e.target.value)}
              required
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ fontSize: 13, marginBottom: 4, display: 'block' }}>
              Lieu <span style={{ color: 'var(--color-error)' }}>*</span>
            </label>
            <input
              type="text"
              value={proposedLocation}
              onChange={(e) => setProposedLocation(e.target.value)}
              placeholder="Ex: Café des Arts, Paris"
              required
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ fontSize: 13, marginBottom: 4, display: 'block' }}>
              Détails du lieu (optionnel)
            </label>
            <textarea
              value={proposedLocationDetails}
              onChange={(e) => setProposedLocationDetails(e.target.value)}
              placeholder="Adresse complète, instructions pour trouver le lieu, etc."
              rows={2}
              style={{ width: '100%', resize: 'none' }}
            />
          </div>

          <button
            type="submit"
            disabled={proposing}
            className="btn-primary"
            style={{ alignSelf: 'flex-start' }}
          >
            {proposing ? 'Proposition…' : 'Proposer ce rendez-vous'}
          </button>
        </form>
      )}

      {errorMsg && (
        <p style={{ color: 'var(--color-error)', fontSize: 13, marginBottom: 12 }}>
          {errorMsg}
        </p>
      )}

      {loading ? (
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
          Chargement des rendez-vous…
        </p>
      ) : meetups.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
          Aucun rendez-vous proposé pour le moment.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {meetups.map((meetup) => (
            <MeetupCard
              key={meetup.id}
              meetup={meetup}
              userId={userId}
              conversationId={conversationId}
              onUpdate={loadMeetups}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MeetupCard({ meetup, userId, conversationId, onUpdate }) {
  const [responding, setResponding] = useState(false);
  const [showCounterForm, setShowCounterForm] = useState(false);
  const [myResponse, setMyResponse] = useState(null);

  // État pour contre-proposition
  const [counterDate, setCounterDate] = useState('');
  const [counterTime, setCounterTime] = useState('');
  const [counterLocation, setCounterLocation] = useState('');
  const [counterLocationDetails, setCounterLocationDetails] = useState('');
  const [counterMessage, setCounterMessage] = useState('');

  useEffect(() => {
    // Trouver ma réponse
    const response = meetup.responses?.find((r) => r.user_id === userId);
    setMyResponse(response || null);
  }, [meetup.responses, userId]);

  const proposedDateTime = new Date(meetup.proposed_date);
  const confirmedDateTime = meetup.confirmed_date
    ? new Date(meetup.confirmed_date)
    : null;
  const displayDate = confirmedDateTime || proposedDateTime;

  const isConfirmed = meetup.status === 'confirmed';
  const isMine = meetup.proposer_user_id === userId;

  async function handleRespond(responseType) {
    if (!userId) return;
    // #region agent log
    const respondStartTime = Date.now();
    let counterDateValue = null;
    if (responseType === 'counter_proposal' && counterDate && counterTime) {
      counterDateValue = new Date(`${counterDate}T${counterTime}`).toISOString();
    }
    fetch('http://127.0.0.1:7244/ingest/b52ac800-6cee-4c21-a14d-e8a882350bc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GroupMeetupsSection.js:280',message:'Responding to group meetup',data:{meetupId:meetup.id,userId:userId?.substring(0,8)||null,responseType,hasCounterProposal:responseType==='counter_proposal'},timestamp:respondStartTime,sessionId:'debug-session',runId:'groups',hypothesisId:'G6'})}).catch(()=>{});
    // #endregion
    setResponding(true);

    const { error } = await supabase.rpc('respond_to_meetup', {
      p_meetup_id: meetup.id,
      p_user_id: userId,
      p_response_type: responseType,
      p_counter_date: counterDateValue,
      p_counter_location: counterLocation.trim() || null,
      p_counter_location_details: counterLocationDetails.trim() || null,
      p_message: counterMessage.trim() || null,
    });

    // #region agent log
    const respondEndTime = Date.now();
    if (error) {
      fetch('http://127.0.0.1:7244/ingest/b52ac800-6cee-4c21-a14d-e8a882350bc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GroupMeetupsSection.js:299',message:'Error responding to meetup',data:{errorCode:error.code,errorMessage:error.message,errorDetails:error.details||null,meetupId:meetup.id,responseType,duration:respondEndTime-respondStartTime},timestamp:respondEndTime,sessionId:'debug-session',runId:'groups',hypothesisId:'G6'})}).catch(()=>{});
    } else {
      fetch('http://127.0.0.1:7244/ingest/b52ac800-6cee-4c21-a14d-e8a882350bc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GroupMeetupsSection.js:299',message:'Meetup response sent successfully',data:{meetupId:meetup.id,responseType,duration:respondEndTime-respondStartTime},timestamp:respondEndTime,sessionId:'debug-session',runId:'groups',hypothesisId:'G6'})}).catch(()=>{});
    }
    // #endregion
    setResponding(false);

    if (error) {
      alert('Erreur : ' + error.message);
      return;
    }

    setShowCounterForm(false);
    setCounterDate('');
    setCounterTime('');
    setCounterLocation('');
    setCounterLocationDetails('');
    setCounterMessage('');
    onUpdate();
  }

  async function handleAcceptCounter(counterUserId) {
    if (!userId || meetup.proposer_user_id !== userId) return;

    // #region agent log
    const acceptStartTime = Date.now();
    fetch('http://127.0.0.1:7244/ingest/b52ac800-6cee-4c21-a14d-e8a882350bc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GroupMeetupsSection.js:315',message:'Accepting counter proposal',data:{meetupId:meetup.id,counterUserId:counterUserId?.substring(0,8)||null,userId:userId?.substring(0,8)||null},timestamp:acceptStartTime,sessionId:'debug-session',runId:'groups',hypothesisId:'G7'})}).catch(()=>{});
    // #endregion

    const { error } = await supabase.rpc('accept_counter_proposal', {
      p_meetup_id: meetup.id,
      p_counter_user_id: counterUserId,
    });

    // #region agent log
    const acceptEndTime = Date.now();
    if (error) {
      fetch('http://127.0.0.1:7244/ingest/b52ac800-6cee-4c21-a14d-e8a882350bc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GroupMeetupsSection.js:323',message:'Error accepting counter proposal',data:{errorCode:error.code,errorMessage:error.message,errorDetails:error.details||null,meetupId:meetup.id,duration:acceptEndTime-acceptStartTime},timestamp:acceptEndTime,sessionId:'debug-session',runId:'groups',hypothesisId:'G7'})}).catch(()=>{});
    } else {
      fetch('http://127.0.0.1:7244/ingest/b52ac800-6cee-4c21-a14d-e8a882350bc6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GroupMeetupsSection.js:323',message:'Counter proposal accepted successfully',data:{meetupId:meetup.id,duration:acceptEndTime-acceptStartTime},timestamp:acceptEndTime,sessionId:'debug-session',runId:'groups',hypothesisId:'G7'})}).catch(()=>{});
    }
    // #endregion

    if (error) {
      alert('Erreur : ' + error.message);
      return;
    }

    onUpdate();
  }

  return (
    <div
      className="card"
      style={{
        border: isConfirmed
          ? '1px solid var(--color-success)'
          : '1px solid var(--color-border)',
        background: isConfirmed
          ? 'rgba(16, 185, 129, 0.1)'
          : 'var(--color-bg-card)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 8,
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 6,
            }}
          >
            <span style={{ fontSize: 18 }}>
              {isConfirmed ? '✅' : '📅'}
            </span>
            <strong style={{ fontSize: 14 }}>
              {isConfirmed ? 'Rendez-vous confirmé' : 'Rendez-vous proposé'}
            </strong>
            {isConfirmed && (
              <span className="badge badge-success" style={{ fontSize: 10 }}>
                Confirmé
              </span>
            )}
          </div>

          <div style={{ fontSize: 13, marginBottom: 4 }}>
            <strong>📅 Date :</strong>{' '}
            {displayDate.toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}{' '}
            à {displayDate.toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>

          <div style={{ fontSize: 13, marginBottom: 4 }}>
            <strong>📍 Lieu :</strong> {meetup.confirmed_location || meetup.proposed_location}
          </div>

          {meetup.confirmed_location_details || meetup.proposed_location_details ? (
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 8 }}>
              {meetup.confirmed_location_details || meetup.proposed_location_details}
            </div>
          ) : null}

          {/* Compteur de réponses */}
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 8 }}>
            {meetup.responses?.filter((r) => r.response_type === 'accepted').length || 0} /{' '}
            {meetup.responses?.length || 0} réponse(s)
          </div>
        </div>
      </div>

      {/* Contre-propositions */}
      {meetup.responses?.filter((r) => r.response_type === 'counter_proposal').length > 0 && (
        <div
          style={{
            marginTop: 12,
            padding: '10px',
            borderRadius: '8px',
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
          }}
        >
          <p style={{ fontSize: 12, fontWeight: 500, marginBottom: 6 }}>
            Contre-propositions :
          </p>
          {meetup.responses
            ?.filter((r) => r.response_type === 'counter_proposal')
            .map((counter) => (
              <div
                key={counter.id}
                style={{
                  fontSize: 12,
                  marginBottom: 8,
                  padding: '8px',
                  background: 'rgba(245, 158, 11, 0.05)',
                  borderRadius: '6px',
                }}
              >
                <div>
                  {counter.counter_date &&
                    new Date(counter.counter_date).toLocaleString('fr-FR')}
                </div>
                <div>{counter.counter_location}</div>
                {counter.counter_location_details && (
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                    {counter.counter_location_details}
                  </div>
                )}
                {isMine && (
                  <button
                    type="button"
                    onClick={() => handleAcceptCounter(counter.user_id)}
                    className="btn-success"
                    style={{ fontSize: 11, padding: '4px 8px', marginTop: 6 }}
                  >
                    Accepter cette proposition
                  </button>
                )}
              </div>
            ))}
        </div>
      )}

      {/* Actions si pas encore répondu */}
      {!myResponse && !isConfirmed && (
        <div
          style={{
            display: 'flex',
            gap: 8,
            marginTop: 12,
            flexWrap: 'wrap',
          }}
        >
          <button
            type="button"
            onClick={() => handleRespond('accepted')}
            disabled={responding}
            className="btn-success"
            style={{ fontSize: 12, padding: '6px 12px' }}
          >
            ✅ Accepter
          </button>
          <button
            type="button"
            onClick={() => handleRespond('declined')}
            disabled={responding}
            className="btn-outline"
            style={{ fontSize: 12, padding: '6px 12px' }}
          >
            ❌ Refuser
          </button>
          <button
            type="button"
            onClick={() => setShowCounterForm(!showCounterForm)}
            disabled={responding}
            className="btn-outline"
            style={{ fontSize: 12, padding: '6px 12px' }}
          >
            🔄 Proposer autre chose
          </button>
        </div>
      )}

      {/* Ma réponse actuelle */}
      {myResponse && (
        <div
          style={{
            marginTop: 12,
            padding: '8px',
            borderRadius: '8px',
            background:
              myResponse.response_type === 'accepted'
                ? 'rgba(16, 185, 129, 0.1)'
                : myResponse.response_type === 'declined'
                ? 'rgba(239, 68, 68, 0.1)'
                : 'rgba(245, 158, 11, 0.1)',
            fontSize: 12,
          }}
        >
          <strong>Ta réponse :</strong>{' '}
          {myResponse.response_type === 'accepted'
            ? '✅ Accepté'
            : myResponse.response_type === 'declined'
            ? '❌ Refusé'
            : '🔄 Contre-proposition envoyée'}
        </div>
      )}

      {/* Formulaire de contre-proposition */}
      {showCounterForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleRespond('counter_proposal');
          }}
          style={{
            marginTop: 12,
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div>
            <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
              Date alternative
            </label>
            <input
              type="date"
              value={counterDate}
              onChange={(e) => setCounterDate(e.target.value)}
              required
              style={{ width: '100%', fontSize: 12 }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
              Heure alternative
            </label>
            <input
              type="time"
              value={counterTime}
              onChange={(e) => setCounterTime(e.target.value)}
              required
              style={{ width: '100%', fontSize: 12 }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
              Lieu alternatif
            </label>
            <input
              type="text"
              value={counterLocation}
              onChange={(e) => setCounterLocation(e.target.value)}
              placeholder="Nouveau lieu"
              required
              style={{ width: '100%', fontSize: 12 }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
              Détails (optionnel)
            </label>
            <textarea
              value={counterLocationDetails}
              onChange={(e) => setCounterLocationDetails(e.target.value)}
              rows={2}
              style={{ width: '100%', fontSize: 12, resize: 'none' }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
              Message (optionnel)
            </label>
            <textarea
              value={counterMessage}
              onChange={(e) => setCounterMessage(e.target.value)}
              placeholder="Pourquoi cette alternative ?"
              rows={2}
              style={{ width: '100%', fontSize: 12, resize: 'none' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="submit"
              disabled={responding}
              className="btn-primary"
              style={{ fontSize: 12, padding: '6px 12px' }}
            >
              Envoyer la contre-proposition
            </button>
            <button
              type="button"
              onClick={() => setShowCounterForm(false)}
              className="btn-outline"
              style={{ fontSize: 12, padding: '6px 12px' }}
            >
              Annuler
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

