# SportsClubNet Server

Run:
```
cd server
npm install
npm start
```
Server on http://localhost:5051

Migrations:
- The repository contains a migration runner at `server/migrate.mjs` which will apply SQL files in `server/migrations/`.
- Some migration files (for example `001_init.sql`) contain DROP TABLE statements and are destructive on a populated database.
- By default the runner will refuse to execute migrations that look destructive. To run destructive migrations intentionally, either set the environment variable `ALLOW_DESTRUCTIVE_MIGRATIONS=1` or run the npm script `npm run migrate:force`.

Always backup your database before running destructive migrations.
