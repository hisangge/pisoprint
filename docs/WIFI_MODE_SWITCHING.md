# WiFi Mode Switching Guide

This guide explains how to easily switch between **Hotspot Mode** (for kiosk users) and **WiFi Client Mode** (for development/internet access) on your Raspberry Pi.

## The Smart Solution

Instead of manually editing configuration files, we use **separate config files** that can be toggled on/off:

- `/etc/dhcpcd.conf.d/wlan0-hotspot.conf` - Static IP config (192.168.4.1)
- `/etc/dhcpcd.conf.d/wlan0.conf` - Symlink to active config (or deleted for DHCP)

## Quick Commands

### Check Current Mode
```bash
sudo ./toggle-wifi-mode.sh status
```

### Switch to WiFi Client (Development)
```bash
# Step 1: Switch to client mode
sudo ./toggle-wifi-mode.sh client

# Step 2: Connect to your WiFi
sudo nmcli device wifi connect 'YourWiFiName' password 'YourPassword'

# Step 3: Check your new IP address
ip addr show wlan0 | grep "inet "
```

### Switch to Hotspot (Production)
```bash
sudo ./toggle-wifi-mode.sh hotspot
```

Your Raspberry Pi will now broadcast **PisoPrint_Kiosk** at **192.168.4.1**

## How It Works

### Hotspot Mode (Production)
```
┌─────────────────┐
│  Raspberry Pi   │
│  192.168.4.1    │ ← Static IP configured in dhcpcd
└────────┬────────┘
         │ WiFi Hotspot
         │ SSID: PisoPrint_Kiosk
         │
    ┌────┴────┐
    │  Users  │
    │ Phones  │
    └─────────┘
```

**Services Running:**
- ✅ `hostapd` - Creates WiFi hotspot
- ✅ `dnsmasq` - DHCP server for connected clients
- ❌ `wpa_supplicant` - Not needed (we're the AP, not a client)

**Configuration:**
- Static IP: `192.168.4.1/24`
- Config file: `/etc/dhcpcd.conf.d/wlan0.conf` → `wlan0-hotspot.conf`
- DHCP disabled (no `nohook wpa_supplicant` active)

### WiFi Client Mode (Development)
```
┌──────────────┐
│   Internet   │
└──────┬───────┘
       │
┌──────┴───────┐
│ WiFi Router  │ ← Your home/office WiFi
│ 192.168.1.1  │
└──────┬───────┘
       │ WiFi Connection
       │
┌──────┴───────┐
│ Raspberry Pi │ ← Dynamic IP from router
│ 192.168.1.X  │    (e.g., 192.168.1.105)
└──────────────┘
```

**Services Running:**
- ❌ `hostapd` - Stopped (not creating hotspot)
- ❌ `dnsmasq` - Stopped (not serving DHCP)
- ✅ `wpa_supplicant` - Connects to WiFi
- ✅ `dhcpcd` - Gets dynamic IP from router

**Configuration:**
- Dynamic IP: Assigned by router's DHCP
- Config file: `/etc/dhcpcd.conf.d/wlan0.conf` → **deleted**
- DHCP enabled (gets IP automatically)

## Why This Works

### The Problem
The original setup had:
```bash
interface wlan0
    static ip_address=192.168.4.1/24
    nohook wpa_supplicant  # ← This prevents WiFi client mode!
```

This configuration **permanently disables** `wpa_supplicant`, so wlan0 can never connect to WiFi networks.

### The Solution
We split the config into two modes:

1. **Hotspot mode:** Use `wlan0-hotspot.conf` with static IP
2. **Client mode:** Delete `wlan0.conf` to enable DHCP

The `toggle-wifi-mode.sh` script automates this switching!

## Typical Workflow

### During Development
```bash
# Morning: Switch to WiFi for development
ssh pi@pisoprint.local
sudo ./toggle-wifi-mode.sh client
sudo nmcli device wifi connect 'OfficeWiFi' password 'password123'

# Work on code, push to GitHub, pull updates, etc.
# Access kiosk at: http://192.168.1.105 (your dynamic IP)

# Evening: Switch back to hotspot for testing
sudo ./toggle-wifi-mode.sh hotspot
# Test kiosk at: http://192.168.4.1
```

### Before Deployment
```bash
# Final check in hotspot mode
sudo ./toggle-wifi-mode.sh hotspot
sudo systemctl enable hostapd dnsmasq
sudo systemctl disable wpa_supplicant

# Verify it starts on boot
sudo reboot
```

## Troubleshooting

### wlan0 has no IP after switching
```bash
# Restart dhcpcd
sudo systemctl restart dhcpcd
sleep 3
ip addr show wlan0
```

### Can't connect to WiFi in client mode
```bash
# Check if wpa_supplicant is running
sudo systemctl status wpa_supplicant

# Scan for networks
sudo nmcli device wifi list

# Try connecting with verbose output
sudo nmcli --ask device wifi connect 'SSID'
```

### Hotspot not broadcasting
```bash
# Check hostapd status
sudo systemctl status hostapd

# Check for errors
sudo journalctl -u hostapd -n 50

# Verify config
cat /etc/hostapd/hostapd.conf

# Restart everything
sudo ./toggle-wifi-mode.sh hotspot
```

### Services start but no connectivity
```bash
# Check iptables
sudo iptables -t nat -L -n -v

# Check IP forwarding
cat /proc/sys/net/ipv4/ip_forward  # Should be 1

# Check dnsmasq leases
cat /var/lib/misc/dnsmasq.leases
```

## Advanced: Manual Switching

If the script doesn't work, you can switch manually:

### To Client Mode
```bash
sudo systemctl stop hostapd dnsmasq
sudo rm /etc/dhcpcd.conf.d/wlan0.conf
sudo systemctl restart dhcpcd
sudo nmcli device wifi connect 'SSID' password 'PASSWORD'
```

### To Hotspot Mode
```bash
sudo systemctl stop wpa_supplicant
sudo ln -sf /etc/dhcpcd.conf.d/wlan0-hotspot.conf /etc/dhcpcd.conf.d/wlan0.conf
sudo systemctl restart dhcpcd
sleep 3
sudo systemctl start hostapd dnsmasq
```

## Summary

✅ **Keep static IP config** - Don't delete it!  
✅ **Use toggle script** - Easy switching between modes  
✅ **Separate config files** - Clean and maintainable  
✅ **No manual editing** - Automated switching  

The key insight: **Don't remove the static IP**, just **toggle which config is active**! 🎯
