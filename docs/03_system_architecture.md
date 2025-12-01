# 3. System Architecture

[← Back to Index](README.md)

## 3.1 Architecture Diagram

The Piso Print System follows a modern Laravel monolith architecture with Inertia.js running on Raspberry Pi hardware:

```
┌─────────────────────────────────────────────────────────────────┐
│                   PISO PRINT VENDING MACHINE ARCHITECTURE       │
└─────────────────────────────────────────────────────────────────┘

                    ┌──────────────────────┐
                    │   USER INTERACTION   │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
    ┌─────────────────┐  ┌──────────────┐  ┌──────────────────┐
    │  Physical       │  │ Touchscreen  │  │ Phone/Laptop     │
    │  Payments       │  │ Kiosk UI     │  │ WiFi Upload      │
    │  ₱1, ₱5, ₱10, ₱20│  │ (Web Browser)│  │ (192.168.4.1)    │
    └────────┬────────┘  └──────────────┘  └────────┬─────────┘
             │                                       │
             ▼                                       ▼
    ┌─────────────────┐              ┌──────────────────────────┐
    │  COIN ACCEPTOR  │              │  WiFi Hotspot (hostapd)  │
    │  (ALLAN Universal Coinslot 1239 PROMAX Multi)│  • SSID: PisoPrint_Kiosk │
    │  • Pulse Output │              │  • IP: 192.168.4.1       │
    │  • GPIO 25      │              │  • DHCP: dnsmasq         │
    └────────┬────────┘              └────────┬─────────────────┘
             │                                │
             │ Pulse Signals (GPIO)           │ WiFi Upload
             │                                │
             ▼                                │
    ┌─────────────────┐                       │
    │  ESP32 Development Board   │            │
    │  • Pulse Count  │                       │
    │  • Credit Calc  │                       │
    │  • JSON Format  │                       │
    └────────┬────────┘                       │
             │                                │
             │ UART Serial (JSON)             │
             │ GPIO 17→Pi RX                  │
             │                                │
             ▼                                ▼
    ┌─────────────────────────────────────────────────────┐
    │         RASPBERRY PI 4 (8GB RAM)                    │
    │  ┌──────────────────────────────────────────────┐   │
    │  │  Laravel 12 Application (PHP 8.3)            │   │
    │  │  ┌─────────────────────────────────────────┐ │   │
    │  │  │  Controllers (HTTP Layer)               │ │   │
    │  │  │  • PaymentController                    │ │   │
    │  │  │  • PrintJobController                   │ │   │
    │  │  │  • FileUploadController                 │ │   │
    │  │  │  • AdminController                      │ │   │
    │  │  └─────────────────────────────────────────┘ │   │
    │  │  ┌─────────────────────────────────────────┐ │   │
    │  │  │  Services (Business Logic)              │ │   │
    │  │  │  • PaymentService (ESP32 UART/PHP)      │ │   │
    │  │  │  • PrintService (CUPS/PHP Process)      │ │   │
    │  │  │  • FileService (USB/WiFi upload)        │ │   │
    │  │  │  • PdfService (validation/processing)   │ │   │
    │  │  └─────────────────────────────────────────┘ │   │
    │  │  ┌─────────────────────────────────────────┐ │   │
    │  │  │  Models (Eloquent ORM)                  │ │   │
    │  │  │  • User (with 2FA support)              │ │   │
    │  │  │  • PrintJob                             │ │   │
    │  │  │  • Transaction                          │ │   │
    │  │  └─────────────────────────────────────────┘ │   │
    │  │  ┌─────────────────────────────────────────┐ │   │
    │  │  │  Database (MySQL 8.0)                   │ │   │
    │  │  │  • Development: Docker container        │ │   │
    │  │  │  • Production: MySQL/SQLite on Pi       │ │   │
    │  │  │  • users, print_jobs, transactions      │ │   │
    │  │  │  • cache, jobs, sessions, etc.          │ │   │
    │  │  └─────────────────────────────────────────┘ │   │
    │  └──────────────────────────────────────────────┘   │
    │                                                     │
    │  ┌──────────────────────────────────────────────┐   │
    │  │  Web Server (Nginx + PHP-FPM)                │   │
    │  │  • Serves Laravel application                │   │
    │  │  • Static asset delivery                     │   │
    │  └──────────────────────────────────────────────┘   │
    │                                                     │
    │  ┌──────────────────────────────────────────────┐   │
    │  │  Frontend (Inertia.js + React 19)            │   │
    │  │  ┌─────────────────────────────────────────┐ │   │
    │  │  │  Pages (React Components)               │ │   │
    │  │  │  • Home.tsx                             │ │   │
    │  │  │  • FileSelection.tsx                    │ │   │
    │  │  │  • Payment.tsx                          │ │   │
    │  │  │  • PrintStatus.tsx                      │ │   │
    │  │  │  • Admin/Dashboard.tsx                  │ │   │
    │  │  └─────────────────────────────────────────┘ │   │
    │  │  ┌─────────────────────────────────────────┐ │   │
    │  │  │  UI Components (Radix UI + Tailwind)    │ │   │
    │  │  │  • Button, Dialog, Select, etc.         │ │   │
    │  │  │  • Custom components                    │ │   │
    │  │  └─────────────────────────────────────────┘ │   │
    │  │  ┌─────────────────────────────────────────┐ │   │
    │  │  │  Inertia Router                         │ │   │
    │  │  │  • Type-safe routing (Wayfinder)        │ │   │
    │  │  │  • Automatic code splitting             │ │   │
    │  │  └─────────────────────────────────────────┘ │   │
    │  └──────────────────────────────────────────────┘   │
    │                                                     │
    │  │  ┌──────────────────────────────────────────────┐   │
    │  │  │  CUPS Print System                           │   │
    │  │  │  • Print job processing (internal queue)     │   │
    │  │  │  • Printer driver management                 │   │
    │  │  │  • Status monitoring                         │   │
    │  │  │  • Controlled via PHP Process facade         │   │
    │  │  │    (lp, lpstat, cancel commands)             │   │
    │  │  └──────────────────────────────────────────────┘   │
    └──────────────┬──────────────────────────────────────┘
                   │
                   │ USB Connection
                   │
                   ▼
    ┌──────────────────────────────────────────────────────┐
    │         USB INKJET PRINTER                           │
    │  • Brother DCP-T720DW with Continuous Ink System     │
    │  • CUPS-compatible drivers                           │
    │  • Automatic paper feed                              │
    └──────────────┬───────────────────────────────────────┘
                   │
                   ▼
    ┌──────────────────────────────────────────────────────┐
    │         PRINTED DOCUMENT                             │
    └──────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│                     LOCAL ADMIN DASHBOARD                       │
└─────────────────────────────────────────────────────────────────┘

    ┌──────────────────────────────────────────────────────┐
    │  Admin Pages (Laravel + Inertia + React)             │
    │  Protected routes with Laravel Fortify auth          │
    │  ┌────────────────────────────────────────────────┐  │
    │  │  • Machine monitoring                          │  │
    │  │  • Transaction reports                         │  │
    │  │  • Revenue analytics                           │  │
    │  │  • Real-time alerts                            │  │
    │  │  • Shared UI components                        │  │
    │  └────────────────────────────────────────────────┘  │
    └──────────────────┬───────────────────────────────────┘
                       │
                       │ Same Laravel Application (Protected Routes)
                       │
                       ▼
    ┌──────────────────────────────────────────────────────┐
    │  Raspberry Pi 4 Kiosk Machine                        │
    │  (MySQL or SQLite Database)                          │
    └──────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│                     DATA FLOW                                   │
└─────────────────────────────────────────────────────────────────┘

  [User] → [Payment] → [Laravel Controllers] → [Print Queue] → [CUPS]
     │                      │                        │            │
     └──────────────────────┴────────────────────────┴────────────┘
                            │
                            ▼
                    [MySQL/SQLite Database]
                            │
                            ▼
                    [Admin Dashboard]
```

