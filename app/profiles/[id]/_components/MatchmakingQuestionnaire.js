'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import ProfilePhotoUploader from '../../../onboarding/_components/ProfilePhotoUploader';

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

  const [photoUrl, setPhotoUrl] = useState('');
  const [photoError, setPhotoError] = useState('');

  useEffect(() => {
    if (!userId) return;
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function loadAll() {
    const [{ data: ansData }, { data: profData }] = await Promise.all([
      supabase
        .from('matchmaking_answers')
        .select('answers')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('profiles')
        .select('main_photo_url')
        .eq('user_id', userId)
        .maybeSingle(),
    ]);

    if (ansData?.answers) {
      setAnswers({ ...DEFAULT_MATCHMAKING, ...ansData.answers });
    } else {
      setAnswers(DEFAULT_MATCHMAKING);
    }

    setPhotoUrl(profData?.main_photo_url || '');
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
        'Tes réponses matchmaking ont été enregistrées. Elles serviront à améliorer les suggestions de rencontres à plusieurs.'
      );
      setOpen(false);
    }
  }

  async function handlePhotoChange(newUrl) {
    setPhotoUrl(newUrl);
    setPhotoError('');

    if (!userId) return;

    const { error } = await supabase
      .from('profiles')
      .update({ main_photo_url: newUrl })
      .eq('user_id', userId);

    if (error) {
      setPhotoError(
        'La photo a été téléversée, mais une erreur est survenue lors de la mise à jour du profil.'
      );
    }
  }

  if (!userId) return null;

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
              maxWidth: 620,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              position: 'relative',
            }}
          >
            {/* Bouton fermer */}
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

            {/* En‑tête */}
            <h2 style={{ fontSize: 20, marginBottom: 4 }}>
              Questionnaire matchmaking
            </h2>
            <p
              style={{
                fontSize: 13,
                color: '#9ca3af',
                marginBottom: 10,
              }}
            >
              Ajuste ta photo et réponds à ces questions pour que ManyLovr
              comprenne mieux ton style de rencontres, notamment à plusieurs,
              ton rapport au one‑shot, à la sécurité, à l’hygiène et à ton mode
              de vie.
            </p>

            {/* Photo tout en haut */}
            <section
              style={{
                marginBottom: 12,
                padding: '8px 10px',
                borderRadius: 10,
                border: '1px solid #1f2937',
                backgroundColor: '#020617',
              }}
            >
              <h3 style={{ fontSize: 14, marginBottom: 6 }}>
                Photo de profil
              </h3>
              <ProfilePhotoUploader
                userId={userId}
                mainPhotoUrl={photoUrl}
                onPhotoChange={handlePhotoChange}
              />
              {photoError && (
                <p
                  style={{
                    fontSize: 12,
                    color: 'tomato',
                    marginTop: 4,
                  }}
                >
                  {photoError}
                </p>
              )}
            </section>

            {/* Formulaire stylé par sections */}
            <form
              onSubmit={handleSubmit}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                fontSize: 13,
              }}
            >
              {/* Bloc 1 : intention & cadre */}
              <section
                style={{
                  padding: '8px 10px',
                  borderRadius: 10,
                  border: '1px solid #1f2937',
                  backgroundColor: '#020617',
                }}
              >
                <h3 style={{ fontSize: 14, marginBottom: 6 }}>
                  Intention & type de lien
                </h3>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 1fr)',
                    gap: 8,
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
                </div>
              </section>

              {/* Bloc 2 : rythme & sécurité */}
              <section
                style={{
                  padding: '8px 10px',
                  borderRadius: 10,
                  border: '1px solid #1f2937',
                  backgroundColor: '#020617',
                }}
              >
                <h3 style={{ fontSize: 14, marginBottom: 6 }}>
                  Rythme & sécurité
                </h3>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 1fr)',
                    gap: 8,
                  }}
                >
                  <label>
                    4. À quelle fréquence idéale imagines‑tu les rencontres
                    physiques (solo ou à plusieurs) ?
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
                    5. Après une rencontre, qu’est‑ce qui te met le plus à
                    l’aise ?
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
                </div>
              </section>

              {/* Bloc 3 : hygiène & mode de vie */}
              <section
                style={{
                  padding: '8px 10px',
                  borderRadius: 10,
                  border: '1px solid #1f2937',
                  backgroundColor: '#020617',
                }}
              >
                <h3 style={{ fontSize: 14, marginBottom: 6 }}>
                  Hygiène & mode de vie
                </h3>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 1fr)',
                    gap: 8,
                  }}
                >
                  <label>
                    7. À quel point l’hygiène corporelle est‑elle importante
                    pour toi ?
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
                </div>
              </section>

              <button
                type="submit"
                disabled={loading}
                style={{ marginTop: 6 }}
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

