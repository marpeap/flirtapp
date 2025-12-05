# 🎯 Guide de configuration Stripe - Étape par étape

## ⚠️ Important : Product ID vs Price ID

Tu as créé 2 **produits** dans Stripe :
- `prod_TXsfcWAzEwAuxv` → 1x Push Éclair à 2,29€
- `prod_TXsTbgUjIQP4Xy` → 3x Push Éclair à 4,99€

**MAIS** le code utilise des **Price ID** (pas des Product ID). Il faut récupérer les **Price ID** de chaque produit.

## 📋 Étape 1 : Récupérer les Price ID

1. Va sur https://dashboard.stripe.com
2. Clique sur **Products** dans le menu de gauche
3. Clique sur le premier produit (1x Push Éclair à 2,29€)
4. Dans la section **Pricing**, tu verras un **Price ID** qui commence par `price_...`
   - Exemple : `price_1ABC123...`
   - **Copie ce Price ID** → C'est `STRIPE_PUSH_ECLAIR_1X_PRICE_ID`
5. Clique sur le deuxième produit (3x Push Éclair à 4,99€)
6. Dans la section **Pricing**, copie aussi son **Price ID**
   - **Copie ce Price ID** → C'est `STRIPE_PUSH_ECLAIR_3X_PRICE_ID`

## 🔑 Étape 2 : Obtenir la clé secrète Stripe

1. Dans le Dashboard Stripe, va dans **Developers** > **API keys**
2. Tu verras deux clés :
   - **Publishable key** (commence par `pk_test_...`) → Pas besoin pour l'instant
   - **Secret key** (commence par `sk_test_...`) → **COPIE CETTE CLÉ**
3. C'est ta `STRIPE_SECRET_KEY`

## 🌐 Étape 3 : Créer le webhook dans Stripe

**⚠️ Le webhook ne peut PAS être créé par SQL** - C'est une configuration dans Stripe Dashboard.

### Option A : En développement local (avec ngrok)

1. **Installe ngrok** : https://ngrok.com/download
2. **Lance ton serveur Next.js** :
   ```bash
   npm run dev
   ```
3. **Dans un autre terminal, lance ngrok** :
   ```bash
   ngrok http 3000
   ```
4. **Copie l'URL HTTPS** fournie par ngrok (ex: `https://abc123.ngrok.io`)
5. **Dans Stripe Dashboard** :
   - Va dans **Developers** > **Webhooks**
   - Clique sur **Add endpoint**
   - **Endpoint URL** : `https://abc123.ngrok.io/api/webhooks/stripe`
   - **Description** : `ManyLovr - Push Éclair purchases`
   - **Events to send** : Sélectionne :
     - ✅ `checkout.session.completed`
     - ✅ `checkout.session.async_payment_failed`
   - Clique sur **Add endpoint**
6. **Copie le Signing secret** (commence par `whsec_...`)
   - Clique sur le webhook créé
   - Dans la section "Signing secret", clique sur "Reveal"
   - **Copie cette valeur** → C'est `STRIPE_WEBHOOK_SECRET`

### Option B : En production (avec ton domaine)

1. **Dans Stripe Dashboard** :
   - Va dans **Developers** > **Webhooks**
   - Clique sur **Add endpoint**
   - **Endpoint URL** : `https://ton-domaine.com/api/webhooks/stripe`
   - **Description** : `ManyLovr - Push Éclair purchases (Production)`
   - **Events to send** : Sélectionne :
     - ✅ `checkout.session.completed`
     - ✅ `checkout.session.async_payment_failed`
   - Clique sur **Add endpoint**
2. **Copie le Signing secret** (commence par `whsec_...`)

## 📝 Étape 4 : Configurer les variables d'environnement

Ajoute ces variables dans ton fichier `.env.local` :

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_... # Clé secrète depuis Developers > API keys
STRIPE_PUSH_ECLAIR_1X_PRICE_ID=price_... # Price ID du produit 1x (2,29€)
STRIPE_PUSH_ECLAIR_3X_PRICE_ID=price_... # Price ID du produit 3x (4,99€)
STRIPE_WEBHOOK_SECRET=whsec_... # Signing secret du webhook

# URL du site
NEXT_PUBLIC_SITE_URL=http://localhost:3000 # En développement
# NEXT_PUBLIC_SITE_URL=https://ton-domaine.com # En production
```

**Exemple complet** :
```bash
STRIPE_SECRET_KEY=sk_test_51ABC123...
STRIPE_PUSH_ECLAIR_1X_PRICE_ID=price_1ABC123...
STRIPE_PUSH_ECLAIR_3X_PRICE_ID=price_1XYZ789...
STRIPE_WEBHOOK_SECRET=whsec_abc123...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## ✅ Étape 5 : Exécuter le script SQL