**Component Interactions:**

1. **Coin Acceptor ↔ ESP32 ↔ Raspberry Pi**
   - Protocol: Serial communication (UART)
   - Each valid coin (₱1, ₱5, ₱10, ₱20) generates pulse signals
   - ESP32 counts pulses and calculates credits
   - ESP32 sends JSON via UART to Raspberry Pi
   - Laravel PHP service reads from serial port (`/dev/ttyS0`)
   - Credit immediately added to user session

2. **Laravel Backend ↔ CUPS**
   - Protocol: PHP Process facade executing shell commands
   - Job submission via `Process::run('lp -d printer file.pdf')`
   - Status monitoring via `Process::run('lpstat -o')`
   - Job cancellation via `Process::run('cancel job-id')`
   - Printer control (enable/disable queue)

3. **Inertia.js Frontend ↔ Laravel Backend**
   - Protocol: Inertia.js (hybrid SPA/SSR)
   - Automatic CSRF protection
   - Type-safe routing via Wayfinder
   - JSON data exchange
   - Server-side rendering support

4. **Laravel Backend ↔ Database**
   - MySQL 8.0 with Eloquent ORM
   - Development: Docker container (docker-compose.yml)
   - Production: MySQL or SQLite on Raspberry Pi
   - Migrations for schema management
   - Model relationships (User, PrintJob, Transaction)
   - Query builder for complex queries

