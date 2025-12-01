# PisoPrint Scripts Documentation

This document describes the streamlined script structure for PisoPrint system management.

## 📁 Script Structure

```
scripts/
├── common.sh           # Shared functions library
├── wifi-manager.sh     # WiFi hotspot & client mode management
├── kiosk-manager.sh    # Kiosk setup & control
├── usb-manager.sh      # USB auto-mount management
└── service-manager.sh  # Systemd service installation
```

## 🔧 Common Functions Library

**File:** `scripts/common.sh`

Provides shared functionality across all scripts:

- **Color definitions** (RED, GREEN, YELLOW, BLUE, CYAN, NC)
- **Output functions** (success, error, warning, info, print_header)
- **System checks** (require_root, require_non_root, command_exists)
- **Service management** (start_service, stop_service, get_service_status)
- **Network functions** (interface_exists, get_interface_ip, get_wifi_mode)
- **File operations** (backup_file, ensure_directory)
- **Process management** (kill_process, is_process_running)
- **URL checking** (is_url_responding, wait_for_url)

### Usage

```bash
# Load in your script
source "$(dirname "$0")/common.sh"

# Use functions
print_header "My Script"
success "Operation completed"
error "Something went wrong"
require_root  # Exit if not root
```

## 📡 WiFi Manager

**File:** `scripts/wifi-manager.sh`

Unified WiFi hotspot setup, mode switching, and diagnostics.

### Commands

```bash
# Initial setup (run once)
sudo ./scripts/wifi-manager.sh setup

# Switch to hotspot mode
sudo ./scripts/wifi-manager.sh hotspot

# Switch to WiFi client mode
sudo ./scripts/wifi-manager.sh client

# Show current status
./scripts/wifi-manager.sh status

# Run diagnostics
sudo ./scripts/wifi-manager.sh diagnose
```

### Features

- **Setup**: Install packages, configure hostapd/dnsmasq, enable IP forwarding
- **Hotspot Mode**: Start WiFi access point (SSID: PisoPrint_Kiosk)
- **Client Mode**: Connect to existing WiFi network
- **Status**: Show current mode, IP, and service status
- **Diagnostics**: Comprehensive troubleshooting checks

### Environment Variables

```bash
export WIFI_SSID="MyKiosk"
export WIFI_PASSWORD="SecurePass123"
export WIFI_IP="192.168.5.1"
export WIFI_INTERFACE="wlan0"
```

## 🖥️ Kiosk Manager

**File:** `scripts/kiosk-manager.sh`

Unified kiosk setup and control.

### Commands

```bash
# Initial setup (run once)
./scripts/kiosk-manager.sh setup

# Start kiosk mode
./scripts/kiosk-manager.sh start

# Stop kiosk mode
./scripts/kiosk-manager.sh stop

# Restart kiosk
./scripts/kiosk-manager.sh restart

# Show status
./scripts/kiosk-manager.sh status
```

### Features

- **Setup**: Install Chromium, create startup scripts, configure autostart
- **Start/Stop/Restart**: Control kiosk mode
- **Status**: Check if kiosk is running
- **Auto-generated scripts**: Creates `start-kiosk.sh` and `exit-kiosk.sh`

### Environment Variables

```bash
export KIOSK_URL="http://localhost"
export PISOPRINT_USER="pi"
```

## 💾 USB Manager

**File:** `scripts/usb-manager.sh`

USB auto-mount setup and monitoring.

### Commands

```bash
# Initial setup
sudo ./scripts/usb-manager.sh setup

# Show status
./scripts/usb-manager.sh status
```

### Features

- **Auto-mount**: Automatically mount USB drives when inserted
- **PDF extraction**: Copy PDF files to Laravel storage
- **File watcher**: Monitor for new files and notify Laravel
- **Status**: Show mounted drives and queued files

### Configuration

- **Mount point**: `/media/usb`
- **Temp directory**: `storage/app/uploads/usb`
- **Supported formats**: FAT32, NTFS, exFAT

## ⚙️ Service Manager

**File:** `scripts/service-manager.sh`

Systemd service installation and management.

### Commands

```bash
# Install all services
sudo ./scripts/service-manager.sh install

# Show service status
./scripts/service-manager.sh status

# View service logs
./scripts/service-manager.sh logs piso-print-esp32
./scripts/service-manager.sh logs piso-print-job-monitor
./scripts/service-manager.sh logs piso-print-kiosk
```

### Services

