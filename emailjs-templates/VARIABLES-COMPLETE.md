# Variables complètes pour les templates EmailJS - Formulaire de contact

Ce document liste **TOUTES** les variables disponibles pour les templates EmailJS du formulaire de contact ManyLovr.

## 📝 Variables du formulaire (toujours présentes)

| Variable | Type | Description | Exemple |
|----------|------|-------------|---------|
| `phone` | String | Numéro de téléphone normalisé (sans espaces) | `0649710370` |
| `phone_original` | String | Numéro de téléphone original (avant normalisation) | `06 49 71 03 70` |
| `message` | String | Message de l'utilisateur | `"J'ai un problème avec..."` |
| `source_page` | String | Page d'origine de la demande | `/contact` |
| `date` | String | Date formatée (à formater côté code) | `15 janvier 2024, 14:30` |
| `timestamp` | String | Timestamp Unix ou format ISO (optionnel) | `1705327800` |
| `website_trap` | String | Valeur du champ honeypot (si rempli = spam) | `""` (vide si pas de spam) |

## 👤 Variables utilisateur (si connecté)

| Variable | Type | Description | Exemple |
|----------|------|-------------|---------|
| `user_id` | String (UUID) | ID unique de l'utilisateur | `550e8400-e29b-41d4-a716-446655440000` |
| `user_email` | String | Email de l'utilisateur | `user@example.com` |
| `display_name` | String | Pseudo de l'utilisateur | `"John Doe"` |
| `gender` | String | Genre de l'utilisateur | `"homme"`, `"femme"`, `"non-binaire"`, `"autre"` |
| `main_intent` | String | Intention principale | `"amour"`, `"amitié"`, `"les_deux"`, `"autre"` |
| `bio` | String | Bio de l'utilisateur | `"Passionné de..."` |
| `main_photo_url` | String (URL) | URL de la photo de profil principale | `https://...` |

## 📍 Variables de localisation du profil utilisateur

| Variable | Type | Description | Exemple |
|----------|------|-------------|---------|
| `user_city` | String | Ville du profil utilisateur | `"Paris"` |
| `user_lat` | Number | Latitude du profil utilisateur | `48.8566` |
| `user_lng` | Number | Longitude du profil utilisateur | `2.3522` |

## 🗺️ Variables de sélection sur la carte (si utilisateur sélectionne une position)

| Variable | Type | Description | Exemple |
|----------|------|-------------|---------|
| `map_lat` | Number | Latitude de la position sélectionnée sur la carte | `48.8566` |
| `map_lng` | Number | Longitude de la position sélectionnée sur la carte | `2.3522` |
| `map_address` | String | Adresse complète de la position sélectionnée | `"123 Rue de la Paix, 75001 Paris"` |
| `map_radius_km` | Number | Rayon de recherche sélectionné (en km) | `25` |
| `map_zoom_level` | Number | Niveau de zoom de la carte | `12` |

## 📡 Variables de géolocalisation actuelle (navigateur/appareil)

Ces variables sont récupérées via l'API de géocodage inverse (BigDataCloud) :

| Variable | Type | Description | Exemple |
|----------|------|-------------|---------|
| `geolocation_lat` | Number | Latitude de la géolocalisation actuelle | `48.8566` |
| `geolocation_lng` | Number | Longitude de la géolocalisation actuelle | `2.3522` |
| `geolocation_city` | String | Ville détectée par géocodage inverse | `"Paris"` |
| `geolocation_locality` | String | Localité détectée | `"Paris 1er"` |
| `geolocation_country` | String | Pays détecté | `"France"` |
| `geolocation_address` | String | Adresse complète formatée | `"1 Rue de Rivoli, 75001 Paris, France"` |

## 🔧 Variables techniques (optionnelles)

| Variable | Type | Description | Exemple |
|----------|------|-------------|---------|
| `ip_address` | String | Adresse IP de l'utilisateur | `192.168.1.1` |
| `user_agent` | String | User Agent du navigateur/appareil | `"Mozilla/5.0..."` |

