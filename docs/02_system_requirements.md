# 2. System Requirements

[← Back to Index](README.md)

## 2.1 Hardware Requirements

| **Component** | **Minimum** | **Recommended** |
|---------------|-------------|-----------------|
| **Raspberry Pi 4 / Orange Pi equivalent** | 2GB RAM<br>32GB Class 10 microSD Card | **8GB RAM** *(Already Owned)*<br>**128GB Class 10 microSD Card** *(Already Owned)*<br>Quad-core ARM Cortex-A72 @ 1.5GHz |
| **ESP32 microcontroller** | ESP32 Development Board (CH340C, USB-C, 30-Pin)<br>Dual-core @ 240MHz<br>Wi-Fi + Bluetooth<br>5V power supply | **ESP32 Development Board (CH340C, USB-C, 30-Pin)** *(Already Owned)*<br>Dual-core Xtensa 32-bit LX6 @ 240MHz<br>520KB SRAM, 4MB Flash<br>Wi-Fi 2.4GHz 802.11 b/g/n + Bluetooth 4.2<br>**Power:** 5V via 12V-to-5V DC-DC buck converter |
| **Programmable Coin Acceptor (Multi-Coin)** | ALLAN Universal Coinslot 1239 PROMAX or CH-926 Multi-Coin Acceptor<br>Configured for ₱1, ₱5, ₱10, ₱20 coins<br>Pulse output signal<br>12V DC operation | **ALLAN Universal Coinslot 1239 PROMAX Multi-Coin Acceptor** *(Recommended)*<br>Configured for ₱1, ₱5, ₱10, ₱20 Philippine Peso coins<br>Pulse output: 1 (₱1), 5 (₱5), 10 (₱10), 20 (₱20) pulses<br>Connected to ESP32 GPIO 25<br>12V DC @ 2A operation<br>Anti-fraud detection features |
| **USB or Wi-Fi printer (CUPS-supported)** | Epson L120<br>USB 2.0 connection<br>Black & white printing<br>Letter size paper | **Brother DCP-T720DW** *(Already Owned)*<br>USB 2.0 connection (primary)<br>12 ipm (black), 10 ipm (color)<br>6000 × 1200 dpi resolution<br>150 sheets capacity<br>CUPS driver support |
| **Power supply (5V for Pi, 12V for coin acceptor)** | 5V 3A USB-C for Raspberry Pi<br>12V 2A for Coin Acceptor<br>Basic surge protection | **5V 3A Official USB-C** *(Already Owned)*<br>12V 2A DC adapter for Coin Acceptor<br>5V via 12V to 5V DC-DC converter for ESP32<br>UPS backup (600VA-1000VA) |
| **LAFVIN 7 Inch Touchscreen IPS DSI Display** | LAFVIN 7 Inch Touchscreen IPS DSI Display<br>800 × 480 pixels<br>10-finger capacitive touch<br>MIPI DSI interface<br>Displays Web Kiosk UI | **LAFVIN 7 Inch Touchscreen IPS DSI Display** *(Already Owned)*<br>800 × 480 pixels<br>10-finger capacitive touch<br>MIPI DSI interface (compatible with Raspberry Pi)<br>5V power via GPIO pins 2 & 6<br>**Runs Chromium Browser in Kiosk Mode**<br>**Displays Laravel + Inertia.js + React 19 UI**<br>Full-screen locked mode, no escape to desktop<br>Touch-optimized interface |
| **Enclosure** | Basic enclosure with ventilation | Steel cabinet with locks<br>700mm(H) × 450mm(W) × 400mm(D)<br>Ventilation fans (2× 80mm, 12V DC)<br>Lockable coin box compartment |
| **Additional Components** | USB cables<br>Jumper wires<br>Basic heatsinks | USB Hub (4-port, powered)<br>USB cables (Type A to B, micro-USB)<br>Jumper wires, breadboard<br>Heatsinks for Raspberry Pi<br>Cooling fans with dust filters<br>LED status indicators (RGB) |
| **Network** | Wi-Fi capability built-in | WiFi Access Point (built-in Pi WiFi)<br>hostapd + dnsmasq<br>SSID: "PisoPrint_Kiosk"<br>2.4GHz channel 7<br>Isolated network for file uploads |

**Hardware Setup Notes:**
- Ensure adequate ventilation for the Raspberry Pi and printer
- Use quality power supply to prevent voltage drops
- Coin acceptor requires separate 12V power supply
- ESP32 powered from 12V supply via DC-DC step-down converter
- All components share common ground
- WiFi Access Point configured for user file uploads (no internet access)

---

## 2.2 Software Requirements

