-- ============================================
-- Création du bucket Storage pour Push Éclair
-- ============================================

-- 1. Créer le bucket 'push_eclair' (si il n'existe pas déjà)
-- Note: Si cette commande échoue, crée le bucket manuellement via l'interface Supabase
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'push_eclair') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'push_eclair',
      'push_eclair',
      true,
      5242880, -- 5 MB en octets
      ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    );
  END IF;
END $$;

-- ============================================
-- POLITIQUES RLS POUR LE BUCKET push_eclair
-- ============================================

-- Supprimer les politiques existantes si elles existent (pour éviter les doublons)
DROP POLICY IF EXISTS "Users can upload push eclair images" ON storage.objects;
DROP POLICY IF EXISTS "Users can read push eclair images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own push eclair images" ON storage.objects;

-- Politique 1: Permettre à tous les utilisateurs authentifiés d'uploader des images
-- Le path est de la forme: pushes/{user_id}/{timestamp}.{ext}
CREATE POLICY "Users can upload push eclair images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'push_eclair' AND
  split_part(name, '/', 2) = auth.uid()::text
);

-- Politique 2: Permettre à tous les utilisateurs authentifiés de lire les images
CREATE POLICY "Users can read push eclair images"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'push_eclair');

-- Politique 3: Permettre aux utilisateurs de supprimer leurs propres images
-- Le path est de la forme: pushes/{user_id}/{timestamp}.{ext}
CREATE POLICY "Users can delete their own push eclair images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'push_eclair' AND
  split_part(name, '/', 2) = auth.uid()::text
);

-- ============================================
-- INSTRUCTIONS POUR CRÉER LE BUCKET
-- ============================================
-- 
-- Le bucket doit être créé manuellement via l'interface Supabase :
-- 
-- 1. Va sur https://supabase.com/dashboard
-- 2. Sélectionne ton projet
-- 3. Va dans "Storage" dans le menu de gauche
-- 4. Clique sur "New bucket"
-- 5. Configure le bucket :
--    - Name: push_eclair
--    - Public bucket: ✅ OUI (pour que les images soient accessibles publiquement)
--    - File size limit: 5 MB (ou selon tes besoins)
--    - Allowed MIME types: image/jpeg, image/png, image/webp, image/gif
-- 6. Clique sur "Create bucket"
-- 
-- OU via SQL (si tu as les droits admin) :
-- 
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--   'push_eclair',
--   'push_eclair',
--   true,
--   5242880, -- 5 MB en octets
--   ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
-- );
-- 
-- ============================================

