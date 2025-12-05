# 📦 Création du bucket Supabase Storage pour les photos de profil

## Problème

L'erreur "Bucket not found" signifie que le bucket Supabase Storage `profile-photos` n'existe pas encore dans ton projet Supabase.

## Solution : Créer le bucket dans Supabase

### Option 1 : Via l'interface Supabase (Recommandé)

1. Va sur ton projet Supabase : https://supabase.com/dashboard
2. Dans le menu de gauche, clique sur **Storage**
3. Clique sur **New bucket** (ou **Créer un bucket**)
4. Configure le bucket :
   - **Name** : `profile-photos`
   - **Public bucket** : ✅ **OUI** (coché) - Les photos doivent être accessibles publiquement
   - **File size limit** : 5 MB (ou plus selon tes besoins)
   - **Allowed MIME types** : `image/jpeg, image/png, image/webp, image/gif` (optionnel, pour limiter les types de fichiers)
5. Clique sur **Create bucket**

### Option 2 : Via SQL (Recommandé pour la configuration complète)

Exécute le script `SQL_STORAGE_BUCKET.sql` dans le **SQL Editor** de Supabase. Ce script :
- Crée le bucket `profile-photos` (public, 5 MB max)
- Configure toutes les politiques de sécurité RLS nécessaires
- Permet aux utilisateurs d'uploader/supprimer uniquement leurs propres photos
- Permet à tous de lire les photos (bucket public)

**Avantage** : Configuration complète et sécurisée en une seule commande.

## Vérification

Après avoir créé le bucket :

1. Va dans **Storage** > **profile-photos**
2. Tu devrais voir un dossier vide (ou avec des photos si tu en as déjà uploadées)
3. Essaie d'uploader une photo depuis l'application

## Structure des fichiers

Les photos seront stockées dans le bucket avec cette structure :
```
profile-photos/
  └── {user_id}/
      └── photos/
          ├── {timestamp}_0.jpg
          ├── {timestamp}_1.png
          └── ...
```

Chaque utilisateur a son propre dossier basé sur son `user_id`, ce qui facilite la gestion et la sécurité.

## Notes importantes

- **Bucket public** : Les photos sont accessibles publiquement via URL. C'est nécessaire pour afficher les photos dans l'application.
- **Sécurité** : Les politiques RLS (Row Level Security) garantissent que les utilisateurs ne peuvent modifier/supprimer que leurs propres photos.
- **Limite de taille** : 5 MB par défaut. Tu peux l'augmenter si nécessaire.
- **Types de fichiers** : Seules les images sont autorisées (JPEG, PNG, WebP, GIF).

## Dépannage

Si tu as toujours des erreurs après avoir créé le bucket :

1. Vérifie que le bucket s'appelle exactement `profile-photos` (sans espaces, avec un tiret)
2. Vérifie que le bucket est bien **public**
3. Vérifie que les politiques RLS sont bien créées
4. Vérifie que l'utilisateur est bien authentifié lors de l'upload

