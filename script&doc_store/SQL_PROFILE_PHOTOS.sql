-- ============================================
-- Table pour les photos de profil multiples
-- ============================================
-- 
-- Permet aux utilisateurs d'avoir jusqu'à 5 photos publiques
-- avec une photo principale
--
-- À exécuter dans Supabase SQL Editor
-- ============================================

-- Table des photos de profil
CREATE TABLE IF NOT EXISTS profile_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  is_main BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_main_photo_per_profile UNIQUE (profile_id, is_main) DEFERRABLE INITIALLY DEFERRED
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_profile_photos_profile ON profile_photos(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_photos_main ON profile_photos(profile_id, is_main) WHERE is_main = true;
CREATE INDEX IF NOT EXISTS idx_profile_photos_order ON profile_photos(profile_id, display_order);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_profile_photos_updated_at
  BEFORE UPDATE ON profile_photos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour s'assurer qu'il n'y a qu'une seule photo principale
CREATE OR REPLACE FUNCTION ensure_single_main_photo()
RETURNS TRIGGER AS $$
BEGIN
  -- Si on définit une photo comme principale, désactiver les autres
  IF NEW.is_main = true THEN
    UPDATE profile_photos
    SET is_main = false
    WHERE profile_id = NEW.profile_id
      AND id != NEW.id
      AND is_main = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_main_photo_trigger
  BEFORE INSERT OR UPDATE ON profile_photos
  FOR EACH ROW
  WHEN (NEW.is_main = true)
  EXECUTE FUNCTION ensure_single_main_photo();

-- Fonction pour limiter à 5 photos maximum par profil
CREATE OR REPLACE FUNCTION limit_profile_photos()
RETURNS TRIGGER AS $$
DECLARE
  photo_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO photo_count
  FROM profile_photos
  WHERE profile_id = NEW.profile_id;
  
  IF photo_count >= 5 THEN
    RAISE EXCEPTION 'Un profil ne peut avoir que 5 photos maximum';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER limit_profile_photos_trigger
  BEFORE INSERT ON profile_photos
  FOR EACH ROW
  EXECUTE FUNCTION limit_profile_photos();

-- Fonction RPC pour définir une photo comme principale
CREATE OR REPLACE FUNCTION set_main_photo(
  p_photo_id UUID,
  p_profile_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Vérifier que la photo appartient au profil
  IF NOT EXISTS (
    SELECT 1 FROM profile_photos
    WHERE id = p_photo_id
      AND profile_id = p_profile_id
  ) THEN
    RAISE EXCEPTION 'Photo non trouvée ou n''appartient pas à ce profil';
  END IF;
  
  -- Désactiver toutes les autres photos principales
  UPDATE profile_photos
  SET is_main = false
  WHERE profile_id = p_profile_id
    AND id != p_photo_id;
  
  -- Activer cette photo comme principale
  UPDATE profile_photos
  SET is_main = true
  WHERE id = p_photo_id;
  
  -- Mettre à jour aussi main_photo_url dans profiles pour rétrocompatibilité
  UPDATE profiles
  SET main_photo_url = (SELECT photo_url FROM profile_photos WHERE id = p_photo_id)
  WHERE id = p_profile_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction RPC pour réorganiser l'ordre des photos
CREATE OR REPLACE FUNCTION reorder_profile_photos(
  p_profile_id UUID,
  p_photo_orders JSONB -- Format: [{"id": "uuid", "order": 0}, ...]
)
RETURNS BOOLEAN AS $$
DECLARE
  photo_item JSONB;
BEGIN
  FOR photo_item IN SELECT * FROM jsonb_array_elements(p_photo_orders)
  LOOP
    UPDATE profile_photos
    SET display_order = (photo_item->>'order')::INTEGER
    WHERE id = (photo_item->>'id')::UUID
      AND profile_id = p_profile_id;
  END LOOP;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

