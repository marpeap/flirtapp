# 📦 Commandes Git pour ManyLovr

## Workflow de base pour pousser tes changements

### 1. Vérifier l'état des fichiers modifiés
```bash
git status
```
Affiche les fichiers modifiés, ajoutés ou supprimés.

### 2. Ajouter les fichiers au staging
```bash
# Ajouter tous les fichiers modifiés
git add .

# Ou ajouter des fichiers spécifiques
git add app/page.js app/globals.css
```

### 3. Créer un commit avec un message
```bash
git commit -m "Refonte du design avec nouveau système de couleurs"
```

### 4. Pousser vers le dépôt distant
```bash
# Si c'est la première fois (branche principale)
git push origin main

# Ou si tu es sur une autre branche
git push origin nom-de-ta-branche

# Si la branche n'existe pas encore sur le remote
git push -u origin nom-de-ta-branche
```

## Workflow complet en une fois

```bash
# 1. Vérifier ce qui a changé
git status

# 2. Ajouter tous les changements
git add .

# 3. Créer un commit
git commit -m "Description de tes changements"

# 4. Pousser vers GitHub/GitLab/etc.
git push origin main
```

## Commandes utiles supplémentaires

### Voir l'historique des commits
```bash
git log
```

### Voir les différences avant de commit
```bash
git diff
```

### Annuler des changements non commités
```bash
# Annuler les modifications d'un fichier
git checkout -- nom-du-fichier

# Annuler tous les changements non commités
git reset --hard HEAD
```

### Créer une nouvelle branche
```bash
git checkout -b nom-de-la-branche
```

### Changer de branche
```bash
git checkout main
```

### Voir les branches
```bash
git branch
```

## Exemple de workflow pour tes changements actuels

```bash
# 1. Vérifier ce qui a changé
git status

# 2. Ajouter tous les fichiers modifiés
git add .

# 3. Créer un commit avec un message descriptif
git commit -m "Refonte design ManyLovr : nouveau système de couleurs, intégration images de fond, remplacement CupidWave par ManyLovr"

# 4. Pousser vers le dépôt
git push origin main
```

## Si tu as des erreurs

### Si le push est rejeté (erreur de divergence)
```bash
# Récupérer les changements distants
git pull origin main

# Résoudre les conflits si nécessaire, puis
git push origin main
```

### Si tu veux forcer le push (⚠️ attention, à utiliser avec précaution)
```bash
git push --force origin main
```

## Configuration initiale (si pas encore fait)

```bash
# Configurer ton nom
git config --global user.name "Ton Nom"

# Configurer ton email
git config --global user.email "ton@email.com"

# Vérifier la configuration
git config --list
```


