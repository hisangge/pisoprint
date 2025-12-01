#!/bin/bash

###############################################################################
# PisoPrint mDNS Setup Script
# Sets up pisoprint.local domain name resolution
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  PisoPrint mDNS Setup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if running on Linux
if [[ "$OSTYPE" != "linux-gnu"* ]]; then
    echo -e "${RED}This script must be run on Linux (Raspberry Pi)${NC}"
    exit 1
fi

# Note: This script can now run as root for consistency

echo -e "${YELLOW}→ Installing Avahi daemon for mDNS...${NC}"
apt update
apt install -y avahi-daemon avahi-utils

echo -e "${YELLOW}→ Configuring hostname...${NC}"
# Set hostname to pisoprint
hostnamectl set-hostname pisoprint

# Update /etc/hosts
if ! grep -q "pisoprint" /etc/hosts; then
    echo -e "${YELLOW}→ Adding pisoprint.local to /etc/hosts...${NC}"
    echo "127.0.0.1 pisoprint pisoprint.local" | tee -a /etc/hosts > /dev/null
fi

echo -e "${YELLOW}→ Starting Avahi service...${NC}"
systemctl enable avahi-daemon
systemctl start avahi-daemon

echo -e "${YELLOW}→ Testing mDNS resolution...${NC}"
sleep 2

# Test if the hostname resolves
if ping -c 1 pisoprint.local &> /dev/null; then
    echo -e "${GREEN}✓ pisoprint.local resolves correctly${NC}"
else
    echo -e "${YELLOW}⚠ mDNS may take a moment to propagate${NC}"
    echo -e "${YELLOW}  Try: ping pisoprint.local${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  mDNS Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Your Raspberry Pi is now accessible at:"
echo "  http://pisoprint.local"
echo ""
echo "Test from another device on the same network:"
echo "  ping pisoprint.local"
echo "  curl http://pisoprint.local"
echo ""
echo "Note: mDNS (.local) domains work on:"
echo "  ✓ macOS and iOS (built-in mDNS)"
echo "  ✓ Linux with Avahi"
echo "  ✓ Windows 10+ (built-in mDNS)"
echo "  ✓ Android (when connected to PisoPrint_Kiosk WiFi)"
echo "  ✓ All devices connected to the hotspot (via dnsmasq DNS)"
echo ""
echo "The hotspot provides DNS resolution for ALL connected devices!"