export const CUPID_AVATAR_COUNT = 263;

// Mapping des répertoires et leurs images disponibles
const CUPID_CATEGORIES = {
  Ghostz: [138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 176, 177, 178, 179, 180, 181, 182, 183, 245, 246, 247, 248, 249, 250, 251, 252, 253, 254, 255, 262, 263],
  Happyz: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 238],
  Lovers: [31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 194, 195, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212],
  Minderz: [61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 220, 221, 222, 223, 224, 237, 239, 240, 241, 242, 243, 244],
  Powerz: [256, 257, 258, 259, 260, 261],
  Sexyz: [91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 196, 197, 198, 199, 200, 213, 214, 215, 216, 217, 218, 219, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236],
};

// Retourne un chemin vers un avatar aléatoire
export function getRandomCupidAvatarPath() {
  // Utiliser un nombre aléatoire entre 1 et 263 (nombre total d'avatars)
  const randomNum = Math.floor(Math.random() * CUPID_AVATAR_COUNT) + 1;
  return `/cupids/${String(randomNum).padStart(3, '0')}.png`;
}

/**
 * Détermine le profil Cupid basé sur les réponses au questionnaire
 * @param {Object} answers - Les réponses au questionnaire de matchmaking
 * @returns {string} - Le nom du répertoire (Ghostz, Happyz, Lovers, Minderz, Powerz, Sexyz)
 */
