# Environment Configuration

This document describes the environment variables and setup for different deployment environments.

## Development Environment (.env)

Create a `.env` file in the `server/` directory for local development:

```env
# Database Configuration
DATABASE_URL="postgresql://leolopez-linquet@localhost:5432/clubbooking_local"

# JWT Secret (generate a secure random string for production)
JWT_SECRET="your-development-secret-key"

# Email Configuration (Resend)
RESEND_API_KEY="re_your_development_key"

# Optional: Force SSL for local development with remote database
# FORCE_PG_SSL=1

# Optional: Client URL for CORS (auto-detected in development)
# CLIENT_URL="http://localhost:5173"

# Node Environment
NODE_ENV="development"
```

### Local Database Setup

For local development, ensure PostgreSQL is running and create the database:

```bash
# Create database
createdb clubbooking_local

# Run migrations
npm run migrate
```

## Production Environment (Render)

Render automatically provides `DATABASE_URL` for attached PostgreSQL databases. Set these environment variables in your Render service:

```env
# Automatically provided by Render
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"

# Required: JWT Secret (use a secure random string)
JWT_SECRET="your-production-secret-key-use-a-long-random-string"

# Required: Email Configuration
RESEND_API_KEY="re_your_production_key"

# Optional: Force SSL connections
FORCE_PG_SSL=1

# Optional: Client URL for CORS (auto-detected from *.onrender.com)
CLIENT_URL="https://your-frontend.onrender.com"

# Environment
NODE_ENV="production"
```

### Production Deployment

Use the production start script which runs migrations before starting:

```bash
npm run start:prod
```

This is equivalent to:
```bash
npm run migrate:deploy && node server.js
```

## Staging Environment (Optional)

For staging deployments, use similar configuration to production but with staging-specific values:

```env
DATABASE_URL="postgresql://staging-username:password@staging-host:port/staging-database?sslmode=require"
JWT_SECRET="your-staging-secret-key"
RESEND_API_KEY="re_your_staging_key"
NODE_ENV="staging"
```

## Environment Variables Reference

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string | - |
| `JWT_SECRET` | Yes | Secret key for JWT tokens | "your-secret-key" (dev only) |
| `RESEND_API_KEY` | No | Resend API key for emails | - |
| `FORCE_PG_SSL` | No | Force SSL connections (set to "1") | Auto-detected |
| `CLIENT_URL` | No | Frontend URL for CORS | Auto-detected |
| `NODE_ENV` | No | Environment mode | "development" |
| `PORT` | No | Server port | 5051 (dev), auto (production) |

## Database Migrations

### Development
```bash
# Pull schema from existing database
npm run prisma:pull

# Generate Prisma client
npm run prisma:generate

# Run development migrations
npm run migrate:dev
```

### Production
```bash
# Deploy migrations (used in start:prod)
npm run migrate:deploy
```

### Prisma Studio
```bash
# Open database browser (development only)
npm run studio
```

## Security Notes

- **Never commit `.env` files** to version control
- Use strong, unique `JWT_SECRET` values for each environment
- Rotate secrets regularly in production
- Use SSL connections (`sslmode=require`) in production
- Set `NODE_ENV=production` in production environments

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` format and credentials
- Check if SSL is required (`FORCE_PG_SSL=1`)
- Ensure database exists and migrations are applied

### CORS Issues
- Set `CLIENT_URL` to your frontend domain
- Check that frontend and backend URLs are correctly configured

### Migration Issues
- Never run destructive migrations in production
- Use `start:prod` script for production deployments
- Backup database before major migrations