## 📋 Utilisation dans les templates

### Syntaxe Handlebars (EmailJS)

Les templates utilisent la syntaxe Handlebars pour les variables conditionnelles :

```handlebars
{{variable}}                    <!-- Variable simple -->
{{#variable}}...{{/variable}}    <!-- Si variable existe et n'est pas vide -->
{{^variable}}...{{/variable}}   <!-- Si variable n'existe pas ou est vide -->
```

### Exemples

```handlebars
<!-- Afficher le téléphone -->
{{phone}}

<!-- Afficher l'email si l'utilisateur est connecté -->
{{#user_email}}
📧 Email: {{user_email}}
{{/user_email}}

<!-- Afficher "Visiteur anonyme" si pas d'user_id -->
{{#user_id}}
Utilisateur: {{user_id}}
{{/user_id}}
{{^user_id}}
Visiteur anonyme
{{/user_id}}

<!-- Afficher les coordonnées si disponibles -->
{{#user_lat}}{{#user_lng}}
Coordonnées: {{user_lat}}, {{user_lng}}
{{/user_lng}}{{/user_lat}}
```

## 🔗 Liens Google Maps / OpenStreetMap

Pour créer des liens vers les cartes, utilisez les coordonnées :

```handlebars
<!-- Google Maps -->
https://www.google.com/maps?q={{user_lat}},{{user_lng}}

<!-- OpenStreetMap -->
https://www.openstreetmap.org/?mlat={{user_lat}}&mlon={{user_lng}}&zoom=15
```

## ⚠️ Notes importantes

1. **Variables optionnelles** : Toutes les variables sauf `phone`, `message`, `source_page` et `date` sont optionnelles et peuvent être vides.

2. **Variables conditionnelles** : Utilisez toujours `{{#variable}}...{{/variable}}` pour les variables optionnelles pour éviter d'afficher des sections vides.

3. **Format de date** : La variable `date` doit être formatée côté code JavaScript avant l'envoi à EmailJS.

4. **Géolocalisation** : Les variables `geolocation_*` nécessitent que l'utilisateur autorise la géolocalisation et qu'une API de géocodage inverse soit appelée.

5. **Sélection de carte** : Les variables `map_*` ne sont disponibles que si l'utilisateur sélectionne une position sur une carte interactive.

6. **Spam detection** : Si `website_trap` contient une valeur, c'est probablement un bot. Ne pas traiter la demande.

## 📝 Exemple d'objet de données complet

```javascript
{
  // Formulaire
  phone: "0649710370",
  phone_original: "06 49 71 03 70",
  message: "J'ai un problème avec mon compte",
  source_page: "/contact",
  date: "15 janvier 2024, 14:30",
  timestamp: "1705327800",
  website_trap: "",
  
  // Utilisateur (si connecté)
  user_id: "550e8400-e29b-41d4-a716-446655440000",
  user_email: "user@example.com",
  display_name: "John Doe",
  gender: "homme",
  main_intent: "amour",
  bio: "Passionné de...",
  main_photo_url: "https://...",
  
  // Localisation profil
  user_city: "Paris",
  user_lat: 48.8566,
  user_lng: 2.3522,
  
  // Sélection carte (si disponible)
  map_lat: 48.8606,
  map_lng: 2.3376,
  map_address: "Louvre, 75001 Paris",
  map_radius_km: 25,
  map_zoom_level: 12,
  
  // Géolocalisation actuelle (si disponible)
  geolocation_lat: 48.8566,
  geolocation_lng: 2.3522,
  geolocation_city: "Paris",
  geolocation_locality: "Paris 1er",
  geolocation_country: "France",
  geolocation_address: "1 Rue de Rivoli, 75001 Paris, France",
  
  // Techniques (si disponibles)
  ip_address: "192.168.1.1",
  user_agent: "Mozilla/5.0..."
}
```

