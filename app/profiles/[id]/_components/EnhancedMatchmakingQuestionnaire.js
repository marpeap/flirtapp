'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import ProfilePhotoUploader from '../../../onboarding/_components/ProfilePhotoUploader';
import { getCupidAvatarFromAnswers } from '@/lib/cupidAvatars';

// Structure complète du questionnaire
const QUESTIONNAIRE_STRUCTURE = [
  {
    id: 'q1_type_lien',
    category: 'Intention & Valeurs',
    question: 'Quel type de lien cherches-tu en priorité ?',
    options: [
      { value: 'ponctuel', label: 'Rencontres ponctuelles, sans engagement' },
      { value: 'regulier_sans_etiquette', label: 'Relation régulière sans étiquette forte' },
      { value: 'exclusive', label: 'Relation exclusive / engagée' },
      { value: 'poly_ouvert', label: 'Polyamour / relation ouverte' },
      { value: 'ouvert_a_tout', label: 'Ouvert·e à voir ce qui se passe' },
    ],
  },
  {
    id: 'q2_one_shot',
    category: 'Intention & Valeurs',
    question: 'Es-tu ouvert·e à un one-shot sans forcément revoir la personne ?',
    options: [
      { value: 'oui', label: 'Oui, clairement' },
      { value: 'plutot_oui', label: 'Plutôt oui, selon le feeling' },
      { value: 'plutot_non', label: 'Plutôt non, je préfère du suivi' },
      { value: 'non', label: 'Non' },
    ],
  },
  {
    id: 'q3_identite_min',
    category: 'Intention & Valeurs',
    question: 'De quoi as-tu besoin comme infos minimales avant de rencontrer quelqu\'un ?',
    options: [
      { value: 'quasi_anon', label: 'Presque rien, je peux rester quasi anonyme' },
      { value: 'prenom_quelques_infos', label: 'Prénom + quelques infos de base' },
      { value: 'identite_plus_claire', label: 'Identité plus claire (réseaux, cercle, etc.)' },
    ],
  },
  {
    id: 'q4_frequence',
    category: 'Rythme & Fréquence',
    question: 'À quelle fréquence idéale imagines-tu les rencontres physiques (solo ou à plusieurs) ?',
    options: [
      { value: 'tres_ponctuel', label: 'Très ponctuel (occasionnel, rare)' },
      { value: 'mensuel', label: 'Environ 1× par mois' },
      { value: 'hebdo', label: 'Environ 1× par semaine' },
      { value: 'plus_souvent', label: 'Plus souvent si ça colle' },
    ],
  },
  {
    id: 'q5_apres_rencontre',
    category: 'Rythme & Fréquence',
    question: 'Après une rencontre, qu\'est-ce qui te met le plus à l\'aise ?',
    options: [
      { value: 'chacun_chez_soi', label: 'Chacun reprend sa vie sans obligation' },
      { value: 'petit_debrief', label: 'Un petit message / débrief sympa' },
      { value: 'papoter_suite', label: 'Papoter / prévoir assez vite une suite' },
    ],
  },
  {
    id: 'q6_safe_sex',
    category: 'Sécurité & Santé',
    question: 'Comment vois-tu les pratiques de protection (préservatifs, tests, etc.) ?',
    options: [
      { value: 'priorite_non_negociable', label: 'Priorité non négociable' },
      { value: 'important_flexible', label: 'Important mais adaptable au contexte' },
      { value: 'a_discuter', label: 'À discuter selon les personnes' },
    ],
    critical: true,
  },
  {
    id: 'q7_hygiene',
    category: 'Mode de Vie',
    question: 'À quel point l\'hygiène corporelle est-elle importante pour toi ?',
    options: [
      { value: 'tres_strict', label: 'Très importante, je suis plutôt strict·e' },
      { value: 'important', label: 'Importante, mais je reste flexible' },
      { value: 'relax', label: 'Plutôt relax tant que c\'est globalement propre' },
    ],
  },
  {
    id: 'q8_tabac',
    category: 'Mode de Vie',
    question: 'Tabac (toi ou les autres) ?',
    options: [
      { value: 'non_fumeur_pas_ok', label: 'Je ne fume pas et je préfère que les autres non plus' },
      { value: 'non_fumeur_ok', label: 'Je ne fume pas mais ça ne me dérange pas' },
      { value: 'fumeur', label: 'Je fume (occasionnel ou régulier)' },
    ],
  },
  {
    id: 'q9_alcool',
    category: 'Mode de Vie',
    question: 'Alcool (ambiances que tu préfères) ?',
    options: [
      { value: 'sobre', label: 'Plutôt sobre / peu d\'alcool' },
      { value: 'quelques_verres', label: 'Quelques verres ok' },
      { value: 'festif', label: 'Ambiance très festive me va bien' },
    ],
  },
  {
    id: 'q10_rythme',
    category: 'Mode de Vie',
    question: 'Ton rythme de vie (lever/coucher) ?',
    options: [
      { value: 'tres_matin', label: 'Plutôt très matin / couché tôt' },
      { value: 'flexible', label: 'Assez flexible' },
      { value: 'noctambule', label: 'Plutôt noctambule' },
    ],
  },
  {
    id: 'q11_communication',
    category: 'Communication',
    question: 'Comment préfères-tu communiquer avant et après les rencontres ?',
    options: [
      { value: 'minimal', label: 'Minimal, juste pour organiser' },
      { value: 'modere', label: 'Modéré, quelques messages sympas' },
      { value: 'beaucoup', label: 'J\'aime bien papoter et échanger' },
    ],
  },
  {
    id: 'q12_ambiance',
    category: 'Ambiance',
    question: 'Quelle ambiance préfères-tu pour les rencontres ?',
    options: [
      { value: 'intime_discret', label: 'Intime et discrète' },
      { value: 'detendue', label: 'Détendue et naturelle' },
      { value: 'festive', label: 'Festive et énergique' },
      { value: 'variee', label: 'Ça dépend, j\'aime la variété' },
    ],
  },
  {
    id: 'q13_experience_groupe',
    category: 'Expérience',
    question: 'Quelle est ton expérience avec les rencontres à plusieurs ?',
    options: [
      { value: 'debutant', label: 'Débutant·e, curieux·se d\'essayer' },
      { value: 'quelques_fois', label: 'Quelques fois, j\'ai testé' },
      { value: 'experimente', label: 'Expérimenté·e, j\'ai l\'habitude' },
    ],
  },
  {
    id: 'q14_boundaries',
    category: 'Limites & Boundaries',
    question: 'L\'établissement de limites claires avant une rencontre est-il important pour toi ?',
    options: [
      { value: 'tres_important', label: 'Très important, je veux que ce soit clair' },
      { value: 'important', label: 'Important, on peut en discuter' },
      { value: 'flexible', label: 'Flexible, je m\'adapte au feeling' },
    ],
    critical: true,
  },
  {
    id: 'q15_lieu',
    category: 'Préférences',
    question: 'Où préfères-tu rencontrer les gens ?',
    options: [
      { value: 'chez_moi', label: 'Chez moi' },
      { value: 'chez_lui', label: 'Chez l\'autre personne' },
      { value: 'lieu_neutre', label: 'Lieu neutre (hôtel, etc.)' },
      { value: 'peu_importe', label: 'Peu importe, selon le contexte' },
    ],
  },
];

