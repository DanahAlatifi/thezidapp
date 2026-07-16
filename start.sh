#!/bin/bash
cd ~/Downloads/connector-portal-rn/rn-app
IP=$(hostname -I | awk '{print $1}')
sed -i "s|BASE_URL: 'http://[0-9.]*:8076'|BASE_URL: 'http://$IP:8076'|" src/api/odoo.js
echo "BASE_URL = http://$IP:8076"
npx expo start -c
