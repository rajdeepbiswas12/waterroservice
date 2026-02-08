PROJECT_ROOT=$(pwd)
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

cd $PROJECT_ROOT
git pull origin master
cd $BACKEND_DIR
npm install
pm2 status
pm2 restart waterroservice-backend 
cd $FRONTEND_DIR
npm install
npm run build
sudo rm -rf /usr/share/nginx/html/*
sudo cp -r dist/ro-service-frontend/browser/* /usr/share/nginx/html/
sudo systemctl reload nginx

