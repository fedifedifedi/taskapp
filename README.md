# TaskApp — Gestion de tâches

Application web de gestion de tâches : inscription / connexion, CRUD des tâches, statut (`TODO`, `IN_PROGRESS`, `DONE`), date d'échéance avec détection des retards, recherche, filtrage, tri et pagination. L'interface propose un tableau de bord (compteurs et progression) et un mode sombre.

- **API REST** : Node.js, Express 5, TypeScript, Prisma 7, PostgreSQL
- **Frontend** : React 19, Vite, TanStack Query, React Hook Form, Tailwind CSS
- **Validation** : schémas Zod partagés entre le front et l'API (`packages/shared`)
- **Authentification** : JWT dans un cookie `httpOnly`, mots de passe hachés avec argon2id

- **Qualité** : tests unitaires, d'intégration et E2E (Playwright), CI GitHub Actions, image Docker, configuration Railway

---

## Prérequis

- Node.js **22.12+** (voir `.nvmrc`)
- Docker (pour PostgreSQL en local), ou un PostgreSQL 15+ existant

## Démarrage rapide

```bash
# 1. Dépendances
npm install

# 2. Base de données locale (PostgreSQL 17 dans Docker, crée aussi taskapp_test)
npm run db:up

# 3. Configuration de l'API
cp apps/api/.env.example apps/api/.env
#    puis remplacer JWT_SECRET par une valeur aléatoire :
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"

# 4. Schéma de base de données + données de démo (facultatif)
npm run db:migrate
npm run db:seed        # compte : demo@taskapp.local / Demo12345

# 5. Lancer l'API (port 3000) et le frontend (port 5173)
npm run dev
```

Ouvrir http://localhost:5173. En développement, Vite redirige `/api` vers l'API : le navigateur ne voit qu'une seule origine, comme en production.

### Accès rapide

| Quoi            | Commande            | Adresse               |
| --------------- | ------------------- | --------------------- |
| Application     | `npm run dev`       | http://localhost:5173 |
| Base de données | `npm run db:studio` | http://localhost:5555 |

Compte de démonstration (après `npm run db:seed`) : `demo@taskapp.local` / `Demo12345`.

### Mode production en local

```bash
npm run build     # build de shared, du frontend puis de l'API
NODE_ENV=production npm start   # sert l'API et la SPA sur http://localhost:3000
```

> En production le cookie de session est `Secure` : utilisez HTTPS, ou `localhost` (considéré comme sûr par les navigateurs).

## Scripts utiles

| Commande             | Rôle                                                 |
| -------------------- | ---------------------------------------------------- |
| `npm run dev`        | API + frontend en mode watch                         |
| `npm run build`      | Build de production complet                          |
| `npm start`          | Démarre le serveur de production                     |
| `npm run typecheck`  | Vérification TypeScript de tous les workspaces       |
| `npm run lint`       | ESLint                                               |
| `npm run format`     | Prettier                                             |
| `npm run db:up`      | Démarre PostgreSQL (Docker)                          |
| `npm run db:migrate` | Crée / applique les migrations (développement)       |
| `npm run db:deploy`  | Applique les migrations existantes (CI / production) |
| `npm run db:seed`    | Données de démonstration                             |
| `npm run db:studio`  | Interface Prisma Studio                              |

## Tests

```bash
npm test                  # tous les tests (unitaires + intégration)
npm run test:unit         # sans base de données
npm run test:integration  # API complète sur la base taskapp_test
npm run test:coverage     # rapport de couverture de l'API (apps/api/coverage/)
```

| Suite              | Emplacement                  | Contenu                                                                                                                            |
| ------------------ | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Unitaires (shared) | `packages/shared/tests`      | Schémas Zod : normalisation, règles de mot de passe, champs inconnus, limites, paramètres de liste                                 |
| Unitaires (API)    | `apps/api/tests/unit`        | Règle `completedAt`, services (repositories simulés), JWT (falsifié, expiré, `alg: none`…)                                         |
| Intégration (API)  | `apps/api/tests/integration` | Requêtes HTTP réelles (Supertest) sur une vraie base PostgreSQL : authentification, validation, CRUD, statuts, IDOR, CSRF, erreurs |

