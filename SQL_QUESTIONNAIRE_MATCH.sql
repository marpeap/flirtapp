-- ============================================
-- Extension du système de questionnaire de match
-- ============================================
-- 
-- Ce script étend la structure existante pour supporter
-- un questionnaire complet avec calcul de compatibilité avancé.
--
-- À exécuter dans Supabase SQL Editor
-- ============================================

-- La table matchmaking_answers existe déjà avec :
-- - user_id (UUID, PK)
-- - answers (JSONB)
-- - created_at, updated_at

-- On va simplement utiliser le champ JSONB existant pour stocker
-- toutes les nouvelles réponses. Pas besoin de modifier la structure.

-- ============================================
-- Fonction pour calculer le score de compatibilité
-- ============================================

CREATE OR REPLACE FUNCTION compute_compatibility_score(
  p_user1_id UUID,
  p_user2_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_user1_answers JSONB;
  v_user2_answers JSONB;
  v_score INTEGER := 0;
  v_max_score INTEGER := 1000; -- Score maximum possible
BEGIN
  -- Récupérer les réponses des deux utilisateurs
  SELECT answers INTO v_user1_answers
  FROM matchmaking_answers
  WHERE user_id = p_user1_id;
  
  SELECT answers INTO v_user2_answers
  FROM matchmaking_answers
  WHERE user_id = p_user2_id;
  
  -- Si l'un des deux n'a pas rempli le questionnaire, retourner 0
  IF v_user1_answers IS NULL OR v_user2_answers IS NULL THEN
    RETURN 0;
  END IF;
  
  -- ============================================
  -- CATÉGORIE 1: INTENTIONS & VALEURS (200 points max)
  -- ============================================
  
  -- Q1: Type de lien recherché (50 points)
  IF v_user1_answers->>'q1_type_lien' = v_user2_answers->>'q1_type_lien' THEN
    v_score := v_score + 50;
  ELSIF (v_user1_answers->>'q1_type_lien' = 'ouvert_a_tout' OR 
         v_user2_answers->>'q1_type_lien' = 'ouvert_a_tout') THEN
    v_score := v_score + 25;
  END IF;
  
  -- Q2: One-shot (30 points)
  IF v_user1_answers->>'q2_one_shot' = v_user2_answers->>'q2_one_shot' THEN
    v_score := v_score + 30;
  ELSIF (v_user1_answers->>'q2_one_shot' IN ('plutot_oui', 'plutot_non') AND
         v_user2_answers->>'q2_one_shot' IN ('plutot_oui', 'plutot_non')) THEN
    v_score := v_score + 15;
  END IF;
  
  -- Q3: Identité minimale (20 points)
  IF v_user1_answers->>'q3_identite_min' = v_user2_answers->>'q3_identite_min' THEN
    v_score := v_score + 20;
  END IF;
  
  -- Q4: Fréquence (30 points)
  IF v_user1_answers->>'q4_frequence' = v_user2_answers->>'q4_frequence' THEN
    v_score := v_score + 30;
  ELSIF (v_user1_answers->>'q4_frequence' IN ('mensuel', 'hebdo') AND
         v_user2_answers->>'q4_frequence' IN ('mensuel', 'hebdo')) THEN
    v_score := v_score + 15;
  END IF;
  
  -- Q5: Après rencontre (20 points)
  IF v_user1_answers->>'q5_apres_rencontre' = v_user2_answers->>'q5_apres_rencontre' THEN
    v_score := v_score + 20;
  END IF;
  
  -- Q6: Safe sex (50 points - CRITIQUE)
  IF v_user1_answers->>'q6_safe_sex' = v_user2_answers->>'q6_safe_sex' THEN
    v_score := v_score + 50;
  ELSIF (v_user1_answers->>'q6_safe_sex' = 'priorite_non_negociable' AND
         v_user2_answers->>'q6_safe_sex' IN ('important_flexible', 'a_discuter')) THEN
    v_score := v_score + 25; -- Compatible mais pas idéal
  ELSIF (v_user2_answers->>'q6_safe_sex' = 'priorite_non_negociable' AND
         v_user1_answers->>'q6_safe_sex' IN ('important_flexible', 'a_discuter')) THEN
    v_score := v_score + 25;
  END IF;
  
  -- ============================================
  -- CATÉGORIE 2: MODE DE VIE (150 points max)
  -- ============================================
  
  -- Q7: Hygiène (40 points)
  IF v_user1_answers->>'q7_hygiene' = v_user2_answers->>'q7_hygiene' THEN
    v_score := v_score + 40;
  ELSIF (v_user1_answers->>'q7_hygiene' IN ('tres_strict', 'important') AND
         v_user2_answers->>'q7_hygiene' IN ('tres_strict', 'important')) THEN
    v_score := v_score + 20;
  END IF;
  
  -- Q8: Tabac (30 points)
  IF v_user1_answers->>'q8_tabac' = v_user2_answers->>'q8_tabac' THEN
    v_score := v_score + 30;
  ELSIF (v_user1_answers->>'q8_tabac' = 'non_fumeur_ok' AND
         v_user2_answers->>'q8_tabac' = 'fumeur') THEN
    v_score := v_score + 20; -- Compatible
  ELSIF (v_user2_answers->>'q8_tabac' = 'non_fumeur_ok' AND
         v_user1_answers->>'q8_tabac' = 'fumeur') THEN
    v_score := v_score + 20;
  ELSIF (v_user1_answers->>'q8_tabac' = 'non_fumeur_pas_ok' AND
         v_user2_answers->>'q8_tabac' = 'fumeur') THEN
    v_score := v_score - 50; -- INCOMPATIBLE
  ELSIF (v_user2_answers->>'q8_tabac' = 'non_fumeur_pas_ok' AND
         v_user1_answers->>'q8_tabac' = 'fumeur') THEN
    v_score := v_score - 50; -- INCOMPATIBLE
  END IF;
  
  -- Q9: Alcool (30 points)
  IF v_user1_answers->>'q9_alcool' = v_user2_answers->>'q9_alcool' THEN
    v_score := v_score + 30;
  ELSIF (v_user1_answers->>'q9_alcool' IN ('sobre', 'quelques_verres') AND
         v_user2_answers->>'q9_alcool' IN ('sobre', 'quelques_verres')) THEN
    v_score := v_score + 15;
  END IF;
  
  -- Q10: Rythme de vie (50 points)
  IF v_user1_answers->>'q10_rythme' = v_user2_answers->>'q10_rythme' THEN
    v_score := v_score + 50;
  ELSIF (v_user1_answers->>'q10_rythme' = 'flexible' OR
         v_user2_answers->>'q10_rythme' = 'flexible') THEN
    v_score := v_score + 25;
  END IF;
  
  -- ============================================
  -- NOUVELLES QUESTIONS (si ajoutées)
  -- ============================================
  
  -- Q11: Communication (si existe)
  IF v_user1_answers->>'q11_communication' IS NOT NULL AND
     v_user2_answers->>'q11_communication' IS NOT NULL THEN
    IF v_user1_answers->>'q11_communication' = v_user2_answers->>'q11_communication' THEN
      v_score := v_score + 30;
    END IF;
  END IF;
  
  -- Q12: Ambiance préférée (si existe)
  IF v_user1_answers->>'q12_ambiance' IS NOT NULL AND
     v_user2_answers->>'q12_ambiance' IS NOT NULL THEN
    IF v_user1_answers->>'q12_ambiance' = v_user2_answers->>'q12_ambiance' THEN
      v_score := v_score + 30;
    END IF;
  END IF;
  
  -- Q13: Expérience avec rencontres à plusieurs (si existe)
  IF v_user1_answers->>'q13_experience_groupe' IS NOT NULL AND
     v_user2_answers->>'q13_experience_groupe' IS NOT NULL THEN
    IF v_user1_answers->>'q13_experience_groupe' = v_user2_answers->>'q13_experience_groupe' THEN
      v_score := v_score + 40;
    ELSIF (v_user1_answers->>'q13_experience_groupe' IN ('debutant', 'quelques_fois') AND
           v_user2_answers->>'q13_experience_groupe' IN ('debutant', 'quelques_fois')) THEN
      v_score := v_score + 20;
    END IF;
  END IF;
  
  -- Q14: Limites et boundaries (si existe) - CRITIQUE
  IF v_user1_answers->>'q14_boundaries' IS NOT NULL AND
     v_user2_answers->>'q14_boundaries' IS NOT NULL THEN
    IF v_user1_answers->>'q14_boundaries' = v_user2_answers->>'q14_boundaries' THEN
      v_score := v_score + 50;
    ELSIF (v_user1_answers->>'q14_boundaries' = 'tres_important' OR
           v_user2_answers->>'q14_boundaries' = 'tres_important') THEN
      -- Si l'un est très strict, on pénalise si l'autre ne l'est pas
      IF v_user1_answers->>'q14_boundaries' != v_user2_answers->>'q14_boundaries' THEN
        v_score := v_score - 30;
      END IF;
    END IF;
  END IF;
  
  -- Q15: Préférences de lieu (si existe)
  IF v_user1_answers->>'q15_lieu' IS NOT NULL AND
     v_user2_answers->>'q15_lieu' IS NOT NULL THEN
    IF v_user1_answers->>'q15_lieu' = v_user2_answers->>'q15_lieu' THEN
      v_score := v_score + 20;
    END IF;
  END IF;
  
  -- S'assurer que le score ne dépasse pas le maximum
  IF v_score > v_max_score THEN
    v_score := v_max_score;
  END IF;
  
  -- S'assurer que le score n'est pas négatif
  IF v_score < 0 THEN
    v_score := 0;
  END IF;
  
  RETURN v_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Index pour améliorer les performances
-- ============================================

-- Index GIN sur le champ JSONB pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_matchmaking_answers_answers_gin 
ON matchmaking_answers USING GIN (answers);

-- ============================================
-- Vue pour faciliter les requêtes de compatibilité
-- ============================================

CREATE OR REPLACE VIEW user_compatibility_scores AS
SELECT 
  p1.user_id as user1_id,
  p2.user_id as user2_id,
  compute_compatibility_score(p1.user_id, p2.user_id) as compatibility_score
FROM profiles p1
CROSS JOIN profiles p2
WHERE p1.user_id != p2.user_id
  AND EXISTS (SELECT 1 FROM matchmaking_answers WHERE user_id = p1.user_id)
  AND EXISTS (SELECT 1 FROM matchmaking_answers WHERE user_id = p2.user_id);

