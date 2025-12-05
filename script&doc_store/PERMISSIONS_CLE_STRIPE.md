# 🔑 Permissions nécessaires pour la clé API Stripe SECRET

## 📋 Fonctionnalités utilisées dans le code

D'après l'analyse du code, voici ce qui est utilisé :

### 1. **Checkout Sessions** (Création de sessions de paiement)
- **Fichier** : `app/api/checkout/push-eclair/route.js`
- **Fonction** : `stripe.checkout.sessions.create()`
- **Permissions nécessaires** : **Write** (créer des sessions)

### 2. **Webhooks** (Vérification des signatures)
- **Fichier** : `app/api/webhooks/stripe/route.js`
- **Fonction** : `stripe.webhooks.constructEvent()`
- **Permissions nécessaires** : **Read** (lire et vérifier les événements)

### 3. **Événements traités** :
- `checkout.session.completed` - Paiement réussi
- `checkout.session.async_payment_failed` - Paiement échoué

## ✅ Permissions à activer dans Stripe

### Option 1 : Permissions complètes (Recommandé)

Quand tu crées une nouvelle clé API secrète dans Stripe, elle a **tous les droits par défaut**. C'est ce qu'il te faut.

**Pas besoin de configurer de permissions spécifiques** - la clé secrète (`sk_live_...`) a déjà tous les accès nécessaires.

### Option 2 : Permissions restrictives (Sécurité renforcée)

Si tu veux limiter les permissions pour plus de sécurité, active uniquement :

1. **Checkout Sessions** : ✅ Read & Write
2. **Webhooks** : ✅ Read
3. **Payment Intents** : ✅ Read (utilisé indirectement via checkout)

## 🔧 Comment créer la clé API SECRET

### Étapes dans Stripe Dashboard :

1. **Va sur** : https://dashboard.stripe.com/apikeys
2. **Clique sur** : "Create secret key"
3. **Nomme la clé** : Ex: "Production - Dating App"
4. **Mode** : Production (pas Test)
5. **Permissions** : Laisse par défaut (tous les droits) OU configure manuellement :
   - Checkout Sessions : Read & Write
   - Webhooks : Read
   - Payment Intents : Read

6. **Copie la clé** : Elle commence par `sk_live_...`
7. **⚠️ IMPORTANT** : Tu ne pourras plus voir la clé après ! Copie-la immédiatement.

## 📝 Mise à jour dans `.env.local`

Une fois la clé créée, remplace dans `.env.local` :

```bash
STRIPE_SECRET_KEY=sk_live_TA_NOUVELLE_CLE_ICI
```

Puis **redémarre le serveur** :
```bash
npm run dev
```

## 🔒 Sécurité

- ✅ **Ne partage JAMAIS** ta clé secrète
- ✅ **Ne commite JAMAIS** la clé dans Git
- ✅ **Utilise uniquement** la clé de production en production
- ✅ **Révoke l'ancienne clé** si tu en crées une nouvelle (dans Stripe Dashboard > API Keys)

## ⚠️ Note importante

Les clés API secrètes Stripe (`sk_live_...`) ont **tous les droits par défaut**. C'est normal et nécessaire pour :
- Créer des sessions de paiement
- Lire les événements webhooks
- Gérer les paiements

Si tu veux plus de sécurité, utilise des **Restricted API Keys** avec des permissions limitées, mais pour un usage simple, la clé secrète standard suffit.

## 🧪 Test après création

Après avoir créé la nouvelle clé et mis à jour `.env.local` :

1. Redémarre le serveur
2. Essaie d'acheter des crédits
3. Vérifie que la session Stripe se crée correctement
4. Vérifie les logs du serveur pour confirmer qu'il n'y a pas d'erreur