5. **USB Drive ↔ Raspberry Pi**
   - Protocol: File system monitoring
   - Automatic mount on insertion
   - File system scan for printable files
   - Laravel handles file processing
   - Auto-eject after printing

6. **Admin Dashboard ↔ Laravel**
   - Protocol: Same Laravel application (protected routes)
   - Authentication via Laravel Fortify
   - Session-based authentication
   - Protected routes via auth middleware

---

## 3.2 Workflow

**Modern Upload-First Payment Model:**

```
Step 1: Upload File
   ↓
Step 2: Configure Settings (copies, color mode, duplex)
   ↓
Step 3: View Exact Cost (real-time calculation)
   ↓
Step 4: Insert Coins (exact amount or overpay)
   ↓
Step 5: Print Automatically (no additional confirmation)
   ↓
Step 6: Collect Output (from printer tray)
   ↓
Step 7: Auto-Reset (system cleans state for next user)
```

**Detailed Workflow:**

1. **User inserts USB drive OR connects to WiFi ("PisoPrint_Kiosk") to upload file**
   - Password: "PisoPrint2025"
   - USB: System auto-detects within 1-2 seconds via filesystem monitoring
   - WiFi: User uploads via http://192.168.4.1 web interface

2. **System validates file and displays preview**
   - PDF format validation using Laravel file validation
   - Page count extracted automatically via PDF processing
   - First page preview shown (optional)

3. **User configures print settings**
   - Number of copies (1-100)
   - Color mode: B&W (₱2), Grayscale (₱3), Color (₱5)
   - Double-sided: Yes/No
   - Orientation: Portrait/Landscape

4. **System calculates exact cost in real-time**
   - Formula: `Base Price × Page Count × Copies`
   - Example: 5-page Color, 2 copies = ₱5 × 5 × 2 = ₱50
   - Cost displayed prominently on screen

5. **User reviews cost and taps "Continue" button**
   - System navigates to Payment screen
   - No money spent yet (can still cancel)

6. **User inserts coins into coin slot**
   - Coin acceptor validates each coin (size, weight, metal)
   - ESP32 detects pulse signals (₱1: 1 pulse, ₱5: 5 pulses, ₱10: 10 pulses, ₱20: 20 pulses)
   - ESP32 counts pulses and calculates credit
   - ESP32 sends JSON to Pi via UART (115200 baud):
     ```json
     {"type":"credit_update","amount":5.00,"timestamp":1697200000}
     ```
   - Pi updates payment progress bar on touchscreen (< 300ms)

7. **When payment complete (total paid ≥ required amount)**
   - Success animation plays
   - System waits 2 seconds (user acknowledgment)
   - Auto-navigates to Print Status screen

8. **System submits job to CUPS and monitors progress**
   - Laravel calls `Process::run('lp -d printer file.pdf')`
   - CUPS job ID returned and stored
   - Progress bar updates (simulated for smooth UX)
   - Page counter displays: "Printing page X of Y"
   - PHP polls CUPS status every 2 seconds via `Process::run('lpstat -o')`

9. **Printer outputs pages to output tray**
   - Brother DCP-T720DW prints at ~12 ipm (black) or ~10 ipm (color)
   - Pages come out face-down

10. **System displays "Print Complete!" message**
    - Shows instruction: "Collect pages from output tray"
    - Waits 2 seconds

11. **System automatically cleans up and resets**
    - Temporary files deleted
    - Session state cleared
    - Auto-redirects to Home screen (ready for next user)

**Total Time Estimate:**
- USB 5-page print: ~25-40 seconds
- WiFi 5-page upload + print: ~35-50 seconds

---

**Navigation:**
- [← Previous: System Requirements](02_system_requirements.md)
- [→ Next: System Features](04_system_features.md)
- [↑ Back to Index](README.md)
