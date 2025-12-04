# 🐛 Bugs identifiés dans ManyLovr

## 🔴 BUGS CRITIQUES

### 1. **Bug dans la vérification des blocages (Push Éclair)**
**Fichier:** `app/profiles/page.js` (lignes 383-388)
**Problème:** La requête pour vérifier les blocages utilise deux `.or()` séparés au lieu d'une seule condition logique.
```javascript
.or(`blocker_id.eq.${currentUserId},blocked_id.eq.${currentUserId}`)
.or(`blocker_id.eq.${otherUserId},blocked_id.eq.${otherUserId}`)
```
**Impact:** La requête ne fonctionne pas correctement. Elle devrait vérifier si un blocage existe entre `currentUserId` et `otherUserId`, mais la logique actuelle est incorrecte.

**Solution:** Utiliser une seule condition `.or()` avec la syntaxe PostgREST correcte :
```javascript
.or(`and(blocker_id.eq.${currentUserId},blocked_id.eq.${otherUserId}),and(blocker_id.eq.${otherUserId},blocked_id.eq.${currentUserId})`)
```

### 2. **Erreur non gérée lors de la création de conversation_participants (Push Éclair)**
**Fichier:** `app/profiles/page.js` (lignes 428-439)
**Problème:** L'insertion dans `conversation_participants` n'est pas vérifiée. Si elle échoue, le Push Éclair continue quand même.
```javascript
await supabase.from('conversation_participants').insert([...]);
// Pas de vérification d'erreur !
```
**Impact:** Si l'insertion échoue, la conversation est créée mais les participants ne sont pas enregistrés, ce qui peut causer des problèmes d'accès.

**Solution:** Vérifier l'erreur et gérer le cas d'échec.

### 3. **Dépendances manquantes dans useEffect (GroupMeetupsSection)**
**Fichier:** `app/messages/[id]/_components/GroupMeetupsSection.js` (ligne 19-22)
**Problème:** Le `useEffect` appelle `loadMeetups()` mais ne l'inclut pas dans les dépendances.
```javascript
useEffect(() => {
  if (!conversationId || !isGroup) return;
  loadMeetups();
}, [conversationId, isGroup]); // loadMeetups manque
```
**Impact:** Avertissement ESLint, et potentiellement des problèmes si `loadMeetups` change.

**Solution:** Soit ajouter `loadMeetups` aux dépendances, soit utiliser `useCallback` pour `loadMeetups`.

### 4. **console.error en production (MeetupReminders)**
**Fichier:** `app/onboarding/_components/MeetupReminders.js` (ligne 42)
**Problème:** `console.error` laissé en production.
**Impact:** Pollution de la console, possible fuite d'informations.

**Solution:** Supprimer ou utiliser un système de logging conditionnel.

---

## 🟠 BUGS IMPORTANTS

### 5. **Pas de gestion d'erreur si les tables group_meetups n'existent pas**
**Fichier:** `app/messages/[id]/_components/GroupMeetupsSection.js`
**Problème:** Si l'utilisateur n'a pas encore exécuté le SQL pour créer les tables `group_meetups`, l'application va planter avec une erreur Supabase.
**Impact:** Crash de l'application si les tables n'existent pas.

**Solution:** Ajouter une vérification et un message d'erreur clair si les tables n'existent pas.

### 6. **Pas de vérification que l'utilisateur est participant avant de proposer un rendez-vous**
**Fichier:** `app/messages/[id]/_components/GroupMeetupsSection.js`
**Problème:** Le composant vérifie `isGroup` mais ne vérifie pas que l'utilisateur est bien participant actif du groupe.
**Impact:** Un utilisateur pourrait théoriquement voir le formulaire même s'il n'est plus participant.

**Solution:** Vérifier via `conversation_participants` que l'utilisateur est actif.

### 7. **Race condition potentielle dans MeetupReminders**
**Fichier:** `app/onboarding/_components/MeetupReminders.js` (lignes 46-62)
**Problème:** Deux requêtes asynchrones séquentielles sans gestion de l'annulation si le composant est démonté.
**Impact:** Possibles warnings React et requêtes inutiles.

