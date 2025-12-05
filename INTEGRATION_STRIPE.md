# 💳 Intégration Stripe - Guide complet

## Vue d'ensemble

Ce guide explique comment configurer et utiliser l'intégration Stripe pour les achats de crédits Push Éclair dans ManyLovr.

## 📋 Prérequis

1. Un compte Stripe (gratuit) : https://stripe.com
2. Accès au Dashboard Stripe
3. Les fichiers suivants ont été créés :
   - `SQL_PUSH_ECLAIR_PURCHASES.sql` - Table pour enregistrer les achats
   - `app/api/webhooks/stripe/route.js` - Webhook pour gérer les événements
   - `app/api/checkout/push-eclair/route.js` - Route pour créer les sessions de paiement (déjà existant)

## 🔧 Configuration

### Étape 1 : Créer la table dans Supabase

Exécute le script SQL `SQL_PUSH_ECLAIR_PURCHASES.sql` dans le **SQL Editor** de Supabase.

Cette table enregistre :
- Les achats de crédits Push Éclair
- Le statut du paiement (pending, completed, failed, refunded)
- Les informations Stripe (checkout_id, payment_intent_id)
- Le montant et la quantité de crédits achetés

### Étape 2 : Créer un produit dans Stripe Dashboard

1. Va sur https://dashboard.stripe.com
2. Clique sur **Products** dans le menu de gauche
3. Clique sur **Add product**
4. Configure le produit :
   - **Name** : `Pack Push Éclair` (ou autre nom)
   - **Description** : `Pack de 5 crédits Push Éclair`
   - **Pricing model** : `Standard pricing`
   - **Price** : Exemple `4.99` EUR (ou le prix de ton choix)
   - **Billing period** : `One time`
5. Clique sur **Save product**
6. **IMPORTANT** : Copie le **Price ID** (commence par `price_...`)
   - Tu le trouveras dans la section "Pricing" du produit créé

### Étape 3 : Obtenir les clés API Stripe

1. Dans le Dashboard Stripe, va dans **Developers** > **API keys**
2. Tu verras deux clés :
   - **Publishable key** (commence par `pk_test_...` ou `pk_live_...`)
   - **Secret key** (commence par `sk_test_...` ou `sk_live_...`)
3. **IMPORTANT** : Copie la **Secret key** (tu en auras besoin pour `.env.local`)

### Étape 4 : Créer un webhook dans Stripe

1. Dans le Dashboard Stripe, va dans **Developers** > **Webhooks**
2. Clique sur **Add endpoint**
3. Configure le webhook :
   - **Endpoint URL** : 
     - En développement : `https://ton-domaine-ngrok.com/api/webhooks/stripe` (utilise ngrok pour tester en local)
     - En production : `https://ton-domaine.com/api/webhooks/stripe`
   - **Description** : `ManyLovr - Push Éclair purchases`
   - **Events to send** : Sélectionne `checkout.session.completed` et `checkout.session.async_payment_failed`
4. Clique sur **Add endpoint**
5. **IMPORTANT** : Copie le **Signing secret** (commence par `whsec_...`)
   - Tu le trouveras en cliquant sur le webhook créé

### Étape 5 : Configurer les variables d'environnement

Ajoute ces variables dans ton fichier `.env.local` :

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_... # Clé secrète Stripe (depuis Dashboard > Developers > API keys)
STRIPE_PUSH_ECLAIR_PRICE_ID=price_... # ID du prix créé dans Stripe (depuis le produit)
STRIPE_WEBHOOK_SECRET=whsec_... # Secret du webhook (depuis Developers > Webhooks)

# URL du site (nécessaire pour les URLs de retour Stripe)
NEXT_PUBLIC_SITE_URL=http://localhost:3000 # En développement
# NEXT_PUBLIC_SITE_URL=https://ton-domaine.com # En production
```

**Important** :
- En **mode test** (développement), utilise les clés qui commencent par `sk_test_` et `pk_test_`
- En **mode live** (production), utilise les clés qui commencent par `sk_live_` et `pk_live_`
- Change aussi le webhook pour pointer vers l'URL de production

### Étape 6 : Tester en local avec ngrok (optionnel mais recommandé)

Pour tester les webhooks en local :

1. Installe ngrok : https://ngrok.com/download
2. Lance ton serveur Next.js : `npm run dev`
3. Dans un autre terminal, lance ngrok :
   ```bash
   ngrok http 3000
   ```
4. Copie l'URL HTTPS fournie par ngrok (ex: `https://abc123.ngrok.io`)
5. Utilise cette URL dans la configuration du webhook Stripe :
   - Endpoint URL : `https://abc123.ngrok.io/api/webhooks/stripe`
6. **Important** : À chaque redémarrage de ngrok, l'URL change. Tu devras mettre à jour le webhook dans Stripe.

## 🧪 Test du paiement

### Carte de test Stripe