export function determineCupidProfile(answers) {
  if (!answers || Object.keys(answers).length === 0) {
    // Si pas de réponses, retourner aléatoire
    const categories = Object.keys(CUPID_CATEGORIES);
    return categories[Math.floor(Math.random() * categories.length)];
  }

  let scores = {
    Ghostz: 0,    // Mystérieux, discret, anonyme
    Happyz: 0,    // Joyeux, positif, détendu
    Lovers: 0,    // Romantique, relationnel, émotionnel
    Minderz: 0,   // Réfléchi, prudent, boundaries
    Powerz: 0,  // Dominant, confiant, expérimenté
    Sexyz: 0,    // Sensuel, direct, one-shot
  };

  // Q1: Type de lien recherché
  if (answers.q1_type_lien) {
    switch (answers.q1_type_lien) {
      case 'ponctuel':
        scores.Sexyz += 3;
        scores.Ghostz += 1;
        break;
      case 'regulier_sans_etiquette':
        scores.Lovers += 2;
        scores.Happyz += 1;
        break;
      case 'exclusive':
        scores.Lovers += 3;
        scores.Minderz += 1;
        break;
      case 'poly_ouvert':
        scores.Powerz += 2;
        scores.Lovers += 1;
        break;
      case 'ouvert_a_tout':
        scores.Happyz += 2;
        scores.Lovers += 1;
        break;
    }
  }

  // Q2: One-shot
  if (answers.q2_one_shot) {
    switch (answers.q2_one_shot) {
      case 'oui':
        scores.Sexyz += 3;
        scores.Ghostz += 1;
        break;
      case 'plutot_oui':
        scores.Sexyz += 2;
        scores.Happyz += 1;
        break;
      case 'plutot_non':
        scores.Lovers += 2;
        scores.Minderz += 1;
        break;
      case 'non':
        scores.Lovers += 3;
        scores.Minderz += 2;
        break;
    }
  }

  // Q3: Identité minimale
  if (answers.q3_identite_min) {
    switch (answers.q3_identite_min) {
      case 'quasi_anon':
        scores.Ghostz += 3;
        scores.Sexyz += 1;
        break;
      case 'prenom_quelques_infos':
        scores.Happyz += 2;
        scores.Minderz += 1;
        break;
      case 'identite_plus_claire':
        scores.Lovers += 2;
        scores.Minderz += 2;
        break;
    }
  }

  // Q4: Fréquence
  if (answers.q4_frequence) {
    switch (answers.q4_frequence) {
      case 'tres_ponctuel':
        scores.Ghostz += 2;
        scores.Sexyz += 1;
        break;
      case 'mensuel':
        scores.Minderz += 2;
        scores.Lovers += 1;
        break;
      case 'hebdo':
        scores.Lovers += 2;
        scores.Happyz += 1;
        break;
      case 'plus_souvent':
        scores.Powerz += 2;
        scores.Sexyz += 1;
        break;
    }
  }

  // Q5: Après chat en ligne
  if (answers.q5_apres_rencontre) {
    switch (answers.q5_apres_rencontre) {
      case 'chacun_chez_soi':
        scores.Ghostz += 2;
        scores.Sexyz += 1;
        break;
      case 'petit_debrief':
        scores.Happyz += 2;
        scores.Minderz += 1;
        break;
      case 'papoter_suite':
        scores.Lovers += 3;
        scores.Happyz += 1;
        break;
    }
  }

  // Q6: Safe sex (critique)
  if (answers.q6_safe_sex) {
    switch (answers.q6_safe_sex) {
      case 'priorite_non_negociable':
        scores.Minderz += 3;
        scores.Lovers += 1;
        break;
      case 'important_flexible':
        scores.Minderz += 2;
        scores.Happyz += 1;
        break;
      case 'a_discuter':
        scores.Sexyz += 1;
        scores.Powerz += 1;
        break;
    }
  }

  // Q7: Hygiène
  if (answers.q7_hygiene) {
    switch (answers.q7_hygiene) {
      case 'tres_strict':
        scores.Minderz += 2;
        scores.Powerz += 1;
        break;
      case 'important':
        scores.Minderz += 1;
        scores.Happyz += 1;
        break;
      case 'relax':
        scores.Ghostz += 1;
        scores.Sexyz += 1;
        break;
    }
  }

  // Q8: Tabac
  if (answers.q8_tabac) {
    switch (answers.q8_tabac) {
      case 'non_fumeur_pas_ok':
        scores.Minderz += 2;
        break;
      case 'non_fumeur_ok':
        scores.Happyz += 1;
        break;
      case 'fumeur':
        scores.Ghostz += 1;
        scores.Sexyz += 1;
        break;
    }
  }

  // Q9: Alcool
  if (answers.q9_alcool) {
    switch (answers.q9_alcool) {
      case 'sobre':
        scores.Minderz += 2;
        break;
      case 'quelques_verres':
        scores.Happyz += 2;
        scores.Lovers += 1;
        break;
      case 'festif':
        scores.Sexyz += 2;
        scores.Powerz += 1;
        break;
    }
  }

  // Q10: Rythme de vie
  if (answers.q10_rythme) {
    switch (answers.q10_rythme) {
      case 'tres_matin':
        scores.Minderz += 2;
        break;
      case 'flexible':
        scores.Happyz += 2;
        break;
      case 'noctambule':
        scores.Ghostz += 2;
        scores.Sexyz += 1;
        break;
    }
  }

  // Q11: Communication
  if (answers.q11_communication) {
    switch (answers.q11_communication) {
      case 'minimal':
        scores.Ghostz += 2;
        break;
      case 'modere':
        scores.Happyz += 2;
        scores.Minderz += 1;
        break;
      case 'beaucoup':
        scores.Lovers += 3;
        scores.Happyz += 1;
        break;
    }
  }

  // Q12: Ambiance
  if (answers.q12_ambiance) {
    switch (answers.q12_ambiance) {
      case 'intime_discret':
        scores.Ghostz += 2;
        scores.Minderz += 1;
        break;
      case 'detendue':
        scores.Happyz += 3;
        scores.Lovers += 1;
        break;
      case 'festive':
        scores.Sexyz += 2;
        scores.Powerz += 1;
        break;
      case 'variee':
        scores.Powerz += 2;
        scores.Happyz += 1;
        break;
    }
  }

  // Q13: Expérience groupe
  if (answers.q13_experience_groupe) {
    switch (answers.q13_experience_groupe) {
      case 'debutant':
        scores.Minderz += 2;
        scores.Lovers += 1;
        break;
      case 'quelques_fois':
        scores.Happyz += 2;
        break;
      case 'experimente':
        scores.Powerz += 3;
        scores.Sexyz += 1;
        break;
    }
  }

  // Q14: Boundaries
  if (answers.q14_boundaries) {
    switch (answers.q14_boundaries) {
      case 'tres_important':
        scores.Minderz += 3;
        break;
      case 'important':
        scores.Minderz += 2;
        scores.Lovers += 1;
        break;
      case 'flexible':
        scores.Sexyz += 1;
        scores.Powerz += 1;
        break;
    }
  }

  // Q15: Lieu
  if (answers.q15_lieu) {
    switch (answers.q15_lieu) {
      case 'chez_moi':
        scores.Powerz += 2;
        scores.Lovers += 1;
        break;
      case 'chez_lui':
        scores.Lovers += 2;
        scores.Minderz += 1;
        break;
      case 'lieu_neutre':
        scores.Minderz += 2;
        scores.Ghostz += 1;
        break;
      case 'peu_importe':
        scores.Happyz += 2;
        scores.Sexyz += 1;
        break;
    }
  }

  // Trouver la catégorie avec le score le plus élevé
  let maxScore = -1;
  let selectedCategory = 'Happyz'; // Par défaut

  for (const [category, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      selectedCategory = category;
    }
  }

  return selectedCategory;
}

