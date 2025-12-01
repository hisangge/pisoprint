#!/bin/bash

###############################################################################
# PisoPrint WiFi Manager
# Unified script for WiFi hotspot setup, mode switching, and diagnostics
# Usage: wifi-manager.sh {setup|hotspot|client|status|diagnose}
###############################################################################

set -e

# Load common functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

# Configuration
SSID="${WIFI_SSID:-$DEFAULT_WIFI_SSID}"
PASSWORD="${WIFI_PASSWORD:-$DEFAULT_WIFI_PASSWORD}"
IP_ADDRESS="${WIFI_IP:-$DEFAULT_WIFI_IP}"
DHCP_RANGE="${WIFI_DHCP_RANGE:-192.168.4.100,192.168.4.200}"
INTERFACE="${WIFI_INTERFACE:-$DEFAULT_WIFI_INTERFACE}"

###############################################################################
# Setup Functions
###############################################################################

setup_hotspot() {
    require_root
    
    print_header "PisoPrint WiFi Hotspot Setup"
    
    info "Installing required packages..."
    apt-get update
    apt-get install -y hostapd dnsmasq iptables-persistent rfkill iw
    
    # Stop services during setup
    stop_service hostapd || true
    stop_service dnsmasq || true
    
    info "Unblocking WiFi..."
    unblock_wifi
    
    info "Configuring dhcpcd..."
    ensure_directory "/etc/dhcpcd.conf.d"
    
    cat > /etc/dhcpcd.conf.d/wlan0-hotspot.conf << EOF
# PisoPrint WiFi Hotspot Configuration
interface $INTERFACE
    static ip_address=$IP_ADDRESS/24
    nohook wpa_supplicant
EOF
    
    ln -sf /etc/dhcpcd.conf.d/wlan0-hotspot.conf /etc/dhcpcd.conf.d/wlan0.conf
    
    info "Configuring dnsmasq..."
    backup_file /etc/dnsmasq.conf || true
    
    cat > /etc/dnsmasq.conf << EOF
# PisoPrint DHCP Server Configuration
interface=$INTERFACE
dhcp-range=$DHCP_RANGE,255.255.255.0,24h
domain=wlan
address=/pisoprint.local/$IP_ADDRESS
EOF
    
    info "Configuring hostapd..."
    ensure_directory "/etc/hostapd"
    
    cat > /etc/hostapd/hostapd.conf << EOF
# PisoPrint WiFi Access Point Configuration
interface=$INTERFACE
driver=nl80211
ssid=$SSID
hw_mode=g
channel=7
wmm_enabled=0
macaddr_acl=0
auth_algs=1
ignore_broadcast_ssid=0
wpa=2
wpa_passphrase=$PASSWORD
wpa_key_mgmt=WPA-PSK
wpa_pairwise=TKIP
rsn_pairwise=CCMP
EOF
    
    # Configure hostapd daemon
    sed -i 's|#DAEMON_CONF=""|DAEMON_CONF="/etc/hostapd/hostapd.conf"|' /etc/default/hostapd 2>/dev/null || true
    
    if [ -f /etc/init.d/hostapd ]; then
        sed -i 's|#DAEMON_CONF=""|DAEMON_CONF="/etc/hostapd/hostapd.conf"|' /etc/init.d/hostapd
    fi
    
    info "Enabling IP forwarding..."
    if grep -q "^#net.ipv4.ip_forward=1" /etc/sysctl.conf; then
        sed -i 's/#net.ipv4.ip_forward=1/net.ipv4.ip_forward=1/' /etc/sysctl.conf
    elif ! grep -q "^net.ipv4.ip_forward=1" /etc/sysctl.conf; then
        echo "net.ipv4.ip_forward=1" >> /etc/sysctl.conf
    fi
    sysctl -p
    
    info "Configuring NAT..."
    iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE 2>/dev/null || true
    iptables -A FORWARD -i eth0 -o wlan0 -m state --state RELATED,ESTABLISHED -j ACCEPT 2>/dev/null || true
    iptables -A FORWARD -i wlan0 -o eth0 -j ACCEPT 2>/dev/null || true
    netfilter-persistent save
    
    info "Enabling services..."
    systemctl unmask hostapd
    enable_service hostapd
    enable_service dnsmasq
    
    info "Starting services..."
    if service_exists dhcpcd; then
        systemctl restart dhcpcd
        sleep 2
    fi
    
    start_service hostapd
    start_service dnsmasq
    
    print_header "WiFi Hotspot Setup Complete!"
    echo -e "SSID:     ${GREEN}$SSID${NC}"
    echo -e "Password: ${GREEN}$PASSWORD${NC}"
    echo -e "IP:       ${GREEN}$IP_ADDRESS${NC}"
    echo ""
    echo "Access kiosk at: http://$IP_ADDRESS or http://pisoprint.local"
    echo ""
}

