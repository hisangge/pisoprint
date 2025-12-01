#!/bin/bash

# Configuration
KIOSK_URL="http://localhost"
export DISPLAY=:0

# 1. CLEANUP: Kill any previous instances to prevent duplicates
# We use pkill to ensure we start with a clean slate
pkill -o chromium || true
pkill -o unclutter || true
pkill -o onboard || true

# 2. DISPLAY: Disable Screen Sleep & Energy Saving
# The screen must stay ON 24/7 for a kiosk
xset s off       # Don't activate screensaver
xset -dpms       # Disable Energy Star power management
xset s noblank   # Don't blank the video device

# 3. UTILITIES: Start Background Tools
# Hide the mouse cursor after 0.5 seconds of inactivity
unclutter -idle 0.5 -root & 

# Start Onboard (Virtual Keyboard) in the background
# It will slide up only when a text input is tapped
onboard --layout=Phone --window-decoration=false &  

# 4. RECOVERY: Clean Chromium Crash State
# This prevents the "Restore pages?" bubble after a power cut
rm -rf ~/.config/chromium/Singleton* 2>/dev/null || true
sed -i 's/"exited_cleanly":false/"exited_cleanly":true/' ~/.config/chromium/Default/Preferences 2>/dev/null || true
sed -i 's/"exit_type":"Crashed"/"exit_type":"Normal"/' ~/.config/chromium/Default/Preferences 2>/dev/null || true

# 5. NETWORK: Wait for Laravel/Nginx
# Loops until the web server returns a 200 OK response
# This prevents the browser from showing a "Connection Refused" dinosaur
until curl -s -o /dev/null "$KIOSK_URL"; do
  sleep 2
done

# 6. LAUNCH: Start Chromium
# Optimized for React 19 + Tailwind on Raspberry Pi 4
chromium \
    --kiosk \
    --noerrdialogs \
    --disable-infobars \
    --check-for-update-interval=31536000 \
    --window-size=800,480 \
    --window-position=0,0 \
    --start-fullscreen \
    --touch-events=enabled \
    --disable-pinch \
    --overscroll-history-navigation=0 \
    --enable-features=OverlayScrollbar \
    --ignore-gpu-blocklist \
    --enable-gpu-rasterization \
    --enable-zero-copy \
    --disk-cache-dir=/tmp/chromium-cache \
    --disk-cache-size=52428800 \
    --user-data-dir=/home/pisoprint/.config/chromium \
    "$KIOSK_URL" &

# Keep the script running to monitor the browser process
wait $!