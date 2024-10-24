#!/bin/bash

echo "Starting cleanup process..."

# Remove old directories and their contents
echo "Removing old directories..."
rm -rf embedded-app/
rm -rf backend/
rm -rf frontend/
rm -rf api/

# Remove specific old files
echo "Removing old files..."
rm -f config.php
rm -f install.sql
rm -f DEPLOYMENT.md
rm -f .htaccess
rm -f server.js
rm -f tsconfig.json
rm -f web/database/discount-rules.js

# Create new directory structure
echo "Creating new directory structure..."
mkdir -p web/frontend/components
mkdir -p web/frontend/hooks
mkdir -p web/database
mkdir -p web/middleware
mkdir -p web/routes
mkdir -p scripts
mkdir -p logs

# Verify kept files
echo "Verifying kept files..."
FILES_TO_KEEP=(
    "web/frontend/components/DiscountRuleForm.jsx"
    "web/frontend/hooks/useApi.js"
    "web/frontend/App.jsx"
    "web/frontend/index.html"
    "web/frontend/index.jsx"
    "web/database/index.js"
    "web/middleware/auth.js"
    "web/middleware/logging.js"
    "web/routes/discounts.js"
    "web/index.js"
    "scripts/deploy.sh"
    "scripts/backup.sh"
    "scripts/monitor.js"
    "scripts/cleanup.sh"
    "ecosystem.config.js"
    "package.json"
    "shopify.app.toml"
    "README.md"
    "HOSTING.md"
    ".gitignore"
    ".env.example"
)

for file in "${FILES_TO_KEEP[@]}"; do
    if [ ! -f "$file" ]; then
        echo "Warning: Missing file $file"
    fi
done

echo "Cleanup completed!"
echo "Please verify the following files exist and are correct:"
printf '%s\n' "${FILES_TO_KEEP[@]}"
