-- ============================================
-- Migration des conversations vers conversation_participants
-- ============================================
-- 
-- Ce script migre les conversations 1-à-1 existantes qui n'ont pas
-- encore d'entrée dans conversation_participants.
--
-- À exécuter dans Supabase SQL Editor
-- ============================================

-- Étape 1 : Créer les entrées pour user_id_1
INSERT INTO conversation_participants (conversation_id, user_id, active)
SELECT DISTINCT
  c.id as conversation_id,
  c.user_id_1 as user_id,
  true as active
FROM conversations c
WHERE c.is_group = false
  AND c.user_id_1 IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 
    FROM conversation_participants cp 
    WHERE cp.conversation_id = c.id 
      AND cp.user_id = c.user_id_1
  );

-- Étape 2 : Créer les entrées pour user_id_2
INSERT INTO conversation_participants (conversation_id, user_id, active)
SELECT DISTINCT
  c.id as conversation_id,
  c.user_id_2 as user_id,
  true as active
FROM conversations c
WHERE c.is_group = false
  AND c.user_id_2 IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 
    FROM conversation_participants cp 
    WHERE cp.conversation_id = c.id 
      AND cp.user_id = c.user_id_2
  );

-- ============================================
-- Vérification (optionnel)
-- ============================================
-- 
-- Pour vérifier que la migration a bien fonctionné :
--
-- SELECT 
--   c.id,
--   c.user_id_1,
--   c.user_id_2,
--   COUNT(cp.id) as participants_count
-- FROM conversations c
-- LEFT JOIN conversation_participants cp ON cp.conversation_id = c.id
-- WHERE c.is_group = false
-- GROUP BY c.id, c.user_id_1, c.user_id_2
-- HAVING COUNT(cp.id) < 2;
--
-- Cette requête devrait retourner 0 lignes si tout est correct
-- (chaque conversation 1-à-1 doit avoir 2 participants)
-- ============================================