**Base de test** : les tests d'intégration utilisent `taskapp_test`, créée automatiquement par `docker compose`. Surcharger avec `TEST_DATABASE_URL` si besoin (en CI par exemple).

- Les migrations sont appliquées automatiquement avant les tests.
- Les tables sont vidées avant chaque test, ce qui rend chaque test indépendant.
- Par sécurité, les tests refusent toute base dont le nom ne contient pas `test`.

### Tests End-to-End (Playwright)

```bash
npm run test:e2e:install   # une seule fois : télécharge Chromium
npm run test:e2e           # build de production + tests E2E
```

Les tests E2E s'exécutent contre le **build de production**. Playwright applique les migrations, puis démarre Express sur le port 3100, qui sert l'API et la SPA comme sur Railway. La base utilisée est `taskapp_test`, surchargeable avec `E2E_DATABASE_URL`.

- **Page Objects** (`e2e/pages`) : `LoginPage`, `RegisterPage`, `TasksPage`, avec des sélecteurs accessibles (rôles et libellés).
- **Fixtures** (`e2e/fixtures.ts`) : chaque test utilise un utilisateur unique, ce qui permet l'exécution en parallèle. Les données de départ sont créées via l'API pour aller plus vite.
- **19 scénarios** :
  - redirection sans session, validation, inscription, déconnexion, mauvais mot de passe, reconnexion, cookie `httpOnly` ;
  - création, titre vide, terminer / rouvrir, filtres, filtre conservé au rechargement, modification, suppression avec confirmation ;
  - recherche, échéances et retards, tri par échéance, tableau de bord, mode sombre.
- **En cas d'échec** : trace et capture d'écran (vidéo en CI) dans `e2e/test-results`. Rapport HTML en CI.
- Pour utiliser un navigateur déjà installé au lieu du Chromium de Playwright : `PW_CHANNEL=msedge` ou `PW_CHANNEL=chrome`.

## Intégration continue (GitHub Actions)

Le workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml) s'exécute à chaque push sur `main` et à chaque pull request. Ses 4 jobs tournent en parallèle :

| Job         | Contenu                                                                                                                                 |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **quality** | ESLint, Prettier, typecheck, `npm audit` des dépendances de production                                                                  |
| **test**    | Tests unitaires et d'intégration avec un service PostgreSQL 17, rapport de couverture en artifact                                       |
| **e2e**     | Build de production, Chromium (mis en cache), Playwright ; rapport, traces et vidéos en artifact                                        |
| **docker**  | Build de l'image, migrations lancées depuis l'image, démarrage du conteneur, smoke test (santé, SPA, inscription, utilisateur non root) |

Recommandé sur GitHub : protéger la branche `main` en exigeant que ces 4 jobs soient verts avant toute fusion.

## Docker

```bash
docker build -t taskapp .
docker run --rm -e DATABASE_URL=... taskapp npm run db:deploy          # migrations
docker run -p 3000:3000 -e DATABASE_URL=... -e JWT_SECRET=... taskapp   # API + SPA
```

L'image est construite en plusieurs étapes : un build complet, puis une image finale qui ne contient que les dépendances de production de l'API et de `shared`, et les builds. Elle est basée sur `node:24-bookworm-slim` et s'exécute sous l'utilisateur `node` (non root).

## Déploiement sur Railway

La configuration est dans [`railway.json`](railway.json) :

- build à partir du `Dockerfile` ;
- **pre-deploy** : `npm run db:deploy` applique les migrations avant la mise en service. Un échec de migration bloque le déploiement ;
- **healthcheck** : `GET /api/health`, qui vérifie aussi la base de données ;
- redémarrage automatique en cas d'échec (3 tentatives).

Mise en place :

