# WiFi Hotspot Troubleshooting Guide

**Problem**: Cannot connect to Raspberry Pi WiFi hotspot "PisoPrint_Kiosk"

This guide will help you diagnose and fix WiFi hotspot connectivity issues on your Raspberry Pi.

---

## 🔍 Quick Diagnostic Commands

Run these commands on your Raspberry Pi to diagnose the issue:

```bash
# 1. Check if hostapd service is running
sudo systemctl status hostapd

# 2. Check if dnsmasq service is running
sudo systemctl status dnsmasq

# 3. Check WiFi interface status
ip addr show wlan0

# 4. Check if hostapd is actually broadcasting
sudo iw dev wlan0 info

# 5. Check for error messages
sudo journalctl -u hostapd -n 50 --no-pager
sudo journalctl -u dnsmasq -n 50 --no-pager

# 6. Check if wlan0 has correct IP
ip -4 addr show wlan0 | grep inet
```

---

## ⚠️ Common Issues & Solutions

### Issue 1: Services Not Running

**Symptom**: WiFi network doesn't appear

**Diagnosis**:
```bash
sudo systemctl status hostapd
sudo systemctl status dnsmasq
```

**Solution**:
```bash
# Start services
sudo systemctl start hostapd
sudo systemctl start dnsmasq

# Enable on boot
sudo systemctl enable hostapd
sudo systemctl enable dnsmasq

# Check again
sudo systemctl status hostapd
sudo systemctl status dnsmasq
```

---

### Issue 2: wlan0 Already Used by WiFi Client

**Symptom**: `hostapd` fails with "Device or resource busy" error

**Diagnosis**:
```bash
# Check if wlan0 is connected to another WiFi network
iwconfig wlan0
```

**Root Cause**: Raspberry Pi WiFi cannot be both a client (connected to WiFi) and access point (hotspot) simultaneously.

**Solution A: Use Ethernet for Internet** (Recommended)
```bash
# 1. Connect Pi to router via Ethernet cable (eth0)
# 2. Disconnect from WiFi
sudo nmcli device disconnect wlan0

# 3. Stop wpa_supplicant on wlan0
sudo systemctl stop wpa_supplicant

# 4. Restart hotspot services
sudo systemctl restart hostapd
sudo systemctl restart dnsmasq

# 5. Verify wlan0 is now in AP mode
sudo iw dev wlan0 info
# Should show "type AP"
```

**Solution B: Use WiFi for Hotspot Only** (No Internet)
```bash
# 1. Remove all WiFi client connections
sudo nmcli connection delete id "<connection-name>"

# 2. Prevent wpa_supplicant from managing wlan0
sudo systemctl disable wpa_supplicant
sudo systemctl stop wpa_supplicant

# 3. Restart services
sudo reboot
```

---

### Issue 3: NetworkManager Conflict

**Symptom**: WiFi hotspot works briefly then stops

**Diagnosis**:
```bash
# Check if NetworkManager is managing wlan0
nmcli device status
```

**Solution**:
```bash
# Method 1: Tell NetworkManager to ignore wlan0
sudo nano /etc/NetworkManager/NetworkManager.conf
```

Add these lines:
```ini
[keyfile]
unmanaged-devices=interface-name:wlan0
```

```bash
# Restart NetworkManager
sudo systemctl restart NetworkManager

# Restart hotspot services
sudo systemctl restart hostapd
sudo systemctl restart dnsmasq
```

**Method 2: Disable NetworkManager completely**
```bash
sudo systemctl stop NetworkManager
sudo systemctl disable NetworkManager
sudo systemctl restart dhcpcd
```

---

### Issue 4: dhcpcd Not Configured

**Symptom**: wlan0 doesn't have IP address 192.168.4.1

**Diagnosis**:
```bash
ip -4 addr show wlan0 | grep inet
# Should show: inet 192.168.4.1/24
```

**Solution**:
```bash
# 1. Edit dhcpcd configuration
sudo nano /etc/dhcpcd.conf

# 2. Add or verify these lines at the end:
interface wlan0
    static ip_address=192.168.4.1/24
    nohook wpa_supplicant

# 3. Restart dhcpcd
sudo systemctl restart dhcpcd

# 4. Verify IP assigned
ip addr show wlan0
```

---

### Issue 5: RF Kill Enabled

**Symptom**: WiFi hardware appears blocked

**Diagnosis**:
```bash
sudo rfkill list all
```

**If you see "Soft blocked: yes" or "Hard blocked: yes":**

