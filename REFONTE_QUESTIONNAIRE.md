# 🎯 Refonte complète du questionnaire et système de match

## Vue d'ensemble

Refonte complète du système de questionnaire de compatibilité avec :
- ✅ **15 questions** au lieu de 10 (questions plus pertinentes)
- ✅ **Barre de progression** visuelle
- ✅ **Navigation par catégories** pour faciliter le remplissage
- ✅ **Système de calcul de compatibilité** basé sur les vraies réponses
- ✅ **Affichage de la compatibilité** dans les matchs suggérés

## Nouveau questionnaire

### Structure

Le questionnaire est organisé en **5 catégories** :

1. **Intention & Valeurs** (3 questions)
   - Type de lien recherché
   - One-shot
   - Identité minimale

2. **Rythme & Fréquence** (2 questions)
   - Fréquence des rencontres
   - Après rencontre

3. **Sécurité & Santé** (1 question critique)
   - Pratiques de protection

4. **Mode de Vie** (4 questions)
   - Hygiène
   - Tabac
   - Alcool
   - Rythme de vie

5. **Communication, Ambiance, Expérience, Limites, Préférences** (5 nouvelles questions)
   - Communication
   - Ambiance préférée
   - Expérience avec rencontres à plusieurs
   - Boundaries (critique)
   - Lieu préféré

### Fonctionnalités

- **Barre de progression** : Affiche la progression (X/15 questions)
- **Navigation par catégories** : Mini-menu pour sauter entre les catégories
- **Questions critiques** : Marquées avec ⚠️ pour la sécurité
- **Validation** : Impossible de passer à la question suivante sans répondre
- **Design moderne** : Interface fluide avec animations

## Nouveau système de calcul de compatibilité

### Score de compatibilité (max 1000 points)

Le score est calculé en fonction des réponses au questionnaire :

#### Catégorie 1: Intentions & Valeurs (200 points)
- Q1: Type de lien (50 points)
- Q2: One-shot (30 points)
- Q3: Identité minimale (20 points)
- Q4: Fréquence (30 points)
- Q5: Après rencontre (20 points)
- Q6: Safe sex (50 points - **CRITIQUE**)

#### Catégorie 2: Mode de Vie (150 points)
- Q7: Hygiène (40 points)
- Q8: Tabac (30 points) - **Pénalités pour incompatibilité**
- Q9: Alcool (30 points)
- Q10: Rythme de vie (50 points)

#### Nouvelles questions (200 points)
- Q11: Communication (30 points)
- Q12: Ambiance (30 points)
- Q13: Expérience groupe (40 points)
- Q14: Boundaries (50 points - **CRITIQUE**)
- Q15: Lieu (20 points)

### Score de match total (max ~1180 points)

Le score final combine :
1. **Compatibilité questionnaire** (max 1000 points) - **Facteur principal**
2. **Proximité géographique** (max 100 points)
3. **Préférences de genre mutuelles** (max 50 points)
4. **Intention de rencontre** (max 30 points)

### Niveaux de compatibilité

- **≥ 80%** : Excellente compatibilité (vert foncé)
- **≥ 60%** : Bonne compatibilité (vert clair)
- **≥ 40%** : Compatibilité correcte (jaune)
- **≥ 20%** : Compatibilité faible (orange)
- **< 20%** : Compatibilité très faible (rouge)

## Fichiers créés/modifiés

### Nouveaux fichiers

1. **`app/profiles/[id]/_components/EnhancedMatchmakingQuestionnaire.js`**
   - Nouveau composant de questionnaire avec barre de progression
   - Navigation par catégories
   - Validation et UX améliorée

2. **`lib/matchCompatibility.js`**
   - Fonctions de calcul de compatibilité
   - `computeCompatibilityScore()` : Calcule le score basé sur les réponses
   - `computeMatchScore()` : Score total (compatibilité + autres facteurs)
   - `getCompatibilityLevel()` : Retourne le niveau et la couleur

3. **`SQL_QUESTIONNAIRE_MATCH.sql`**
   - Fonction SQL `compute_compatibility_score()` pour calcul côté serveur
   - Index GIN pour performances
   - Vue `user_compatibility_scores` pour requêtes rapides

### Fichiers modifiés

1. **`app/profiles/[id]/_components/MatchmakingQuestionnaire.js`**
   - Redirige vers le nouveau composant (rétrocompatibilité)

2. **`app/matches/page.js`**
   - Utilise le nouveau système de calcul de compatibilité
   - Affiche le niveau de compatibilité pour chaque match
   - Charge les réponses au questionnaire de tous les candidats

## Installation

### 1. Exécuter le SQL

Exécute le fichier `SQL_QUESTIONNAIRE_MATCH.sql` dans Supabase SQL Editor pour :
- Créer la fonction `compute_compatibility_score()`
- Créer l'index GIN pour performances
- Créer la vue `user_compatibility_scores`

### 2. Tester

1. Remplir le nouveau questionnaire (15 questions)
2. Vérifier que les réponses sont sauvegardées
3. Aller sur `/matches` et vérifier que les scores de compatibilité s'affichent
4. Vérifier que les matchs sont triés par score de compatibilité

## Améliorations futures possibles

1. **Machine Learning** : Utiliser les données de matchs réussis pour améliorer l'algorithme
2. **Questions dynamiques** : Adapter les questions selon les réponses précédentes
3. **Comparaison détaillée** : Afficher les points de compatibilité/différence entre deux profils
4. **Recommandations** : Suggérer des améliorations du profil pour augmenter les matchs
5. **Statistiques** : Dashboard avec stats de compatibilité moyenne, etc.

## Notes techniques

- Le calcul de compatibilité peut se faire côté client (JavaScript) ou côté serveur (SQL)
- Les questions critiques (safe sex, boundaries) ont un poids plus important
- Les incompatibilités majeures (ex: tabac) peuvent pénaliser fortement le score
- Le système est extensible : facile d'ajouter de nouvelles questions