/**
 * Sélectionne un avatar aléatoire dans une catégorie spécifique
 * @param {string} category - Le nom du répertoire (Ghostz, Happyz, Lovers, etc.)
 * @returns {string} - Le chemin de l'avatar (ex: "/cupids/138.png")
 */
export function getCupidAvatarByCategory(category) {
  const images = CUPID_CATEGORIES[category] || CUPID_CATEGORIES.Happyz;
  const randomIndex = Math.floor(Math.random() * images.length);
  const imageNumber = images[randomIndex];
  return `/cupids/${String(imageNumber).padStart(3, '0')}.png`;
}

/**
 * Obtient un avatar basé sur les réponses au questionnaire
 * @param {Object} answers - Les réponses au questionnaire
 * @returns {string} - Le chemin de l'avatar
 */
export function getCupidAvatarFromAnswers(answers) {
  const category = determineCupidProfile(answers);
  return getCupidAvatarByCategory(category);
}

/**
 * Obtient tous les avatars disponibles dans une catégorie
 * @param {string} category - Le nom du répertoire
 * @returns {Array<string>} - Liste des chemins d'avatars
 */
export function getCupidAvatarsByCategory(category) {
  const images = CUPID_CATEGORIES[category] || [];
  return images.map((num) => `/cupids/${String(num).padStart(3, '0')}.png`);
}

/**
 * Obtient N avatars aléatoires de toutes les catégories
 * @param {number} count - Le nombre d'avatars à retourner (par défaut 5)
 * @returns {Array<string>} - Liste des chemins d'avatars
 */
export function getRandomCupidAvatars(count = 5) {
  const allAvatars = [];
  
  // Collecter tous les avatars de toutes les catégories
  for (const [category, images] of Object.entries(CUPID_CATEGORIES)) {
    for (const num of images) {
      allAvatars.push(`/cupids/${String(num).padStart(3, '0')}.png`);
    }
  }
  
  // Mélanger le tableau (Fisher-Yates shuffle)
  for (let i = allAvatars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allAvatars[i], allAvatars[j]] = [allAvatars[j], allAvatars[i]];
  }
  
  // Retourner les N premiers
  return allAvatars.slice(0, count);
}

/**
 * Obtient un avatar aléatoire avec son chemin correct
 * @returns {string} - Le chemin de l'avatar
 */
export function getRandomCupidAvatar() {
  // Utiliser un nombre aléatoire entre 1 et 263 (nombre total d'avatars)
  const randomNum = Math.floor(Math.random() * CUPID_AVATAR_COUNT) + 1;
  return `/cupids/${String(randomNum).padStart(3, '0')}.png`;
}
