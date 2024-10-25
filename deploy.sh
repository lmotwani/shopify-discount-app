#!/bin/bash

# Stop on any error
set -e

echo "Starting deployment..."

# Pull latest changes
echo "Pulling latest changes..."
git pull origin main

# Install dependencies
echo "Installing dependencies..."
npm install

# Build frontend
echo "Building frontend..."
npm run build

# Restart PM2 process
echo "Restarting PM2 process..."
pm2 restart shopify-discount-app || pm2 start web/index.js --name shopify-discount-app

echo "Deployment complete!"

# Show logs
pm2 logs shopify-discount-app --lines 50