1. Sur Railway, créer un projet **Deploy from GitHub repo** à partir de ce dépôt.
2. Ajouter une base **PostgreSQL** au projet.
3. Dans le service de l'application, définir les variables :
   - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}` (variable de référence) ;
   - `JWT_SECRET` = une valeur aléatoire d'au moins 32 caractères ;
   - `NODE_ENV=production` est déjà défini par l'image, et `PORT` est fourni par Railway.
4. **Settings → Networking → Generate Domain** pour obtenir l'URL publique en HTTPS.
5. Activer **Wait for CI** dans les paramètres du service : seul un commit dont la CI est verte sera déployé.

## Architecture

```
.
├── apps/
│   ├── api/                  # API Express
│   │   ├── prisma/           # schema.prisma, migrations, seed
│   │   └── src/
│   │       ├── config/       # variables d'environnement validées (Zod), logger
│   │       ├── lib/          # prisma, erreurs, jwt, mots de passe, cookie
│   │       ├── middlewares/  # auth, erreurs, rate limit, contrôle d'origine
│   │       ├── modules/      # auth, users, tasks, health
│   │       ├── app.ts        # construction de l'app (injectable, testable)
│   │       └── server.ts     # démarrage et arrêt propre
│   └── web/                  # SPA React
│       └── src/
│           ├── api/          # client HTTP typé
│           ├── components/   # composants UI réutilisables
│           ├── features/     # auth/, tasks/ (pages, hooks, composants)
│           └── lib/          # utilitaires
├── packages/shared/          # schémas Zod + types partagés
└── docker-compose.yml        # PostgreSQL local
```

**API en couches** : `routes → controller → service → repository (Prisma)`.

- Les **controllers** valident les entrées avec les schémas Zod partagés et formatent les réponses HTTP.
- Les **services** portent les règles métier et ne dépendent pas d'Express, ce qui les rend testables unitairement.
- Les **repositories** sont les seuls à accéder à Prisma. Chaque requête sur les tâches est filtrée par `userId`.
- Les dépendances sont assemblées dans `createApp({ prisma })`, ce qui permet d'injecter une autre base dans les tests.

**Un seul service en production** : Express sert l'API sous `/api` et le build de la SPA. Front et API partagent la même origine, ce qui supprime le besoin de CORS et simplifie les cookies.

## Modèle de données

| User           |                       | Task          |                                    |
| -------------- | --------------------- | ------------- | ---------------------------------- |
| `id`           | UUID                  | `id`          | UUID                               |
| `email`        | unique, en minuscules | `userId`      | FK → User (suppression en cascade) |
| `name`         | 100 car. max          | `title`       | 1 à 200 caractères                 |
| `passwordHash` | argon2id              | `description` | optionnelle, 2000 car. max         |
| `createdAt`    |                       | `status`      | `TODO` \| `IN_PROGRESS` \| `DONE`  |
| `updatedAt`    |                       | `dueDate`     | optionnelle (`DATE`, sans heure)   |
|                |                       | `completedAt` | défini au passage à `DONE`         |
|                |                       | `createdAt`   |                                    |
|                |                       | `updatedAt`   |                                    |

Index : `(user_id, status)` et `(user_id, created_at DESC)`.

## API REST

Préfixe : `/api/v1`. Toutes les routes `/tasks` exigent une session.

| Méthode | Route                 | Description                    | Succès |
| ------- | --------------------- | ------------------------------ | ------ |
| POST    | `/auth/register`      | Inscription (ouvre la session) | 201    |
| POST    | `/auth/login`         | Connexion                      | 200    |
| POST    | `/auth/logout`        | Déconnexion                    | 204    |
| GET     | `/auth/me`            | Utilisateur courant            | 200    |
| GET     | `/tasks`              | Liste paginée et filtrée       | 200    |
| GET     | `/tasks/stats`        | Compteurs par statut           | 200    |
| POST    | `/tasks`              | Création                       | 201    |
| GET     | `/tasks/:id`          | Détail                         | 200    |
| PATCH   | `/tasks/:id`          | Modification partielle         | 200    |
| PATCH   | `/tasks/:id/complete` | Marquer comme terminée         | 200    |
| DELETE  | `/tasks/:id`          | Suppression                    | 204    |
| GET     | `/api/health`         | Santé de l'API et de la base   | 200    |

**Paramètres de `GET /tasks`** :

- `status` : `TODO` \| `IN_PROGRESS` \| `DONE` ;
- `q` : recherche dans le titre et la description, insensible à la casse, 100 caractères maximum ;
- `page` : 1 ou plus ; `limit` : de 1 à 100, 20 par défaut ;
- `sort` : `createdAt`, `updatedAt`, `title`, `status` ou `dueDate`, préfixé par `-` pour un tri décroissant ; `-createdAt` par défaut. Avec `dueDate`, les tâches sans échéance sont toujours placées à la fin.

**Échéance** : champ `dueDate` au format `AAAA-MM-JJ` à la création et à la modification. Une valeur `""` ou `null` supprime l'échéance.

**Réponses** : `{ "data": … }`, et pour une liste `{ "data": [...], "meta": { page, limit, total, totalPages } }`.

**Erreurs** (format unique) :

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Données invalides",
    "details": [{ "path": "title", "message": "Le titre est requis" }]
  }
}
```

