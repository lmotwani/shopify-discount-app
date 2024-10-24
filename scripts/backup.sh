#!/bin/bash

# Backup script for Shopify Quantity Discounts App
echo "Starting backup process..."

# Configuration
APP_DIR="/www/wwwroot/shopify-discount-app"
BACKUP_DIR="/www/backup/shopify-discount-app"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

# Create backup directories if they don't exist
mkdir -p $BACKUP_DIR/database
mkdir -p $BACKUP_DIR/logs
mkdir -p $BACKUP_DIR/app

# Backup database
echo "Backing up database..."
cp $APP_DIR/web/database/*.sqlite $BACKUP_DIR/database/discount-rules_$TIMESTAMP.sqlite

# Backup application files
echo "Backing up application files..."
tar -czf $BACKUP_DIR/app/app_backup_$TIMESTAMP.tar.gz \
    --exclude="node_modules" \
    --exclude=".git" \
    $APP_DIR

# Backup logs
echo "Backing up logs..."
cp -r $APP_DIR/logs/* $BACKUP_DIR/logs/

# Clean up old backups
echo "Cleaning up old backups..."
find $BACKUP_DIR -type f -mtime +$RETENTION_DAYS -delete

# Create backup report
echo "Creating backup report..."
echo "Backup completed at: $(date)" > $BACKUP_DIR/backup_report_$TIMESTAMP.txt
echo "Database backup: discount-rules_$TIMESTAMP.sqlite" >> $BACKUP_DIR/backup_report_$TIMESTAMP.txt
echo "Application backup: app_backup_$TIMESTAMP.tar.gz" >> $BACKUP_DIR/backup_report_$TIMESTAMP.txt

echo "Backup completed successfully!"