###############################################################################
# Mode Switching Functions
###############################################################################

switch_to_hotspot() {
    require_root
    
    print_header "Switching to Hotspot Mode"
    
    stop_service wpa_supplicant || true
    
    if [ -f /etc/dhcpcd.conf.d/wlan0-hotspot.conf ]; then
        ln -sf /etc/dhcpcd.conf.d/wlan0-hotspot.conf /etc/dhcpcd.conf.d/wlan0.conf
    else
        error "Hotspot config not found. Run: $0 setup"
        exit 1
    fi
    
    if service_exists dhcpcd; then
        systemctl restart dhcpcd
        sleep 3
    fi
    
    start_service hostapd
    start_service dnsmasq
    
    success "Hotspot mode enabled"
    echo "  SSID: $SSID"
    echo "  IP:   $IP_ADDRESS"
}

switch_to_client() {
    require_root
    
    print_header "Switching to WiFi Client Mode"
    
    stop_service hostapd
    stop_service dnsmasq
    
    rm -f /etc/dhcpcd.conf.d/wlan0.conf
    
    if service_exists dhcpcd; then
        systemctl restart dhcpcd
    fi
    
    start_service wpa_supplicant || true
    
    success "WiFi Client mode enabled"
    echo ""
    info "Available WiFi networks:"
    sleep 2
    
    if command_exists nmcli; then
        nmcli device wifi list
        echo ""
        info "Connect with: sudo nmcli device wifi connect 'SSID' password 'PASSWORD'"
    elif command_exists iwlist; then
        iwlist $INTERFACE scan | grep ESSID
        echo ""
        info "Edit /etc/wpa_supplicant/wpa_supplicant.conf to connect"
    fi
}

###############################################################################
# Status Functions
###############################################################################

show_status() {
    print_header "PisoPrint WiFi Status"
    
    echo -e "${YELLOW}Service Status:${NC}"
    get_service_status hostapd
    get_service_status dnsmasq
    get_service_status wpa_supplicant
    echo ""
    
    echo -e "${YELLOW}Network Interface ($INTERFACE):${NC}"
    if interface_exists "$INTERFACE"; then
        local state=$(get_interface_state "$INTERFACE")
        local ip=$(get_interface_ip "$INTERFACE")
        local mode=$(get_wifi_mode "$INTERFACE")
        
        echo "  State: $state"
        echo "  IP:    ${ip:-No IP assigned}"
        echo "  Mode:  ${mode:-unknown}"
    else
        error "$INTERFACE not found"
    fi
    echo ""
    
    if is_service_running hostapd; then
        print_msg "$CYAN" "Current Mode: 🔥 HOTSPOT (AP) MODE"
        echo "  Users connect to: $SSID"
        echo "  Access kiosk at: http://$IP_ADDRESS"
    elif [ -n "$(get_interface_ip "$INTERFACE")" ]; then
        local client_ip=$(get_interface_ip "$INTERFACE")
        print_msg "$CYAN" "Current Mode: 📡 WiFi CLIENT MODE"
        echo "  Access kiosk at: http://$client_ip"
    else
        print_msg "$RED" "Current Mode: ❌ UNKNOWN/ERROR"
    fi
}

###############################################################################
# Diagnostics Functions
###############################################################################

