'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

function normalizePhone(frPhone) {
  return frPhone.replace(/\s+/g, '');
}

function isValidFrenchPhone(phone) {
  const normalized = normalizePhone(phone);
  // 0Xxxxxxxxx ou +33Xxxxxxxxx (mobile ou fixe simple)
  const regex = /^((\+33)|0)[1-9]\d{8}$/;
  return regex.test(normalized);
}

export default function ContactPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [phone, setPhone] = useState('');
  const [phoneConfirm, setPhoneConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [phoneValidated, setPhoneValidated] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Champ honeypot (anti-bot : s'il est rempli, on rejette silencieusement)
  const [websiteTrap, setWebsiteTrap] = useState('');

  function handleValidatePhone() {
    setErrorMsg('');
    setStatusMsg('');
    setPhoneValidated(false);

    if (!phone || !phoneConfirm) {
      setErrorMsg('Merci de saisir ton numéro deux fois.');
      return;
    }

    if (normalizePhone(phone) !== normalizePhone(phoneConfirm)) {
      setErrorMsg('Les deux numéros ne correspondent pas.');
      return;
    }

    if (!isValidFrenchPhone(phone)) {
      setErrorMsg("Le numéro n’a pas l’air d’un numéro français valide.");
      return;
    }

    setPhoneValidated(true);
    setStatusMsg('Numéro validé. Tu peux maintenant envoyer ton message.');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');
    setStatusMsg('');

    if (websiteTrap) {
      // Probable bot : on fait comme si ça marchait, mais on n’enregistre rien
      setStatusMsg('Message envoyé.');
      return;
    }

    if (!phoneValidated) {
      setErrorMsg('Merci de valider ton numéro avant d’envoyer le message.');
      return;
    }

    if (!message.trim()) {
      setErrorMsg('Le message ne peut pas être vide.');
      return;
    }

    setSubmitting(true);

    // On essaie de lier à un compte si la personne est connectée
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id ?? null;

    const { error } = await supabase.from('contact_requests').insert({
      user_id: userId,
      phone: normalizePhone(phone),
      message: message.trim(),
      source_page: pathname,
    });

    setSubmitting(false);

    if (error) {
      setErrorMsg(error.message);
    } else {
      setStatusMsg(
        "Merci, ton message a bien été enregistré. Tu peux aussi m’écrire directement au 0649710370 si c’est urgent."
      );
      setMessage('');
      // On garde le numéro validé pour éviter de le retaper
    }
  }

  return (
    <main>
      <div className="card" style={{ maxWidth: 520, margin: '0 auto' }}>
        <h1>Soumettre un message, et non pas "quelqu'un"...</h1>
        <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 14 }}>
          Tu peux utiliser ce formulaire pour signaler un bug, un abus, ou poser une
          question. Ton numéro est demandé pour pouvoir te répondre et limiter le spam.
        </p>

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          {/* Honeypot anti-spam (caché visuellement) */}
          <div style={{ position: 'absolute', left: '-9999px', height: 0, overflow: 'hidden' }}>
            <label>
              Ne pas remplir ce champ :
              <input
                type="text"
                value={websiteTrap}
                onChange={(e) => setWebsiteTrap(e.target.value)}
              />
            </label>
          </div>

          <section>
            <h2 style={{ fontSize: 15, marginBottom: 6 }}>Validation du numéro</h2>
            <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8 }}>
              Numéro français uniquement pour l’instant (format 06…, 07…, 01…, ou +33…).
            </p>
            <label style={{ fontSize: 13 }}>
              Numéro de téléphone
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setPhoneValidated(false);
                }}
                placeholder="Ex : 0649710370 ou +33649710370"
                style={{ marginTop: 4 }}
              />
            </label>
            <label style={{ fontSize: 13, marginTop: 8 }}>
              Confirme ton numéro
              <input
                type="tel"
                value={phoneConfirm}
                onChange={(e) => {
                  setPhoneConfirm(e.target.value);
                  setPhoneValidated(false);
                }}
                placeholder="Retape le même numéro"
                style={{ marginTop: 4 }}
              />
            </label>
            <button
              type="button"
              onClick={handleValidatePhone}
              disabled={submitting}
              style={{ marginTop: 8, fontSize: 12, padding: '6px 12px' }}
            >
              Valider mon numéro
            </button>
            {phoneValidated && (
              <p style={{ color: '#a3e635', fontSize: 12, marginTop: 6 }}>
                Numéro validé.
              </p>
            )}
          </section>

          <section>
            <h2 style={{ fontSize: 15, marginBottom: 6 }}>Ton message</h2>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Explique en quelques phrases ce qui ne va pas, ce que tu veux signaler, ou ta question."
            />
          </section>

          <button type="submit" disabled={submitting}>
            {submitting ? 'Envoi en cours…' : 'Envoyer la demande'}
          </button>
        </form>

        {errorMsg && (
          <p style={{ color: 'tomato', marginTop: 12, fontSize: 13 }}>{errorMsg}</p>
        )}
        {statusMsg && (
          <p style={{ color: '#a3e635', marginTop: 12, fontSize: 13 }}>{statusMsg}</p>
        )}

        <p style={{ marginTop: 16, fontSize: 12, color: '#9ca3af' }}>
          Tu peux aussi me joindre directement : Marpeap au 0649710370.
        </p>
      </div>
    </main>
  );
}

