# TaxiDja

Plateforme intelligente de gestion du transport urbain au Tchad (cars, rakcha, motos), avec géolocalisation.
Conçue pour fonctionner dans tout le pays (pays / provinces / villes / zones), pas uniquement à N'Djamena.

## Structure du monorepo

```
TaxiDja/
├── mobile/    # App Android (Expo + React Native + TypeScript) — rôles PASSENGER / DRIVER
├── backend/   # API (Node.js + TypeScript + Express + Prisma + Socket.IO)
├── admin/     # Dashboard web d'administration (React + TypeScript + Vite)
├── docs/      # Documentation du projet
```

## Prérequis

- Node.js 20+
- Java 17 (Android/Gradle)
- Android Studio + Android SDK (platform-tools, emulator, cmdline-tools)
- PostgreSQL (installation native, voir `backend/.env.example`)

## Démarrage rapide

### Backend

```bash
cd backend
cp .env.example .env   # renseigner DATABASE_URL et JWT_SECRET
npm install
npx prisma migrate dev
npm run dev
```

### Mobile

```bash
cd mobile
npm install
npx expo start
```

### Admin

```bash
cd admin
cp .env.example .env
npm install
npm run dev
```

Compte admin de dev créé par `backend/prisma/seed.ts` — email `admin@taxidja.td`, mot de passe
`admin1234` (voir `admin/README.md`).

## Build & test sur un téléphone Android (APK)

Un APK de test (build "release" signé avec le keystore de debug, donc non destiné au Play Store)
peut être généré pour installation directe sur un téléphone physique, hors émulateur.

### Générer l'APK

```bash
cd mobile
npx expo prebuild --platform android --clean   # régénère android/ depuis app.config.js
cd android
./gradlew assembleRelease
```

L'APK est produit dans `mobile/android/app/build/outputs/apk/release/app-release.apk`, puis copié
dans `builds/taxidja-preview.apk` à la racine du repo pour un accès plus simple (dossier non versionné,
voir `.gitignore`).

> Un profil EAS `preview` (`mobile/eas.json`) est aussi configuré pour produire un APK via
> `eas build --platform android --profile preview`. Cette voie nécessite un compte Expo connecté
> (`npx eas-cli login`) — elle n'a pas été utilisée pour ce build initial car aucun compte n'était
> configuré dans cet environnement. Le build ci-dessus (prebuild + Gradle) utilise exactement le
> même mécanisme que `eas build --local` mais sans passer par l'authentification EAS.

### Installer l'APK sur le téléphone

1. Sur le téléphone : Paramètres → Sécurité (ou "Applications") → autoriser l'installation
   d'applications de sources inconnues pour l'application que tu utilises pour transférer le
   fichier (navigateur, Fichiers, etc.).
2. Transférer `builds/taxidja-preview.apk` sur le téléphone : câble USB, ou tout moyen équivalent
   (Bluetooth, lien de partage, clé USB…).
3. Sur le téléphone, ouvrir le fichier `.apk` transféré et confirmer l'installation.

### Adresse de l'API backend (réseau local)

L'app mobile ne peut pas utiliser `localhost` ni `10.0.2.2` (spécifique à l'émulateur Android) sur un
téléphone physique : elle doit pointer vers l'adresse IP de la machine de développement sur le réseau
WiFi local.

- `mobile/.env` contient `EXPO_PUBLIC_API_URL=http://<IP_LAN>:3000`, embarqué dans le JS au moment du
  build — il faut donc **reconstruire l'APK** après toute modification de cette valeur.
