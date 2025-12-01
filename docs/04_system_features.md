# 4. System Features

[← Back to Index](README.md)

**Core Features:**

## 4.1 Payment & Credit Management

**Coin-operated credit system**
- **Dynamic pricing**: ₱2 (B&W), ₱3 (Grayscale), ₱5 (Color) per page
- Accepts ₱1, ₱5, ₱10, ₱20 coins via ALLAN Universal Coinslot 1239 PROMAX Multi-Coin Acceptor
- Real-time payment tracking on LAFVIN 7 Inch Touchscreen IPS DSI Display
- Per-job payment model (no persistent balances between users)

**LAFVIN 7 Inch Touchscreen IPS DSI Display**
- LAFVIN 7 Inch Touchscreen IPS DSI Display (800×480)
- Web-based kiosk UI (Laravel 12 + Inertia.js + React 19 + TypeScript)
- Large touch-friendly buttons
- Visual 3-step guide: Upload → Preview → Pay
- Real-time payment progress tracking
- Session management with 5-minute idle timeout

**Dual file input methods**
- **USB drive**: Plug-and-print (auto-detect within 1-2 seconds)
- **WiFi upload**: Connect to "PisoPrint_Kiosk" hotspot (Password: PisoPrint2025), upload via http://192.168.4.1

**Modern user workflow**
- Upload first, see cost, then pay (transparent pricing)
- No blind payments (users know exact cost before inserting coins)
- Real-time cost calculation when settings change

**Pricing System**
- Dynamic pricing by print mode:
  - Black & White: ₱2 per page
  - Grayscale: ₱3 per page
  - Color: ₱5 per page
- Automatic cost calculation: `basePrice × pageCount × copies`
- Configurable pricing in admin settings

## 4.2 Document Management

**File Format Support**
- **PDF only**: Native support, fastest processing
- All documents must be in PDF format

**File Upload Methods**

*Method 1: USB Drive (Auto-Detection)*
- ✅ Insert USB flash drive into kiosk USB port
- ✅ System auto-detects drive and copies PDF files to storage
- ✅ Notification appears on home screen when files are ready
- ⚙️ File browser in kiosk UI (in development)
- **Current Status**: USB detection works, but files appear as "pending upload" notification instead of browseable list
- **Recommended**: Use WiFi upload for best user experience

*Method 2: WiFi Upload (Phone/Laptop)* ✅ **Fully Functional**
- Connect to WiFi hotspot: "PisoPrint_Kiosk" (Password: PisoPrint2025)
- Open browser and navigate to http://192.168.4.1/mobile/upload
- Web-based upload interface with drag-and-drop
- Progress indicator during upload
- File size limit: 50MB maximum
- Upload confirmation shows page count and cost
- Files automatically appear on kiosk screen

**Document Processing**
- PDF format validation
- Page count detection
- Document preview (optional)
- Print settings: orientation (paper size fixed to Letter 8.5" × 11")
- Quality settings: draft, normal, high
- Duplex printing support (if printer capable)

## 4.3 Print Job Processing

**Immediate Submission After Payment**
- Jobs are **only created after full payment received** (per-job payment model)
- No job holding or queue management at application level
- Direct submission to CUPS for immediate printing after payment complete
- Real-time status monitoring (2-second polling)
- Automatic session cleanup after completion

**CUPS Internal Queue**
- CUPS manages its own internal print queue (system-level, not application-level)
- Application does not hold or queue jobs waiting for payment
- Jobs enter CUPS queue only after payment complete
- Status tracking: processing → printing → completed/failed
- CUPS handles printer-level queuing (multiple jobs to same printer)

**Job Monitoring**
- Real-time status updates displayed on touchscreen
- Print progress percentage display (0-100%)
- Current page number shown (e.g., "Printing page 3 of 10")
- Estimated time to completion based on printer speed
- Visual indicators: animated printer icon, progress bar

**CUPS Integration**
- Direct integration with CUPS print server via Laravel Process facade
- `Process::run("lp -d {$printer} {$file}")` - Submit job to printer after payment
- `Process::run("lpstat -o")` - Monitor active print jobs
- `Process::run("cancel {$jobId}")` - Cancel job (admin only or user during printing)
- Printer status monitoring (online, offline, paper jam, low paper)
- Error detection and automatic logging
- Built-in error handling with `$result->failed()` checks

**Error Handling**
- Paper jam detection → pause and notify admin
- Out of paper → pause and notify admin
- Printer offline → display error, queue job for retry
- Print failure → automatic session cleanup and error logging
- No credit deduction if print fails before starting

## 4.4 User Interface

**Web-Based Interface**
- Responsive design (mobile, tablet, desktop)
- Intuitive navigation
- Real-time balance display
- File upload with preview
- Print history view
- Current job status
- Simple, clean layout

**User Features**
- No login required for basic use
- Session-based tracking (optional user accounts)
- Print history for session
- Cancel active jobs (while printing)
- View payment progress
- Help and instructions page

**Accessibility**
- High contrast mode
- Large fonts option
- Keyboard navigation
- Screen reader compatible
- Multi-language support (future)

## 4.5 Administrative Features

**Admin Dashboard**
- System status overview
- Printer status and health
- Current queue view
- Revenue statistics
- Usage reports
- User activity logs

**Configuration Management**
- Pricing configuration
- Coin denomination settings
- File size limits
- Supported formats
- Print quality defaults
- System maintenance mode

**Reporting & Analytics**
- Daily/weekly/monthly reports
- Coin transaction logs
- Print job history
- Revenue tracking
- Document print frequency
- Peak usage times
- Error frequency analysis

**Maintenance Tools**
- Remote system restart
- CUPS service management
- Database backup/restore
- Log file management
- Printer test page
- System diagnostics

## 4.6 Security Features

**Payment Security**
- Coin validation (hardware-level)
- Anti-fraud pulse detection
- Credit tampering prevention
- Secure transaction logging
- Balance verification

**System Security**
- Admin password protection
- Secure file upload (virus scanning optional)
- File type validation
- Input sanitization
- SQL injection prevention
- XSS attack prevention

**Data Privacy**
- Automatic file deletion after printing
- Configurable retention period
- Encrypted database (optional)
- No personal data collection
- GDPR-compliant (if needed)

## 4.7 Reliability Features

**Error Handling**
- Automatic retry on network errors
- Graceful printer error handling
- Job recovery after power loss
- Database corruption recovery
- Automatic service restart

**Monitoring & Alerts**
- Low paper alerts
- Low ink/toner alerts
- Printer offline detection
- High error rate detection
- System health monitoring
- Email/SMS alerts (optional)

**Backup & Recovery**
- Automated database backups
- Configuration file backups
- Transaction log backups
- Quick restore procedures
- Disaster recovery plan

## 4.8 Performance Optimization

**Speed Optimizations**
- Fast PDF processing
- Efficient page counting
- Optimized file uploads
- Minimal latency in credit updates
- Quick print job submission

**Resource Management**
- Memory usage optimization
- CPU usage monitoring
- Disk space management
- Automatic temp file cleanup
- Connection pooling

---

**Navigation:**
- [← Previous: System Architecture](03_system_architecture.md)
- [→ Next: Database Design](05_database_design.md)
- [↑ Back to Index](README.md)
