# Hosting Setup for Shopify Quantity Discounts App

## VPS Requirements (AlmaLinux with aapanel)

1. Node.js 16+ installation
2. PM2 for process management
3. Nginx as reverse proxy
4. SSL certificate (Let's Encrypt)

## Installation Steps

1. **Install Node.js**
```bash
# Using aapanel plugin manager
# Install Node.js plugin
```

2. **Install PM2**
```bash
npm install -g pm2
```

3. **Configure Nginx**
Create a new site in aapanel:
```nginx
server {
    listen 443 ssl http2;
    server_name shopify-discount-app.webvijayi.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

4. **Deploy Application**
```bash
# Create app directory
mkdir -p /www/wwwroot/shopify-discount-app
cd /www/wwwroot/shopify-discount-app

# Clone repository
git clone [your-repo-url] .

# Install dependencies
npm install

# Build frontend
npm run build

# Start with PM2
pm2 start web/index.js --name "shopify-discount-app"
```

5. **Environment Setup**
Create `.env` file:
```env
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SCOPES=write_products,read_products
HOST=https://shopify-discount-app.webvijayi.com
PORT=3000
```

6. **Database Setup**
SQLite database will be automatically created in the `web/database` directory.

## Monitoring

1. **Check Application Status**
```bash
pm2 status
pm2 logs shopify-discount-app
```

2. **Nginx Logs**
```bash
tail -f /www/wwwlogs/shopify-discount-app.error.log
```

## Updates

1. **Pull Updates**
```bash
git pull origin main
```

2. **Rebuild and Restart**
```bash
npm install
npm run build
pm2 restart shopify-discount-app
```

## Backup

1. **Database Backup**
```bash
# Backup SQLite database
cp web/database/discount-rules.sqlite backup/
```

2. **Application Backup**
Use aapanel backup feature to backup the entire application directory.

## Security

1. **Firewall Setup**
```bash
# Allow only necessary ports
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --reload
```

2. **SSL Renewal**
Let's Encrypt certificates will auto-renew through aapanel.

## Troubleshooting

1. **Application Issues**
- Check PM2 logs: `pm2 logs`
- Check Node.js version: `node -v`
- Verify environment variables: `pm2 env shopify-discount-app`

2. **Nginx Issues**
- Check nginx status: `systemctl status nginx`
- Check nginx logs: `tail -f /www/wwwlogs/shopify-discount-app.error.log`

3. **Database Issues**
- Check file permissions
- Verify SQLite database exists
- Check disk space: `df -h`
