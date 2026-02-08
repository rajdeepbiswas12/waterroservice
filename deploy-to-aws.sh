#!/bin/bash

# AWS Deployment Script for RO Service
# This script helps deploy the fixed version to AWS

set -e

echo "=== RO Service AWS Deployment ==="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if AWS IP/domain is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: AWS IP or domain not provided${NC}"
    echo "Usage: ./deploy-to-aws.sh <aws-ip-or-domain> [ssh-user]"
    echo "Example: ./deploy-to-aws.sh 54.123.45.67 ubuntu"
    echo "Example: ./deploy-to-aws.sh myapp.example.com ec2-user"
    exit 1
fi

AWS_HOST="$1"
SSH_USER="${2:-ubuntu}"  # Default to ubuntu if not provided

echo -e "${YELLOW}Deploying to: ${AWS_HOST}${NC}"
echo -e "${YELLOW}SSH User: ${SSH_USER}${NC}"
echo ""

# Step 1: Update config.json with AWS API URL
echo -e "${GREEN}[1/5] Updating frontend config...${NC}"
cd frontend/src/assets

# Backup original config
cp config.json config.json.backup

# Create production config
cat > config.json <<EOF
{
  "apiUrl": "http://${AWS_HOST}:5000/api",
  "production": true
}
EOF

echo "Config updated to use: http://${AWS_HOST}:5000/api"
cd ../../..

# Step 2: Build frontend
echo -e "${GREEN}[2/5] Building frontend...${NC}"
cd frontend
npm run build
cd ..

# Step 3: Ask for deployment path
echo ""
echo -e "${YELLOW}What is the deployment path on AWS?${NC}"
echo "Common paths:"
echo "  1. /var/www/html (default nginx)"
echo "  2. /home/${SSH_USER}/waterroservice"
echo "  3. Custom path"
read -p "Enter deployment path [/var/www/html]: " DEPLOY_PATH
DEPLOY_PATH=${DEPLOY_PATH:-/var/www/html}

# Step 4: Deploy to AWS
echo -e "${GREEN}[3/5] Deploying frontend to AWS...${NC}"
echo "Copying files to ${SSH_USER}@${AWS_HOST}:${DEPLOY_PATH}"

# Create tarball
cd frontend/dist/browser
tar -czf ../../../frontend-build.tar.gz *
cd ../../..

# Copy to AWS
scp frontend-build.tar.gz ${SSH_USER}@${AWS_HOST}:/tmp/

# Extract on AWS
echo "Extracting files on AWS..."
ssh ${SSH_USER}@${AWS_HOST} << EOF
    sudo mkdir -p ${DEPLOY_PATH}
    cd ${DEPLOY_PATH}
    sudo tar -xzf /tmp/frontend-build.tar.gz
    sudo rm /tmp/frontend-build.tar.gz
    sudo chown -R www-data:www-data ${DEPLOY_PATH}
    echo "Frontend deployed successfully!"
EOF

# Cleanup
rm frontend-build.tar.gz

# Restore original config
cp frontend/src/assets/config.json.backup frontend/src/assets/config.json
rm frontend/src/assets/config.json.backup

# Step 5: Check backend
echo -e "${GREEN}[4/5] Checking backend status...${NC}"
ssh ${SSH_USER}@${AWS_HOST} << 'EOF'
    if command -v pm2 &> /dev/null; then
        echo "PM2 backend status:"
        pm2 status
        echo ""
        echo "Recent backend logs:"
        pm2 logs --lines 10 --nostream
    elif systemctl is-active --quiet waterroservice; then
        echo "Backend service is running (systemd)"
        sudo systemctl status waterroservice --no-pager
    else
        echo "Warning: Could not determine backend status"
        echo "Please check manually that your backend is running"
    fi
EOF

# Step 6: Verification
echo ""
echo -e "${GREEN}[5/5] Deployment Complete!${NC}"
echo ""
echo "=== Verification Steps ==="
echo "1. Visit http://${AWS_HOST} in your browser"
echo "2. Open DevTools (F12) > Console tab"
echo "3. You should see: 'Config loaded successfully'"
echo "4. Try logging in and check for descriptive error messages"
echo ""
echo "=== Troubleshooting ==="
echo "If login still fails:"
echo "  1. Check backend logs: ssh ${SSH_USER}@${AWS_HOST} 'pm2 logs backend'"
echo "  2. Test API: curl http://${AWS_HOST}:5000/api/auth/login"
echo "  3. Check CORS settings in backend/server.js"
echo "  4. Verify firewall: ssh ${SSH_USER}@${AWS_HOST} 'sudo ufw status'"
echo ""
echo -e "For detailed troubleshooting, see: ${YELLOW}AWS_DEPLOYMENT_FIX.md${NC}"