1. **piso-print-esp32** - ESP32 coin acceptor listener
2. **piso-print-job-monitor** - Print job monitor
3. **piso-print-kiosk** - Chromium kiosk mode

### Management

```bash
# Enable auto-start
sudo systemctl enable piso-print-esp32
sudo systemctl enable piso-print-job-monitor
sudo systemctl enable piso-print-kiosk

# Start services
sudo systemctl start piso-print-esp32
sudo systemctl start piso-print-job-monitor
sudo systemctl start piso-print-kiosk

# Check status
sudo systemctl status piso-print-esp32
```

## 🚀 Quick Start Guide

### 1. Initial Setup

```bash
# Clone/navigate to project
cd piso-print

# Make scripts executable
chmod +x scripts/*.sh

# Setup WiFi hotspot
sudo ./scripts/wifi-manager.sh setup

# Setup kiosk mode
./scripts/kiosk-manager.sh setup

# Setup USB auto-mount
sudo ./scripts/usb-manager.sh setup

# Install systemd services
sudo ./scripts/service-manager.sh install
```

### 2. Enable Services

```bash
# Enable auto-start
sudo systemctl enable piso-print-esp32
sudo systemctl enable piso-print-job-monitor
sudo systemctl enable piso-print-kiosk
```

### 3. Start Everything

```bash
# Start services
sudo systemctl start piso-print-esp32
sudo systemctl start piso-print-job-monitor

# Start kiosk (or reboot for auto-start)
./scripts/kiosk-manager.sh start
# OR
sudo reboot
```

## 📊 Monitoring

```bash
# Check all service status
./scripts/service-manager.sh status

# Check WiFi status
./scripts/wifi-manager.sh status

# Check kiosk status
./scripts/kiosk-manager.sh status

# Check USB status
./scripts/usb-manager.sh status

# View logs
./scripts/service-manager.sh logs piso-print-esp32
journalctl -u piso-print-kiosk -f
tail -f /var/log/piso-print/*.log
```

## 🔄 Mode Switching

### WiFi Mode

```bash
# Switch to hotspot (for kiosk use)
sudo ./scripts/wifi-manager.sh hotspot

# Switch to client (for updates/internet)
sudo ./scripts/wifi-manager.sh client
```

### Kiosk Control

```bash
# Stop kiosk for maintenance
./scripts/kiosk-manager.sh stop

# Restart after changes
./scripts/kiosk-manager.sh restart
```

## 🐛 Troubleshooting

### WiFi Issues

```bash
# Run diagnostics
sudo ./scripts/wifi-manager.sh diagnose

# Common fixes
sudo rfkill unblock wifi
sudo systemctl restart hostapd dnsmasq
sudo reboot
```

### Kiosk Issues

```bash
# Check if web app is running
curl http://localhost

# Check X server
echo $DISPLAY  # Should be :0
xset q

# View kiosk logs
journalctl -u piso-print-kiosk -n 50
```

### Service Issues

```bash
# Check service status
./scripts/service-manager.sh status

# View specific service logs
./scripts/service-manager.sh logs piso-print-esp32

# Restart service
sudo systemctl restart piso-print-job-monitor
```

## 🔐 Security Notes

- Scripts use `NoNewPrivileges=true` for services
- Only necessary permissions granted
- Temporary files use `PrivateTmp=true`
- Services run as non-root user where possible

## 📝 Legacy Scripts

The following scripts have been replaced:

- ❌ `setup-wifi-hotspot.sh` → ✅ `scripts/wifi-manager.sh setup`
- ❌ `toggle-wifi-mode.sh` → ✅ `scripts/wifi-manager.sh hotspot|client`
- ❌ `diagnose-wifi.sh` → ✅ `scripts/wifi-manager.sh diagnose`
- ❌ `kiosk-setup.sh` → ✅ `scripts/kiosk-manager.sh setup`
- ❌ `setup-usb-automount.sh` → ✅ `scripts/usb-manager.sh setup`
- ❌ Individual service files → ✅ `scripts/service-manager.sh install`

## 🎯 Best Practices

1. **Always use the new scripts** in `scripts/` directory
2. **Source common.sh** for consistent output and error handling
3. **Check status** before making changes
4. **Run diagnostics** when troubleshooting
5. **View logs** for detailed error information

## 📞 Support

For issues or questions:
1. Run diagnostics: `./scripts/wifi-manager.sh diagnose`
2. Check logs: `./scripts/service-manager.sh logs <service>`
3. Review `/var/log/piso-print/*.log`
4. Check systemd journal: `journalctl -xe`
