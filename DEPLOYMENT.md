# Hostinger Deployment Guide

## Complete Step-by-Step Deployment to Hostinger

### Prerequisites on Hostinger
- VPS or Business/Premium Shared Hosting plan
- SSH access enabled
- MySQL database access

---

## Part 1: MySQL Database Setup on Hostinger

### Via Hostinger Control Panel (hPanel)

1. **Login to Hostinger Control Panel**
   - Go to https://hpanel.hostinger.com
   - Login with your credentials

2. **Create MySQL Database**
   - Navigate to **Databases** → **MySQL Databases**
   - Click **Create New Database**
   - Database Name: `u123456789_roservice` (Hostinger adds prefix)
   - Click **Create**

3. **Create Database User**
   - In same section, find **MySQL Users**
   - Username: `u123456789_admin` (Hostinger adds prefix)
   - Password: Generate strong password
   - Click **Create User**

4. **Assign User to Database**
   - Find **Add User To Database** section
   - Select your user and database
   - Grant **ALL PRIVILEGES**
   - Click **Add**

5. **Note Down Credentials**
   ```
   Host: localhost (or specific IP from hPanel)
   Database: u123456789_roservice
   Username: u123456789_admin
   Password: [your generated password]
   Port: 3306
   ```

---

## Part 2: Backend Deployment

### Option A: Deploy via File Manager (Easier for Beginners)

1. **Build Your Backend Locally**
   ```bash
   cd backend
   # Remove node_modules if exists
   rm -rf node_modules
   ```

2. **Zip the Backend Folder**
   ```bash
   # On your local machine
   cd ..
   zip -r backend.zip backend/
   ```

3. **Upload via File Manager**
   - Login to hPanel
   - Go to **File Manager**
   - Navigate to `public_html` or create `api` folder
   - Upload `backend.zip`
   - Extract the zip file
   - Delete zip file after extraction

4. **Setup Node.js Application via hPanel**
   - Go to **Advanced** → **Node.js**
   - Click **Create Application**
   - Node.js version: 18.x or higher
   - Application mode: Production
   - Application root: `/home/u123456789/public_html/backend`
   - Application URL: `api.yourdomain.com` or `yourdomain.com/api`
   - Application startup file: `server.js`
   - Click **Create**

5. **Install Dependencies**
   - In Node.js Application section
   - Click **Enter to virtual environment**
   - Run command: `npm install`

6. **Configure Environment Variables**
   - Click on your application
   - Find **Environment Variables** section
   - Add each variable from your `.env` file:
     ```
     PORT=5000
     NODE_ENV=production
     DB_HOST=localhost
     DB_USER=u123456789_admin
     DB_PASSWORD=[your db password]
     DB_NAME=u123456789_roservice
     DB_PORT=3306
     JWT_SECRET=[your secret]
     JWT_EXPIRE=7d
     FRONTEND_URL=https://yourdomain.com
     TWILIO_ACCOUNT_SID=[your twilio sid]
     TWILIO_AUTH_TOKEN=[your twilio token]
     TWILIO_WHATSAPP_NUMBER=[your twilio number]
     ```

7. **Start the Application**
   - Click **Start Application**
   - Check if status shows **Running**

### Option B: Deploy via SSH (Advanced Users)

1. **Connect via SSH**
   ```bash
   ssh u123456789@yourdomain.com
   # Enter your password
   ```

2. **Navigate to Application Directory**
   ```bash
   cd public_html
   mkdir api
   cd api
   ```

3. **Clone Your Repository**
   ```bash
   git clone https://github.com/yourusername/waterroservice.git
   cd waterroservice/backend
   ```

4. **Install Dependencies**
   ```bash
   npm install --production
   ```

5. **Create .env File**
   ```bash
   nano .env
   # Paste your production environment variables
   # Press Ctrl+X, then Y, then Enter to save
   ```

6. **Setup with PM2 (if available)**
   ```bash
   npm install -g pm2
   pm2 start server.js --name ro-backend
   pm2 save
   pm2 startup
   ```

---

## Part 3: Frontend Deployment

### Build Angular Application

1. **Update Production Environment**
   ```bash
   # On your local machine
   cd frontend
   ```

2. **Edit `src/environments/environment.prod.ts`**
   ```typescript
   export const environment = {
     production: true,
     apiUrl: 'https://api.yourdomain.com/api', // or https://yourdomain.com/api
     googleMapsApiKey: 'YOUR_GOOGLE_MAPS_API_KEY'
   };
   ```

3. **Build for Production**
   ```bash
   ng build --configuration production
   ```
   This creates `dist/ro-service-frontend/` folder

### Deploy to Hostinger

1. **Via File Manager**
   - Login to hPanel → File Manager
   - Navigate to `public_html`
   - Delete default `index.html` and other files
   - Upload all files from `dist/ro-service-frontend/` to `public_html`