**Solution**:
```bash
# Unblock WiFi
sudo rfkill unblock wifi
sudo rfkill unblock all

# Restart hotspot
sudo systemctl restart hostapd
```

---

### Issue 6: Wrong WiFi Driver

**Symptom**: `hostapd` fails with "nl80211: Could not configure driver mode"

**Diagnosis**:
```bash
lsmod | grep -E "brcmfmac|brcmutil"
```

**Solution**:
```bash
# Update hostapd configuration
sudo nano /etc/hostapd/hostapd.conf
```

Change driver line:
```conf
# Try this first (most Raspberry Pi models)
driver=nl80211

# If that fails, try:
# driver=brcmfmac
```

```bash
# Restart hostapd
sudo systemctl restart hostapd
```

---

### Issue 7: Wrong WiFi Channel

**Symptom**: Hotspot appears but cannot connect

**Solution**:
```bash
# Edit hostapd configuration
sudo nano /etc/hostapd/hostapd.conf
```

Try different channels:
```conf
# Change channel (try 1, 6, or 11 instead of 7)
channel=6

# For Raspberry Pi 3B+ and 4, also try:
# hw_mode=a
# channel=36
```

```bash
# Restart hostapd
sudo systemctl restart hostapd
```

---

### Issue 8: Missing Configuration File Path

**Symptom**: `hostapd` runs but no WiFi appears

**Diagnosis**:
```bash
sudo systemctl status hostapd
# Check if it mentions configuration file
```

**Solution**:
```bash
# Set configuration path
sudo nano /etc/default/hostapd
```

Uncomment and set:
```bash
DAEMON_CONF="/etc/hostapd/hostapd.conf"
```

```bash
# Restart service
sudo systemctl daemon-reload
sudo systemctl restart hostapd
```

---

### Issue 9: Firewall Blocking

**Symptom**: Can connect but no DHCP address assigned

**Solution**:
```bash
# Check iptables rules
sudo iptables -L -v -n

# Clear and reconfigure
sudo iptables -F
sudo iptables -t nat -F

# Add NAT rules
sudo iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
sudo iptables -A FORWARD -i eth0 -o wlan0 -m state --state RELATED,ESTABLISHED -j ACCEPT
sudo iptables -A FORWARD -i wlan0 -o eth0 -j ACCEPT

# Save rules
sudo netfilter-persistent save

# Restart dnsmasq
sudo systemctl restart dnsmasq
```

---

### Issue 10: dnsmasq Port Conflict

**Symptom**: dnsmasq fails to start, port 53 already in use

**Diagnosis**:
```bash
sudo lsof -i :53
# or
sudo netstat -tulpn | grep :53
```

**Solution A: Disable systemd-resolved**
```bash
# Stop systemd-resolved
sudo systemctl stop systemd-resolved
sudo systemctl disable systemd-resolved

# Create manual resolv.conf
sudo rm /etc/resolv.conf
sudo nano /etc/resolv.conf
```

Add:
```
nameserver 8.8.8.8
nameserver 8.8.4.4
```

```bash
# Restart dnsmasq
sudo systemctl restart dnsmasq
```

**Solution B: Configure systemd-resolved to not use port 53**
```bash
sudo nano /etc/systemd/resolved.conf
```

Add:
```ini
[Resolve]
DNSStubListener=no
```

```bash
sudo systemctl restart systemd-resolved
sudo systemctl restart dnsmasq
```

---

## 🔧 Complete Reset & Reconfiguration

If none of the above works, do a complete reset:

```bash
# 1. Stop all services
sudo systemctl stop hostapd
sudo systemctl stop dnsmasq
sudo systemctl stop NetworkManager
sudo systemctl stop wpa_supplicant

# 2. Remove old configurations
sudo rm /etc/hostapd/hostapd.conf
sudo rm /etc/dnsmasq.conf

# 3. Run setup script
cd /home/leodyversemilla07/piso-print
sudo bash setup-wifi-hotspot.sh

# 4. Reboot
sudo reboot

# 5. After reboot, check services
sudo systemctl status hostapd
sudo systemctl status dnsmasq
ip addr show wlan0
```

---

## ✅ Verification Checklist

After applying fixes, verify each item:

- [ ] `sudo systemctl status hostapd` shows "active (running)"
- [ ] `sudo systemctl status dnsmasq` shows "active (running)"
- [ ] `ip addr show wlan0` shows IP address 192.168.4.1/24
- [ ] `sudo iw dev wlan0 info` shows "type AP"
- [ ] WiFi network "PisoPrint_Kiosk" visible on your phone/laptop
- [ ] Can connect to "PisoPrint_Kiosk" with password "PisoPrint2025"
- [ ] Device receives IP in range 192.168.4.100-192.168.4.200
- [ ] Can access http://192.168.4.1 in browser

