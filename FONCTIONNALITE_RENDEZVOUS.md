# 📅 Fonctionnalité de Rendez-vous de Groupe

## Vue d'ensemble

Système complet de planification de rendez-vous pour les groupes de ManyLovr, permettant :
- ✅ Proposition de date et lieu par n'importe quel membre
- ✅ Validation, refus ou contre-proposition par les partenaires
- ✅ Confirmation automatique quand tous acceptent
- ✅ Reminders dans le profil pour les rendez-vous confirmés

## Architecture

### Tables de base de données

#### `group_meetups`
Table principale des rendez-vous proposés :
- `id` : UUID
- `conversation_id` : Lien vers la conversation de groupe
- `proposer_user_id` : Qui a proposé
- `proposed_date` : Date/heure proposée
- `proposed_location` : Lieu proposé
- `proposed_location_details` : Détails optionnels
- `status` : 'pending', 'confirmed', 'cancelled', 'completed'
- `confirmed_date` : Date confirmée (peut différer si modifiée)
- `confirmed_location` : Lieu confirmé
- `confirmed_location_details` : Détails confirmés

#### `group_meetup_responses`
Réponses des participants :
- `id` : UUID
- `meetup_id` : Lien vers le rendez-vous
- `user_id` : Qui répond
- `response_type` : 'accepted', 'declined', 'counter_proposal'
- `counter_date` : Si contre-proposition, nouvelle date
- `counter_location` : Si contre-proposition, nouveau lieu
- `counter_location_details` : Détails de la contre-proposition
- `message` : Message optionnel

### Fonctions SQL

#### `propose_group_meetup()`
Propose un nouveau rendez-vous pour un groupe.
- Vérifie que l'utilisateur est participant actif
- Vérifie que c'est bien un groupe
- Crée l'entrée dans `group_meetups`

#### `respond_to_meetup()`
Permet à un participant de répondre (accepter, refuser, contre-proposer).
- Vérifie que l'utilisateur est participant
- Insère ou met à jour la réponse
- Gère les contre-propositions

#### `accept_counter_proposal()`
Permet au créateur d'accepter une contre-proposition.
- Met à jour le rendez-vous avec les nouvelles infos
- Transforme la contre-proposition en acceptation

#### `check_meetup_confirmation()` (Trigger)
Confirme automatiquement le rendez-vous quand tous les participants actifs ont accepté.

## Composants React

### 1. `GroupMeetupsSection.js`
Composant principal affiché dans les conversations de groupe :
- Liste des rendez-vous proposés/confirmés
- Formulaire pour proposer un nouveau rendez-vous
- Affichage des réponses de chaque participant
- Gestion des contre-propositions

**Emplacement** : `app/messages/[id]/_components/GroupMeetupsSection.js`

### 2. `MeetupReminders.js`
Affiche les reminders dans le profil :
- Liste des rendez-vous confirmés à venir
- Affichage avec date, heure, lieu
- Lien direct vers la conversation du groupe

**Emplacement** : `app/onboarding/_components/MeetupReminders.js`

## Workflow utilisateur

### 1. Proposer un rendez-vous
1. Dans une conversation de groupe, cliquer sur "+ Proposer un rendez-vous"
2. Remplir : date, heure, lieu (obligatoire), détails (optionnel)
3. Envoyer → Tous les participants reçoivent la proposition

### 2. Répondre à une proposition
Chaque participant peut :
- ✅ **Accepter** : Le rendez-vous se confirme automatiquement si tous acceptent
- ❌ **Refuser** : Le rendez-vous reste en attente
- 🔄 **Proposer autre chose** : Contre-proposition avec nouvelle date/lieu

### 3. Gérer les contre-propositions
- Le créateur voit toutes les contre-propositions
- Il peut accepter une contre-proposition → Le rendez-vous est mis à jour
- Les autres participants doivent réaccepter la nouvelle proposition

### 4. Voir les reminders
- Dans "Mon profil" (`/onboarding`)
- Dans la page de profil détaillée (si c'est ton propre profil)
- Affichage des rendez-vous confirmés à venir
- Clic pour aller directement à la conversation

## Installation

### 1. Exécuter le SQL
Exécute le fichier `SQL_MEETUPS_RENDEZVOUS.sql` dans Supabase SQL Editor.

### 2. Vérifier les permissions
Assure-toi que les utilisateurs authentifiés peuvent :
- Lire les `group_meetups` de leurs groupes
- Créer des `group_meetups` dans leurs groupes
- Lire/écrire dans `group_meetup_responses` pour leurs groupes

### 3. Tester
1. Créer un groupe
2. Proposer un rendez-vous
3. Vérifier que les autres participants voient la proposition
4. Accepter/refuser/contre-proposer
5. Vérifier la confirmation automatique
6. Vérifier les reminders dans le profil

## Améliorations futures possibles

1. **Notifications** : Notifier les participants quand un rendez-vous est proposé/confirmé
2. **Rappels** : Envoyer un rappel 24h avant le rendez-vous
3. **Annulation** : Permettre d'annuler un rendez-vous confirmé
4. **Historique** : Voir les rendez-vous passés
5. **Calendrier** : Vue calendrier des rendez-vous
6. **Géolocalisation** : Suggérer des lieux proches
7. **Météo** : Afficher la météo prévue pour le jour du rendez-vous

## Notes techniques

- Les rendez-vous sont liés aux conversations de groupe uniquement
- La confirmation automatique se fait via un trigger SQL
- Les reminders ne montrent que les rendez-vous confirmés à venir
- Les contre-propositions peuvent être multiples (chaque participant peut proposer)
- Le créateur peut accepter n'importe quelle contre-proposition



