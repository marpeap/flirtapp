# 💥 Gestion des crédits Push Éclair - Interface Admin

## Vue d'ensemble

Interface d'administration permettant d'attribuer et gérer les crédits Push Éclair des utilisateurs depuis la page admin.

## Fonctionnalités

### 1. Recherche d'utilisateurs
- Recherche par **pseudo** (display_name)
- Recherche insensible à la casse
- Limite de 20 résultats
- Affichage des crédits actuels dans les résultats

### 2. Gestion des crédits
Deux modes d'action disponibles :

#### Mode "Ajouter des crédits"
- Ajoute un nombre de crédits au total existant
- Exemple : Si l'utilisateur a 3 crédits et tu ajoutes 5 → Total = 8

#### Mode "Définir le nombre exact"
- Remplace le nombre de crédits par une valeur exacte
- Exemple : Si l'utilisateur a 3 crédits et tu définis 10 → Total = 10

### 3. Affichage
- **Section pliable** : Peut être masquée/affichée
- **Résultats de recherche** : Liste cliquable avec crédits actuels
- **Interface de gestion** : Formulaire clair avec prévisualisation
- **Messages de confirmation** : Feedback visuel après chaque action

## Utilisation

### Pour l'admin

1. Aller sur `/admin`
2. Cliquer sur "Afficher" dans la section "💥 Gestion des crédits Push Éclair"
3. Rechercher un utilisateur par son pseudo
4. Cliquer sur le profil dans les résultats
5. Choisir l'action (Ajouter ou Définir)
6. Entrer le nombre de crédits
7. Cliquer sur le bouton d'action
8. Voir la confirmation avec le nouveau total

### Exemple

**Scénario** : Un utilisateur a 2 crédits, tu veux lui donner 10 crédits supplémentaires.

1. Rechercher son pseudo
2. Sélectionner son profil
3. Choisir "Ajouter des crédits"
4. Entrer "10"
5. Cliquer sur "Ajouter 10 crédit(s)"
6. Résultat : L'utilisateur a maintenant 12 crédits

## Fichiers modifiés

### `app/admin/page.js`
- Ajout de la section de gestion Push Éclair
- Fonction `handleSearchUsers()` : Recherche d'utilisateurs
- Fonction `handleUpdateCredits()` : Mise à jour des crédits
- Affichage des crédits dans le tableau des derniers profils

## Structure des données

### Table `profiles`
- Champ `push_eclair_credits` : INTEGER (peut être NULL, défaut 0)

### Mise à jour
```sql
UPDATE profiles 
SET push_eclair_credits = <nouveau_total>
WHERE id = <profile_id>;
```

## Sécurité

- ✅ Accès restreint : Seul l'admin (email défini dans `ADMIN_EMAIL`) peut accéder
- ✅ Validation : Vérification que le nombre de crédits est >= 0
- ✅ Feedback : Messages d'erreur clairs en cas de problème

## Améliorations futures possibles

1. **Historique des attributions** : Table pour tracer qui a donné combien et quand
2. **Recherche par email** : Via une fonction RPC Supabase
3. **Attribution en masse** : Donner des crédits à plusieurs utilisateurs d'un coup
4. **Statistiques** : Voir combien de crédits ont été distribués au total
5. **Notifications** : Notifier l'utilisateur quand des crédits sont ajoutés


