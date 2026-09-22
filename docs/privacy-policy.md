# Politique de confidentialité — TaxiDja

_Dernière mise à jour : 22 septembre 2026_

TaxiDja est une application de mise en relation entre passagers et conducteurs, développée dans le
cadre d'un projet étudiant (Licence 3). Cette politique explique simplement quelles données nous
collectons, pourquoi, et comment elles sont protégées.

## 1. Quelles données sont collectées

- **Informations de compte** : prénom, nom, numéro de téléphone (identifiant de connexion), email
  (optionnel), mot de passe (jamais stocké en clair — voir section 3).
- **Position GPS** : ta position est utilisée pour afficher la carte, calculer un itinéraire et une
  estimation de prix, et — pendant une course active — pour te localiser (passager) ou localiser le
  conducteur en approche. Le suivi de position du conducteur n'est actif que pendant une course en
  cours, pas en permanence.
- **Historique des courses** : trajets effectués, prix, statut, notes laissées.
- **Photo de profil (optionnelle)** : si tu choisis d'en ajouter une.
- **Pour les conducteurs** : informations du véhicule (type, marque, modèle, plaque, couleur) et
  numéro/date d'expiration du permis de conduire, nécessaires à la vérification par l'équipe TaxiDja
  avant de pouvoir recevoir des courses.

## 2. Pourquoi ces données sont collectées

Uniquement pour faire fonctionner le service : créer et gérer ton compte, te mettre en relation avec
un conducteur ou un passager, calculer un itinéraire et un tarif, assurer le suivi d'une course en
cours, vérifier l'identité et le véhicule des conducteurs, et te permettre de consulter ton historique
et de noter tes courses.

## 3. Comment les données sont stockées

Les données sont actuellement hébergées sur un serveur backend auto-géré (base de données
PostgreSQL), dans le cadre du développement de ce projet étudiant. Les mots de passe sont hachés
(bcrypt) et ne sont jamais stockés ni consultables en clair. Si le projet évolue vers un hébergement
cloud pour une utilisation plus large, cette politique sera mise à jour en conséquence et les mêmes
principes de protection continueront de s'appliquer.

## 4. Partage des données

Aucune donnée n'est vendue ni partagée avec des tiers à des fins commerciales ou publicitaires. Les
seules données partagées entre utilisateurs sont celles nécessaires au bon déroulement d'une course
(ex. : un conducteur voit le prénom et la position du passager qui lui est assigné, et inversement).

Le calcul d'itinéraire utilise un service public tiers (OSRM — voir `README.md` du projet) : les
coordonnées de départ et d'arrivée d'une course lui sont transmises pour calculer le trajet, sans
information d'identité associée.

## 5. Droit de suppression du compte

Tu as le droit de demander la suppression de ton compte et des données associées. Cette
fonctionnalité n'est pas encore disponible directement dans l'application — en attendant, envoie une
demande à l'adresse de contact ci-dessous, et ton compte et tes données seront supprimés dans un
délai raisonnable.

## 6. Contact

Pour toute question sur cette politique ou pour une demande de suppression de compte, contacte :
**contact@taxidja.td** _(adresse de contact du projet — à remplacer par un contact réel avant
publication sur le Play Store)_.

## 7. Évolution de cette politique

Ce projet est encore en développement. Cette politique pourra évoluer si de nouvelles fonctionnalités
collectant des données sont ajoutées, ou si l'hébergement change. La date de dernière mise à jour en
haut de ce document reflète la version en vigueur.