const DEFAULT_ANSWERS = QUESTIONNAIRE_STRUCTURE.reduce((acc, q) => {
  acc[q.id] = '';
  return acc;
}, {});

export default function EnhancedMatchmakingQuestionnaire({ userId }) {
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState(DEFAULT_ANSWERS);
  const [currentStep, setCurrentStep] = useState(0);
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
      setAnswers({ ...DEFAULT_ANSWERS, ...ansData.answers });
    } else {
      setAnswers(DEFAULT_ANSWERS);
    }

    setPhotoUrl(profData?.main_photo_url || '');
  }

  function openModal() {
    setStatus('');
    setOpen(true);
    setCurrentStep(0);
  }

  function closeModal() {
    if (loading) return;
    setOpen(false);
  }

  function updateAnswer(questionId, value) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  function nextStep() {
    if (currentStep < QUESTIONNAIRE_STRUCTURE.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  }

  function prevStep() {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }

  function goToStep(step) {
    if (step >= 0 && step < QUESTIONNAIRE_STRUCTURE.length) {
      setCurrentStep(step);
    }
  }

  const currentQuestion = QUESTIONNAIRE_STRUCTURE[currentStep];
  const progress = ((currentStep + 1) / QUESTIONNAIRE_STRUCTURE.length) * 100;
  const answeredCount = Object.values(answers).filter((v) => v !== '').length;
  const totalQuestions = QUESTIONNAIRE_STRUCTURE.length;
  const isComplete = answeredCount === totalQuestions;

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
      // Assigner un avatar Cupid basé sur les réponses
      const cupidAvatar = getCupidAvatarFromAnswers(answers);
      
      // Mettre à jour le profil avec l'avatar Cupid (seulement si pas de photo personnelle)
      // Si l'utilisateur a déjà une photo personnelle, on ne la remplace pas
      // L'avatar Cupid sera affiché dans la carte personnelle
      if (!photoUrl || photoUrl.startsWith('/cupids/')) {
        const { error: avatarError } = await supabase
          .from('profiles')
          .update({ main_photo_url: cupidAvatar })
          .eq('user_id', userId);

        if (!avatarError) {
          setPhotoUrl(cupidAvatar);
        }
      }

      setStatus(
        '✅ Tes réponses ont été enregistrées ! Un avatar ManyLovr a été sélectionné selon ton profil. Tu peux le voir dans ta carte personnelle. Elles permettront de te proposer des matchs vraiment compatibles avec tes envies.'
      );
      setTimeout(() => {
        setOpen(false);
      }, 2000);
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

  // Grouper les questions par catégorie pour la navigation
  const categories = QUESTIONNAIRE_STRUCTURE.reduce((acc, q, index) => {
    if (!acc[q.category]) {
      acc[q.category] = [];
    }
    acc[q.category].push({ ...q, index });
    return acc;
  }, {});

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="btn-primary"
        style={{
          marginTop: 12,
          padding: '8px 16px',
          fontSize: 13,
        }}
      >
        📋 Questionnaire de compatibilité ({answeredCount}/{totalQuestions})
      </button>

      {open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            zIndex: 70,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: 700,
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
            }}
          >
            {/* Bouton fermer */}
            <button
              type="button"
              onClick={closeModal}
              disabled={loading}
              className="btn-outline"
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                padding: '6px 12px',
                fontSize: 12,
                zIndex: 10,
              }}
            >
              ✕ Fermer
            </button>

            {/* En-tête avec barre de progression */}
            <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--color-border)' }}>
              <h2 style={{ fontSize: 20, marginBottom: 8 }}>
                Questionnaire de compatibilité
              </h2>
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 12 }}>
                Réponds à ces questions pour que ManyLovr comprenne tes vraies envies et te propose des matchs vraiment compatibles.
              </p>

              {/* Barre de progression */}
              <div style={{ marginBottom: 8 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 6,
                  }}
                >
                  <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                    Question {currentStep + 1} sur {totalQuestions}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                    {answeredCount}/{totalQuestions} répondues
                  </span>
                </div>
                <div
                  style={{
                    width: '100%',
                    height: 8,
                    backgroundColor: 'var(--color-bg-secondary)',
                    borderRadius: 999,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${progress}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #a855f7, #ec4899)',
                      borderRadius: 999,
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </div>

              {/* Navigation par catégorie (mini-menu) */}
              <div
                style={{
                  display: 'flex',
                  gap: 6,
                  flexWrap: 'wrap',
                  fontSize: 11,
                }}
              >
                {Object.keys(categories).map((category) => {
                  const categoryQuestions = categories[category];
                  const categoryAnswered = categoryQuestions.filter(
                    (q) => answers[q.id] !== ''
                  ).length;
                  const isCurrentCategory = categoryQuestions.some(
                    (q) => q.index === currentStep
                  );

                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => goToStep(categoryQuestions[0].index)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: 6,
                        border: '1px solid var(--color-border)',
                        background: isCurrentCategory
                          ? 'rgba(168, 85, 247, 0.2)'
                          : 'var(--color-bg-card)',
                        color: 'var(--color-text-primary)',
                        fontSize: 11,
                        cursor: 'pointer',
                      }}
                    >
                      {category} ({categoryAnswered}/{categoryQuestions.length})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Contenu scrollable */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                paddingRight: 8,
              }}
            >
              {/* Photo de profil (première question) */}
              {currentStep === 0 && (
                <section
                  style={{
                    marginBottom: 20,
                    padding: '16px',
                    borderRadius: 12,
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-bg-secondary)',
                  }}
                >
                  <h3 style={{ fontSize: 14, marginBottom: 8 }}>
                    📸 Photo de profil
                  </h3>
                  <ProfilePhotoUploader
                    userId={userId}
                    mainPhotoUrl={photoUrl}
                    onPhotoChange={handlePhotoChange}
                  />
                  {photoError && (
                    <p style={{ fontSize: 12, color: 'var(--color-error)', marginTop: 8 }}>
                      {photoError}
                    </p>
                  )}
                </section>
              )}

              {/* Question actuelle */}
              <form onSubmit={(e) => {
                e.preventDefault();
                if (currentStep < QUESTIONNAIRE_STRUCTURE.length - 1) {
                  nextStep();
                } else {
                  handleSubmit(e);
                }
              }}>
                <div
                  style={{
                    marginBottom: 20,
                    padding: '20px',
                    borderRadius: 12,
                    border: currentQuestion.critical
                      ? '2px solid var(--color-warning)'
                      : '1px solid var(--color-border)',
                    background: currentQuestion.critical
                      ? 'rgba(245, 158, 11, 0.05)'
                      : 'var(--color-bg-card)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 12,
                    }}
                  >
                    <span style={{ fontSize: 18 }}>
                      {currentQuestion.critical ? '⚠️' : '❓'}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        color: 'var(--color-text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                      }}
                    >
                      {currentQuestion.category}
                    </span>
                  </div>

                  <h3
                    style={{
                      fontSize: 16,
                      marginBottom: 16,
                      fontWeight: 600,
                    }}
                  >
                    {currentQuestion.question}
                  </h3>

                  {currentQuestion.critical && (
                    <p
                      style={{
                        fontSize: 12,
                        color: 'var(--color-warning)',
                        marginBottom: 16,
                        padding: '8px',
                        borderRadius: 6,
                        background: 'rgba(245, 158, 11, 0.1)',
                      }}
                    >
                      ⚠️ Cette question est importante pour ta sécurité et celle des autres.
                    </p>
                  )}

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                    }}
                  >
                    {currentQuestion.options.map((option) => (
                      <label
                        key={option.value}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '12px 16px',
                          borderRadius: 10,
                          border:
                            answers[currentQuestion.id] === option.value
                              ? '2px solid #a855f7'
                              : '1px solid var(--color-border)',
                          background:
                            answers[currentQuestion.id] === option.value
                              ? 'rgba(168, 85, 247, 0.1)'
                              : 'var(--color-bg-card)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          if (answers[currentQuestion.id] !== option.value) {
                            e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.5)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (answers[currentQuestion.id] !== option.value) {
                            e.currentTarget.style.borderColor = 'var(--color-border)';
                          }
                        }}
                      >
                        <input
                          type="radio"
                          name={currentQuestion.id}
                          value={option.value}
                          checked={answers[currentQuestion.id] === option.value}
                          onChange={(e) => updateAnswer(currentQuestion.id, e.target.value)}
                          style={{ marginRight: 12, cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: 14, flex: 1 }}>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Navigation */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 12,
                    marginTop: 20,
                  }}
                >
                  <button
                    type="button"
                    onClick={prevStep}
                    disabled={currentStep === 0}
                    className="btn-outline"
                    style={{ flex: 1 }}
                  >
                    ← Précédent
                  </button>

                  {currentStep < QUESTIONNAIRE_STRUCTURE.length - 1 ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      disabled={!answers[currentQuestion.id]}
                      className="btn-primary"
                      style={{ flex: 1 }}
                    >
                      Suivant →
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={loading || !isComplete}
                      className="btn-primary"
                      style={{ flex: 1 }}
                    >
                      {loading ? 'Enregistrement…' : '✅ Enregistrer mes réponses'}
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Status message */}
            {status && (
              <div
                style={{
                  marginTop: 16,
                  padding: '12px',
                  borderRadius: 8,
                  background: status.startsWith('✅')
                    ? 'rgba(16, 185, 129, 0.1)'
                    : 'rgba(239, 68, 68, 0.1)',
                  border: `1px solid ${status.startsWith('✅') ? '#10b981' : '#ef4444'}`,
                }}
              >
                <p
                  style={{
                    fontSize: 13,
                    color: status.startsWith('✅') ? '#10b981' : '#ef4444',
                    margin: 0,
                  }}
                >
                  {status}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

