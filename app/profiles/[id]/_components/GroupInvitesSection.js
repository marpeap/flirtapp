'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';



const DEFAULT_MATCHMAKING = {
  q1_type_lien: '',
  q2_one_shot: '',
  q3_identite_min: '',
  q4_frequence: '',
  q5_apres_rencontre: '',
  q6_safe_sex: '',
  q7_hygiene: '',
  q8_tabac: '',
  q9_alcool: '',
  q10_rythme: '',
};

export default function MatchmakingQuestionnaire({ userId }) {
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState(DEFAULT_MATCHMAKING);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (!userId) return;
    loadAnswers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function loadAnswers() {
    const { data, error } = await supabase
      .from('matchmaking_answers')
      .select('answers')
      .eq('user_id', userId)
      .maybeSingle();

    if (!error && data?.answers) {
      setAnswers({ ...DEFAULT_MATCHMAKING, ...data.answers });
    } else {
      setAnswers(DEFAULT_MATCHMAKING);
    }
  }

  function openModal() {
    setStatus('');
    setOpen(true);
  }

  function closeModal() {
    if (loading) return;
    setOpen(false);
  }

  function updateField(key, value) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!userId) return;

    setLoading(true);
    setStatus('');

    const { error } = await supabase
      .from('matchmaking_answers')
      .upsert(
        {
          user_id: userId,
          answers,
        },
        { onConflict: 'user_id' }
      );

    setLoading(false);

    if (error) {
      setStatus(error.message);
    } else {
      setStatus(
        'Tes réponses matchmaking ont été enregistrées. Elles serviront à améliorer les suggestions de groupes.'
      );
      setOpen(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        style={{
          marginTop: 12,
          padding: '6px 12px',
          fontSize: 12,
          backgroundImage: 'linear-gradient(135deg, #22c55e, #16a34a)',
          color: '#052e16',
        }}
      >
        Questionnaire matchmaking (10 questions)
      </button>

      {open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.75)',
            zIndex: 70,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: 520,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              position: 'relative',
            }}
          >
            <button
              type="button"
              onClick={closeModal}
              disabled={loading}
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                padding: '4px 10px',
                fontSize: 12,
                backgroundImage:
                  'linear-gradient(135deg, #6b7280, #111827)',
                color: '#e5e7eb',
              }}
            >
              Fermer
            </button>

            <h2 style={{ fontSize: 18, marginBottom: 6 }}>
              Questionnaire matchmaking
            </h2>
            <p
              style={{
                fontSize: 13,
                color: '#9ca3af',
                marginBottom: 10,
              }}
            >
              Ces 10 questions servent à mieux comprendre tes désirs
              relationnels, ton rapport au one‑shot, à l’hygiène et à ton mode
              de vie. Elles restent privées et servent uniquement au
              matchmaking.
            </p>

            <form
              onSubmit={handleSubmit}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                fontSize: 13,
              }}
            >
              <label>
                1. Quel type de lien cherches‑tu en priorité ?
                <select
                  value={answers.q1_type_lien}
                  onChange={(e) =>
                    updateField('q1_type_lien', e.target.value)
                  }
                  style={{ marginTop: 4, width: '100%' }}
                >
                  <option value="">Choisir…</option>
                  <option value="ponctuel">
                    Rencontres ponctuelles, sans engagement
                  </option>
                  <option value="regulier_sans_etiquette">
                    Relation régulière sans étiquette forte
                  </option>
                  <option value="exclusive">
                    Relation exclusive / engagée
                  </option>
                  <option value="poly_ouvert">
                    Polyamour / relation ouverte
                  </option>
                  <option value="ouvert_a_tout">
                    Ouvert·e à voir ce qui se passe
                  </option>
                </select>
              </label>

              <label>
                2. Es‑tu ouvert·e à un one‑shot sans forcément revoir la
                personne ?
                <select
                  value={answers.q2_one_shot}
                  onChange={(e) =>
                    updateField('q2_one_shot', e.target.value)
                  }
                  style={{ marginTop: 4, width: '100%' }}
                >
                  <option value="">Choisir…</option>
                  <option value="oui">Oui, clairement</option>
                  <option value="plutot_oui">
                    Plutôt oui, selon le feeling
                  </option>
                  <option value="plutot_non">
                    Plutôt non, je préfère du suivi
                  </option>
                  <option value="non">Non</option>
                </select>
              </label>

              <label>
                3. De quoi as‑tu besoin comme infos minimales avant de
                rencontrer quelqu’un ?
                <select
                  value={answers.q3_identite_min}
                  onChange={(e) =>
                    updateField('q3_identite_min', e.target.value)
                  }
                  style={{ marginTop: 4, width: '100%' }}
                >
                  <option value="">Choisir…</option>
                  <option value="quasi_anon">
                    Presque rien, je peux rester quasi anonyme
                  </option>
                  <option value="prenom_quelques_infos">
                    Prénom + quelques infos de base
                  </option>
                  <option value="identite_plus_claire">
                    Identité plus claire (réseaux, cercle, etc.)
                  </option>
                </select>
              </label>

              <label>
                4. À quelle fréquence idéale imagines‑tu les rencontres
                physiques ?
                <select
                  value={answers.q4_frequence}
                  onChange={(e) =>
                    updateField('q4_frequence', e.target.value)
                  }
                  style={{ marginTop: 4, width: '100%' }}
                >
                  <option value="">Choisir…</option>
                  <option value="tres_ponctuel">
                    Très ponctuel (occasionnel, rare)
                  </option>
                  <option value="mensuel">Environ 1× par mois</option>
                  <option value="hebdo">Environ 1× par semaine</option>
                  <option value="plus_souvent">
                    Plus souvent si ça colle
                  </option>
                </select>
              </label>

              <label>
                5. Après une rencontre, qu’est‑ce qui te met le plus à l’aise ?
                <select
                  value={answers.q5_apres_rencontre}
                  onChange={(e) =>
                    updateField('q5_apres_rencontre', e.target.value)
                  }
                  style={{ marginTop: 4, width: '100%' }}
                >
                  <option value="">Choisir…</option>
                  <option value="chacun_chez_soi">
                    Chacun reprend sa vie sans obligation
                  </option>
                  <option value="petit_debrief">
                    Un petit message / débrief sympa
                  </option>
                  <option value="papoter_suite">
                    Papoter / prévoir assez vite une suite
                  </option>
                </select>
              </label>

              <label>
                6. Comment vois‑tu les pratiques de protection (préservatifs,
                tests, etc.) ?
                <select
                  value={answers.q6_safe_sex}
                  onChange={(e) =>
                    updateField('q6_safe_sex', e.target.value)
                  }
                  style={{ marginTop: 4, width: '100%' }}
                >
                  <option value="">Choisir…</option>
                  <option value="priorite_non_negociable">
                    Priorité non négociable
                  </option>
                  <option value="important_flexible">
                    Important mais adaptable au contexte
                  </option>
                  <option value="a_discuter">
                    À discuter selon les personnes
                  </option>
                </select>
              </label>

              <label>
                7. À quel point l’hygiène corporelle est‑elle importante pour
                toi ?
                <select
                  value={answers.q7_hygiene}
                  onChange={(e) =>
                    updateField('q7_hygiene', e.target.value)
                  }
                  style={{ marginTop: 4, width: '100%' }}
                >
                  <option value="">Choisir…</option>
                  <option value="tres_strict">
                    Très importante, je suis plutôt strict·e
                  </option>
                  <option value="important">
                    Importante, mais je reste flexible
                  </option>
                  <option value="relax">
                    Plutôt relax tant que c’est globalement propre
                  </option>
                </select>
              </label>

              <label>
                8. Tabac (toi ou les autres) ?
                <select
                  value={answers.q8_tabac}
                  onChange={(e) =>
                    updateField('q8_tabac', e.target.value)
                  }
                  style={{ marginTop: 4, width: '100%' }}
                >
                  <option value="">Choisir…</option>
                  <option value="non_fumeur_pas_ok">
                    Je ne fume pas et je préfère que les autres non plus
                  </option>
                  <option value="non_fumeur_ok">
                    Je ne fume pas mais ça ne me dérange pas
                  </option>
                  <option value="fumeur">
                    Je fume (occasionnel ou régulier)
                  </option>
                </select>
              </label>

              <label>
                9. Alcool (ambiances que tu préfères) ?
                <select
                  value={answers.q9_alcool}
                  onChange={(e) =>
                    updateField('q9_alcool', e.target.value)
                  }
                  style={{ marginTop: 4, width: '100%' }}
                >
                  <option value="">Choisir…</option>
                  <option value="sobre">
                    Plutôt sobre / peu d’alcool
                  </option>
                  <option value="quelques_verres">
                    Quelques verres ok
                  </option>
                  <option value="festif">
                    Ambiance très festive me va bien
                  </option>
                </select>
              </label>

              <label>
                10. Ton rythme de vie (lever/coucher) ?
                <select
                  value={answers.q10_rythme}
                  onChange={(e) =>
                    updateField('q10_rythme', e.target.value)
                  }
                  style={{ marginTop: 4, width: '100%' }}
                >
                  <option value="">Choisir…</option>
                  <option value="tres_matin">
                    Plutôt très matin / couché tôt
                  </option>
                  <option value="flexible">Assez flexible</option>
                  <option value="noctambule">Plutôt noctambule</option>
                </select>
              </label>

              <button
                type="submit"
                disabled={loading}
                style={{ marginTop: 8 }}
              >
                {loading ? 'Enregistrement…' : 'Enregistrer mes réponses'}
              </button>
            </form>

            {status && (
              <p
                style={{
                  marginTop: 10,
                  fontSize: 13,
                  color: status.startsWith('Tes réponses')
                    ? '#a3e635'
                    : 'tomato',
                }}
              >
                {status}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}

