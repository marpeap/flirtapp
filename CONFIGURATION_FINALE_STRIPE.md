# ✅ Configuration Stripe - Récapitulatif final

## 🎯 Toutes les valeurs configurées

### Variables d'environnement à ajouter

```bash
# Stripe Configuration - PRODUCTION
STRIPE_SECRET_KEY=sk_live_... # Récupérer depuis Stripe Dashboard > Developers > API keys
STRIPE_PUSH_ECLAIR_1X_PRICE_ID=price_1Samu6RgFX6d3B74qhMGuxAa
STRIPE_PUSH_ECLAIR_3X_PRICE_ID=price_1SamikRgFX6d3B74Vt4FSSx5
STRIPE_WEBHOOK_SECRET=whsec_... # Récupérer depuis Stripe Dashboard > Developers > Webhooks > [ton webhook] > Signing secret
NEXT_PUBLIC_SITE_URL=https://ton-domaine.com # ⚠️ Remplace par ton domaine de production
```

## ✅ Ce qui est déjà fait

- [x] Produits créés dans Stripe (1x et 3x Push Éclair)
- [x] Price ID récupérés
- [x] Clé secrète de production récupérée
- [x] Webhook créé dans Stripe
- [x] Signing secret récupéré : `whsec_...` (à récupérer depuis Stripe Dashboard)

## 📋 Ce qui reste à faire

### 1. Ajouter les variables d'environnement

**En développement (`.env.local`)** :
- Ajoute toutes les variables ci-dessus dans `.env.local`
- Remplace `https://ton-domaine.com` par `http://localhost:3000` pour le développement

**En production (hébergeur)** :
- **Vercel** : Settings > Environment Variables > Add
- **Netlify** : Site settings > Environment variables > Add variable
- **Autre** : Selon ton hébergeur, ajoute les variables dans les settings

### 2. Exécuter le script SQL

1. Va dans **Supabase** > **SQL Editor**
2. Exécute le fichier `SQL_PUSH_ECLAIR_PURCHASES.sql`
3. Vérifie qu'il n'y a pas d'erreur

### 3. Configurer l'URL du webhook

Dans **Stripe Dashboard** > **Développeurs** > **Webhooks** :
- Vérifie que l'URL du webhook pointe vers : `https://ton-domaine.com/api/webhooks/stripe`
- Remplace `ton-domaine.com` par ton vrai domaine de production

### 4. Déployer et tester

1. **Déploie ton application** en production
2. **Teste un achat** :
   - Connecte-toi à l'application
   - Va sur `/profiles`
   - Clique sur "Push Éclair" puis "Acheter des crédits"
   - Choisis un pack (1x ou 3x)
   - Complète le paiement avec une vraie carte
3. **Vérifie** :
   - Que tu es redirigé vers `/profiles?push_success=true`
   - Que tes crédits ont été ajoutés
   - Dans Stripe Dashboard > **Transactions**, tu devrais voir la transaction
   - Dans Stripe Dashboard > **Webhooks** > Ton webhook > **Tentatives**, tu devrais voir les événements envoyés

## 🔍 Vérification rapide

### Vérifier que le webhook fonctionne

1. **Dans Stripe Dashboard** > **Développeurs** > **Webhooks**
2. **Clique sur ton webhook**
3. **Regarde les "Tentatives" (Attempts)** :
   - Après un paiement, tu devrais voir `checkout.session.completed` avec un statut 200 (vert)
   - Si tu vois des erreurs (rouge), vérifie l'URL du webhook

### Vérifier les achats dans Supabase

```sql
SELECT 
  id,
  user_id,
  quantity,
  amount_cents,
  status,
  created_at
FROM push_eclair_purchases 
ORDER BY created_at DESC 
LIMIT 10;
```

### Vérifier les crédits ajoutés

```sql
SELECT 
  id,
  display_name,
  push_eclair_credits
FROM profiles
WHERE push_eclair_credits > 0
ORDER BY updated_at DESC
LIMIT 10;
```

## 🎉 Une fois tout configuré

Tes utilisateurs pourront :
- ✅ Voir leurs crédits Push Éclair disponibles
- ✅ Choisir entre le pack 1x (2,29€) ou 3x (4,99€)
- ✅ Acheter des crédits via Stripe Checkout
- ✅ Recevoir automatiquement leurs crédits après paiement
- ✅ Utiliser leurs crédits pour envoyer des Push Éclair

Tout est prêt ! Il ne reste plus qu'à configurer les variables d'environnement et déployer. 🚀
