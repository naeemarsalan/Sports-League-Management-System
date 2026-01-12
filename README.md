# Sports League Management System (Appwrite)

## Overview
This repository now focuses on Appwrite serverless functions plus migration tooling for league data. The legacy Flask application has been removed from this branch.

## Repository Layout
- `appwrite/functions/leaderboard/index.js`: Appwrite function that computes the leaderboard.
- `migrations/sql/`: SQL migrations for the legacy Postgres schema.
- `migrations/appwrite/`: Appwrite setup and data migration scripts.
- `data/pool_league_backup.sql`: Legacy SQL dump used for Appwrite data migration.

## SQL Migrations
Apply the SQL migrations in order:
1. `migrations/sql/001_init_schema.sql`
2. `migrations/sql/002_seed_test_data.sql`
3. `migrations/sql/003_init_admin.sql`

## Appwrite Setup
Create the Appwrite database and collections:
```sh
python migrations/appwrite/appwrite_setup.py --database-id pool-league --database-name "Pool League"
```

Required environment variables:
- `APPWRITE_ENDPOINT`
- `APPWRITE_PROJECT_ID`
- `APPWRITE_API_KEY`
- Optional: `APPWRITE_MEMBER_ROLE`, `APPWRITE_ADMIN_ROLE`

## Appwrite Data Migration
Seed Appwrite from the legacy SQL dump:
```sh
python migrations/appwrite/appwrite_migrate.py --dump data/pool_league_backup.sql
```

Required environment variables:
- `APPWRITE_ENDPOINT`
- `APPWRITE_PROJECT_ID`
- `APPWRITE_API_KEY`
- `APPWRITE_DATABASE_ID`
- `APPWRITE_PROFILES_COLLECTION_ID`
- `APPWRITE_MATCHES_COLLECTION_ID`

## License
This project is licensed under the MIT License. See `LICENSE` for details.