Codes utilisés : `VALIDATION_ERROR` (400), `UNAUTHORIZED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `CONFLICT` (409), `RATE_LIMITED` (429), `INTERNAL_ERROR` (500).

## Sécurité

- Mots de passe hachés avec **argon2id** (paramètres OWASP). Longueur maximale bornée pour éviter une saturation du serveur.
- JWT (HS256, algorithme imposé à la vérification) stocké dans un cookie **`httpOnly`, `SameSite=Lax`, `Secure` en production**. Le jeton n'est jamais accessible au JavaScript.
- **CSRF** : cookie `SameSite`, même origine, et refus des requêtes qui modifient des données lorsque `Origin` ou `Sec-Fetch-Site` indiquent une origine étrangère.
- **IDOR** : chaque accès à une tâche est filtré par propriétaire. Une tâche appartenant à un autre utilisateur renvoie **404**, pour ne pas révéler son existence.
- **Anti force brute** : limitation de débit sur `/auth` et sur l'ensemble de l'API. Le message d'erreur de connexion est identique que l'email existe ou non, et le temps de réponse aussi.
- **Validation stricte** avec Zod : les champs inconnus sont refusés (pas de mass assignment) et la taille du corps des requêtes est limitée.
- En-têtes de sécurité via **helmet** (CSP, nosniff…). Aucune stack trace n'est renvoyée en production. Cookies et mots de passe sont masqués dans les logs.
- Configuration validée au démarrage : l'API refuse de démarrer si une variable manque ou si `JWT_SECRET` fait moins de 32 caractères.

### Audit des dépendances

`npm audit` signale 4 alertes « high » qui viennent toutes de la **CLI `prisma` 7.10** : ce sont les versions de `deepmerge-ts` et `mysql2` que Prisma fige. Elles ne sont pas exploitables dans ce projet :

- `mysql2` est un pilote MySQL que Prisma embarque, mais qui n'est jamais chargé avec PostgreSQL ;
- `deepmerge-ts` ne fusionne que le fichier `prisma.config.ts` du projet, jamais des données utilisateur.

Le correctif proposé (`npm audit fix --force`) ferait revenir à Prisma 6, et les `overrides` npm ne s'appliquent pas à ces versions figées. À réévaluer à la prochaine version de Prisma.

## Variables d'environnement (API)

| Variable              | Défaut          | Description                                                  |
| --------------------- | --------------- | ------------------------------------------------------------ |
| `DATABASE_URL`        | —               | URL PostgreSQL (**obligatoire**)                             |
| `JWT_SECRET`          | —               | Secret de signature, 32 caractères minimum (**obligatoire**) |
| `JWT_EXPIRES_IN`      | `1d`            | Durée de session (`15m`, `12h`, `1d`…)                       |
| `NODE_ENV`            | `development`   | `development` \| `test` \| `production`                      |
| `PORT`                | `3000`          | Port HTTP                                                    |
| `LOG_LEVEL`           | `info`          | Niveau de log pino                                           |
| `AUTH_RATE_LIMIT_MAX` | `20`            | Requêtes `/auth` par tranche de 15 min et par IP             |
| `API_RATE_LIMIT_MAX`  | `300`           | Requêtes API par tranche de 15 min et par IP                 |
| `TRUST_PROXY`         | `1` en prod     | Nombre de proxys de confiance                                |
| `WEB_DIST_DIR`        | `apps/web/dist` | Build du frontend à servir                                   |
