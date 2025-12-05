# 🚀 Guide pour lancer ManyLovr en local

## Prérequis

- **Node.js** version 18 ou supérieure (recommandé: 20+)
- **npm** (généralement inclus avec Node.js)
- Un projet Supabase configuré avec les tables nécessaires

## Étapes pour lancer l'application

### 1. Installer les dépendances

Si c'est la première fois que tu lances le projet, ou si les dépendances ont changé :

```bash
cd /home/marpeap/datingapp/web
npm install
```

Cette commande va installer toutes les dépendances listées dans `package.json` :
- Next.js 16.0.6
- React 19.2.0
- Supabase client
- Stripe
- ESLint

### 2. Configurer les variables d'environnement

L'application a besoin de se connecter à Supabase. Crée un fichier `.env.local` à la racine du dossier `web` :

```bash
cd /home/marpeap/datingapp/web
touch .env.local
```

Puis ajoute ces variables dans `.env.local` :

```env
NEXT_PUBLIC_SUPABASE_URL=ton_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=ta_clé_anon_supabase
```

**Où trouver ces valeurs ?**
1. Va sur [supabase.com](https://supabase.com)
2. Connecte-toi à ton projet
3. Va dans **Settings** → **API**
4. Tu trouveras :
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Exemple de `.env.local` :**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **Important :** 
- Le fichier `.env.local` est dans `.gitignore` (ne sera pas commité)
- Ne partage jamais tes clés publiquement
- Les variables doivent commencer par `NEXT_PUBLIC_` pour être accessibles côté client

### 3. Lancer le serveur de développement

```bash
npm run dev
```

Tu devrais voir quelque chose comme :

```
  ▲ Next.js 16.0.6
  - Local:        http://localhost:3000
  - Ready in 2.3s
```

### 4. Ouvrir l'application

Ouvre ton navigateur et va sur : **http://localhost:3000**

L'application devrait se charger ! 🎉

---

## Commandes utiles

### Développement
```bash
npm run dev          # Lance le serveur de développement (port 3000 par défaut)
```

### Production
```bash
npm run build        # Compile l'application pour la production
npm run start        # Lance le serveur de production (après build)
```

### Linting
```bash
npm run lint         # Vérifie le code avec ESLint
```

---

## Dépannage

### Erreur "Cannot find module"
```bash
# Supprime node_modules et réinstalle
rm -rf node_modules package-lock.json
npm install
```

### Erreur de connexion Supabase
- Vérifie que `.env.local` existe et contient les bonnes variables
- Vérifie que les variables commencent bien par `NEXT_PUBLIC_`
- Redémarre le serveur après avoir modifié `.env.local`

### Port 3000 déjà utilisé
```bash
# Utilise un autre port
PORT=3001 npm run dev
```

### Erreur "Module not found" pour Next.js Image
Le composant `Image` de Next.js est utilisé dans `app/signup/page.js`. Si tu as des erreurs, vérifie que Next.js est bien installé.

---

## Structure du projet

```
web/
├── app/              # Pages Next.js (App Router)
├── components/       # Composants réutilisables
├── lib/             # Utilitaires (Supabase, etc.)
├── public/          # Fichiers statiques
├── cupids/          # Avatars
├── .env.local       # Variables d'environnement (à créer)
├── package.json      # Dépendances
└── next.config.mjs  # Configuration Next.js
```

---

## Prochaines étapes

Une fois l'application lancée :
1. Crée un compte via `/signup`
2. Complète ton profil via `/onboarding`
3. Explore les profils sur `/profiles`
4. Teste la messagerie sur `/messages`

Bon développement ! 🚀

