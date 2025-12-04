/**
 * Système de calcul de compatibilité basé sur les réponses du questionnaire
 */

// Haversine pour calculer la distance en km
export function distanceKm(lat1, lng1, lat2, lng2) {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) {
    return null;
  }
  const R = 6371; // rayon de la Terre
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function isWantedGender(lookingFor, gender) {
  if (!lookingFor || lookingFor === 'any') return true;
  return lookingFor === gender;
}

/**
 * Calcule le score de compatibilité basé sur les réponses du questionnaire
 * Utilise la fonction SQL compute_compatibility_score si disponible,
 * sinon calcule côté client
 */
export async function computeCompatibilityScore(user1Answers, user2Answers) {
  if (!user1Answers || !user2Answers) {
    return 0;
  }

  let score = 0;
  const maxScore = 1000;

  // ============================================
  // CATÉGORIE 1: INTENTIONS & VALEURS (200 points max)
  // ============================================

  // Q1: Type de lien recherché (50 points)
  if (user1Answers.q1_type_lien === user2Answers.q1_type_lien) {
    score += 50;
  } else if (
    user1Answers.q1_type_lien === 'ouvert_a_tout' ||
    user2Answers.q1_type_lien === 'ouvert_a_tout'
  ) {
    score += 25;
  }

  // Q2: One-shot (30 points)
  if (user1Answers.q2_one_shot === user2Answers.q2_one_shot) {
    score += 30;
  } else if (
    ['plutot_oui', 'plutot_non'].includes(user1Answers.q2_one_shot) &&
    ['plutot_oui', 'plutot_non'].includes(user2Answers.q2_one_shot)
  ) {
    score += 15;
  }

  // Q3: Identité minimale (20 points)
  if (user1Answers.q3_identite_min === user2Answers.q3_identite_min) {
    score += 20;
  }

  // Q4: Fréquence (30 points)
  if (user1Answers.q4_frequence === user2Answers.q4_frequence) {
    score += 30;
  } else if (
    ['mensuel', 'hebdo'].includes(user1Answers.q4_frequence) &&
    ['mensuel', 'hebdo'].includes(user2Answers.q4_frequence)
  ) {
    score += 15;
  }

  // Q5: Après rencontre (20 points)
  if (user1Answers.q5_apres_rencontre === user2Answers.q5_apres_rencontre) {
    score += 20;
  }

  // Q6: Safe sex (50 points - CRITIQUE)
  if (user1Answers.q6_safe_sex === user2Answers.q6_safe_sex) {
    score += 50;
  } else if (
    user1Answers.q6_safe_sex === 'priorite_non_negociable' &&
    ['important_flexible', 'a_discuter'].includes(user2Answers.q6_safe_sex)
  ) {
    score += 25; // Compatible mais pas idéal
  } else if (
    user2Answers.q6_safe_sex === 'priorite_non_negociable' &&
    ['important_flexible', 'a_discuter'].includes(user1Answers.q6_safe_sex)
  ) {
    score += 25;
  }

  // ============================================
  // CATÉGORIE 2: MODE DE VIE (150 points max)
  // ============================================

  // Q7: Hygiène (40 points)
  if (user1Answers.q7_hygiene === user2Answers.q7_hygiene) {
    score += 40;
  } else if (
    ['tres_strict', 'important'].includes(user1Answers.q7_hygiene) &&
    ['tres_strict', 'important'].includes(user2Answers.q7_hygiene)
  ) {
    score += 20;
  }

  // Q8: Tabac (30 points)
  if (user1Answers.q8_tabac === user2Answers.q8_tabac) {
    score += 30;
  } else if (
    user1Answers.q8_tabac === 'non_fumeur_ok' &&
    user2Answers.q8_tabac === 'fumeur'
  ) {
    score += 20; // Compatible
  } else if (
    user2Answers.q8_tabac === 'non_fumeur_ok' &&
    user1Answers.q8_tabac === 'fumeur'
  ) {
    score += 20;
  } else if (
    user1Answers.q8_tabac === 'non_fumeur_pas_ok' &&
    user2Answers.q8_tabac === 'fumeur'
  ) {
    score -= 50; // INCOMPATIBLE
  } else if (
    user2Answers.q8_tabac === 'non_fumeur_pas_ok' &&
    user1Answers.q8_tabac === 'fumeur'
  ) {
    score -= 50; // INCOMPATIBLE
  }

  // Q9: Alcool (30 points)
  if (user1Answers.q9_alcool === user2Answers.q9_alcool) {
    score += 30;
  } else if (
    ['sobre', 'quelques_verres'].includes(user1Answers.q9_alcool) &&
    ['sobre', 'quelques_verres'].includes(user2Answers.q9_alcool)
  ) {
    score += 15;
  }

  // Q10: Rythme de vie (50 points)
  if (user1Answers.q10_rythme === user2Answers.q10_rythme) {
    score += 50;
  } else if (
    user1Answers.q10_rythme === 'flexible' ||
    user2Answers.q10_rythme === 'flexible'
  ) {
    score += 25;
  }

  // ============================================
  // NOUVELLES QUESTIONS (si présentes)
  // ============================================

  // Q11: Communication (30 points)
  if (user1Answers.q11_communication && user2Answers.q11_communication) {
    if (user1Answers.q11_communication === user2Answers.q11_communication) {
      score += 30;
    }
  }

  // Q12: Ambiance (30 points)
  if (user1Answers.q12_ambiance && user2Answers.q12_ambiance) {
    if (user1Answers.q12_ambiance === user2Answers.q12_ambiance) {
      score += 30;
    }
  }

  // Q13: Expérience groupe (40 points)
  if (user1Answers.q13_experience_groupe && user2Answers.q13_experience_groupe) {
    if (user1Answers.q13_experience_groupe === user2Answers.q13_experience_groupe) {
      score += 40;
    } else if (
      ['debutant', 'quelques_fois'].includes(user1Answers.q13_experience_groupe) &&
      ['debutant', 'quelques_fois'].includes(user2Answers.q13_experience_groupe)
    ) {
      score += 20;
    }
  }

  // Q14: Boundaries (50 points - CRITIQUE)
  if (user1Answers.q14_boundaries && user2Answers.q14_boundaries) {
    if (user1Answers.q14_boundaries === user2Answers.q14_boundaries) {
      score += 50;
    } else if (
      user1Answers.q14_boundaries === 'tres_important' ||
      user2Answers.q14_boundaries === 'tres_important'
    ) {
      // Si l'un est très strict, on pénalise si l'autre ne l'est pas
      if (user1Answers.q14_boundaries !== user2Answers.q14_boundaries) {
        score -= 30;
      }
    }
  }

  // Q15: Lieu (20 points)
  if (user1Answers.q15_lieu && user2Answers.q15_lieu) {
    if (user1Answers.q15_lieu === user2Answers.q15_lieu) {
      score += 20;
    }
  }

  // S'assurer que le score ne dépasse pas le maximum
  if (score > maxScore) {
    score = maxScore;
  }

  // S'assurer que le score n'est pas négatif
  if (score < 0) {
    score = 0;
  }

  return score;
}

