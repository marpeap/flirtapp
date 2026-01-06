# Configuration Supabase - Version Web

## Harmonisation avec la version mobile

Cette version web utilise maintenant la même instance Supabase que la version mobile pour permettre le partage des données entre les deux plateformes.

## Variables d'environnement requises

Créez un fichier `.env.local` à la racine du projet web avec les valeurs suivantes :

```env
# URL du projet Supabase (identique à la version mobile)
NEXT_PUBLIC_SUPABASE_URL=https://yomlhagujagscbsfxmyi.supabase.co

# Clé publique anonyme (identique à la version mobile)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvbWxoYWd1amFnc2Nic2Z4bXlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3ODI2MTAsImV4cCI6MjA4MjM1ODYxMH0.mjTVq122y4s4xD1ARTgYOTah_nt4IgXzXbQ5VeVSaGs

# Clé de service (pour les webhooks et opérations serveur uniquement)
# ⚠️ NE JAMAIS exposer cette clé côté client
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvbWxoYWd1amFnc2Nic2Z4bXlpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njc4MjYxMCwiZXhwIjoyMDgyMzU4NjEwfQ.ezt2ZuWhH9EXF91s5bohZffPG9qX85J2cRnBfUwFPzA
```

## Modifications apportées

### 1. Client Supabase harmonisé

Le fichier `lib/supabaseClient.js` a été mis à jour pour :
- Utiliser les mêmes options de configuration que la version mobile
- Activer la persistance de session (`persistSession: true`)
- Activer le rafraîchissement automatique des tokens (`autoRefreshToken: true`)
- Configurer Realtime avec les mêmes paramètres
- Détecter les sessions dans l'URL pour Next.js (`detectSessionInUrl: true`)

### 2. Compatibilité des variables d'environnement

Le client accepte maintenant :
- `NEXT_PUBLIC_SUPABASE_URL` ou `SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` ou `SUPABASE_ANON_KEY`

Cela permet une meilleure compatibilité avec différents environnements.

## Schéma de base de données

Le schéma de base de données est défini dans :
- `../mobile/supabase_schema.sql`

**Important** : Si vous ajoutez de nouvelles colonnes dans la version web, assurez-vous de les ajouter également au schéma SQL mobile pour maintenir la cohérence.

### Colonnes utilisées par la version web

La version web utilise notamment :
- `profiles.allow_messages_from` - Contrôle qui peut envoyer des messages
- `profiles.show_distance` - Affiche ou masque la distance

Ces colonnes doivent être ajoutées au schéma si elles n'existent pas déjà.

## Partage de session

Grâce à la configuration harmonisée :
- Les utilisateurs peuvent se connecter sur mobile et continuer sur web (et vice versa)
- Les sessions sont partagées entre les deux plateformes
- Les données sont synchronisées en temps réel via Realtime

## Vérification

Pour vérifier que tout fonctionne :

1. Assurez-vous que le fichier `.env.local` existe avec les bonnes valeurs
2. Redémarrez le serveur de développement : `npm run dev`
3. Testez la connexion et vérifiez que les données sont partagées avec la version mobile

## Sécurité

⚠️ **IMPORTANT** :
- Ne commitez jamais le fichier `.env.local` dans Git
- La clé `SUPABASE_SERVICE_ROLE_KEY` ne doit jamais être exposée côté client
- Utilisez uniquement `NEXT_PUBLIC_SUPABASE_ANON_KEY` dans le code client


