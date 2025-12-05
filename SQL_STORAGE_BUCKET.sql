-- ============================================
-- Création du bucket Storage pour les photos de profil
-- ============================================
-- 
-- Ce script crée le bucket "profile-photos" dans Supabase Storage
-- et configure les politiques de sécurité (RLS)
--
-- À exécuter dans Supabase SQL Editor
-- ============================================

-- Créer le bucket profile-photos
-- Note: Si le bucket existe déjà, cette commande échouera silencieusement
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-photos',
  'profile-photos',
  true,  -- Public pour que les photos soient accessibles publiquement
  5242880,  -- 5 MB en octets (tu peux augmenter si nécessaire)
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Politiques de sécurité (RLS)
-- ============================================

-- Supprimer les anciennes politiques si elles existent (pour éviter les doublons)
DROP POLICY IF EXISTS "Users can upload their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own photos" ON storage.objects;

-- Politique 1 : Permettre à tous les utilisateurs authentifiés d'uploader leurs propres photos
-- Les photos sont stockées dans {user_id}/photos/...
CREATE POLICY "Users can upload their own photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Politique 2 : Permettre à tous de lire les photos (puisque le bucket est public)
CREATE POLICY "Anyone can view photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-photos');

-- Politique 3 : Permettre aux utilisateurs de supprimer leurs propres photos
CREATE POLICY "Users can delete their own photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Politique 4 : Permettre aux utilisateurs de mettre à jour leurs propres photos
CREATE POLICY "Users can update their own photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- Vérification
-- ============================================
-- Pour vérifier que le bucket a été créé, exécute cette requête :
-- SELECT * FROM storage.buckets WHERE id = 'profile-photos';


