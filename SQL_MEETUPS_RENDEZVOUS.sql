-- ============================================
-- Tables pour le système de rendez-vous de groupe
-- ============================================
-- 
-- Ce script crée les tables nécessaires pour permettre aux groupes
-- de proposer, valider et gérer des rendez-vous avec date et lieu.
--
-- À exécuter dans Supabase SQL Editor
-- ============================================

-- Table principale des rendez-vous proposés
CREATE TABLE IF NOT EXISTS group_meetups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  proposer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Informations du rendez-vous
  proposed_date TIMESTAMPTZ NOT NULL,
  proposed_location TEXT NOT NULL,
  proposed_location_details TEXT, -- Adresse complète, instructions, etc.
  
  -- Statut global du rendez-vous
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'confirmed', 'cancelled', 'completed'
  
  -- Date confirmée (peut différer de proposed_date si modifiée)
  confirmed_date TIMESTAMPTZ,
  confirmed_location TEXT,
  confirmed_location_details TEXT,
  
  -- Métadonnées
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  
  CONSTRAINT valid_status CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed'))
);

-- Table des réponses des participants
CREATE TABLE IF NOT EXISTS group_meetup_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meetup_id UUID NOT NULL REFERENCES group_meetups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Type de réponse
  response_type VARCHAR(20) NOT NULL, -- 'accepted', 'declined', 'counter_proposal'
  
  -- Si counter_proposal, ces champs sont remplis
  counter_date TIMESTAMPTZ,
  counter_location TEXT,
  counter_location_details TEXT,
  
  -- Message optionnel
  message TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_response_type CHECK (response_type IN ('accepted', 'declined', 'counter_proposal')),
  CONSTRAINT unique_user_meetup UNIQUE (meetup_id, user_id)
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_group_meetups_conversation ON group_meetups(conversation_id);
CREATE INDEX IF NOT EXISTS idx_group_meetups_proposer ON group_meetups(proposer_user_id);
CREATE INDEX IF NOT EXISTS idx_group_meetups_status ON group_meetups(status);
CREATE INDEX IF NOT EXISTS idx_group_meetups_date ON group_meetups(proposed_date);
CREATE INDEX IF NOT EXISTS idx_group_meetups_confirmed_date ON group_meetups(confirmed_date) WHERE confirmed_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_meetup_responses_meetup ON group_meetup_responses(meetup_id);
CREATE INDEX IF NOT EXISTS idx_meetup_responses_user ON group_meetup_responses(user_id);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_group_meetups_updated_at
  BEFORE UPDATE ON group_meetups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_group_meetup_responses_updated_at
  BEFORE UPDATE ON group_meetup_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour confirmer un rendez-vous quand tous les participants actifs ont accepté
CREATE OR REPLACE FUNCTION check_meetup_confirmation()
RETURNS TRIGGER AS $$
DECLARE
  v_meetup_id UUID;
  v_conversation_id UUID;
  v_active_participants_count INTEGER;
  v_accepted_count INTEGER;
BEGIN
  -- Si c'est une mise à jour vers 'accepted', vérifier si on peut confirmer
  IF NEW.response_type = 'accepted' THEN
    v_meetup_id := NEW.meetup_id;
    
    -- Récupérer la conversation
    SELECT conversation_id INTO v_conversation_id
    FROM group_meetups
    WHERE id = v_meetup_id;
    
    -- Compter les participants actifs du groupe
    SELECT COUNT(*) INTO v_active_participants_count
    FROM conversation_participants
    WHERE conversation_id = v_conversation_id
      AND active = true;
    
    -- Compter les acceptations
    SELECT COUNT(*) INTO v_accepted_count
    FROM group_meetup_responses
    WHERE meetup_id = v_meetup_id
      AND response_type = 'accepted';
    
    -- Si tous les participants actifs ont accepté, confirmer le rendez-vous
    IF v_accepted_count >= v_active_participants_count THEN
      UPDATE group_meetups
      SET 
        status = 'confirmed',
        confirmed_date = COALESCE(confirmed_date, proposed_date),
        confirmed_location = COALESCE(confirmed_location, proposed_location),
        confirmed_location_details = COALESCE(confirmed_location_details, proposed_location_details),
        confirmed_at = NOW()
      WHERE id = v_meetup_id
        AND status = 'pending';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_meetup_confirmation_trigger
  AFTER INSERT OR UPDATE ON group_meetup_responses
  FOR EACH ROW
  EXECUTE FUNCTION check_meetup_confirmation();

