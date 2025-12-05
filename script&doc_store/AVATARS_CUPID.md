# 🎭 Système d'avatars Cupid basé sur le questionnaire

## Vue d'ensemble

Système intelligent de sélection d'avatars ManyLovr basé sur les réponses au questionnaire de compatibilité. Chaque utilisateur se voit attribuer un avatar qui reflète son profil de personnalité.

## 6 Profils Cupid

### 👻 Ghostz
- **Traits** : Discret, Indépendant, Mystérieux
- **Description** : Mystérieux et discret, tu préfères garder une certaine distance et l'anonymat.
- **Correspond à** : Utilisateurs qui préfèrent l'anonymat, rencontres ponctuelles, communication minimale

### 😊 Happyz
- **Traits** : Joyeux, Détendu, Optimiste
- **Description** : Positif et détendu, tu cherches des rencontres joyeuses et sans prise de tête.
- **Correspond à** : Utilisateurs ouverts, flexibles, ambiance détendue

### 💕 Lovers
- **Traits** : Romantique, Émotionnel, Fidèle
- **Description** : Romantique et relationnel, tu privilégies les connexions émotionnelles profondes.
- **Correspond à** : Utilisateurs cherchant des relations durables, exclusives, communication importante

### 🧠 Minderz
- **Traits** : Réfléchi, Prudent, Respectueux
- **Description** : Réfléchi et prudent, tu accordes une grande importance aux boundaries et à la sécurité.
- **Correspond à** : Utilisateurs soucieux de sécurité, boundaries importantes, hygiène stricte

### ⚡ Powerz
- **Traits** : Confiant, Expérimenté, Direct
- **Description** : Confiant et expérimenté, tu sais ce que tu veux et tu n'as pas peur de l'exprimer.
- **Correspond à** : Utilisateurs expérimentés, polyamour, fréquence élevée

### 🔥 Sexyz
- **Traits** : Sensuel, Direct, Aventureux
- **Description** : Sensuel et direct, tu cherches des rencontres intenses et sans fioritures.
- **Correspond à** : Utilisateurs cherchant one-shot, rencontres ponctuelles, ambiance festive

## Logique de sélection

L'algorithme analyse les 15 questions du questionnaire et attribue des points à chaque profil selon les réponses :

- **Q1 (Type de lien)** : Influence Lovers, Sexyz, Powerz
- **Q2 (One-shot)** : Influence Sexyz, Lovers, Minderz
- **Q3 (Identité minimale)** : Influence Ghostz, Minderz
- **Q4 (Fréquence)** : Influence Powerz, Lovers, Ghostz
- **Q5 (Après rencontre)** : Influence Lovers, Ghostz, Happyz
- **Q6 (Safe sex)** : Influence Minderz (critique)
- **Q7 (Hygiène)** : Influence Minderz, Powerz
- **Q8 (Tabac)** : Influence Minderz, Ghostz
- **Q9 (Alcool)** : Influence Sexyz, Happyz, Minderz
- **Q10 (Rythme)** : Influence Minderz, Happyz, Ghostz
- **Q11 (Communication)** : Influence Lovers, Ghostz, Happyz
- **Q12 (Ambiance)** : Influence Happyz, Sexyz, Ghostz
- **Q13 (Expérience groupe)** : Influence Powerz, Minderz
- **Q14 (Boundaries)** : Influence Minderz (critique)
- **Q15 (Lieu)** : Influence Powerz, Minderz, Happyz

Le profil avec le score le plus élevé est sélectionné.

## Fonctionnalités

### 1. Attribution automatique
Quand un utilisateur complète le questionnaire :
- Un avatar est automatiquement sélectionné selon son profil
- Si l'utilisateur n'a pas de photo personnelle, l'avatar devient sa photo de profil
- Si l'utilisateur a déjà une photo, l'avatar est affiché dans la carte personnelle

### 2. Carte personnelle
La carte personnelle affiche :
- L'avatar Cupid sélectionné (80x80px)
- Le nom du profil (Ghostz, Happyz, etc.)
- L'emoji associé
- La description du profil
- Les traits de personnalité (badges)

### 3. Emplacement
La carte personnelle est visible :
- Dans la page de profil (`/profiles/[id]`)
- Uniquement pour le propriétaire du profil
- Uniquement si le questionnaire a été complété

## Fichiers créés/modifiés

### Nouveaux fichiers
1. **`app/profiles/[id]/_components/CupidProfileCard.js`**
   - Composant affichant la carte personnelle avec l'avatar Cupid
   - Charge les réponses au questionnaire
   - Détermine et affiche le profil Cupid

### Fichiers modifiés
1. **`lib/cupidAvatars.js`**
   - Ajout de `determineCupidProfile()` : Détermine le profil selon les réponses
   - Ajout de `getCupidAvatarByCategory()` : Sélectionne un avatar dans une catégorie
   - Ajout de `getCupidAvatarFromAnswers()` : Combine les deux fonctions
   - Mapping complet de tous les avatars par catégorie

2. **`app/profiles/[id]/_components/EnhancedMatchmakingQuestionnaire.js`**
   - Attribution automatique de l'avatar après soumission du questionnaire
   - Mise à jour de la photo de profil si pas de photo personnelle

3. **`app/profiles/[id]/page.js`**
   - Intégration du composant `CupidProfileCard`

## Structure des avatars

Les avatars sont organisés dans `/cupids/` :
- `Ghostz/` : 59 images (138-183, 245-255, 262-263)
- `Happyz/` : 31 images (1-30, 238)
- `Lovers/` : 54 images (31-60, 184-195, 201-212)
- `Minderz/` : 42 images (61-90, 220-224, 237, 239-244)
- `Powerz/` : 6 images (256-261)
- `Sexyz/` : 71 images (91-137, 196-200, 213-219, 225-236)

## Utilisation

### Pour l'utilisateur
1. Compléter le questionnaire de compatibilité (15 questions)
2. Un avatar est automatiquement sélectionné
3. La carte personnelle apparaît dans le profil
4. L'avatar reflète la personnalité selon les réponses

### Pour le développeur
```javascript
import { determineCupidProfile, getCupidAvatarByCategory } from '@/lib/cupidAvatars';

// Déterminer le profil
const profile = determineCupidProfile(answers);

// Obtenir un avatar de ce profil
const avatar = getCupidAvatarByCategory(profile);
```

## Notes techniques

- L'avatar est sélectionné de manière déterministe (même réponses = même profil)
- Mais l'image spécifique est aléatoire dans la catégorie
- Si l'utilisateur modifie ses réponses, le profil peut changer
- La carte personnelle ne s'affiche que si le questionnaire est complété



