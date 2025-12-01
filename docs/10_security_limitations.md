# 10. Security & Limitations

## 10.1 Security

The Piso Print System implements multiple security layers to protect operations and data.

### 10.1.1 Payment Security

**Coin Validation (Hardware Level)**
- Multi-sensor validation (size, weight, metal composition)
- Magnetic signature verification
- Optical detection
- Anti-fraud mechanisms built into coin acceptor

**Credit Tracking**
- All transactions logged with timestamps
- Cryptographic checksums on transaction records
- Balance verification at multiple points
- Audit trail for all credit movements

**Anti-Tampering Measures**
- Pulse debouncing prevents signal injection
- Pulse counting with validation
- Maximum pulse rate limiting
- Anomaly detection (too many pulses too quickly)

### 10.1.2 System Security

**Access Control**
- Admin panel requires authentication (Laravel Fortify)
- Password hashing (bcrypt with Laravel's built-in hashing)
- Session management with timeout (configurable in `config/session.php`)
- Protected admin routes via auth middleware (all authenticated users are admins)

**Network Security**
- Firewall configured (ufw on Raspberry Pi)
- Only necessary ports open:
  - 22 (SSH) - Admin only
  - 80/443 (HTTP/HTTPS) - Local network
  - 631 (CUPS) - Localhost only
- Optional: VPN for remote admin access
- HTTPS with SSL/TLS certificates (via Certbot or Let's Encrypt)

**File Security**
- Uploaded files scanned for malicious content (optional)
- File type validation (Laravel validation rules)
- File size limits enforced (`'file|max:51200'` for 50MB)
- Files stored in Laravel storage (`storage/app/print-jobs/`)
- Automatic deletion after 24 hours (Laravel scheduled task)
- No execution permissions on upload directory

**Database Security**
- SQL injection prevention (Laravel Eloquent ORM and Query Builder)
- Database user has minimal required permissions
- Regular database backups encrypted (optional)
- Database not accessible from network (localhost only)
- Input sanitization via Laravel validation and middleware

**Application Security**
- XSS prevention (Blade template escaping, React JSX escaping)
- CSRF tokens on forms (Laravel built-in CSRF protection)
- Rate limiting on API endpoints (Laravel throttle middleware)
- Input validation on all user inputs (Form Requests)
- Secure session cookies (httpOnly, secure, sameSite flags)

### 10.1.3 Data Privacy

**User Data**
- Minimal data collection (only what's necessary)
- No personal information required for basic use
- Optional user accounts for tracking
- Files deleted after printing (configurable retention)
- Transaction logs anonymized (optional)

**Compliance**
- GDPR-ready architecture (if needed)
- Data retention policies configurable
- Right to be forgotten support
- Data export capabilities

**Logging**
- Logs contain no sensitive information
- IP addresses logged (can be anonymized)
- Admin actions audited
- Log rotation and archival

### 10.1.4 Physical Security

**Hardware Protection**
- Raspberry Pi in locked enclosure
- ESP32 connections protected from tampering
- Coin acceptor in secure housing
- USB ports not externally accessible
- Power supply protected

**Printer Security**
- Printer access restricted
- Paper tray locks available
- Admin panel on printer disabled

## 10.2 Limitations

Understanding system limitations helps set proper expectations and plan for future enhancements.

### 10.2.1 Payment Limitations

**Supports only coin payments (no QR/GCash yet):**
- Current: ₱1, ₱5, ₱10, ₱20 coins only via ALLAN Universal Coinslot 1239 PROMAX Multi-Coin Acceptor
- No digital payment methods (GCash, PayMaya, QR codes)
- Future enhancement: Add bill validator, RFID cards, GCash integration

**Current Limitations:**
- **No change given**: Users must insert exact amount or overpay (no refund)
- **No refunds**: Once coins inserted, cannot be refunded (hardware limitation)
- **Manual collection**: Coins must be physically collected and counted
- **Power loss during payment**: coins forfeited (hardware limitation)
- **Session timeout during payment**: coins forfeited (hardware limitation)

**Impact:**
- Users must have coins available
- Administrator must regularly empty coin box
- Reconciliation requires manual counting

**Future Solutions:**
- Bill validator for larger denominations
- RFID card support for repeat customers
- Digital payment integration (GCash, PayMaya)
- Automatic coin counting machine
- Remote coin box level monitoring

### 10.2.2 Printer Limitations

**Current Limitations:**
- **USB only**: Only supports USB-connected printers in current version
- **Single printer**: One printer per system
- **No duplex detection**: Cannot automatically adjust pricing for 2-sided printing
- **CUPS dependent**: Requires CUPS-compatible printer

**Impact:**
- Limited to printers physically near Raspberry Pi
- Cannot balance load across multiple printers
- Color printing costs same as B&W (loss of revenue)
- Must manually configure duplex printing

**Future Solutions:**
- Network printer support
- Multi-printer load balancing
- Color detection and differential pricing
- Automatic duplex pricing

**Requires CUPS-supported printers:**
- Only works with printers that have CUPS drivers
- Brother DCP-T720DW: Fully supported
- Some printers may require manual driver installation

**Best for local network use, not large-scale cloud printing:**
- Designed for single-location deployment
- No cloud sync or multi-location management
- Future enhancement: Cloud management platform

**Additional Limitations:**
- PDF format only (no Word, Excel, images directly)
- Paper size fixed to Letter (8.5"×11"), A4 not supported
- Single printer per kiosk (no multi-printer load balancing)
- Overpayment not refunded (hardware limitation)

### 10.2.3 File Format Limitations

**Current Limitations:**
- **PDF only**: Only PDF files are supported (native format)
- **No Microsoft Office files**: Word (DOC/DOCX), Excel (XLS/XLSX), PowerPoint (PPT/PPTX) not supported
- **No image files**: JPG, PNG, GIF, BMP not supported as direct print files
- **Size limit**: 50MB maximum file size
- **No automatic conversion**: System does not convert other formats to PDF

**Impact:**
- Users must convert their documents to PDF format before printing
- All non-PDF files will be rejected with error message
- Users need PDF conversion tools on their devices

**Future Solutions:**
- Add automatic document conversion (LibreOffice headless for DOC/DOCX/XLS/XLSX/PPT/PPTX)
- Add support for direct image printing (JPG, PNG) with auto-PDF conversion
- Add support for text files (TXT) with formatting
- Increase file size limit with SSD storage upgrade

### 10.2.4 Network Limitations

**Current Limitations:**
- **Local network only**: Not designed for internet-scale access
- **Single location**: Cannot manage multiple kiosks from central location
- **No cloud sync**: Data stays local
- **Wi-Fi range**: Users must be within Wi-Fi range

**Impact:**
- Cannot deploy across multiple locations easily
- No remote monitoring from home/office
- Cannot aggregate data from multiple machines
- Users need to be physically present

**Future Solutions:**
- Cloud-based management platform
- Multi-location dashboard
- Remote monitoring and control
- Mobile app with cloud sync

### 10.2.5 Scalability Limitations

**Current Limitations:**
- **Hardware constraints**: Raspberry Pi has limited CPU/RAM
- **Storage**: microSD card limited capacity and speed
- **Single queue**: One print queue for all jobs

**Impact:**
- May slow down with many concurrent users (>10)
- Large file processing can slow system
- Disk may fill with logs and files
- Peak times may have delays

**Future Solutions:**
- Upgrade to more powerful SBC (Orange Pi, etc.)
- Use SSD instead of microSD
- Implement job prioritization
- Add more RAM to Raspberry Pi

### 10.2.6 User Experience Limitations

**Current Limitations:**
- **Web-based only**: No mobile app
- **No document preview**: Cannot preview before printing (optional feature)
- **No print history**: History cleared on browser close
- **No user accounts**: Anonymous use only (optional feature)
- **English only**: No multi-language support yet

**Impact:**
- Less convenient than dedicated app
- Users may print wrong document
- Cannot track individual usage easily
- Not accessible to non-English speakers

**Future Solutions:**
- Develop mobile app (Android/iOS)
- Add document preview feature
- Implement optional user accounts
- Add multi-language support (Filipino, Spanish, etc.)

### 10.2.7 Maintenance Limitations

**Current Limitations:**
- **Manual paper refill**: No automatic paper loading
- **Manual coin collection**: Must physically empty coin box
- **No predictive maintenance**: Cannot predict when printer parts will fail
- **Local administration**: Must be physically present for most tasks

**Impact:**
- Requires regular on-site visits
- Downtime if paper runs out during off-hours
- Unexpected printer failures
- Cannot fix issues remotely

**Future Solutions:**
- Low paper alerts via SMS/email
- Remote diagnostic capabilities
- Predictive maintenance based on usage
- Automatic notifications system

### 10.2.8 Regulatory Limitations

**Current Limitations:**
- **No receipt generation**: No official receipt for payment
- **No BIR integration**: Not integrated with tax systems
- **No proper POS**: Not a registered Point of Sale system

**Impact:**
- Cannot be used in businesses requiring official receipts
- May not comply with tax regulations for commercial use
- Limited to informal/educational settings

**Future Solutions:**
- Add receipt printer
- BIR POS accreditation (for commercial use)
- Proper accounting system integration

## 10.3 Risk Assessment

| **Risk** | **Likelihood** | **Impact** | **Mitigation** |
|----------|---------------|-----------|----------------|
| Coin acceptor failure | Medium | High | Keep spare acceptor, regular cleaning |
| Printer paper jam | High | Low | User can clear, admin alerted |
| Power outage | Medium | Medium | UPS backup, transaction logging |
| Network connectivity loss | Low | Medium | Local caching, queue persistence |
| Raspberry Pi failure | Low | High | Regular backups, spare Pi ready |
| Security breach | Low | High | Regular updates, firewall, monitoring |
| Database corruption | Low | High | Daily backups, transaction logs |
| User error | High | Low | Clear instructions, error prevention |

---

**Navigation:**
- [← Previous: Testing & Validation](09_testing_validation.md)
- [→ Next: Future Enhancements](11_future_enhancements.md)
- [↑ Back to Index](README.md)
