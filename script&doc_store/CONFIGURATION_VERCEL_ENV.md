# 🔐 Configuration des Variables d'Environnement sur Vercel

## ⚠️ IMPORTANT : Ne JAMAIS commit `.env.local` sur GitHub

Le fichier `.env.local` contient des **clés secrètes** et est déjà dans `.gitignore`. Il ne doit **JAMAIS** être envoyé sur GitHub.

## 📋 Variables d'Environnement Requises

Voici toutes les variables d'environnement nécessaires pour que l'application fonctionne sur Vercel :

### 🔵 Variables Supabase (Publiques - commencent par `NEXT_PUBLIC_`)

Ces variables sont accessibles côté client et peuvent être vues dans le code source du navigateur.

```
NEXT_PUBLIC_SUPABASE_URL=https://ton-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ton-anon-key-ici
NEXT_PUBLIC_SITE_URL=https://ton-domaine.vercel.app
```

### 🔴 Variables Supabase (Secrètes - NE PAS commencer par `NEXT_PUBLIC_`)

Ces variables sont **UNIQUEMENT** accessibles côté serveur.

```
SUPABASE_SERVICE_ROLE_KEY=ton-service-role-key-ici
```

**Où trouver la Service Role Key :**
1. Va sur [Supabase Dashboard](https://app.supabase.com)
2. Sélectionne ton projet
3. Va dans **Settings** → **API**
4. Copie la **`service_role` key** (⚠️ **NE JAMAIS** la partager publiquement)

### 💳 Variables Stripe (Secrètes)

```
STRIPE_SECRET_KEY=sk_live_... (ou sk_test_... pour les tests)
STRIPE_PUSH_ECLAIR_1X_PRICE_ID=price_1Samu6RgFX6d3B74qhMGuxAa
STRIPE_PUSH_ECLAIR_3X_PRICE_ID=price_1SamikRgFX6d3B74Vt4FSSx5
STRIPE_WEBHOOK_SECRET=whsec_1xxowDXgnW1ZLZJFbJMgk7vmZtN0OP4r
```

**Où trouver les valeurs Stripe :**
1. Va sur [Stripe Dashboard](https://dashboard.stripe.com)
2. **Secret Key** : **Developers** → **API keys** → Copie la **Secret key** (commence par `sk_live_` ou `sk_test_`)
3. **Price IDs** : **Products** → Sélectionne ton produit → Copie les **Price IDs**
4. **Webhook Secret** : **Developers** → **Webhooks** → Sélectionne ton endpoint → Copie le **Signing secret**

---

## 🚀 Configuration sur Vercel

### Méthode 1 : Via le Dashboard Vercel (Recommandé)

1. Va sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionne ton projet
3. Va dans **Settings** → **Environment Variables**
4. Pour chaque variable ci-dessus :
   - Clique sur **Add New**
   - **Key** : Le nom de la variable (ex: `STRIPE_SECRET_KEY`)
   - **Value** : La valeur de la variable
   - **Environment** : Sélectionne **Production**, **Preview**, et **Development** selon tes besoins
   - Clique sur **Save**

### Méthode 2 : Via Vercel CLI

```bash
# Installer Vercel CLI si ce n'est pas déjà fait
npm i -g vercel

# Se connecter
vercel login

# Ajouter les variables une par une
vercel env add STRIPE_SECRET_KEY production
vercel env add STRIPE_PUSH_ECLAIR_1X_PRICE_ID production
vercel env add STRIPE_PUSH_ECLAIR_3X_PRICE_ID production
vercel env add STRIPE_WEBHOOK_SECRET production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add NEXT_PUBLIC_SITE_URL production
```

---

## ✅ Vérification

Après avoir ajouté toutes les variables :

1. **Redéploie ton application** sur Vercel :
   - Va dans **Deployments**
   - Clique sur les **3 points** à côté du dernier déploiement
   - Sélectionne **Redeploy**

2. **Vérifie les logs** :
   - Va dans **Deployments** → Sélectionne le dernier déploiement
   - Clique sur **View Function Logs**
   - Vérifie qu'il n'y a pas d'erreurs liées aux variables manquantes

3. **Teste le paiement** :
   - Essaie d'acheter un Push Éclair
   - Vérifie que le Checkout Stripe s'ouvre correctement

---

## 🔍 Dépannage

### Erreur : "STRIPE_SECRET_KEY is not configured"

**Solution :** La variable `STRIPE_SECRET_KEY` n'est pas configurée sur Vercel ou n'est pas disponible dans l'environnement de production.

1. Vérifie que la variable est bien ajoutée dans **Settings** → **Environment Variables**
2. Vérifie que l'environnement est bien sélectionné (Production)
3. **Redéploie** l'application après avoir ajouté la variable

### Erreur : "Prix Stripe non configuré pour le pack 1x"

**Solution :** Les Price IDs ne sont pas configurés.

1. Vérifie que `STRIPE_PUSH_ECLAIR_1X_PRICE_ID` et `STRIPE_PUSH_ECLAIR_3X_PRICE_ID` sont bien ajoutés
2. Vérifie que les valeurs correspondent bien aux Price IDs dans Stripe Dashboard

### Erreur : "supabaseKey is required"

**Solution :** La `SUPABASE_SERVICE_ROLE_KEY` n'est pas configurée.

1. Ajoute la variable `SUPABASE_SERVICE_ROLE_KEY` dans Vercel
2. Redéploie l'application

### Le webhook ne fonctionne pas

**Solution :** Vérifie la configuration du webhook Stripe.

1. Dans Stripe Dashboard → **Developers** → **Webhooks**
2. Vérifie que l'endpoint est : `https://ton-domaine.vercel.app/api/webhooks/stripe`
3. Vérifie que le **Signing secret** correspond à `STRIPE_WEBHOOK_SECRET` dans Vercel
4. Teste le webhook avec un événement de test

---

## 📝 Checklist de Déploiement

Avant de déployer en production, vérifie que :

- [ ] Toutes les variables d'environnement sont ajoutées sur Vercel
- [ ] `NEXT_PUBLIC_SITE_URL` pointe vers l'URL de production (ex: `https://ton-domaine.vercel.app`)
- [ ] Les Price IDs Stripe sont ceux de **production** (pas de test)
- [ ] La Secret Key Stripe est celle de **production** (`sk_live_...`)
- [ ] Le webhook Stripe pointe vers l'URL de production
- [ ] L'application a été redéployée après avoir ajouté les variables

---

## 🔒 Sécurité

**RÈGLES D'OR :**

1. ❌ **NE JAMAIS** commit `.env.local` sur GitHub
2. ❌ **NE JAMAIS** partager les clés secrètes publiquement
3. ✅ Utiliser des variables d'environnement pour toutes les clés secrètes
4. ✅ Utiliser des clés de **production** uniquement en production
5. ✅ Utiliser des clés de **test** pour les environnements de développement

---

*Dernière mise à jour : 2024*

