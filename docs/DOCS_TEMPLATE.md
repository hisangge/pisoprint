 


# Piso Print System using CUPS and Raspberry Pi

**Date:** October 2025  
**Prepared by:** Christian Cabrera

---

## Table of Contents

1. [Introduction](#introduction)
   - [System Overview](#system-overview)
   - [Objective / Purpose](#objective--purpose)
   - [Scope](#scope)
   - [Intended Audience](#intended-audience)
2. [System Requirements](#system-requirements)
   - [Hardware Requirements](#hardware-requirements)
   - [Software Requirements](#software-requirements)
3. [System Architecture](#system-architecture)
4. [System Features](#system-features)
5. [Database Design](#database-design)
6. [System Modules](#system-modules)
7. [User Guide](#user-guide)
   - [For Users](#for-users)
   - [For Administrators](#for-administrators)
8. [System Flow](#system-flow)
9. [Testing & Validation](#testing--validation)
10. [Security & Limitations](#security--limitations)
11. [Future Enhancements](#future-enhancements)
12. [Appendices](#appendices)
13. [General Guidelines](#general-guidelines)

---

## 1. Introduction

### System Overview

The Piso Print System is a coin-operated document printing solution that allows users to print files by inserting coins. It uses an ESP32 microcontroller connected to a coin acceptor to detect payments and a Raspberry Pi/Orange Pi as the print server. The Pi manages print jobs using the CUPS (Common Unix Printing System) and only releases jobs when the user has sufficient credits.

> **Note:** Atleast 15 words with supporting articles/research.

### Objective / Purpose

This system provides an affordable, self-service printing solution for schools, libraries, and small businesses where users pay per page without requiring staff assistance.

> **Note:** Must be itemized.

### Scope

- Supports USB printers connected to Raspberry Pi/Orange Pi.
- Accepts ₱1 coins (can be configured for other denominations).
- Provides a simple web-based interface for uploading and printing files.
- Tracks credits and deducts them per printed page.
- Logs coin transactions and print jobs.

### Intended Audience

- **End-users:** Students, customers, or anyone who needs on-demand printing.
- **Administrators:** System operators managing printers, logs, and reports.

---

## 2. System Requirements

### Hardware Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| Raspberry Pi 4 / Orange Pi equivalent | 2GB RAM, 32GB Class 10 MMC | 4GB RAM, 64GB Class 10 MMC |
| ESP32 microcontroller | specify | specify |
| Programmable Coin Acceptor (set for ₱1 coin) | specify | specify |
| USB or Wi-Fi printer (CUPS-supported) | Epson L120 | Epson M1120 |
| Power supply (5V for Pi, 12V for coin acceptor) | specify | specify |
| Display for credits | 16 × 2 LCD Display panel | 16 × 4 LCD Display panel |

### Software Requirements

| Software | Minimum | Recommended |
|----------|---------|-------------|
| Raspberry Pi OS / Armbian | specify | specify |
| Python 3 or Node.js (credit-check daemon) | specify | specify |
| CUPS (Common Unix Printing System) | specify | specify |
| ESP32 firmware (Arduino/ESP-IDF) | specify | specify |
| Web server (Express.js or Flask) for file uploads | specify | specify |

---

## 3. System Architecture

```
+-----------+       +------------+        +-----------+
|  Coin     | ----> |   ESP32    | <----> | Raspberry |
| Acceptor  |       | (Credits)  |        | Pi/Orange |
+-----------+       +------------+        +-----------+
                                               |
                                               v
                                           +---------+
                                           | Printer |
                                           +---------+
```

### Workflow:

1. User inserts coin → ESP32 detects → sends credits to Pi.
2. User uploads file via Pi web interface.
3. Pi checks available credits vs. pages.
4. If sufficient → release print job via CUPS.
5. Credits deducted.

> **Note:** Add system overview image  
> **Note:** Add further discussion here

---

## 4. System Features

- Coin-operated credit system (₱1 per page).
- Web interface for document upload.
- Automatic credit deduction per page.
- Printing restricted until sufficient credits are inserted.
- Admin reporting for print jobs and coin logs.

> **Note:** Add discussion

---

## 5. Database Design

### Table: Users

| UserID | Name | Role | Balance |
|--------|------|------|---------|
|        |      |      |         |

### Table: PrintJobs

| JobID | UserID | FileName | Pages | Cost | Status |
|-------|--------|----------|-------|------|--------|
|       |        |          |       |      |        |

### Table: Transactions

| TxID | UserID | CoinInserted | DateTime |
|------|--------|--------------|----------|
|      |        |              |          |

> **Note:** Make sure in table formats, add discussion for each tables/relationships

---

## 6. System Modules

### 1. Coin Module (ESP32)
- Detects coin insertion via pulse input.
- Updates balance and sends to Pi via Serial/Wi-Fi.

### 2. Communication Module
- ESP32 ↔ Pi using Serial (UART) or Wi-Fi (MQTT/HTTP).

### 3. Print Manager (Pi)
- Holds pending jobs until credits are enough.
- Uses CUPS commands (`cupsdisable`, `cupsenable`, `cancel`).

### 4. Web UI Module
- Users upload documents.
- Displays balance, file status, and cost.

### 5. Admin Panel
- Manage pricing, view reports, reset balances.

> **Note:** Discuss each modules

---

## 7. User Guide

### For Users

1. Insert ₱1 coin in slot.
2. Go to the provided Wi-Fi/web interface.
3. Upload file (PDF/DOC/DOCX/Images).
4. Check page count and required credits.
5. If credits are enough → job prints.
6. If not → insert more coins.

### For Administrators

- Start system: boot Pi, connect printer.
- Check coin and print logs.
- Update print price if needed.
- Perform maintenance on printer.

---

## 8. System Flow

### Use Case (User)

- **Actor:** User
- **Goal:** Print file using coins
- **Flow:** Insert coin → Upload file → System checks → Print

### Flowchart

```
[Insert Coin] --> [ESP32 detects credit] --> [Pi updates balance] 
      |
      v
[Upload File] --> [Check Pages vs Balance]
      | Yes
      v
[Release Print Job] --> [Deduct Credits] --> [Print Complete]
      |
      No
      v
[Wait for more coins]
```

---

## 9. Testing & Validation

- **Test 1:** Insert ₱1, upload 1-page PDF → Should print.
- **Test 2:** Insert ₱1, upload 3-page PDF → Should wait until ₱3 inserted.
- **Test 3:** Invalid coin → No credit added.
- **Test 4:** Power interruption → Balance resets/logs checked.

> **Note:** Add discussion

---

## 10. Security & Limitations

### Security

- Print jobs held until paid.
- Printer disabled when no credits.
- Admin login for system settings.

### Limitations

- Supports only coin payments (no QR/GCash yet).
- Requires CUPS-supported printers.
- Best for local network use, not large-scale cloud printing.

---

## 11. Future Enhancements

- QR Code / GCash / PayMaya integration.
- Multi-printer support.
- Touchscreen kiosk UI.
- Remote monitoring and SMS/email alerts.

> **Note:** Discuss why this will be addressed as future enhancements.

---

## 12. Appendices

- ESP32 sample code for coin detection.
- Pi script for CUPS integration.
- Coin acceptor configuration guide.

---

## 13. General Guidelines

- **Font size:** 12pt, Arial Narrow, normal spacing
- **Title font:** 40pt, Arial Narrow Bold
- **Margin:** 2.54 cm (1 inch) all aspects
- **Paper size:** 8.5" × 13" (Legal)