| **Software Component** | **Minimum** | **Recommended** |
|------------------------|-------------|-----------------|
| **Operating System (Dev)** | Windows 10<br>macOS 12<br>Ubuntu 20.04 LTS | Windows 11<br>macOS 14+<br>Ubuntu 22.04 LTS |
| **Operating System (Production)** | Raspberry Pi OS (64-bit)<br>Debian 11 (Bullseye)<br>Kernel 5.15+ | **Raspberry Pi OS (64-bit)**<br>**Debian 12 (Bookworm)**<br>**Kernel 6.1+** |
| **Raspberry Pi 4 / Orange Pi equivalent** | 2GB RAM<br>32GB Class 10 microSD Card | **8GB RAM** *(Already Owned)*<br>**128GB Class 10 microSD Card** *(Already Owned)*<br>Quad-core ARM Cortex-A72 @ 1.5GHz |
| **PHP** | PHP 8.2 | **PHP 8.3.27** |
| **PHP Extensions** | php-cli, php-fpm<br>php-mysql, php-sqlite3<br>php-mbstring, php-xml | **php8.3-cli, php8.3-fpm**<br>**php8.3-mysql**<br>**php8.3-mbstring, php8.3-xml**<br>**php8.3-curl, php8.3-zip**<br>**php8.3-gd, php8.3-intl** |
| **Laravel Framework** | Laravel 11.x | **Laravel 12.36.0** (Process facade requires 12.0+) |
| **Composer** | Composer 2.0 | **Composer 2.x (latest)** |
| **Node.js** | Node.js 18.x LTS<br>npm 9.x | **Node.js 22.x LTS**<br>**npm 10.x** |
| **Web Server (Raspberry Pi)** | Apache 2.4+ | **Nginx 1.22+** or **Apache 2.4+** |
| **Kiosk Browser** | Chromium | **Chromium 130+ in Kiosk Mode**<br>**unclutter** (hide mouse cursor)<br>**xdotool** (keyboard control) |
| **Database** | MySQL 8.0 | **MySQL 8.0+** (Development & Production with Docker)<br>SQLite 3.35+ (Alternative/Testing) |
| **Docker** | Docker 20.x | **Docker 27.x+** (Development)<br>**Docker Compose 3.8+** (Container orchestration) |
| **Inertia.js** | Inertia Laravel 1.x<br>Inertia React 1.x | **Inertia Laravel 2.0.10**<br>**Inertia React 2.1.4** |
| **React** | React 18.x | **React 19.2.0**<br>**React DOM 19.2.0** |
| **TypeScript** | TypeScript 5.0 | **TypeScript 5.7.2** |
| **Vite** | Vite 5.x | **Vite 7.0.4** |
| **Laravel Vite Plugin** | laravel-vite-plugin 1.x | **laravel-vite-plugin 2.0** |
| **Tailwind CSS** | Tailwind CSS 3.x | **Tailwind CSS 4.0.0**<br>**@tailwindcss/vite 4.1.11** |
| **UI Components** | Basic Radix UI components | **Radix UI** (17 components)<br>**Headless UI 2.2.0**<br>**Lucide React 0.475.0** |
| **Authentication** | Basic Laravel Auth | **Laravel Fortify 1.31.2** |
| **Routing** | Basic Laravel routes | **Laravel Wayfinder 0.1.12**<br>**@laravel/vite-plugin-wayfinder 0.1.3** |
| **Testing** | PHPUnit 10.x<br>Jest | **Pest 4.1.2**<br>**PHPUnit 12.4.0**<br>**Vitest** (frontend) |
| **Code Quality** | Basic linting | **ESLint 9.17.0**<br>**Prettier 3.4.2**<br>**Laravel Pint 1.25.1** |
| **Development Tools** | Basic setup | **Docker + MySQL 8.0**<br>**Concurrently 9.0.1**<br>**TypeScript ESLint 8.23.0** |
| **Utilities** | Basic CSS utilities | **class-variance-authority 0.7.1**<br>**clsx 2.1.1**<br>**tailwind-merge 3.0.1**<br>**tw-animate-css 1.4.0**<br>**input-otp 1.4.2** |
| **Development Tools** | Basic setup | **Laravel Boost 1.6+** (MCP server for AI assistance)<br>**Laravel Pail 1.2.2+** (log viewer)<br>**Docker + MySQL 8.0**<br>**Concurrently 9.0.1** |

**Software Installation Notes:**
- **Development:** Install PHP 8.3+, Composer, Node.js 22.x, npm, Docker, and Docker Compose
- **Raspberry Pi Production:** Install PHP 8.3+ with extensions (cli, fpm, mysql, mbstring, xml, curl, zip, gd, intl)
- **Web Server:** Configure Nginx or Apache on Raspberry Pi
- **Kiosk Mode:** Install Chromium browser, unclutter, xdotool for full-screen locked kiosk
- **Database (Development):** MySQL 8.0 via Docker Compose (see docker-compose.yml)
- **Database (Production):** MySQL 8.0+ or SQLite 3.35+ on Raspberry Pi
- Configure services to start on boot: `sudo systemctl enable nginx php8.3-fpm mysql`
- **Optional WiFi Access Point:** Install hostapd and dnsmasq for WiFi hotspot (SSID: PisoPrint_Kiosk)
- Set static IP for WiFi interface (wlan0): 192.168.4.1/24
- Configure DHCP range: 192.168.4.2 - 192.168.4.20
- Set up automatic security updates for Raspberry Pi OS
- Create automated backup scripts for database and configuration files
- Use systemd to ensure services restart on failure
- Configure firewall (ufw) to allow only necessary ports (22, 80, 443)
- Implement log rotation to prevent disk space issues
- Install CUPS for printer support: `sudo apt install cups`
- Install Brother DCP-T720DW official Linux drivers for Raspberry Pi