/**
 * Calcule le score de match complet (compatibilité + proximité + préférences)
 */
export function computeMatchScore(me, other, radiusKm, compatibilityScore = null) {
  let score = 0;

  // 1) Score de compatibilité du questionnaire (max 1000 points)
  // C'est le facteur le plus important
  if (compatibilityScore !== null) {
    score += compatibilityScore;
  }

  // 2) Proximité géographique (max 100 points si très proche)
  const d = distanceKm(me.lat, me.lng, other.lat, other.lng);
  if (d != null) {
    const maxRadius = radiusKm || 50;
    const clamped = Math.max(0, Math.min(maxRadius, d));
    const distanceFactor = 1 - clamped / maxRadius; // 1 proche, 0 loin
    score += Math.round(distanceFactor * 100);
  }

  // 3) Préférences de genre mutuelles (max 50 points)
  const meWantsOther = isWantedGender(me.looking_for_gender, other.gender);
  const otherWantsMe = isWantedGender(other.looking_for_gender, me.gender);

  if (meWantsOther && otherWantsMe) {
    score += 50;
  } else if (meWantsOther || otherWantsMe) {
    score += 25;
  }

  // 4) Intention de rencontre (max 30 points)
  if (me.main_intent && other.main_intent) {
    if (me.main_intent === other.main_intent) {
      score += 30;
    } else if (me.main_intent === 'both' || other.main_intent === 'both') {
      score += 15;
    }
  }

  return score;
}

/**
 * Obtient le niveau de compatibilité en pourcentage
 */
export function getCompatibilityLevel(score, maxScore = 1000) {
  const percentage = (score / maxScore) * 100;

  if (percentage >= 80) {
    return { level: 'excellent', label: 'Excellente compatibilité', color: '#10b981' };
  } else if (percentage >= 60) {
    return { level: 'good', label: 'Bonne compatibilité', color: '#22c55e' };
  } else if (percentage >= 40) {
    return { level: 'fair', label: 'Compatibilité correcte', color: '#eab308' };
  } else if (percentage >= 20) {
    return { level: 'low', label: 'Compatibilité faible', color: '#f97316' };
  } else {
    return { level: 'very_low', label: 'Compatibilité très faible', color: '#ef4444' };
  }
}

