# Templates EmailJS pour le formulaire de contact

Ce dossier contient les templates EmailJS pour le formulaire de contact de ManyLovr.

## 📚 Documentation complète

**Consultez le fichier `VARIABLES-COMPLETE.md` pour la liste exhaustive de TOUTES les variables disponibles**, y compris :
- Variables du formulaire
- Variables utilisateur (si connecté)
- Variables de localisation du profil
- Variables de sélection sur la carte (maps)
- Variables de géolocalisation actuelle
- Variables techniques

## Variables principales

Les variables principales disponibles dans les templates :

### Formulaire (toujours présentes)
- `{{phone}}` - Numéro de téléphone normalisé (format français)
- `{{phone_original}}` - Numéro de téléphone original (avant normalisation)
- `{{message}}` - Message de l'utilisateur
- `{{source_page}}` - Page d'origine de la demande
- `{{date}}` - Date et heure de la demande (à formater côté code)
- `{{timestamp}}` - Timestamp (optionnel)
- `{{website_trap}}` - Valeur du champ honeypot (si rempli = spam)

### Utilisateur (si connecté)
- `{{user_id}}` - ID de l'utilisateur
- `{{user_email}}` - Email de l'utilisateur
- `{{display_name}}` - Pseudo
- `{{gender}}` - Genre
- `{{main_intent}}` - Intention principale
- `{{bio}}` - Bio
- `{{main_photo_url}}` - URL photo de profil

### Localisation profil
- `{{user_city}}` - Ville du profil
- `{{user_lat}}` - Latitude du profil
- `{{user_lng}}` - Longitude du profil

### Sélection carte (maps)
- `{{map_lat}}` - Latitude sélectionnée sur la carte
- `{{map_lng}}` - Longitude sélectionnée sur la carte
- `{{map_address}}` - Adresse de la position sélectionnée
- `{{map_radius_km}}` - Rayon de recherche (km)
- `{{map_zoom_level}}` - Niveau de zoom

### Géolocalisation actuelle
- `{{geolocation_lat}}` - Latitude actuelle
- `{{geolocation_lng}}` - Longitude actuelle
- `{{geolocation_city}}` - Ville détectée
- `{{geolocation_locality}}` - Localité
- `{{geolocation_country}}` - Pays
- `{{geolocation_address}}` - Adresse complète

### Techniques
- `{{ip_address}}` - Adresse IP
- `{{user_agent}}` - User Agent

## Templates disponibles

### 1. Template de notification (pour l'administrateur)

**Fichiers :**
- `contact-notification-template.html` - Version HTML
- `contact-notification-template-text.txt` - Version texte

**Utilisation :** Envoyer à l'administrateur (Marpeap) lorsqu'une nouvelle demande de contact est reçue.

**Sujet recommandé :** `Nouvelle demande de contact - ManyLovr`

**Destinataire :** Email de l'administrateur (à configurer dans EmailJS)

### 2. Template de confirmation (pour l'utilisateur)

**Fichiers :**
- `contact-confirmation-template.html` - Version HTML
- `contact-confirmation-template-text.txt` - Version texte

**Utilisation :** Envoyer à l'utilisateur pour confirmer la réception de sa demande.

**Sujet recommandé :** `Confirmation de réception - ManyLovr`

**Destinataire :** Email de l'utilisateur (si disponible) ou SMS via EmailJS

## Configuration dans EmailJS

### Étape 1 : Créer les templates

1. Connecte-toi à [EmailJS](https://www.emailjs.com/)
2. Va dans **Email Templates**
3. Clique sur **Create New Template**
4. Copie-colle le contenu HTML ou texte selon le template

### Étape 2 : Template de notification

**Nom du template :** `contact_notification`

**Sujet :** `Nouvelle demande de contact - ManyLovr`

**Contenu :** Copie le contenu de `contact-notification-template.html`

**Variables à ajouter dans EmailJS :**
- `phone`
- `message`
- `user_id`
- `source_page`
- `date`

### Étape 3 : Template de confirmation (optionnel)

**Nom du template :** `contact_confirmation`

**Sujet :** `Confirmation de réception - ManyLovr`

**Contenu :** Copie le contenu de `contact-confirmation-template.html`

**Variables à ajouter dans EmailJS :**
- `phone`

## Note sur les variables conditionnelles

EmailJS utilise la syntaxe Handlebars. Pour gérer les variables optionnelles comme `user_id`, utilise :

```handlebars
{{#user_id}}{{user_id}}{{/user_id}}{{^user_id}}Visiteur anonyme{{/user_id}}
```

Cela affichera l'ID utilisateur s'il existe, sinon "Visiteur anonyme".

## Format de date

La variable `{{date}}` doit être formatée côté code JavaScript avant l'envoi. Exemple :

```javascript
const dateFormatted = new Date().toLocaleString('fr-FR', {
  dateStyle: 'full',
  timeStyle: 'short'
});
```

## Intégration dans le code

Voir le fichier `contact/page.js` pour l'intégration complète avec EmailJS.