---

## 🔍 Detailed Diagnostics Script

Save this as `diagnose-wifi.sh` and run with `sudo bash diagnose-wifi.sh`:

```bash
#!/bin/bash

echo "======================================"
echo "PisoPrint WiFi Hotspot Diagnostics"
echo "======================================"
echo ""

echo "1. Service Status:"
echo "-------------------"
systemctl status hostapd --no-pager | grep -E "Active:|Loaded:"
systemctl status dnsmasq --no-pager | grep -E "Active:|Loaded:"
echo ""

echo "2. Network Interface (wlan0):"
echo "-----------------------------"
ip addr show wlan0 | grep -E "inet |state"
echo ""

echo "3. WiFi Mode:"
echo "-------------"
iw dev wlan0 info | grep -E "type|ssid"
echo ""

echo "4. RF Kill Status:"
echo "------------------"
rfkill list wifi
echo ""

echo "5. Listening Services:"
echo "----------------------"
echo "Port 53 (DNS):"
lsof -i :53 2>/dev/null || echo "  No service on port 53"
echo ""

echo "6. Recent hostapd Errors:"
echo "-------------------------"
journalctl -u hostapd -n 10 --no-pager | grep -i error || echo "  No errors"
echo ""

echo "7. Recent dnsmasq Errors:"
echo "-------------------------"
journalctl -u dnsmasq -n 10 --no-pager | grep -i error || echo "  No errors"
echo ""

echo "8. WiFi Driver:"
echo "---------------"
lsmod | grep -E "brcm|cfg80211"
echo ""

echo "9. Configuration Files:"
echo "-----------------------"
echo "hostapd config exists: $([ -f /etc/hostapd/hostapd.conf ] && echo 'YES' || echo 'NO')"
echo "dnsmasq config exists: $([ -f /etc/dnsmasq.conf ] && echo 'YES' || echo 'NO')"
echo ""

echo "======================================"
echo "Diagnostics Complete"
echo "======================================"
```

---

## 📱 Testing from Client Device

### On Windows:
```cmd
# Scan for networks
netsh wlan show networks

# Check connection
netsh wlan show interfaces

# Ping Raspberry Pi
ping 192.168.4.1
```

### On Linux/Mac:
```bash
# Scan for networks
sudo iwlist wlan0 scan | grep -i pisoprintios

# Check connection
nmcli connection show

# Ping Raspberry Pi
ping 192.168.4.1
```

### On Phone:
1. Settings → WiFi
2. Look for "PisoPrint_Kiosk"
3. Connect with password: PisoPrint2025
4. Open browser → http://192.168.4.1

---

## 🎯 Most Common Root Causes (Ranked)

1. **wlan0 already used as WiFi client** (50% of cases)
   - Solution: Use Ethernet instead, disconnect WiFi

2. **NetworkManager interference** (25% of cases)
   - Solution: Tell NetworkManager to ignore wlan0

3. **Services not running** (15% of cases)
   - Solution: Enable and start services

4. **systemd-resolved port conflict** (5% of cases)
   - Solution: Disable DNSStubListener

5. **RF kill enabled** (3% of cases)
   - Solution: `rfkill unblock wifi`

6. **Other issues** (2% of cases)
   - Wrong driver, wrong channel, firewall, etc.

---

## 💡 Recommended Configuration

For most reliable operation on Raspberry Pi 4:

1. **Use Ethernet for internet**, not WiFi
2. **Disable NetworkManager** on wlan0
3. **Use channel 6** in hostapd.conf
4. **Disable systemd-resolved DNS stub**
5. **Ensure dhcpcd manages wlan0**

---

## 📞 Getting Help

If still having issues, collect this information:

```bash
# Run diagnostics and save output
sudo bash diagnose-wifi.sh > wifi-diagnostics.txt

# Check Raspberry Pi model
cat /proc/device-tree/model

# Check OS version
cat /etc/os-release

# Check network status
ip link show
ip addr show

# Save to file
uname -a > system-info.txt
```

---

## 🔗 Related Files

- **Setup Script**: `setup-wifi-hotspot.sh`
- **Deployment Guide**: `docs/RASPBERRY_PI_DEPLOYMENT_GUIDE.md`
- **Config**: `.env` (WIFI_SSID, WIFI_PASSWORD, etc.)

---

**Last Updated**: November 3, 2025  
**Version**: 1.0
