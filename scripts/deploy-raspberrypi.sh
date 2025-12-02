#!/bin/bash
# PisoPrint - Simple Deployment Script
# Run this on the Raspberry Pi after cloning the repo

set -e

echo "🚀 PisoPrint - Automated Deployment"
echo "===================================="

# Update system
echo "📦 Step 1/8: Updating system packages..."
sudo apt update -qq

# Install PHP 8.4 and extensions
echo "🐘 Step 2/8: Installing PHP 8.4..."
sudo apt install -y php8.4 php8.4-fpm php8.4-cli php8.4-sqlite3 php8.4-mbstring \
    php8.4-xml php8.4-curl php8.4-zip php8.4-gd php8.4-bcmath php8.4-intl -qq

# Install Nginx
echo "🌐 Step 3/8: Installing Nginx..."
sudo apt install -y nginx -qq

# Install Composer
echo "🎼 Step 4/8: Installing Composer..."
if [ ! -f /usr/local/bin/composer ]; then
    curl -sS https://getcomposer.org/installer | php
    sudo mv composer.phar /usr/local/bin/composer
    sudo chmod +x /usr/local/bin/composer
fi

# Move app to /var/www
echo "📂 Step 5/8: Setting up application..."
sudo rm -rf /var/www/pisoprint
sudo mv ~/pisoprint /var/www/pisoprint
cd /var/www/pisoprint

# Install Composer dependencies
echo "📥 Step 6/8: Installing Composer dependencies (this takes a few minutes)..."
sudo composer install --no-dev --optimize-autoloader --no-interaction

# Setup Laravel
echo "⚙️ Step 7/8: Configuring Laravel..."
sudo cp .env.example .env
sudo php artisan key:generate
sudo php artisan storage:link
sudo chmod -R 775 storage bootstrap/cache
sudo chown -R www-data:www-data /var/www/pisoprint

# Create database and migrate
echo "🗄️ Creating SQLite database..."
sudo touch database/database.sqlite
sudo chown www-data:www-data database/database.sqlite
sudo php artisan migrate --force

# Configure Nginx
echo "🔧 Step 8/8: Configuring Nginx..."
sudo bash -c 'cat > /etc/nginx/sites-available/pisoprint << "EOF"
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    root /var/www/pisoprint/public;
    index index.php index.html;
    server_name _;

    location / {
        try_files \$uri \$uri/ /index.php?\$query_string;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.4-fpm.sock;
    }

    location ~ /\.ht {
        deny all;
    }
}
EOF'

sudo ln -sf /etc/nginx/sites-available/pisoprint /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx php8.4-fpm

# Setup systemd services
echo "🔄 Setting up services..."

# Laravel Queue
sudo bash -c 'cat > /etc/systemd/system/laravel-queue.service << "EOF"
[Unit]
Description=Laravel Queue Worker
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/pisoprint
ExecStart=/usr/bin/php artisan queue:work --sleep=3 --tries=3
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF'

# Coin Listener
sudo bash -c 'cat > /etc/systemd/system/coin-listener.service << "EOF"
[Unit]
Description=PisoPrint Coin Listener
After=network.target

[Service]
Type=simple
User=pisoprint
Group=dialout
WorkingDirectory=/var/www/pisoprint/scripts
Environment="ESP32_SERIAL_PORT=/dev/ttyUSB0"
Environment="LARAVEL_URL=http://localhost"
ExecStart=/usr/bin/python3 coin_listener.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF'

# Kiosk Mode
echo "🖥️ Setting up kiosk mode..."
sudo apt install -y unclutter onboard chromium xdotool -qq
sudo chmod +x /var/www/pisoprint/start-kiosk.sh

sudo bash -c 'cat > /etc/systemd/system/kiosk.service << "EOF"
[Unit]
Description=PisoPrint Kiosk Mode
After=graphical.target

[Service]
Type=simple
User=pisoprint
Environment=DISPLAY=:0
Environment=XAUTHORITY=/home/pisoprint/.Xauthority
ExecStart=/var/www/pisoprint/start-kiosk.sh
Restart=always
RestartSec=10

[Install]
WantedBy=graphical.target
EOF'

# Enable services
sudo systemctl daemon-reload
sudo systemctl enable laravel-queue
sudo systemctl start laravel-queue
sudo systemctl enable coin-listener
sudo systemctl enable kiosk

# Enable desktop auto-login
echo "🎨 Configuring desktop auto-login..."
sudo raspi-config nonint do_boot_behaviour B4

# Add user to dialout group
sudo usermod -a -G dialout pisoprint

echo ""
echo "✅ ========================================"
echo "✅  DEPLOYMENT COMPLETE!"
echo "✅ ========================================"
echo ""
echo "🌐 Application URL: http://$(hostname -I | awk '{print $1}')"
echo "🖥️ Kiosk Interface: http://localhost/kiosk"
echo ""
echo "📋 Next Steps:"
echo "  • Reboot to start kiosk mode: sudo reboot"
echo "  • Connect ESP32 for coin acceptor"
echo "  • Configure printer at: http://$(hostname -I | awk '{print $1}'):631"
echo ""
echo "Rebooting in 10 seconds..."
sleep 10
sudo reboot
