# 9. Testing & Validation

Comprehensive testing ensures the Piso Print System operates reliably and meets all requirements.

## 9.1 Test Categories

### 9.1.1 Unit Testing

**ESP32 Coin Detection Module:**
- Test pulse detection accuracy
- Verify debounce timing (30ms threshold)
- Test credit calculation logic
- Verify Serial UART communication to Raspberry Pi
- Test heartbeat/status monitoring

**Print Manager Service (Laravel):**
- Test payment completion checking with Pest tests
- Verify per-job payment calculations
- Test immediate CUPS job submission (no queue holding)
- Verify Laravel Process facade command execution
- Test error handling and exceptions
- Example test structure:
  ```php
  test('print job submitted after payment complete', function () {
      $user = User::factory()->create(['balance' => 20]);
      $job = app(PrintJobManager::class)->submitJob(
          userId: $user->id,
          filePath: storage_path('test.pdf'),
          pages: 5,
          options: ['color_mode' => 'bw'],
          paymentComplete: true
      );
      expect($job->status)->toBe('printing');
  });
  ```

**Web Application (Laravel + Inertia):**
- Test file upload validation with Feature tests
- Verify API endpoint responses
- Test Inertia route rendering
- Verify database operations with Eloquent
- Test authentication (Laravel Fortify)

### 9.1.2 Integration Testing

**Test 1: Basic Print Flow (Upload-First Model)**
- **Objective**: Verify complete workflow from upload to printed output
- **Steps**:
  1. Insert USB with 1-page PDF
  2. Configure: B&W, 1 copy
  3. System calculates cost: ₱2
  4. Insert ₱1 + ₱1 coins
  5. Payment complete → auto-proceed
  6. Job prints successfully
- **Expected Result**: Should print within 30 seconds
- **Status**: [ ] Pass / [ ] Fail

**Test 2: Cost Adjustment Before Payment**
- **Objective**: Verify user can change settings to reduce cost
- **Steps**:
  1. Upload 10-page PDF
  2. Select Color mode → cost = ₱50
  3. Change to Grayscale → cost = ₱30
  4. Change to B&W → cost = ₱20
  5. User satisfied, proceeds to payment
- **Expected Result**: Cost updates instantly, no payment until satisfied
- **Status**: [ ] Pass / [ ] Fail

**Test 3: PDF File Validation**
- **Objective**: Verify PDF file format validation
- **Steps**:
  1. Test valid PDF file → Should accept and process
  2. Test non-PDF file (.docx) → Should reject with error
  3. Test non-PDF file (.jpg) → Should reject with error
  4. Test corrupted PDF → Should reject with error
- **Expected Result**: ✓ Only valid PDFs are accepted
- **Status**: [ ] Pass / [ ] Fail

**Test 4: Invalid Coin Rejection**
- **Objective**: Verify system rejects invalid coins
- **Steps**:
  1. Insert foreign coin (different size)
  2. Insert damaged/bent coin
  3. Insert fake coin (wrong weight)
- **Expected Result**: ✓ No credit added, coins rejected
- **Status**: [ ] Pass / [ ] Fail

**Test 5: Power Interruption Recovery**
- **Objective**: Verify system recovers after power loss
- **Steps**:
  1. User has ₱5 balance
  2. Upload 3-page document
  3. During printing, cut power
  4. Restore power
  5. Check balance and job status
- **Expected Result**: 
  - ✓ Balance preserved (₱5)
  - ✓ Job status recoverable
  - ✓ Credits refunded if print incomplete
- **Status**: [ ] Pass / [ ] Fail

**Test 5: Session Isolation**
- **Objective**: Verify sessions are properly isolated
- **Steps**:
  1. User A uploads file, configures settings
  2. User A walks away without paying (5-min timeout)
  3. System auto-resets to Home screen
  4. User B starts new session
  5. Verify User A's file and settings are cleared
- **Expected Result**: Clean slate for User B, no data leakage
- **Status**: [ ] Pass / [ ] Fail

**Test 6: Printer Error Handling**
- **Objective**: Verify graceful error handling
- **Steps**:
  1. Upload file, configure B&W, 5 pages (₱10 required)
  2. Insert ₱10 coins, payment complete
  3. Remove paper from printer before job starts
  4. System attempts to print
  5. Verify error message displayed
- **Expected Result**: Error detected, user notified
- **Status**: [ ] Pass / [ ] Fail

**Test 7: Large File Handling**
- **Objective**: Verify system handles large documents
- **Steps**:
  1. Upload 50-page PDF (~10MB)
  2. Configure B&W mode (₱100 required)
  3. Insert sufficient coins
  4. Monitor progress
- **Expected Result**: All 50 pages print correctly
- **Status**: [ ] Pass / [ ] Fail

**Test 8: File Upload Size Limit**
- **Objective**: Verify file size restrictions enforced
- **Steps**:
  1. Attempt to upload 60MB file (over 50MB limit)
