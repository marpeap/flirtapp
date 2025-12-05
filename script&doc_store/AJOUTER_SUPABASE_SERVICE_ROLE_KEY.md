# 🔑 Ajouter SUPABASE_SERVICE_ROLE_KEY

## 🎯 Problème

L'erreur **"supabaseKey is required"** apparaît car la variable `SUPABASE_SERVICE_ROLE_KEY` n'est pas définie dans `.env.local`.

Cette clé est nécessaire pour :
- ✅ Insérer les achats dans la table `push_eclair_purchases`
- ✅ Mettre à jour les crédits Push Éclair depuis le webhook Stripe
- ✅ Effectuer des opérations admin sur Supabase

## ✅ Solution

### 1. Récupérer la clé depuis Supabase Dashboard

1. **Va sur** : https://supabase.com/dashboard
2. **Sélectionne ton projet** : ManyLovr (ou le nom de ton projet)
3. **Va dans** : **Settings** (⚙️) → **API**
4. **Trouve la section** : **Project API keys**
5. **Copie la clé** : **`service_role`** (⚠️ **PAS** `anon` ou `public`)

   La clé `service_role` commence généralement par `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` et est beaucoup plus longue que la clé `anon`.

   ⚠️ **ATTENTION** : Cette clé a **tous les droits** sur ta base de données. Ne la partage JAMAIS publiquement !

### 2. Ajouter la clé dans `.env.local`

1. **Ouvre le fichier** `.env.local` :
   ```bash
   nano .env.local
   # ou avec VS Code :
   code .env.local
   ```

2. **Ajoute cette ligne** (remplace `TA_CLE_SERVICE_ROLE` par la vraie clé) :
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=TA_CLE_SERVICE_ROLE
   ```

3. **Sauvegarde** le fichier (Ctrl+O puis Enter dans nano, ou Ctrl+S dans VS Code)

### 3. Redémarrer le serveur

**IMPORTANT** : Après avoir modifié `.env.local`, tu DOIS redémarrer le serveur :

```bash
# Arrête le serveur avec Ctrl+C
# Puis relance :
npm run dev
```

## 📝 Exemple de fichier `.env.local` complet

Ton fichier `.env.local` devrait ressembler à ça :

```bash
# Supabase - Clés publiques (accessibles côté client)
NEXT_PUBLIC_SUPABASE_URL=https://vpehcrrbqmcsbklpzcyc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwZWhjcnJicW1jc2JrbHB6Y3ljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2OTM0MDEsImV4cCI6MjA4MDI2OTQwMX0.djEdyfKtMOj5W0UYMMfPJjcjOMV7r6kKJAapv97eHA4

# Supabase - Clé service role (admin, côté serveur uniquement)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwZWhjcnJicW1jc2JrbHB6Y3ljIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDY5MzQwMSwiZXhwIjoyMDgwMjY5NDAxfQ.XXXXXXXXXXXXX

# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUSH_ECLAIR_1X_PRICE_ID=price_1Samu6RgFX6d3B74qhMGuxAa
STRIPE_PUSH_ECLAIR_3X_PRICE_ID=price_1SamikRgFX6d3B74Vt4FSSx5
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## 🔍 Différence entre les clés Supabase

| Clé | Usage | Sécurité | Où l'utiliser |
|-----|-------|----------|---------------|
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client (navigateur) | ✅ Sécurisée (RLS activé) | Frontend, composants React |
| `SUPABASE_SERVICE_ROLE_KEY` | Serveur (admin) | ⚠️ **Très sensible** (bypass RLS) | API routes, webhooks, scripts admin |

## ⚠️ Sécurité

- ✅ **Ne commite JAMAIS** `SUPABASE_SERVICE_ROLE_KEY` dans Git
- ✅ **Ne partage JAMAIS** cette clé publiquement
- ✅ **Utilise uniquement** côté serveur (dans `/app/api/...`)
- ✅ Le fichier `.env.local` est déjà dans `.gitignore` (ne sera pas commité)

## 🧪 Test après ajout

Après avoir ajouté la clé et redémarré le serveur :

1. Va sur `http://localhost:3000/profiles`
2. Clique sur "Push Éclair"
3. Clique sur "Acheter des crédits"
4. L'erreur "supabaseKey is required" ne devrait plus apparaître
5. Tu devrais être redirigé vers Stripe Checkout

## 📸 Aide visuelle

Dans Supabase Dashboard > Settings > API, tu verras :

```
Project API keys
├── anon / public
│   └── eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (courte)
└── service_role  ← C'EST CETTE CLÉ QU'IL TE FAUT
    └── eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (longue)
```

⚠️ **Ne confonds pas** : Tu dois copier la clé `service_role`, pas `anon` !

