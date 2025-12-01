# 1. Introduction

## 1.1 System Overview

The Piso Print System is a **coin-operated document printing solution** that allows users to print files using a modern **upload-first, pay-after-preview** workflow. It uses an ESP32 microcontroller connected to a multi-coin acceptor (₱1, ₱5, ₱10, ₱20) to detect payments and a Raspberry Pi 4 as the print server. The Pi manages print jobs using CUPS (Common Unix Printing System) and processes jobs immediately after sufficient payment is received.

**Key Components:**
- **ESP32 Microcontroller**: Detects coin insertions via pulse counting from ALLAN Universal Coinslot 1239 PROMAX multi-coin acceptor
- **Raspberry Pi 4**: Acts as web server running Laravel 12, Nginx, and MySQL database
- **7" LAFVIN Touchscreen IPS DSI Display**: Displays web-based kiosk UI (Laravel + Inertia + React 19 + TypeScript)
- **Brother DCP-T720DW Printer**: USB-connected inkjet with CISS (Continuous Ink Supply System)
- **WiFi Hotspot**: Built-in access point for file uploads from phones/laptops

**Modern Workflow:**
```
Upload File → Configure Settings → View Exact Cost → Insert Coins → Print Automatically
```

## 1.2 Objective / Purpose

This system provides an affordable, self-service printing solution for schools, libraries, and small businesses where users pay per page without requiring staff assistance.

- **Reduce operational costs** by eliminating dedicated staff for printing services
- **Provide 24/7 availability** without human supervision
- **Ensure transparent pricing** by showing exact costs before payment
- **Simplify user experience** with intuitive touchscreen interface
- **Track usage accurately** for accounting and maintenance
- **Enhance user trust** through pay-after-preview model (no blind payments)
- **Support multiple input methods** (USB drives and WiFi uploads)

## 1.3 Scope

**Hardware Scope:**
- Supports USB inkjet printers connected to Raspberry Pi 4 (Brother DCP-T720DW)
- Accepts ₱1, ₱5, ₱10, and ₱20 Philippine peso coins via ALLAN Universal Coinslot 1239 PROMAX multi-coin acceptor
- 7" LAFVIN Touchscreen IPS DSI Display for user interface
- ESP32 microcontroller for coin detection and UART communication

**Software Scope:**
- **Backend**: Laravel 12 (PHP 8.3) with Inertia.js adapter
- **Frontend**: React 19 + TypeScript + Tailwind CSS 4
- **File upload methods**: USB drive (plug-and-print) and WiFi upload (phone/laptop)
- **Dynamic pricing**: ₱2 (B&W), ₱3 (Grayscale), ₱5 (Color) per page
- Tracks credits via per-job payment model (no persistent balances)
- Logs all transactions to MySQL database
- **Supported file format**: PDF only
- Web-based admin dashboard using Laravel + Inertia + React
- Real-time payment progress tracking on touchscreen
- Automatic session reset after job completion

**Feature Scope:**
- Document preview before printing (optional)
- Real-time system monitoring and alerts
- Remote administration capabilities
- Automatic error notifications (low paper, ink, jams)
- Session isolation with 5-minute idle timeout

**Authentication Model:**
- **Public Kiosk**: No login required for printing services (anonymous/guest sessions)
- **Admin Dashboard**: Protected routes requiring authentication (Laravel Fortify with 2FA)
- **Simple Access Control**: Binary authentication model - users are either guests (anonymous) or authenticated admins with full access (no role hierarchy or permission levels)
- **Session Management**: Anonymous sessions expire after 5 minutes of inactivity

## 1.4 Intended Audience

**End-users:**
- Students who need affordable printing services
- Library patrons requiring self-service document printing
- Customers in internet cafes and business centers
- Anyone who needs convenient, pay-per-use printing without staff assistance

**Administrators:**
- System operators responsible for day-to-day maintenance
- Technical staff managing printer setup and configuration
- Business owners monitoring usage and revenue
- IT personnel troubleshooting system issues

**Developers:**
- Software developers implementing or modifying the system
- Hardware engineers integrating additional components
- Technical consultants deploying the system in new locations

**Stakeholders:**
- School administrators evaluating the system for campus deployment
- Business owners considering investment in automated printing services
- Project sponsors reviewing system capabilities and limitations