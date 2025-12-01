# 5. Database Design

The Piso Print System uses MySQL 8.0 as its primary database for production deployments. SQLite 3.35+ can optionally be used for development/testing environments.

**Development Environment:** MySQL 8.0 runs in Docker via Docker Compose for easy setup and isolation.

**Production Environment:** MySQL 8.0 recommended for production; SQLite 3.35+ can be used for lightweight single-kiosk deployments.

## Payment Model

**Session-Based Balance with Database Tracking:**

The system uses a hybrid approach that combines session-based payment with database persistence for audit trails. This is a **per-job payment model** where users pay for each print job individually:

1. **User Balance Field**: Tracks credits in database (`users.balance`)
2. **Session Tracking**: Links kiosk session to user record (guest or authenticated)
3. **Temporary Storage**: Balance persists only during active session
4. **Auto-Reset**: Balance resets to ₱0.00 after successful print job completion
5. **Transaction Log**: All coin insertions and deductions logged in `transactions` table
6. **Audit Trail**: Complete financial history maintained for accounting

**How It Works:**
```
1. User starts session → Guest user record (ID=1) or new session user
2. Coins inserted → Balance increases (₱1, ₱5, ₱10, or ₱20)
3. Sufficient balance → Print job created and submitted to CUPS
4. Print complete → Balance reset to ₱0.00
5. Transaction logged → Permanent audit trail maintained
```

