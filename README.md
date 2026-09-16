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
npm install
npm run dev
```

## Statut

Phase actuelle : mise en place de l'architecture de base (aucune fonctionnalité métier implémentée).