- Pour connaître l'IP LAN actuelle de la machine (Windows) :
  ```powershell
  Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" }
  ```
  (chercher l'interface Wi-Fi active). Cette IP change si tu changes de réseau WiFi ou si le bail DHCP
  est renouvelé — dans ce cas, mets à jour `EXPO_PUBLIC_API_URL` dans `mobile/.env` puis relance le build.
- **Le téléphone et la machine qui fait tourner le backend doivent être sur le même réseau WiFi**
  pendant les tests (pas de VPN, pas de "isolation clients" activée sur le routeur/point d'accès).
- Le backend doit écouter sur toutes les interfaces (c'est déjà le cas, `httpServer.listen(PORT)` sans
  host explicite) et le pare-feu Windows doit autoriser les connexions entrantes sur le port 3000 :
  ```powershell
  # À exécuter dans un PowerShell en administrateur
  New-NetFirewallRule -DisplayName "TaxiDja Backend (dev, port 3000)" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow -Profile Private
  ```
- Démarrer le backend normalement (`npm run dev` dans `backend/`) avant d'ouvrir l'app sur le téléphone.

## Carte (OpenStreetMap / MapLibre)

L'app n'utilise pas Google Maps (nécessite une carte bancaire pour activer la facturation Google
Cloud, indisponible dans ce contexte) : la carte est rendue avec
[MapLibre](https://maplibre.org/) (`@maplibre/maplibre-react-native`), un fork open-source et
maintenu de Mapbox GL Native, alimenté par les tuiles raster publiques d'OpenStreetMap
(`tile.openstreetmap.org`). Aucune clé API ni compte n'est nécessaire. Voir
`mobile/src/config/osmMapStyle.ts` pour la configuration des tuiles.

**Important — avant une mise en production avec de vrais utilisateurs** : le serveur `tile.openstreetmap.org`
est un service public géré par la fondation OSM, prévu pour un usage léger/évaluation, avec des
[règles d'usage strictes](https://operations.osmfoundation.org/policies/tiles/) (pas de trafic
massif, attribution visible obligatoire — déjà en place via le contrôle d'attribution de MapLibre).
Avant un lancement avec plusieurs utilisateurs actifs, remplacer `tiles` dans `osmMapStyle.ts` par :
- un fournisseur de tuiles dédié acceptant plus de méthodes de paiement que Google Cloud (offres
  gratuites généreuses chez [MapTiler](https://www.maptiler.com/) ou
  [Stadia Maps](https://stadiamaps.com/)), ou
- un serveur de tuiles auto-hébergé (ex. [OpenMapTiles](https://openmaptiles.org/) + tileserver-gl).

## Itinéraires routiers (OSRM)

La distance/durée d'une course et le tracé affiché sur la carte viennent d'un vrai calcul
d'itinéraire routier via [OSRM](http://project-osrm.org/) (Open Source Routing Machine), pas d'une
ligne droite. Le backend (`backend/src/services/routing.service.ts`) appelle le serveur de démo
public `router.project-osrm.org` (`GET /route/v1/driving/...`), sans clé ni compte.

**Important — avant une mise en production avec de vrais utilisateurs** : comme pour les tuiles
OpenStreetMap ci-dessus, le serveur de démo public OSRM est prévu pour de l'évaluation/développement,
avec des limites d'usage raisonnable non documentées formellement mais bien réelles (risque de
rate-limiting ou d'indisponibilité sous charge) — **pas adapté à une production à grande échelle**.
Avant un lancement avec plusieurs utilisateurs actifs, remplacer par :
- un serveur OSRM auto-hébergé, construit avec les données OpenStreetMap du Tchad (extrait
  disponible sur [Geofabrik](http://download.geofabrik.de/africa/chad.html)) — solution recommandée,
  gratuite une fois hébergée, contrôle total sur la charge et la latence ; ou
- un service de routage payant équivalent (Mapbox Directions API, Google Directions API,
  GraphHopper, etc).

Si OSRM est injoignable (timeout de 5s, erreur réseau, panne), le backend bascule automatiquement
sur un calcul Haversine (ligne droite) avec un `console.error` explicite — jamais de crash, jamais
une réservation bloquée, juste une estimation moins précise le temps que ça se rétablisse. Le champ
`Ride.routeGeometry` (JSON, liste de points `{latitude, longitude}`) est `null` dans ce cas, puisqu'un
fallback ligne droite n'a pas de vrai tracé à afficher.

## Suivi en direct

Pendant une course active (`ACCEPTED` / `DRIVER_ARRIVING` / `IN_PROGRESS`), la position GPS du
conducteur (déjà suivie côté mobile via `useDriverLocationTracking`) est diffusée en temps réel au
passager assigné via l'événement Socket.IO `driver:position_update`, émis par le backend à chaque
mise à jour de position (`PATCH /driver/location`). Le passager affiche un marqueur qui se déplace en
direct sur la carte ; le conducteur affiche sa propre position ainsi que le tracé vers sa prochaine
étape (point de départ du passager, puis destination finale).

## Statut

Phase actuelle : notation, historique des courses (passager/conducteur), build APK de test, carte
OpenStreetMap/MapLibre (sans dépendance Google Maps), itinéraires routiers réels (OSRM) et suivi en
direct du conducteur implémentés.
