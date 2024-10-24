# Deployment Guide for Shopify Quantity Discounts App on aapanel

## 1. Prerequisites Setup

1. Login to aapanel and ensure these modules are enabled:
   - mod_proxy
   - mod_proxy_http
   - mod_proxy_wstunnel
   - mod_rewrite
   - mod_headers
   - mod_ssl

2. Install Node.js:
   - Go to aapanel App Store
   - Search for "Node.js"
   - Install version 16.x or higher

3. Install PM2 globally:
```bash
npm install -g pm2
```

## 2. App Deployment

1. Create app directory:
```bash
mkdir -p /www/wwwroot/shopifydiscountapp
cd /www/wwwroot/shopifydiscountapp
```

2. Clone repository:
```bash
git clone [your-repo-url] .
```

3. Install dependencies:
```bash
npm install
```

4. Create environment file:
```bash
cp .env.example .env
```

5. Update .env with your values:
```env
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SCOPES=write_products,read_products,write_discounts,read_discounts
HOST=https://shopify-discount-app.webvijayi.com
PORT=3000
DATABASE_URL=sqlite:///www/wwwroot/shopifydiscountapp/web/database/shopify.sqlite3
SESSION_SECRET=your_random_secret
NODE_ENV=production
```

6. Build the app:
```bash
npm run build
```

## 3. Apache Configuration

1. In aapanel, go to "Website" → Select your domain → "Set"

2. Update the Apache configuration with the provided settings (see apache_config.conf)

3. Enable required Apache modules:
```bash
# These commands might vary based on your aapanel setup
a2enmod proxy
a2enmod proxy_http
a2enmod proxy_wstunnel
a2enmod headers
```

4. Set proper permissions:
```bash
chown -R www:www /www/wwwroot/shopifydiscountapp
chmod -R 755 /www/wwwroot/shopifydiscountapp
chmod -R 777 /www/wwwroot/shopifydiscountapp/web/database
```

## 4. Start the Application

1. Start the app with PM2:
```bash
cd /www/wwwroot/shopifydiscountapp
pm2 start npm --name "shopify-discount-app" -- start
```

2. Save PM2 configuration:
```bash
pm2 save
pm2 startup
```

## 5. Verify Installation

1. Check app status:
```bash
pm2 status
pm2 logs shopify-discount-app
```

2. Test the URL:
   - https://shopify-discount-app.webvijayi.com should load
   - Check SSL is working properly
   - Verify Shopify authentication works

## 6. Update Process

When you need to update the app:

```bash
cd /www/wwwroot/shopifydiscountapp
git pull
npm install
npm run build
pm2 restart shopify-discount-app
```

## 7. Troubleshooting

### Common Issues

1. 502 Bad Gateway
   - Check if Node.js app is running: `pm2 status`
   - Verify port 3000 is not in use: `lsof -i :3000`
   - Check Apache logs: `tail -f /www/wwwlogs/shopify-discount-app.webvijayi.com-error_log`

2. SSL Issues
   - Verify certificate paths in Apache config
   - Check certificate renewal status in aapanel

3. Permission Issues
   - Verify ownership: `ls -la /www/wwwroot/shopifydiscountapp`
   - Check database permissions: `ls -la /www/wwwroot/shopifydiscountapp/web/database`

### Logs Location

- Application logs: `/www/wwwroot/shopifydiscountapp/logs/`
- Apache access: `/www/wwwlogs/shopify-discount-app.webvijayi.com-access_log`
- Apache error: `/www/wwwlogs/shopify-discount-app.webvijayi.com-error_log`
- PM2 logs: `pm2 logs shopify-discount-app`

## 8. Backup

1. Database backup (daily):
```bash
0 0 * * * /www/wwwroot/shopifydiscountapp/scripts/backup.sh
```

2. Use aapanel backup feature for full site backup

## 9. Monitoring

1. Use PM2 for app monitoring:
```bash
pm2 monit
```

2. Check resource usage in aapanel

3. Monitor disk space:
```bash
df -h
du -sh /www/wwwroot/shopifydiscountapp/*
```

## 10. Security

1. Ensure .env file is protected:
```bash
chmod 600 /www/wwwroot/shopifydiscountapp/.env
```

2. Keep system updated:
```bash
dnf update -y
```

3. Regular security checks in aapanel

For additional support or issues, check the application logs and PM2 status first, then review Apache configuration and logs.
