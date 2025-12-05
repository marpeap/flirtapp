# 🔧 Configuration des variables d'environnement Stripe

## ⚠️ Erreur : "Prix Stripe non configuré pour le pack 1x"

Cette erreur signifie que les variables d'environnement Stripe ne sont pas configurées dans ton fichier `.env.local`.

## 📝 Solution : Ajouter les variables dans `.env.local`

1. **Crée ou ouvre le fichier `.env.local`** à la racine du projet :
   ```bash
   nano .env.local
   # ou
   code .env.local
   ```

2. **Ajoute ces variables** (remplace les valeurs par tes vraies clés) :

   ```bash
   # Stripe Configuration
   STRIPE_SECRET_KEY=sk_live_... # Ta clé secrète Stripe (depuis Stripe Dashboard > Developers > API keys)
   STRIPE_PUSH_ECLAIR_1X_PRICE_ID=price_1Samu6RgFX6d3B74qhMGuxAa
   STRIPE_PUSH_ECLAIR_3X_PRICE_ID=price_1SamikRgFX6d3B74Vt4FSSx5
   STRIPE_WEBHOOK_SECRET=whsec_... # Signing secret du webhook (depuis Stripe Dashboard > Developers > Webhooks)
   
   # URL du site
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

3. **Sauvegarde le fichier**

4. **Redémarre ton serveur Next.js** :
   ```bash
   # Arrête le serveur (Ctrl+C)
   # Puis relance :
   npm run dev
   ```

## ✅ Vérification

Après avoir ajouté les variables et redémarré le serveur :

1. Va sur `/profiles`
2. Clique sur "Push Éclair"
3. Clique sur "Acheter des crédits"
4. L'erreur ne devrait plus apparaître

## 🔍 Où trouver les valeurs

### STRIPE_SECRET_KEY
- Va sur https://dashboard.stripe.com
- **Developers** > **API keys**
- Copie la **Secret key** (commence par `sk_live_...` ou `sk_test_...`)

### STRIPE_PUSH_ECLAIR_1X_PRICE_ID et STRIPE_PUSH_ECLAIR_3X_PRICE_ID
- Tu as déjà ces valeurs :
  - 1x Push : `price_1Samu6RgFX6d3B74qhMGuxAa`
  - 3x Push : `price_1SamikRgFX6d3B74Vt4FSSx5`

### STRIPE_WEBHOOK_SECRET
- Va sur https://dashboard.stripe.com
- **Developers** > **Webhooks**
- Clique sur ton webhook
- Dans "Signing secret", clique sur "Reveal"
- Copie la valeur (commence par `whsec_...`)

## ⚠️ Important

- Le fichier `.env.local` est déjà dans `.gitignore`, donc il ne sera pas commité
- Ne partage JAMAIS ce fichier
- Redémarre toujours le serveur après avoir modifié `.env.local`