run_diagnostics() {
    require_root
    
    print_header "PisoPrint WiFi Diagnostics"
    
    local issues=0
    
    # 1. Service Status
    echo -e "${YELLOW}1. Service Status:${NC}"
    get_service_status hostapd || issues=$((issues + 1))
    get_service_status dnsmasq || issues=$((issues + 1))
    echo ""
    
    # 2. Network Interface
    echo -e "${YELLOW}2. Network Interface:${NC}"
    if interface_exists "$INTERFACE"; then
        local state=$(get_interface_state "$INTERFACE")
        local ip=$(get_interface_ip "$INTERFACE")
        
        if is_interface_up "$INTERFACE"; then
            success "$INTERFACE: $state"
        else
            error "$INTERFACE: $state"
            issues=$((issues + 1))
        fi
        
        if [ "$ip" = "$IP_ADDRESS" ]; then
            success "IP Address: $ip"
        elif [ -z "$ip" ]; then
            error "No IP Address assigned"
            issues=$((issues + 1))
        else
            warning "IP Address: $ip (expected $IP_ADDRESS)"
        fi
    else
        error "$INTERFACE: NOT FOUND"
        issues=$((issues + 1))
    fi
    echo ""
    
    # 3. WiFi Mode
    echo -e "${YELLOW}3. WiFi Mode:${NC}"
    local mode=$(get_wifi_mode "$INTERFACE")
    if [ "$mode" = "AP" ]; then
        success "Mode: Access Point"
    elif [ -z "$mode" ] || [ "$mode" = "unknown" ]; then
        error "Cannot determine mode"
        issues=$((issues + 1))
    else
        warning "Mode: $mode (expected AP)"
    fi
    echo ""
    
    # 4. RF Kill Status
    echo -e "${YELLOW}4. RF Kill Status:${NC}"
    if is_wifi_blocked; then
        error "WiFi is blocked!"
        echo "  Fix with: sudo rfkill unblock wifi"
        issues=$((issues + 1))
    else
        success "WiFi: Not blocked"
    fi
    echo ""
    
    # 5. Configuration Files
    echo -e "${YELLOW}5. Configuration Files:${NC}"
    if [ -f /etc/hostapd/hostapd.conf ]; then
        success "/etc/hostapd/hostapd.conf exists"
    else
        error "/etc/hostapd/hostapd.conf missing"
        issues=$((issues + 1))
    fi
    
    if [ -f /etc/dnsmasq.conf ]; then
        success "/etc/dnsmasq.conf exists"
    else
        error "/etc/dnsmasq.conf missing"
        issues=$((issues + 1))
    fi
    echo ""
    
    # 6. Recent Errors
    echo -e "${YELLOW}6. Recent Errors:${NC}"
    local hostapd_errors=$(journalctl -u hostapd -n 20 --no-pager 2>/dev/null | grep -i "error\|fail" || true)
    if [ -z "$hostapd_errors" ]; then
        success "hostapd: No recent errors"
    else
        error "hostapd: Errors detected"
        echo "$hostapd_errors" | tail -n 3
    fi
    echo ""
    
    # Summary
    print_header "Diagnostic Summary"
    if [ $issues -eq 0 ]; then
        success "No critical issues found!"
        info "If hotspot still not working:"
        echo "  1. Reboot: sudo reboot"
        echo "  2. Check clients can see SSID: $SSID"
        echo "  3. Try different channel in /etc/hostapd/hostapd.conf"
    else
        error "Found $issues issue(s)"
        echo ""
        info "Recommended actions:"
        echo "  1. Fix the issues above"
        echo "  2. Run: $0 setup (to reconfigure)"
        echo "  3. Reboot: sudo reboot"
    fi
}

###############################################################################
# Main
###############################################################################

main() {
    local command="${1:-status}"
    
    case "$command" in
        setup)
            setup_hotspot
            ;;
        hotspot|ap)
            switch_to_hotspot
            ;;
        client|wifi)
            switch_to_client
            ;;
        status)
            show_status
            ;;
        diagnose|diagnostic|test)
            run_diagnostics
            ;;
        help|--help|-h)
            echo "Usage: $0 {setup|hotspot|client|status|diagnose}"
            echo ""
            echo "Commands:"
            echo "  setup     - Initial WiFi hotspot setup (run once)"
            echo "  hotspot   - Switch to hotspot (AP) mode"
            echo "  client    - Switch to WiFi client mode"
            echo "  status    - Show current WiFi status"
            echo "  diagnose  - Run diagnostics"
            echo ""
            echo "Examples:"
            echo "  sudo $0 setup              # First-time setup"
            echo "  sudo $0 hotspot            # Enable hotspot"
            echo "  sudo $0 client             # Connect to WiFi"
            echo "  $0 status                  # Check status"
            echo "  sudo $0 diagnose           # Run diagnostics"
            ;;
        *)
            error "Unknown command: $command"
            echo "Run: $0 help"
            exit 1
            ;;
    esac
}

main "$@"
