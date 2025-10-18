#!/bin/bash

# Production Database Sync Helper
# This script helps you sync your Render database

echo "🚀 Club Booking App - Production Database Sync"
echo ""

# Check if RENDER_DATABASE_URL is set
if [ -z "$RENDER_DATABASE_URL" ]; then
    echo "❌ RENDER_DATABASE_URL environment variable not set!"
    echo ""
    echo "To set it temporarily for this session:"
    echo "export RENDER_DATABASE_URL=\"your_render_database_url_here\""
    echo ""
    echo "To set it permanently, add this line to your ~/.zshrc or ~/.bashrc:"
    echo "export RENDER_DATABASE_URL=\"your_render_database_url_here\""
    echo ""
    echo "You can get your database URL from:"
    echo "1. Go to Render Dashboard"
    echo "2. Click on your database service"
    echo "3. Go to 'Connect' tab"
    echo "4. Copy the 'External Database URL'"
    exit 1
fi

echo "📍 Production Database URL: $(echo $RENDER_DATABASE_URL | sed 's|://[^:]*:[^@]*@|://***:***@|')"
echo ""

# Check current status
echo "🔍 Checking production database status..."
npm run migrate:check:prod

echo ""
echo "What would you like to do?"
echo "1) Check status only (done above)"
echo "2) Apply pending migrations to production"
echo "3) Check local database status"
echo "4) Exit"
echo ""

read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo "✅ Status check complete!"
        ;;
    2)
        echo ""
        echo "⚠️  WARNING: You're about to modify the PRODUCTION database!"
        echo "This action will apply migrations to your live Render database."
        echo ""
        read -p "Are you sure you want to continue? (yes/no): " confirm
        if [ "$confirm" = "yes" ]; then
            echo ""
            echo "🔧 Applying migrations to production..."
            npm run db:sync:prod
        else
            echo "❌ Cancelled - no changes made to production database"
        fi
        ;;
    3)
        echo ""
        echo "🔍 Checking local database status..."
        npm run migrate:check
        ;;
    4)
        echo "👋 Goodbye!"
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        ;;
esac