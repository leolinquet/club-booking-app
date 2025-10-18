# Multi-Sport Club Booking App

A comprehensive booking system for sports clubs with real-time chat, user management, and automated database protection.

## 🚀 Quick Start

### Server
```bash
cd server
npm i
npm run init:db
npm start
```

### Client
```bash
cd client
npm i
npm run dev
```

Open http://localhost:5173

### Dev (single command)
```bash
# from repository root
npm install
npm run dev

# this runs the server (port 5051) and the client (Vite on 5173) concurrently
```

## 🛡️ Database Protection System

**IMPORTANT**: This project includes comprehensive database protection. Always use these commands:

### Daily Development
```bash
cd server

# Check database health before working
npm run db:health

# Create backup before changes
npm run db:backup create daily

# Run migrations safely (auto-backup)
npm run migrate:safe
```

### Emergency Recovery
```bash
# List available backups
npm run db:backup:list

# Restore from backup
npm run db:backup:restore path/to/backup.sql

# Quick health check
npm run db:health
```

See [DATABASE_PROTECTION.md](DATABASE_PROTECTION.md) for detailed protection guide.

## 📦 Database Migrations

### Applying Migrations
```bash
# Safe migration with automatic backup
npm run migrate:safe

# Standard migration (without backup)
npm run migrate

# Check what migrations would run
npm run migrate:check
```

### Creating Migrations
```bash
# Create new migration file
npm run migrate:new

# Follow naming: XXX_description.sql
```

### Production Deployment
```bash
# Set production database URL
export RENDER_DATABASE_URL="postgres://..."

# Run production migration
DATABASE_URL=$RENDER_DATABASE_URL npm run migrate
```

See [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) for complete deployment process.

## 🗄️ Database Commands

```bash
# Health check
npm run db:health

# Backup management
npm run db:backup create [label]
npm run db:backup:list
npm run db:backup:restore <file>
npm run db:backup:clean

# Safety tools
npm run db:safety
npm run migrate:safe
```

## 🔧 Development Safety

The app includes automatic protection against data loss:

- ✅ **Auto-backups** before migrations
- ✅ **Health checks** before risky operations  
- ✅ **Migration tracking** prevents conflicts
- ✅ **Destructive operation** warnings
- ✅ **Recovery guides** for emergencies

## 📋 Features

- 🏟️ Multi-sport club management
- 📅 Court booking system
- 💬 Real-time chat conversations
- 👥 User management and authentication
- 🔔 Unread message notifications
- 📊 Database health monitoring
- 🛡️ Automated backup system
- 🚀 Production deployment tools

## 🚨 Emergency Procedures

If you lose data:

1. **Stop the app**: `pkill -f "node server.js"`
2. **Check backups**: `npm run db:backup:list`
3. **Restore backup**: `npm run db:backup:restore <file>`
4. **Verify health**: `npm run db:health`

For detailed recovery procedures, see [DATABASE_PROTECTION.md](DATABASE_PROTECTION.md).

## 📁 Project Structure

```
├── client/          # React frontend
├── server/          # Node.js backend
│   ├── migrations/  # Database migrations
│   ├── backups/     # Automatic backups
│   ├── db-*.mjs     # Database tools
│   └── ...
├── .github/         # CI/CD workflows
├── DATABASE_PROTECTION.md
└── DEPLOYMENT_CHECKLIST.md
```

## 🤝 Contributing

1. Always run `npm run db:health` before making changes
2. Create backups: `npm run db:backup create feature-name`
3. Use safe migrations: `npm run migrate:safe`
4. Follow the [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)

**Remember: When in doubt, backup first! 🛡️**