**Solution:** Utiliser un flag `isMounted` ou `AbortController` pour annuler les requêtes.

### 8. **Pas de gestion d'erreur dans handleSendPush (Push Éclair)**
**Fichier:** `app/profiles/page.js` (lignes 296-479)
**Problème:** Si une erreur survient dans la boucle `for...of`, elle n'est pas gérée individuellement, et le processus continue.
**Impact:** Si un Push Éclair échoue pour un utilisateur, les autres ne sont pas envoyés non plus, ou l'erreur n'est pas claire.

**Solution:** Gérer les erreurs individuellement et continuer pour les autres utilisateurs.

### 9. **Pas de vérification que conversationId existe avant de charger les meetups**
**Fichier:** `app/messages/[id]/_components/GroupMeetupsSection.js`
**Problème:** `loadMeetups()` vérifie `conversationId` mais si `conversationId` devient `null` après le chargement initial, cela pourrait causer des problèmes.
**Impact:** Requêtes inutiles ou erreurs.

**Solution:** Ajouter une vérification plus robuste.

---

## 🟡 BUGS MINEURS / AMÉLIORATIONS

### 10. **console.error dans plusieurs fichiers**
**Fichiers:** 
- `app/onboarding/_components/MeetupReminders.js` (ligne 42)
- `app/profiles/[id]/page.js` (lignes 256, 292)
- `app/profiles/page.js` (ligne 577)
- `app/admin/page.js` (ligne 77)
- `app/onboarding/_components/ProfilePhotoUploader.js` (ligne 46)
- `app/api/checkout/push-eclair/route.js` (ligne 89)

**Problème:** `console.error` laissés en production.
**Impact:** Pollution de la console.

**Solution:** Créer un système de logging centralisé ou supprimer.

### 11. **Pas de debounce sur les filtres**
**Fichier:** `app/profiles/page.js`
**Problème:** Les requêtes sont lancées à chaque changement de filtre.
**Impact:** Trop de requêtes inutiles, performance dégradée.

**Solution:** Ajouter un debounce de 300-500ms.

### 12. **Pas de pagination pour les listes**
**Fichiers:** `app/profiles/page.js`, `app/matches/page.js`
**Problème:** Tous les profils sont chargés d'un coup.
**Impact:** Performance dégradée avec beaucoup d'utilisateurs.

**Solution:** Implémenter la pagination ou le lazy loading.

### 13. **Pas de messagerie en temps réel**
**Fichier:** `app/messages/[id]/page.js`
**Problème:** Pas de subscription Supabase Realtime.
**Impact:** L'utilisateur doit recharger pour voir les nouveaux messages.

**Solution:** Ajouter une subscription Supabase Realtime.

### 14. **Pas de gestion des erreurs réseau**
**Problème général:** Pas de retry automatique ou gestion des timeouts.
**Impact:** Mauvaise expérience utilisateur en cas de problème réseau.

**Solution:** Ajouter des retry automatiques et des messages d'erreur clairs.

---

## 📋 RÉSUMÉ PAR PRIORITÉ

### ✅ CORRIGÉS :
1. ✅ Bug vérification blocages (Push Éclair) - **CORRIGÉ**
2. ✅ Erreur non gérée conversation_participants - **CORRIGÉ**
3. ✅ Dépendances useEffect GroupMeetupsSection - **CORRIGÉ**
4. ✅ Gestion d'erreur si tables group_meetups n'existent pas - **CORRIGÉ**
5. ✅ Race condition MeetupReminders - **CORRIGÉ**

### À corriger rapidement :

### À corriger rapidement :
5. Vérification participant avant proposer rendez-vous
6. Race condition MeetupReminders
7. Gestion d'erreur handleSendPush
8. console.error en production (nettoyage)

### Améliorations futures :
9. Debounce sur filtres
10. Pagination
11. Messagerie temps réel
12. Gestion erreurs réseau

