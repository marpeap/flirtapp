# 🎨 Design System ManyLovr

## Concept

Le nouveau design de ManyLovr reflète les valeurs de l'application :
- **Bienveillance** : Couleurs douces et apaisantes
- **Inclusivité** : Palette accessible et accueillante
- **Qualité** : Design raffiné et moderne
- **Sécurité** : Interface claire et rassurante
- **Respect** : Espaces généreux, transitions douces

## Palette de couleurs

### Couleurs principales
- **Violet doux** (`#a855f7`) : Créativité, ouverture, connexion
- **Rose doux** (`#f472b6`) : Tendresse, bienveillance, chaleur

### Couleurs de fond
- **Fond principal** : `#0f0f23` - Sombre mais doux, apaisant
- **Fond secondaire** : `#1a1a2e` - Légèrement plus clair
- **Cartes** : Transparence avec blur pour effet glassmorphism

### Couleurs de texte
- **Primaire** : `#f8fafc` - Très clair pour lisibilité
- **Secondaire** : `#cbd5e1` - Pour les textes moins importants
- **Atténué** : `#94a3b8` - Pour les métadonnées

## Composants

### Boutons

#### `.btn-primary`
Bouton principal avec dégradé violet/rose. Utilisé pour les actions principales.

#### `.btn-secondary`
Bouton secondaire avec fond transparent et bordure. Pour les actions alternatives.

#### `.btn-outline`
Bouton avec bordure uniquement. Pour les actions moins importantes.

#### `.btn-ghost`
Bouton sans bordure ni fond. Pour les actions discrètes.

#### `.btn-danger`
Bouton rouge pour les actions destructives (suppression, etc.).

### Cartes

#### `.card`
Carte de base avec transparence et blur. Effet glassmorphism.

#### `.card-elevated`
Carte avec ombre plus prononcée. Pour mettre en avant un contenu.

### Badges

#### `.badge`
Badge par défaut avec fond violet transparent.

#### `.badge-success`, `.badge-warning`, `.badge-error`
Variantes avec couleurs d'état.

## Typographie

- **Police** : System fonts (Inter, Segoe UI, etc.)
- **Hiérarchie claire** : Tailles de 2.5rem (h1) à 1.25rem (h4)
- **Line-height généreux** : 1.6-1.7 pour la lisibilité
- **Poids** : 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

## Espacements

Système cohérent basé sur des multiples de 4px :
- `--spacing-xs` : 4px
- `--spacing-sm` : 8px
- `--spacing-md` : 16px
- `--spacing-lg` : 24px
- `--spacing-xl` : 32px
- `--spacing-2xl` : 48px

## Rayons de bordure

- `--radius-sm` : 8px
- `--radius-md` : 12px
- `--radius-lg` : 16px
- `--radius-xl` : 24px
- `--radius-full` : 9999px (pour les boutons ronds)

## Ombres

Ombres douces et subtiles :
- `--shadow-sm` : Ombre légère
- `--shadow-md` : Ombre moyenne (par défaut)
- `--shadow-lg` : Ombre prononcée
- `--shadow-xl` : Ombre très prononcée
- `--shadow-glow` : Effet de lueur violette (pour les boutons primaires)

## Transitions

Toutes les interactions utilisent des transitions douces :
- `--transition-fast` : 150ms
- `--transition-base` : 250ms (par défaut)
- `--transition-slow` : 350ms

## Effets spéciaux

### `.text-gradient`
Texte avec dégradé violet/rose. Utilisé pour les titres importants.

### `.glow-effect`
Effet de lueur autour d'un élément.

### `.fade-in`
Animation d'apparition en fondu depuis le bas.

## Responsive

Le design est entièrement responsive :
- **Desktop** : Layout en 2 colonnes, espacements généreux
- **Tablet** : Adaptation des grilles, espacements réduits
- **Mobile** : Layout en 1 colonne, padding réduit

## Accessibilité

- **Contraste** : Tous les textes respectent WCAG AA
- **Focus visible** : Bordures et ombres sur les éléments focusables
- **Tailles de texte** : Minimum 14px pour le corps, 12px pour les labels
- **Espacements** : Suffisants pour les interactions tactiles

## Utilisation

Tous les styles sont disponibles via les variables CSS et les classes utilitaires dans `globals.css`. 

Pour utiliser le design system :
1. Utilisez les classes CSS définies (`.btn-primary`, `.card`, etc.)
2. Référencez les variables CSS pour les couleurs (`var(--color-primary)`)
3. Respectez les espacements et rayons définis

## Exemples

```jsx
// Bouton primaire
<button className="btn-primary">Créer mon profil</button>

// Carte avec contenu
<div className="card">
  <h2>Titre</h2>
  <p>Contenu...</p>
</div>

// Badge
<span className="badge">Nouveau</span>

// Texte avec dégradé
<h1 className="text-gradient">Titre accrocheur</h1>
```




