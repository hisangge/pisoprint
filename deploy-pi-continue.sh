#!/bin/bash
# Piso Print - Continue Deployment Script for Raspberry Pi
# Run this on the Raspberry Pi to complete the deployment

set -e  # Exit on error

echo "=============================================="
echo "Piso Print - Continuing Deployment"
echo "=============================================="
echo ""

# Navigate to project directory
cd /var/www/pisoprint
echo "✓ Current directory: $(pwd)"
echo ""

# Step 1: Build Frontend Assets
echo "Step 1: Building frontend assets..."
echo "This may take 3-5 minutes on Raspberry Pi..."
npm run build
echo "✓ Frontend built successfully"
echo ""

# Step 2: Check/Create Environment File
echo "Step 2: Checking environment configuration..."
if [ ! -f .env ]; then
    echo "Creating .env file from example..."
    cp .env.example .env
    echo "✓ .env file created"
else
    echo "✓ .env file already exists"
fi
echo ""

# Step 3: Generate Application Key (if not set)
echo "Step 3: Checking application key..."
if grep -q "APP_KEY=$" .env || ! grep -q "APP_KEY=" .env; then
    echo "Generating application key..."
    php artisan key:generate --force
    echo "✓ Application key generated"
else
    echo "✓ Application key already set"
fi
echo ""

# Step 4: Configure Database Settings
echo "Step 4: Ensuring database configuration..."
sed -i 's/DB_CONNECTION=.*/DB_CONNECTION=mysql/' .env
sed -i 's/DB_HOST=.*/DB_HOST=127.0.0.1/' .env
sed -i 's/DB_PORT=.*/DB_PORT=3306/' .env
sed -i 's/DB_DATABASE=.*/DB_DATABASE=pisoprint/' .env
sed -i 's/DB_USERNAME=.*/DB_USERNAME=pisoprint/' .env
sed -i 's/DB_PASSWORD=.*/DB_PASSWORD=pisoprint/' .env
echo "✓ Database configuration updated"
echo ""

# Step 5: Run Database Migrations
echo "Step 5: Running database migrations..."
php artisan migrate --force
echo "✓ Database migrations completed"
echo ""

# Step 6: Create Storage Link
echo "Step 6: Creating storage symlink..."
php artisan storage:link || echo "Storage link may already exist"
echo "✓ Storage link created"
echo ""

# Step 7: Optimize Laravel
echo "Step 7: Optimizing Laravel application..."
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan optimize
echo "✓ Laravel optimized"
echo ""

# Step 8: Set Permissions
echo "Step 8: Setting correct permissions..."
sudo chown -R pisoprint:www-data /var/www/pisoprint
sudo chmod -R 755 /var/www/pisoprint
sudo chmod -R 775 /var/www/pisoprint/storage
sudo chmod -R 775 /var/www/pisoprint/bootstrap/cache
echo "✓ Permissions set correctly"
echo ""

# Step 9: Add user to dialout group for serial port access
echo "Step 9: Configuring serial port access..."
sudo usermod -a -G dialout www-data
sudo usermod -a -G dialout pisoprint
echo "✓ Serial port access configured"
echo ""

# Step 10: Verify Services
echo "Step 10: Checking system services..."
echo ""
echo "Nginx status:"
sudo systemctl status nginx --no-pager | grep "Active:"
echo ""
echo "PHP-FPM status:"
sudo systemctl status php8.3-fpm --no-pager | grep "Active:"
echo ""
echo "MariaDB status:"
sudo systemctl status mariadb --no-pager | grep "Active:"
echo ""

echo "=============================================="
echo "✓ Deployment Steps Completed!"
echo "=============================================="
echo ""
echo "Next steps:"
echo "1. Configure Nginx (if not already done)"
echo "2. Setup systemd services for Laravel queue and coin listener"
echo "3. Configure WiFi hotspot"
echo "4. Test the application"
echo ""
echo "To test the application now, run:"
echo "  curl -I http://localhost"
echo ""
