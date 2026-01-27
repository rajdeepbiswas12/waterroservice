# Runtime Configuration Guide

## Overview
The application now uses runtime configuration for the API URL, allowing you to change the backend endpoint without rebuilding the frontend.

## Configuration File
Location: `frontend/dist/ro-service-frontend/browser/assets/config.json`

## Deployment Steps

### For AWS EC2 (HTTPS):

```bash
# After building the frontend
cd /home/ec2-user/waterroservice/frontend
npx ng build --configuration production

# Update the config.json file
cat > dist/ro-service-frontend/browser/assets/config.json << 'EOF'
{
  "apiUrl": "https://54.242.13.162/api",
  "production": true
}
EOF

# Reload nginx
sudo systemctl reload nginx
```

### For AWS EC2 (HTTP):

```bash
cat > dist/ro-service-frontend/browser/assets/config.json << 'EOF'
{
  "apiUrl": "http://54.242.13.162/api",
  "production": true
}
EOF
```

### For Local Development:

```bash
# frontend/src/assets/config.json
{
  "apiUrl": "http://localhost:5000/api",
  "production": false
}
```

## Troubleshooting Connection Refused

### On EC2 Instance:

```bash
# 1. Check if backend is running
pm2 status
pm2 logs ro-service-api --lines 50

# 2. Test backend directly
curl http://localhost:5000/api/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@roservice.com","password":"admin123"}'

# 3. Check backend .env CORS settings
cat /home/ec2-user/waterroservice/backend/.env | grep CORS_ORIGIN
# Should be: CORS_ORIGIN=https://54.242.13.162 (or http)

# 4. Test through nginx proxy
curl -k https://localhost/api/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@roservice.com","password":"admin123"}'

# 5. Check nginx logs
sudo tail -f /var/log/nginx/ro-service-error.log

# 6. Verify port 5000 is listening
sudo netstat -tlnp | grep 5000

# 7. Check if nginx can reach backend
sudo setenforce 0  # Temporarily disable SELinux if blocking
```

### Common Fixes:

1. **Backend not running**: `cd /home/ec2-user/waterroservice/backend && pm2 start ecosystem.config.js`

2. **Wrong CORS origin**: Edit `/home/ec2-user/waterroservice/backend/.env` and set `CORS_ORIGIN=https://54.242.13.162`, then `pm2 restart ro-service-api`

3. **Nginx proxy misconfigured**: Check `/etc/nginx/conf.d/ro-service.conf` has:
   ```nginx
   location /api/ {
       proxy_pass http://127.0.0.1:5000/api/;
   }
   ```

4. **SELinux blocking**: Run `sudo setenforce 0` (temporary) or configure SELinux policies

5. **Firewall blocking**: Check Security Group allows inbound on ports 80, 443, 5000

## Updating API URL Without Rebuild

You can change the API URL at any time by editing the config file:

```bash
# On production server
sudo nano /home/ec2-user/waterroservice/frontend/dist/ro-service-frontend/browser/assets/config.json

# Change apiUrl to your new endpoint
# No need to rebuild or restart anything
# Just refresh the browser
```

## Docker Configuration (Future)

```json
{
  "apiUrl": "${API_URL}",
  "production": true
}
```

Then use environment variables when deploying.
