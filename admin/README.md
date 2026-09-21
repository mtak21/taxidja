# TaxiDja Admin

Dashboard web d'administration (React + TypeScript + Vite) pour la plateforme TaxiDja.

## Démarrage

```bash
cd admin
cp .env.example .env   # VITE_API_URL, par défaut http://localhost:3000
npm install
npm run dev
```

L'admin a besoin du backend (`../backend`) démarré et migré/seedé (`npx prisma migrate dev`, `npm run seed`).

## Compte admin de développement

Créé par le seed Prisma du backend (`backend/prisma/seed.ts`), à usage dev uniquement :

- **Email** : `admin@taxidja.td`
- **Mot de passe** : `admin1234`

⚠️ Identifiants volontairement simples pour le développement local — à changer avant tout déploiement.

## Authentification

- Réutilise `/auth/login` du backend (rôles gérés côté serveur : `PASSENGER` / `DRIVER` / `ADMIN`).
- Le token est stocké en **`localStorage`** (pas de cookie) : l'admin et l'API tournent sur des origines
  différentes en dev (Vite `5173` / Express `3000`) et l'app parle à l'API uniquement via un header
  `Authorization: Bearer <token>`, exactement comme l'app mobile (qui utilise `SecureStore`). Un cookie
  aurait demandé de la config CORS à credentials + une protection CSRF pour ce même résultat.
- Toute route du dashboard est protégée par `ProtectedRoute` (`src/auth/ProtectedRoute.tsx`) : redirection
  vers `/login` si non connecté, ou si le compte connecté n'a pas le rôle `ADMIN`.
- Refresh automatique du token d'accès sur un 401 (même mécanisme que le mobile), déconnexion si le refresh
  échoue.

## Structure

```
src/
  api/          client axios + appels /auth et /admin
  auth/         AuthContext (état de session) + ProtectedRoute
  components/   Layout (sidebar), Badge, StatCard, Modal, Pagination
  pages/        un fichier par écran (Dashboard, Utilisateurs, Conducteurs, Véhicules,
                Courses, Villes & Zones, Tarifs)
  types.ts      types partagés, alignés sur les réponses du backend
```

Thème visuel : mêmes tokens de couleur que l'app mobile (`mobile/src/theme/colors.ts`), déclarés en
variables CSS dans `src/index.css` (dupliqués plutôt que partagés via un package commun, pour rester dans
l'esprit MVP du monorepo).