1. Va dans **Supabase** > **SQL Editor**
2. Exécute le script `SQL_PUSH_ECLAIR_PURCHASES.sql`
3. Vérifie qu'il n'y a pas d'erreur

## 🧪 Étape 6 : Tester

1. **Redémarre ton serveur Next.js** (pour charger les nouvelles variables d'environnement) :
   ```bash
   npm run dev
   ```

2. **Si tu utilises ngrok**, assure-toi qu'il est toujours actif :
   ```bash
   ngrok http 3000
   ```
   - **Important** : Si ngrok redémarre, l'URL change. Tu devras mettre à jour le webhook dans Stripe.

3. **Teste l'achat** :
   - Connecte-toi à l'application
   - Va sur `/profiles`
   - Clique sur "Push Éclair"
   - Clique sur "Acheter des crédits"
   - Choisis un pack (1x ou 3x)
   - Clique sur "Acheter"
   - Tu seras redirigé vers Stripe Checkout
   - Utilise la carte de test : `4242 4242 4242 4242`
   - Date : `12/34`, CVC : `123`
   - Complète le paiement
   - Tu seras redirigé vers `/profiles?push_success=true`
   - Vérifie que tes crédits ont été ajoutés

## 🔍 Vérification

### Vérifier que le webhook fonctionne

1. **Dans Stripe Dashboard** :
   - Va dans **Developers** > **Logs**
   - Tu devrais voir les événements de webhook envoyés
   - Si tu vois des erreurs (rouge), vérifie l'URL du webhook

2. **Dans Supabase** :
   ```sql
   SELECT * FROM push_eclair_purchases ORDER BY created_at DESC LIMIT 10;
   ```
   - Tu devrais voir tes achats avec le statut `completed`

3. **Dans l'application** :
   - Vérifie que les crédits ont bien été ajoutés à ton profil

## 🐛 Dépannage

### Erreur "Prix Stripe non configuré"

- Vérifie que les variables `STRIPE_PUSH_ECLAIR_1X_PRICE_ID` et `STRIPE_PUSH_ECLAIR_3X_PRICE_ID` sont bien définies
- Vérifie que ce sont des **Price ID** (commencent par `price_`), pas des Product ID
- Redémarre le serveur après avoir modifié `.env.local`

### Le webhook ne fonctionne pas

- Vérifie que ngrok est actif (en développement)
- Vérifie que l'URL du webhook est correcte
- Vérifie les logs Stripe dans **Developers** > **Logs**
- Vérifie les logs de ton serveur Next.js

### Les crédits ne sont pas ajoutés

- Vérifie que le webhook a bien reçu l'événement `checkout.session.completed`
- Vérifie les logs du serveur pour les erreurs
- Vérifie que la table `push_eclair_purchases` existe bien
- Vérifie que le `user_id` dans les métadonnées Stripe est correct

## 📊 Résumé des IDs nécessaires

| Variable | Où le trouver | Exemple |
|----------|---------------|---------|
| `STRIPE_SECRET_KEY` | Developers > API keys > Secret key | `sk_test_51ABC...` |
| `STRIPE_PUSH_ECLAIR_1X_PRICE_ID` | Products > 1x Push > Pricing > Price ID | `price_1ABC123...` |
| `STRIPE_PUSH_ECLAIR_3X_PRICE_ID` | Products > 3x Push > Pricing > Price ID | `price_1XYZ789...` |
| `STRIPE_WEBHOOK_SECRET` | Developers > Webhooks > [ton webhook] > Signing secret | `whsec_abc123...` |

## ✅ Checklist

- [ ] Récupéré les 2 Price ID (pas les Product ID)
- [ ] Récupéré la Secret key Stripe
- [ ] Créé le webhook dans Stripe
- [ ] Récupéré le Signing secret du webhook
- [ ] Ajouté toutes les variables dans `.env.local`
- [ ] Exécuté le script SQL `SQL_PUSH_ECLAIR_PURCHASES.sql`
- [ ] Redémarré le serveur Next.js
- [ ] Testé l'achat avec la carte de test
- [ ] Vérifié que les crédits sont ajoutés

Une fois tout cela fait, l'intégration Stripe sera complète ! 🎉

