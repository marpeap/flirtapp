# Diagnostic de l'erreur "Failed to Fetch"

## Étapes de diagnostic

### 1. Vérifier que le fichier .env.local existe

```bash
cd web
ls -la .env.local
cat .env.local
```

Le fichier doit contenir :
- `NEXT_PUBLIC_SUPABASE_URL=https://yomlhagujagscbsfxmyi.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...`

### 2. Redémarrer le serveur Next.js

**IMPORTANT** : Next.js ne charge les variables d'environnement qu'au démarrage. Vous DEVEZ redémarrer le serveur après avoir créé/modifié `.env.local`.

```bash
# Arrêter le serveur (Ctrl+C)
# Puis redémarrer :
cd web
npm run dev
```

### 3. Vérifier la console du navigateur

1. Ouvrez les outils de développement (F12)
2. Allez dans l'onglet **Console**
3. Essayez de créer un compte
4. Regardez les messages de log qui commencent par 🔵, ✅ ou ❌

### 4. Vérifier l'onglet Network

1. Ouvrez les outils de développement (F12)
2. Allez dans l'onglet **Network**
3. Essayez de créer un compte
4. Cherchez la requête vers Supabase (généralement vers `yomlhagujagscbsfxmyi.supabase.co`)
5. Cliquez sur la requête et vérifiez :
   - Le statut HTTP (doit être 200 ou 201)
   - L'onglet "Response" pour voir l'erreur détaillée
   - L'onglet "Headers" pour vérifier les en-têtes

### 5. Vérifier les paramètres Supabase

Dans le dashboard Supabase :
1. Allez dans **Settings** > **API**
2. Vérifiez que l'URL du projet est bien `https://yomlhagujagscbsfxmyi.supabase.co`
3. Vérifiez que la clé anonyme correspond

### 6. Vérifier les paramètres d'authentification

Dans le dashboard Supabase :
1. Allez dans **Authentication** > **Settings**
2. Vérifiez que "Enable email signup" est activé
3. Vérifiez les paramètres de confirmation d'email

### 7. Tester la connexion Supabase directement

Ouvrez la console du navigateur et exécutez :

```javascript
// Vérifier que le client Supabase est bien configuré
console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Présente' : 'Manquante');

// Tester une requête simple
const { data, error } = await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'test123456'
});
console.log('Résultat:', { data, error });
```

## Solutions courantes

### Problème : Variables d'environnement non chargées
**Solution** : Redémarrer le serveur Next.js après avoir créé/modifié `.env.local`

### Problème : CORS
**Solution** : Vérifier dans Supabase > Settings > API que votre domaine est autorisé

### Problème : Email déjà utilisé
**Solution** : Utiliser un autre email ou supprimer l'utilisateur existant dans Supabase > Authentication > Users

### Problème : Confirmation d'email requise
**Solution** : Désactiver temporairement la confirmation d'email dans Supabase > Authentication > Settings

## Logs de débogage

Le code a été amélioré pour afficher des logs détaillés dans la console :
- 🔵 = Information de débogage
- ✅ = Succès
- ❌ = Erreur

Ces logs vous aideront à identifier précisément où le problème se situe.