- **Expected Result**: Upload rejected with clear error message
- **Status**: [ ] Pass / [ ] Fail

**Test 9: Session Cancellation Before Payment**
- **Objective**: Verify users can cancel before paying
- **Steps**:
  1. Upload 5-page document
  2. Configure Color mode (₱25 required)
  3. User sees cost, decides not to proceed
  4. Taps "Cancel" or "Back" button
- **Expected Result**: Returns to Home screen, no coins inserted, no charge
- **Status**: [ ] Pass / [ ] Fail

## 9.2 Performance Testing

**Response Time Tests:**

| **Action** | **Target** | **Measured** | **Status** |
|------------|------------|--------------|------------|
| Coin detection to balance display | < 500ms | ___ms | [ ] Pass / [ ] Fail |
| Credit update ESP32 → Pi | < 300ms | ___ms | [ ] Pass / [ ] Fail |
| File upload (1MB) | < 3s | ___s | [ ] Pass / [ ] Fail |
| PDF page count extraction | < 2s | ___s | [ ] Pass / [ ] Fail |
| Print job submission to CUPS | < 1s | ___s | [ ] Pass / [ ] Fail |
| Web page load time | < 2s | ___s | [ ] Pass / [ ] Fail |
| Balance update on UI | < 500ms | ___ms | [ ] Pass / [ ] Fail |

**Load Testing:**

- **Concurrent Users**: Test with 5 simultaneous users
  - All uploading files
  - All actively printing
  - System should remain responsive
  
- **High Volume**: Test 100 print jobs in sequence
  - Verify all jobs complete
  - Check for memory leaks
  - Verify database integrity

- **Long-Running**: Test system for 24 hours continuous operation
  - Monitor resource usage
  - Check for crashes or hangs
  - Verify logs don't fill disk

## 9.3 Security Testing

**Authentication Tests:**
- [ ] Admin panel requires password
- [ ] Invalid credentials rejected
- [ ] Session expires after timeout
- [ ] Password reset functionality works

**Input Validation Tests:**
- [ ] SQL injection attempts blocked
- [ ] XSS attempts sanitized
- [ ] File upload validates types
- [ ] Malicious files rejected
- [ ] Buffer overflow protection

**Access Control Tests:**
- [ ] Regular users cannot access admin panel
- [ ] API endpoints properly secured
- [ ] Database not directly accessible
- [ ] System files protected

## 9.4 Acceptance Testing

**User Acceptance Criteria:**

1. **Ease of Use**
   - [ ] New user can print within 2 minutes without assistance
   - [ ] Instructions clear and understandable
   - [ ] Error messages helpful

2. **Reliability**
   - [ ] System uptime > 99% during testing period
   - [ ] < 1% print job failures
   - [ ] Balance tracking 100% accurate

3. **Performance**
   - [ ] Response time feels immediate to user
   - [ ] No noticeable lag during operations
   - [ ] Print quality meets expectations

4. **Robustness**
   - [ ] Handles errors gracefully
   - [ ] Recovers from power loss
   - [ ] Continues operation despite network hiccups

**Administrator Acceptance Criteria:**

1. **Management**
   - [ ] Admin panel intuitive and easy to use
   - [ ] Reports provide useful information
   - [ ] Configuration changes take effect immediately

2. **Maintenance**
   - [ ] Daily maintenance takes < 10 minutes
   - [ ] Logs provide sufficient troubleshooting info
   - [ ] Backup/restore works correctly

3. **Monitoring**
   - [ ] Can identify issues quickly
   - [ ] Revenue reconciliation is accurate
   - [ ] System health visible at a glance

## 9.5 Test Documentation

**Test Report Template:**

```
Test Case ID: TC-XXX
Test Case Name: [Descriptive Name]
Module: [Coin/Print/Web/Admin]
Priority: [High/Medium/Low]
Tester: [Name]
Date: [YYYY-MM-DD]

Preconditions:
- [Required setup]

Test Steps:
1. [Step 1]
2. [Step 2]
3. [Step 3]

Expected Results:
- [Expected outcome]

Actual Results:
- [What actually happened]

Status: [ ] Pass / [ ] Fail / [ ] Blocked
Defects: [Bug ID if failed]
Notes: [Additional observations]
```

**Running Pest Tests:**

```bash
# Run all tests
php artisan test

# Run specific test suite
php artisan test --testsuite=Feature
php artisan test --testsuite=Unit

# Run tests with coverage
php artisan test --coverage

# Run specific test file
php artisan test tests/Feature/PrintJobTest.php

# Run tests in parallel (faster)
php artisan test --parallel
```

---

**Navigation:**
- [← Previous: System Flow](08_system_flow.md)
- [→ Next: Security & Limitations](10_security_limitations.md)
- [↑ Back to Index](README.md)