**Why This Model:**
- ✅ Database tracking for financial audit compliance
- ✅ Session isolation (each user gets clean slate)
- ✅ No persistent balances across sessions (prevents fraud) - **per-job payment only**
- ✅ Complete transaction history for accounting
- ✅ Simple for users (pay exactly what's needed, no leftover credits)

## 5.1 Users Table

Stores information about system users with two-factor authentication support and session balance tracking.

**Table Name:** `users`

| **Field Name** | **Data Type** | **Constraints** | **Description** |
|----------------|---------------|-----------------|-----------------|
| id | BIGINT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT | Unique identifier for each user |
| name | VARCHAR(255) | NOT NULL | User's full name |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User's email address |
| email_verified_at | TIMESTAMP | NULL | Email verification timestamp |
| password | VARCHAR(255) | NOT NULL | Hashed password |
| two_factor_secret | TEXT | NULL | Two-factor authentication secret |
| two_factor_recovery_codes | TEXT | NULL | Recovery codes for 2FA |
| two_factor_confirmed_at | TIMESTAMP | NULL | 2FA confirmation timestamp |
| balance | DECIMAL(10,2) | NOT NULL, DEFAULT 0.00 | Current session credit balance (resets after print) |
| last_active | TIMESTAMP | NULL | Last activity timestamp |
| remember_token | VARCHAR(100) | NULL | Remember me token |
| created_at | TIMESTAMP | NULL | Account creation date |
| updated_at | TIMESTAMP | NULL | Last update timestamp |

**SQL Creation Statement:**
```sql
CREATE TABLE users (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified_at TIMESTAMP NULL,
    password VARCHAR(255) NOT NULL,
    two_factor_secret TEXT NULL,
    two_factor_recovery_codes TEXT NULL,
    two_factor_confirmed_at TIMESTAMP NULL,
    balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    last_active TIMESTAMP NULL,
    remember_token VARCHAR(100) NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    INDEX idx_users_email (email),
    INDEX idx_users_balance (balance),
    INDEX idx_users_last_active (last_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Payment Model:**
- **Session-based**: Balance tracks current session's credits
- **Temporary**: Balance resets to 0.00 after successful print job
- **Audit Trail**: All transactions logged in `transactions` table
- **Anonymous Users**: Guest sessions use special user ID (e.g., ID=1)
- **Admin Users**: Authenticated staff have accounts but don't use balance for printing

**Sample Data:**
| id | name | email | balance | last_active |
|--------|------|------|---------|-------------|
| 1 | Guest Session | guest@pisoprint.local | 5.00 | 2025-10-29 10:30:00 |
| 2 | Admin User | admin@pisoprint.local | 0.00 | 2025-10-29 05:42:17 |
| 3 | John Doe | john@example.com | 0.00 | 2025-10-29 10:15:00 |

## 5.2 PrintJobs Table

Records all print jobs submitted to the system.

**Table Name:** `print_jobs`

| **Field Name** | **Data Type** | **Constraints** | **Description** |
|----------------|---------------|-----------------|-----------------|
| id | BIGINT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT | Unique print job identifier |
| user_id | BIGINT UNSIGNED | FOREIGN KEY REFERENCES users(id) | User who submitted the job |
| file_name | VARCHAR(255) | NOT NULL | Original filename |
| file_path | VARCHAR(500) | NOT NULL | Server path to uploaded file |
| file_size | BIGINT | NOT NULL | File size in bytes |
| file_type | VARCHAR(50) | NOT NULL | File MIME type or extension |
| pages | INTEGER | NOT NULL | Number of pages to print |
| cost | DECIMAL(10,2) | NOT NULL | Total cost for the print job |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'pending' | Job status: **pending** (submitted to CUPS, in print queue awaiting printer), **processing** (preparing job for printing), **printing** (actively printing), **completed** (successfully printed), **failed** (error occurred), **cancelled** (user/admin cancelled). **Note:** Jobs only enter database after payment complete; all statuses refer to CUPS print queue states. |
| priority | INTEGER | DEFAULT 0 | Job priority (higher = more urgent) |
| created_at | TIMESTAMP | NULL | Job submission timestamp |
| updated_at | TIMESTAMP | NULL | Last update timestamp |
| started_at | TIMESTAMP | NULL | When printing started |
| completed_at | TIMESTAMP | NULL | When printing finished |
| error_message | TEXT | NULL | Error details if job failed |
| printer_name | VARCHAR(100) | NULL | Printer used for the job |
| cups_job_id | INTEGER | NULL | CUPS system job ID |
| color_mode | VARCHAR(20) | DEFAULT 'grayscale' | Print mode: grayscale, color |
| paper_size | VARCHAR(20) | DEFAULT 'Letter' | Paper size: Letter (8.5" × 11") - fixed |
| orientation | VARCHAR(20) | DEFAULT 'portrait' | Page orientation |
| copies | INTEGER | DEFAULT 1 | Number of copies |

**SQL Creation Statement:**
```sql
CREATE TABLE print_jobs (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    pages INT NOT NULL,
    cost DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    priority INT DEFAULT 0,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    error_message TEXT NULL,
    printer_name VARCHAR(100) NULL,
    cups_job_id INT NULL,
    color_mode VARCHAR(20) DEFAULT 'grayscale',
    paper_size VARCHAR(20) DEFAULT 'Letter',
    orientation VARCHAR(20) DEFAULT 'portrait',
    copies INT DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_print_jobs_user_id (user_id),
    INDEX idx_print_jobs_status (status),
    INDEX idx_print_jobs_created_at (created_at),
    INDEX idx_print_jobs_cups_job_id (cups_job_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Sample Data:**
| id | user_id | file_name | pages | cost | status | color_mode |
|-------|--------|----------|-------|------|---------|------------|
| 1 | 1 | document.pdf | 5 | 10.00 | completed | B&W (5 × ₱2) |
| 2 | 1 | report.pdf | 10 | 30.00 | printing | Grayscale (10 × ₱3) |
| 3 | 2 | invoice.pdf | 1 | 5.00 | completed | Color (1 × ₱5) |
| 4 | 1 | thesis.pdf | 25 | 50.00 | pending | B&W (25 × ₱2) |

## 5.3 Transactions Table

Logs all coin insertions and credit transactions.

**Table Name:** `transactions`

| **Field Name** | **Data Type** | **Constraints** | **Description** |
|----------------|---------------|-----------------|-----------------|
| id | BIGINT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT | Unique transaction identifier |
| user_id | BIGINT UNSIGNED | FOREIGN KEY REFERENCES users(id) | User associated with transaction |
| transaction_type | VARCHAR(20) | NOT NULL | Type: 'coin_insert', 'print_deduct', 'admin_add' |
| amount | DECIMAL(10,2) | NOT NULL | Transaction amount (positive for credit, negative for deduction) |
| balance_before | DECIMAL(10,2) | NOT NULL | Balance before transaction |
| balance_after | DECIMAL(10,2) | NOT NULL | Balance after transaction |
| print_job_id | BIGINT UNSIGNED | NULL, FOREIGN KEY REFERENCES print_jobs(id) | Associated print job (if applicable) |
| coin_count | INTEGER | NULL | Number of coins inserted (for coin_insert type) |
| coin_value | DECIMAL(10,2) | NULL | Value per coin (₱1, ₱5, ₱10, or ₱20) |
| description | VARCHAR(255) | NULL | Additional transaction details |
| session_id | VARCHAR(100) | NULL | User session identifier |
| esp32_id | VARCHAR(50) | NULL | ESP32 device identifier |
| is_verified | BOOLEAN | DEFAULT TRUE | Transaction verification status |
| created_at | TIMESTAMP | NULL | Transaction timestamp |
| updated_at | TIMESTAMP | NULL | Last update timestamp |

**SQL Creation Statement:**
```sql
CREATE TABLE transactions (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    transaction_type VARCHAR(20) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    balance_before DECIMAL(10,2) NOT NULL,
    balance_after DECIMAL(10,2) NOT NULL,
    print_job_id BIGINT UNSIGNED NULL,
    coin_count INT NULL,
    coin_value DECIMAL(10,2) NULL,
    description VARCHAR(255) NULL,
    session_id VARCHAR(100) NULL,
    esp32_id VARCHAR(50) NULL,
    is_verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (print_job_id) REFERENCES print_jobs(id) ON DELETE SET NULL,
    INDEX idx_transactions_user_id (user_id),
    INDEX idx_transactions_type (transaction_type),
    INDEX idx_transactions_created_at (created_at),
    INDEX idx_transactions_session_id (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Sample Data:**
| id | user_id | transaction_type | amount | balance_before | balance_after | created_at |
|------|--------|----------------|--------|---------------|--------------|----------|
| 1 | 1 | coin_insert | 5.00 | 0.00 | 5.00 | 2025-10-29 10:00:00 |
| 2 | 1 | coin_insert | 5.00 | 5.00 | 10.00 | 2025-10-29 10:00:15 |
| 3 | 1 | print_deduct | -10.00 | 10.00 | 0.00 | 2025-10-29 10:01:30 |
| 4 | 1 | coin_insert | 10.00 | 0.00 | 10.00 | 2025-10-29 11:15:00 |
| 5 | 1 | coin_insert | 20.00 | 10.00 | 30.00 | 2025-10-29 11:15:30 |
| 6 | 1 | print_deduct | -30.00 | 30.00 | 0.00 | 2025-10-29 11:16:45 |

## 5.4 Additional Tables (Optional)

**SystemLogs Table** - For system event logging:
```sql
CREATE TABLE system_logs (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    log_level VARCHAR(20) NOT NULL, -- INFO, WARNING, ERROR, CRITICAL
    message TEXT NOT NULL,
    component VARCHAR(50) NULL, -- ESP32, PrintManager, WebServer, etc.
    user_id BIGINT UNSIGNED NULL,
    print_job_id BIGINT UNSIGNED NULL,
    additional_data JSON NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (print_job_id) REFERENCES print_jobs(id) ON DELETE SET NULL,
    INDEX idx_system_logs_log_level (log_level),
    INDEX idx_system_logs_created_at (created_at),
    INDEX idx_system_logs_component (component)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**PrinterStatus Table** - For printer health monitoring:
```sql
CREATE TABLE printer_status (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    printer_name VARCHAR(100) NOT NULL,
    is_online BOOLEAN NOT NULL,
    paper_level VARCHAR(20) NULL, -- full, medium, low, empty
    ink_level VARCHAR(20) NULL,
    error_state TEXT NULL,
    total_pages_printed INT DEFAULT 0,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    INDEX idx_printer_status_printer_name (printer_name),
    INDEX idx_printer_status_updated_at (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## 5.5 Database Relationships

```
users (1) ─────< (many) print_jobs
  │
  └──────────< (many) transactions

print_jobs (1) ─────< (many) transactions
               (via print_job_id)

Relationships:
• One user can have many print jobs
• One user can have many transactions
• One print job can have multiple transactions (coin insertions, final deduction on print)
```

## 5.6 Database Maintenance

**Docker Development Setup:**
```bash
# Start MySQL container
docker-compose up -d

# Run migrations
php artisan migrate

# Fresh migration (drop all tables and re-run)
php artisan migrate:fresh

# Seed database
php artisan db:seed

# Access MySQL CLI
docker-compose exec mysql mysql -u laravel -p piso_print
# Password: secret

# Backup database
docker-compose exec mysql mysqldump -u laravel -p piso_print > backup.sql

# Restore database
docker-compose exec -T mysql mysql -u laravel -p piso_print < backup.sql
```

**Production Backup Strategy:**
- Daily automatic backups at off-peak hours (2:00 AM)
- Retention: 30 days of daily backups
- Weekly full backups retained for 6 months
- Backup location: External storage or cloud

**Cleanup Procedures:**
- Delete print job files older than 7 days
- Archive transactions older than 1 year
- Compress old logs monthly
- Optimize tables weekly with `OPTIMIZE TABLE` command
- Analyze tables for query optimization

---

**Navigation:**
- [← Previous: System Features](04_system_features.md)
- [→ Next: System Modules](06_system_modules.md)
- [↑ Back to Index](README.md)
