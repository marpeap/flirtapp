# 🐛 Debug : Erreur serveur lors de la création du paiement

## 🔍 Comment identifier l'erreur

J'ai amélioré le code pour afficher des messages d'erreur plus détaillés. Voici comment identifier le problème :

### 1. Vérifier les logs du serveur

Ouvre le terminal où tourne `npm run dev` et regarde les erreurs qui s'affichent quand tu cliques sur "Acheter des crédits".

Tu devrais voir quelque chose comme :
```
Erreur création Checkout Push Éclair: [détails de l'erreur]
Détails de l'erreur: { message: ..., type: ..., code: ... }
```

### 2. Vérifier les erreurs courantes

#### Erreur : "No such price: price_xxx"
**Cause** : Le Price ID n'existe pas dans Stripe ou n'est pas valide.
**Solution** :
- Vérifie que les Price ID dans `.env.local` sont corrects
- Va sur Stripe Dashboard > Products et vérifie les Price ID

#### Erreur : "Invalid API Key provided"
**Cause** : La clé secrète Stripe n'est pas valide.
**Solution** :
- Vérifie que `STRIPE_SECRET_KEY` dans `.env.local` est correcte
- Assure-toi d'utiliser la clé de **production** (`sk_live_...`) et non de test
- Redémarre le serveur après modification

#### Erreur : "You must provide an API key"
**Cause** : La variable `STRIPE_SECRET_KEY` n'est pas définie.
**Solution** :
- Vérifie que `.env.local` contient bien `STRIPE_SECRET_KEY=...`
- Redémarre le serveur

#### Erreur : "NEXT_PUBLIC_SITE_URL is not defined"
**Cause** : L'URL du site n'est pas définie.
**Solution** :
- Ajoute `NEXT_PUBLIC_SITE_URL=http://localhost:3000` dans `.env.local`
- Redémarre le serveur

### 3. Vérifier la console du navigateur

Ouvre la console du navigateur (F12) et regarde les erreurs quand tu cliques sur "Acheter des crédits".

### 4. Vérifier les variables d'environnement

Assure-toi que toutes ces variables sont dans `.env.local` :

```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUSH_ECLAIR_1X_PRICE_ID=price_...
STRIPE_PUSH_ECLAIR_3X_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 5. Vérifier que le serveur a été redémarré

**Important** : Après avoir modifié `.env.local`, tu DOIS redémarrer le serveur :
```bash
# Arrête avec Ctrl+C
npm run dev
```

## 🔧 Test rapide

Pour tester si Stripe est bien configuré, tu peux ajouter temporairement ce code dans la route API :

```javascript
console.log('Stripe config:', {
  hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
  secretKeyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 7),
  price1x: process.env.STRIPE_PUSH_ECLAIR_1X_PRICE_ID,
  price3x: process.env.STRIPE_PUSH_ECLAIR_3X_PRICE_ID,
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
});
```

## 📝 Prochaines étapes

1. **Regarde les logs du serveur** quand tu cliques sur "Acheter des crédits"
2. **Copie le message d'erreur exact** qui apparaît
3. **Vérifie les variables d'environnement** dans `.env.local`
4. **Redémarre le serveur** si tu as modifié `.env.local`

Une fois que tu as le message d'erreur exact, je pourrai t'aider à le résoudre plus précisément.