Utilise ces cartes pour tester les paiements :

- **Succès** : `4242 4242 4242 4242`
- **Échec** : `4000 0000 0000 0002`
- **3D Secure** : `4000 0025 0000 3155`

Pour toutes ces cartes :
- **Date d'expiration** : N'importe quelle date future (ex: `12/34`)
- **CVC** : N'importe quel code à 3 chiffres (ex: `123`)
- **Code postal** : N'importe quel code postal (ex: `12345`)

### Processus de test

1. Lance l'application : `npm run dev`
2. Connecte-toi à ton compte
3. Va sur la page `/profiles`
4. Clique sur le bouton "Push Éclair"
5. Clique sur "Acheter des crédits"
6. Tu seras redirigé vers Stripe Checkout
7. Utilise la carte de test `4242 4242 4242 4242`
8. Complète le paiement
9. Tu seras redirigé vers `/profiles?push_success=true`
10. Vérifie que tes crédits ont été ajoutés

## 🔍 Vérification

### Vérifier que tout fonctionne

1. **Table Supabase** :
   ```sql
   SELECT * FROM push_eclair_purchases ORDER BY created_at DESC LIMIT 10;
   ```

2. **Logs Stripe** :
   - Va dans **Developers** > **Logs** dans le Dashboard Stripe
   - Tu devrais voir les événements de webhook

3. **Logs de l'application** :
   - Vérifie la console du serveur Next.js pour les erreurs éventuelles

## 📊 Structure des données

### Table `push_eclair_purchases`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Identifiant unique |
| `user_id` | UUID | ID de l'utilisateur (référence `auth.users`) |
| `stripe_checkout_id` | TEXT | ID de la session Stripe Checkout |
| `stripe_payment_intent_id` | TEXT | ID du Payment Intent Stripe |
| `quantity` | INTEGER | Nombre de crédits achetés |
| `amount_cents` | INTEGER | Montant payé en centimes |
| `status` | TEXT | Statut : `pending`, `completed`, `failed`, `refunded` |
| `created_at` | TIMESTAMPTZ | Date de création |
| `updated_at` | TIMESTAMPTZ | Date de mise à jour |

## 🚀 Passage en production

1. **Créer un compte Stripe Live** :
   - Complète la vérification de ton compte Stripe
   - Active le mode Live

2. **Créer le produit en mode Live** :
   - Crée le même produit dans le mode Live
   - Copie le nouveau Price ID

3. **Créer le webhook en mode Live** :
   - Crée un nouveau webhook pointant vers ton domaine de production
   - Copie le nouveau Signing secret

4. **Mettre à jour `.env.local`** (ou variables d'environnement de production) :
   - Remplace les clés de test par les clés live
   - Remplace le Price ID par celui du mode live
   - Remplace le webhook secret par celui du mode live
   - Mets à jour `NEXT_PUBLIC_SITE_URL` avec ton domaine de production

5. **Tester en production** :
   - Fais un petit achat de test avec une vraie carte
   - Vérifie que les crédits sont bien ajoutés
   - Vérifie les logs Stripe

## 🐛 Dépannage

### Le webhook ne fonctionne pas

- Vérifie que l'URL du webhook est correcte
- Vérifie que ngrok est actif (en développement)
- Vérifie les logs Stripe dans le Dashboard
- Vérifie les logs de ton serveur Next.js

### Les crédits ne sont pas ajoutés après le paiement

- Vérifie que le webhook a bien reçu l'événement `checkout.session.completed`
- Vérifie les logs du serveur pour les erreurs
- Vérifie que la table `push_eclair_purchases` est bien créée
- Vérifie que le `user_id` dans les métadonnées Stripe est correct

### Erreur "Prix Stripe non configuré"

- Vérifie que `STRIPE_PUSH_ECLAIR_PRICE_ID` est bien défini dans `.env.local`
- Vérifie que le Price ID est correct (commence par `price_`)
- Redémarre le serveur Next.js après avoir modifié `.env.local`

### Erreur "Missing signature or webhook secret"

- Vérifie que `STRIPE_WEBHOOK_SECRET` est bien défini dans `.env.local`
- Vérifie que le secret est correct (commence par `whsec_`)
- Redémarre le serveur Next.js

## 📝 Notes importantes

- **Sécurité** : Ne partage jamais tes clés secrètes Stripe (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`)
- **Test vs Live** : Utilise toujours le mode test pendant le développement
- **Webhooks** : Les webhooks sont essentiels pour créditer les utilisateurs après paiement
- **Idempotence** : Le système vérifie que chaque paiement n'est traité qu'une seule fois

## 🔗 Ressources

- Documentation Stripe : https://stripe.com/docs
- Documentation Stripe Checkout : https://stripe.com/docs/payments/checkout
- Documentation Webhooks Stripe : https://stripe.com/docs/webhooks
- ngrok (pour tester les webhooks en local) : https://ngrok.com

