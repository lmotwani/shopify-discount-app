#!/bin/bash

# Deployment script for Shopify Quantity Discounts App
echo "Starting deployment..."

# Configuration
APP_DIR="/www/wwwroot/shopify-discount-app"
BACKUP_DIR="/www/backup/shopify-discount-app"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create backup directories if they don't exist
mkdir -p $BACKUP_DIR/database
mkdir -p $BACKUP_DIR/logs

# Backup current version
echo "Creating backup..."
cp -r $APP_DIR/web/database/*.sqlite $BACKUP_DIR/database/discount-rules_$TIMESTAMP.sqlite
tar -czf $BACKUP_DIR/app_backup_$TIMESTAMP.tar.gz $APP_DIR

# Pull latest changes
echo "Pulling latest changes..."
cd $APP_DIR
git pull origin main

# Install dependencies
echo "Installing dependencies..."
npm install

# Build frontend
echo "Building frontend..."
npm run build

# Database migrations (if any)
echo "Running database checks..."
node scripts/db-check.js

# Restart application
echo "Restarting application..."
pm2 restart shopify-discount-app

# Verify deployment
echo "Verifying deployment..."
pm2 show shopify-discount-app

echo "Deployment completed!"