2. **Create .htaccess File**
   - In `public_html`, create `.htaccess` file
   - Add this content:
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /index.html [L]
   </IfModule>

   # Enable GZIP compression
   <IfModule mod_deflate.c>
     AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
   </IfModule>

   # Browser Caching
   <IfModule mod_expires.c>
     ExpiresActive On
     ExpiresByType image/jpg "access plus 1 year"
     ExpiresByType image/jpeg "access plus 1 year"
     ExpiresByType image/gif "access plus 1 year"
     ExpiresByType image/png "access plus 1 year"
     ExpiresByType text/css "access plus 1 month"
     ExpiresByType application/javascript "access plus 1 month"
     ExpiresByType text/javascript "access plus 1 month"
   </IfModule>
   ```

---

## Part 4: SSL Certificate Setup

1. **Enable Free SSL**
   - Login to hPanel
   - Go to **Security** → **SSL**
   - Select your domain
   - Click **Install** free Let's Encrypt SSL
   - Wait 5-10 minutes for activation

2. **Force HTTPS (Optional but Recommended)**
   - Add to `.htaccess`:
   ```apache
   # Force HTTPS
   RewriteCond %{HTTPS} off
   RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
   ```

---

## Part 5: Domain/Subdomain Configuration

### For API Subdomain

1. **Create Subdomain**
   - hPanel → **Domains** → **Subdomains**
   - Create: `api.yourdomain.com`
   - Point to: `/public_html/api/backend` (or your backend path)

2. **Update DNS (if needed)**
   - Add A record for `api` pointing to your server IP

### For Main Domain

- Main domain automatically points to `public_html`
- Place frontend files directly in `public_html`

---

## Part 6: Testing Deployment

### Test Backend API

```bash
# Test health endpoint
curl https://api.yourdomain.com/api/health

# Test login
curl -X POST https://api.yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@roservice.com","password":"Admin@123"}'
```

### Test Frontend

1. Open browser: `https://yourdomain.com`
2. You should see login page
3. Try logging in with admin credentials

---

## Part 7: Monitoring & Maintenance

### Monitor Application Logs

**Via SSH:**
```bash
# PM2 logs (if using PM2)
pm2 logs ro-backend

# Or check Node.js application logs in hPanel
```

**Via hPanel:**
- Node.js section → Your application → **Logs**

### Database Backups

1. **Automatic Backups (hPanel)**
   - Go to **Files** → **Backups**
   - Enable automatic daily backups

2. **Manual Backup**
   ```bash
   # Via SSH
   mysqldump -u u123456789_admin -p u123456789_roservice > backup_$(date +%Y%m%d).sql
   ```

3. **Download Backup via phpMyAdmin**
   - hPanel → **Databases** → **phpMyAdmin**
   - Select database → **Export** → **Go**

### Update Application

```bash
# Via SSH
cd /home/u123456789/public_html/api/waterroservice
git pull origin main
cd backend
npm install
pm2 restart ro-backend
```

---

## Troubleshooting

### Backend Not Starting

1. **Check Node.js Logs**
   - hPanel → Node.js → Your App → Logs

2. **Verify Environment Variables**
   - Check all variables are set correctly

3. **Database Connection Issues**
   - Verify database credentials
   - Check if database exists
   - Test connection via phpMyAdmin

### Frontend 404 Errors

1. **Check .htaccess exists**
2. **Verify mod_rewrite is enabled**
3. **Check file permissions** (should be 644)

### SSL Issues

1. Wait 10-15 minutes after SSL installation
2. Clear browser cache
3. Check SSL status in hPanel

### API CORS Errors

Update backend `.env`:
```
FRONTEND_URL=https://yourdomain.com
```

Restart backend application.

---

## Performance Optimization

### Enable Caching

Add to `.htaccess`:
```apache
<IfModule mod_headers.c>
  Header set Cache-Control "max-age=31536000, public"
</IfModule>
```

### Enable GZIP Compression

Already included in `.htaccess` above

### Optimize Images

Use tools like TinyPNG before uploading

### Use CDN (Optional)

- Cloudflare (Free plan available)
- Hostinger CDN (if available in your plan)

---

## Security Checklist

- ✅ SSL Certificate enabled
- ✅ Strong database passwords
- ✅ Change default admin password
- ✅ Regular backups enabled
- ✅ Latest Node.js version
- ✅ Environment variables secured
- ✅ File permissions set correctly (644 for files, 755 for directories)
- ✅ Disable directory listing

---

## Cost Estimate (Hostinger)

| Service | Monthly Cost |
|---------|-------------|
| Premium Shared Hosting | $2.99 - $7.99 |
| Business Hosting | $3.99 - $9.99 |
| VPS Hosting | $4.99 - $29.99 |
| Domain Name | $0.99 - $12.99/year |
| SSL Certificate | FREE (Let's Encrypt) |

**Recommended:** Business Hosting or VPS for production

---

## Support Resources

- **Hostinger Knowledge Base:** https://support.hostinger.com
- **Live Chat:** Available 24/7 in hPanel
- **Community Forum:** https://community.hostinger.com

---

## Next Steps After Deployment

1. ✅ Test all features thoroughly
2. ✅ Create first admin user
3. ✅ Add employees
4. ✅ Create test orders
5. ✅ Test WhatsApp notifications
6. ✅ Monitor for first 24 hours
7. ✅ Set up monitoring alerts
8. ✅ Configure regular backups

---

**Deployment Complete! 🎉**

Your RO Service Management System is now live on Hostinger!