**PHP Extensions Required (Raspberry Pi):**
```bash
# Install PHP 8.3 and required extensions
sudo apt install php8.3-cli php8.3-fpm php8.3-mysql php8.3-mbstring \
  php8.3-xml php8.3-curl php8.3-zip php8.3-gd php8.3-intl

# For serial port communication (ESP32 UART)
sudo apt install php8.3-dev
sudo usermod -a -G dialout www-data  # Grant web server access to serial ports
```

**Docker Setup (Development):**
```bash
# Start MySQL container
docker-compose up -d

# Check container status
docker-compose ps

# View MySQL logs
docker-compose logs -f mysql

# Stop containers
docker-compose down

# Stop containers and remove volumes (clean slate)
docker-compose down -v
```

**ESP32 Development Environment:**

| **Component** | **Specification** |
|---------------|-------------------|
| **Programming Language** | C/C++ (Arduino Framework) |
| **IDE Options** | Arduino IDE 2.x or PlatformIO (VS Code extension) |
| **Board Support** | ESP32 Board Package 2.x or higher |
| **Required Libraries** | ArduinoJson 7.x (JSON serialization for UART communication) |
| **Framework** | Arduino Core for ESP32 |
| **Compiler** | Xtensa GCC toolchain (included with ESP32 board package) |

**Why C/C++ for ESP32:**
- Real-time coin pulse detection requires low-latency interrupt handling
- Direct hardware access for GPIO and UART
- Mature library ecosystem (ArduinoJson for UART communication)
- Precise memory management (520KB SRAM limitation)
- Large community support and extensive documentation
- Native support for all ESP32 hardware features

**Installation Instructions:**
```bash
# Option 1: Arduino IDE
# 1. Install Arduino IDE 2.x from arduino.cc
# 2. Add ESP32 board support via Boards Manager
# 3. Install required libraries via Library Manager

# Option 2: PlatformIO (Recommended for professional development)
# 1. Install VS Code
# 2. Install PlatformIO extension
# 3. Create new ESP32 project (framework = arduino)
# 4. Libraries auto-install via platformio.ini
```

**Actual Node.js Packages (package.json):**
```json
{
  "dependencies": {
    "@headlessui/react": "^2.2.0",
    "@inertiajs/react": "^2.1.4",
    "@radix-ui/react-avatar": "^1.1.3",
    "@radix-ui/react-checkbox": "^1.1.4",
    "@radix-ui/react-collapsible": "^1.1.3",
    "@radix-ui/react-dialog": "^1.1.6",
    "@radix-ui/react-dropdown-menu": "^2.1.6",
    "@radix-ui/react-label": "^2.1.2",
    "@radix-ui/react-navigation-menu": "^1.2.5",
    "@radix-ui/react-select": "^2.1.6",
    "@radix-ui/react-separator": "^1.1.2",
    "@radix-ui/react-slot": "^1.2.3",
    "@radix-ui/react-toggle": "^1.1.2",
    "@radix-ui/react-toggle-group": "^1.1.2",
    "@radix-ui/react-tooltip": "^1.1.8",
    "@tailwindcss/vite": "^4.1.11",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "concurrently": "^9.0.1",
    "input-otp": "^1.4.2",
    "laravel-vite-plugin": "^2.0",
    "lucide-react": "^0.475.0",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "tailwind-merge": "^3.0.1",
    "tailwindcss": "^4.0.0",
    "tw-animate-css": "^1.4.0",
    "typescript": "^5.7.2",
    "vite": "^7.0.4"
  },
  "devDependencies": {
    "@eslint/js": "^9.19.0",
    "@laravel/vite-plugin-wayfinder": "^0.1.3",
    "@types/node": "^22.13.5",
    "@types/react": "^19.2.0",
    "@types/react-dom": "^19.2.0",
    "@vitejs/plugin-react": "^5.0.0",
    "babel-plugin-react-compiler": "^1.0.0",
    "eslint": "^9.17.0",
    "eslint-config-prettier": "^10.0.1",
    "eslint-plugin-react": "^7.37.3",
    "eslint-plugin-react-hooks": "^7.0.0",
    "prettier": "^3.4.2",
    "prettier-plugin-organize-imports": "^4.1.0",
    "prettier-plugin-tailwindcss": "^0.6.11",
    "shadcn": "^3.5.0",
    "typescript-eslint": "^8.23.0"
  }
}
```

**Note:** This is a Laravel + Inertia.js application with web-based kiosk mode (Chromium).

---

**Navigation:**
- [← Previous: Introduction](01_introduction.md)
- [→ Next: System Architecture](03_system_architecture.md)
- [↑ Back to Index](README.md)