-- Fonction RPC pour proposer un rendez-vous
CREATE OR REPLACE FUNCTION propose_group_meetup(
  p_conversation_id UUID,
  p_proposer_user_id UUID,
  p_proposed_date TIMESTAMPTZ,
  p_proposed_location TEXT,
  p_proposed_location_details TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_meetup_id UUID;
BEGIN
  -- Vérifier que l'utilisateur est bien participant actif
  IF NOT EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = p_conversation_id
      AND user_id = p_proposer_user_id
      AND active = true
  ) THEN
    RAISE EXCEPTION 'Utilisateur non participant de cette conversation';
  END IF;
  
  -- Vérifier que la conversation est un groupe
  IF NOT EXISTS (
    SELECT 1 FROM conversations
    WHERE id = p_conversation_id
      AND is_group = true
  ) THEN
    RAISE EXCEPTION 'Cette conversation n''est pas un groupe';
  END IF;
  
  -- Créer le rendez-vous
  INSERT INTO group_meetups (
    conversation_id,
    proposer_user_id,
    proposed_date,
    proposed_location,
    proposed_location_details
  )
  VALUES (
    p_conversation_id,
    p_proposer_user_id,
    p_proposed_date,
    p_proposed_location,
    p_proposed_location_details
  )
  RETURNING id INTO v_meetup_id;
  
  RETURN v_meetup_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction RPC pour répondre à un rendez-vous
CREATE OR REPLACE FUNCTION respond_to_meetup(
  p_meetup_id UUID,
  p_user_id UUID,
  p_response_type VARCHAR(20),
  p_counter_date TIMESTAMPTZ DEFAULT NULL,
  p_counter_location TEXT DEFAULT NULL,
  p_counter_location_details TEXT DEFAULT NULL,
  p_message TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_conversation_id UUID;
BEGIN
  -- Vérifier que l'utilisateur est participant
  SELECT conversation_id INTO v_conversation_id
  FROM group_meetups
  WHERE id = p_meetup_id;
  
  IF NOT EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = v_conversation_id
      AND user_id = p_user_id
      AND active = true
  ) THEN
    RAISE EXCEPTION 'Utilisateur non participant de cette conversation';
  END IF;
  
  -- Insérer ou mettre à jour la réponse
  INSERT INTO group_meetup_responses (
    meetup_id,
    user_id,
    response_type,
    counter_date,
    counter_location,
    counter_location_details,
    message
  )
  VALUES (
    p_meetup_id,
    p_user_id,
    p_response_type,
    p_counter_date,
    p_counter_location,
    p_counter_location_details,
    p_message
  )
  ON CONFLICT (meetup_id, user_id)
  DO UPDATE SET
    response_type = EXCLUDED.response_type,
    counter_date = EXCLUDED.counter_date,
    counter_location = EXCLUDED.counter_location,
    counter_location_details = EXCLUDED.counter_location_details,
    message = EXCLUDED.message,
    updated_at = NOW();
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction RPC pour accepter une contre-proposition et confirmer
CREATE OR REPLACE FUNCTION accept_counter_proposal(
  p_meetup_id UUID,
  p_counter_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_counter_date TIMESTAMPTZ;
  v_counter_location TEXT;
  v_counter_location_details TEXT;
BEGIN
  -- Récupérer la contre-proposition
  SELECT counter_date, counter_location, counter_location_details
  INTO v_counter_date, v_counter_location, v_counter_location_details
  FROM group_meetup_responses
  WHERE meetup_id = p_meetup_id
    AND user_id = p_counter_user_id
    AND response_type = 'counter_proposal';
  
  IF v_counter_date IS NULL THEN
    RAISE EXCEPTION 'Aucune contre-proposition trouvée';
  END IF;
  
  -- Mettre à jour le rendez-vous avec la contre-proposition
  UPDATE group_meetups
  SET
    proposed_date = v_counter_date,
    proposed_location = v_counter_location,
    proposed_location_details = v_counter_location_details,
    updated_at = NOW()
  WHERE id = p_meetup_id;
  
  -- Transformer la contre-proposition en acceptation
  UPDATE group_meetup_responses
  SET
    response_type = 'accepted',
    counter_date = NULL,
    counter_location = NULL,
    counter_location_details = NULL,
    updated_at = NOW()
  WHERE meetup_id = p_meetup_id
    AND user_id = p_counter_user_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Vues utiles
-- ============================================

-- Vue pour récupérer les rendez-vous avec leurs réponses
CREATE OR REPLACE VIEW group_meetups_with_responses AS
SELECT 
  m.*,
  COUNT(DISTINCT r.id) FILTER (WHERE r.response_type = 'accepted') as accepted_count,
  COUNT(DISTINCT r.id) FILTER (WHERE r.response_type = 'declined') as declined_count,
  COUNT(DISTINCT r.id) FILTER (WHERE r.response_type = 'counter_proposal') as counter_proposal_count,
  COUNT(DISTINCT cp.user_id) FILTER (WHERE cp.active = true) as total_participants
FROM group_meetups m
LEFT JOIN group_meetup_responses r ON r.meetup_id = m.id
LEFT JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id
GROUP BY m.id;

-- ============================================
-- Permissions (Row Level Security)
-- ============================================
-- 
-- À configurer selon tes besoins de sécurité
-- Les utilisateurs doivent pouvoir voir les rendez-vous de leurs groupes
-- et répondre aux rendez-vous de leurs groupes

