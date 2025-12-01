# ESP32 Testing Guide

## Quick Test Checklist

### ✅ Pre-Installation Tests (On Workbench)

**Test 1: Basic Serial Communication**
```bash
# Tools needed: ESP32 + USB cable + Computer

1. Upload firmware to ESP32
2. Open Serial Monitor (115200 baud)
3. Expected output:
   STATUS:READY
   HEARTBEAT (every 30s)
   
✅ Pass if you see above messages
❌ Fail if blank or garbled text
```

**Test 2: Manual Pulse Simulation**
```bash
# Tools needed: ESP32 + Jumper wire

1. Connect jumper wire to GPIO 25
2. Touch jumper to GND 5 times (quickly)
3. Wait 500ms
4. Expected output:
   COIN:5.00
   
✅ Pass if COIN:5.00 appears
❌ Fail if wrong amount or no message
```

**Test 3: Heartbeat Timing**
```bash
# Tools needed: ESP32 + Serial Monitor + Stopwatch

1. Note time of first HEARTBEAT message
2. Wait for second HEARTBEAT
3. Measure interval
4. Expected: ~30 seconds

✅ Pass if 29-31 seconds
❌ Fail if significantly different
```

---

### ✅ With Coin Acceptor (Before Raspberry Pi)

**Test 4: Coin Acceptor Power**
```bash
# Tools needed: ESP32 + Coin Acceptor + 12V PSU + Multimeter

1. Connect 12V to coin acceptor (RED = +, BLACK = GND)
2. Measure voltage at coin acceptor terminals
3. Expected: 11.5-12.5V DC

✅ Pass if voltage correct
❌ Fail if no voltage or wrong voltage
```

**Test 5: Coin Acceptor LED**
```bash
# Tools needed: Powered coin acceptor

1. Power on coin acceptor
2. Observe LED indicator
3. Expected: Solid green or slow blink (ready)

✅ Pass if LED indicates ready
❌ Fail if LED off or fast blinking (error)
```

**Test 6: COIN Signal Test**
```bash
# Tools needed: ESP32 + Coin Acceptor (connected) + Multimeter

1. Disconnect ESP32 from GPIO 25
2. Set multimeter to continuity/resistance mode
3. Insert ₱5 coin
4. Expected: 5 beeps/flashes from multimeter

✅ Pass if correct number of pulses
❌ Fail if wrong count or no pulses
```

**Test 7: ₱1 Coin Detection**
```bash
# Tools needed: Complete setup + ₱1 coin + Serial Monitor

1. Insert ₱1 coin
2. Expected output:
   COIN:1.00

✅ Pass if COIN:1.00 appears
❌ Fail if wrong amount or no message
```

**Test 8: ₱5 Coin Detection**
```bash
# Insert ₱5 coin
# Expected: COIN:5.00

✅ Pass
❌ Fail
```

**Test 9: ₱10 Coin Detection**
```bash
# Insert ₱10 coin
# Expected: COIN:10.00

✅ Pass
❌ Fail
```

**Test 10: ₱20 Coin Detection**
```bash
# Insert ₱20 coin
# Expected: COIN:20.00

✅ Pass
❌ Fail
```

**Test 11: Multiple Coins**
```bash
1. Insert ₱5 coin
2. Wait 1 second
3. Insert ₱1 coin
4. Expected output:
   COIN:5.00
   COIN:1.00

✅ Pass if both messages appear
❌ Fail if merged or missing
```

**Test 12: Rapid Coins**
```bash
1. Insert ₱5 coin
2. Immediately insert ₱5 coin (< 1 second)
3. Expected output:
   COIN:5.00
   COIN:5.00

✅ Pass if both detected separately
❌ Fail if detected as COIN:10.00
```

---

### ✅ Integration with Raspberry Pi

**Test 13: USB Connection**
```bash
# SSH to Raspberry Pi

lsusb | grep CH340

Expected output:
Bus 001 Device 004: ID 1a86:7523 QinHeng Electronics CH340 serial converter

✅ Pass if CH340 listed
❌ Fail if not found
```

**Test 14: Serial Port Detection**
```bash
ls -la /dev/ttyUSB*

Expected output:
crw-rw---- 1 root dialout 188, 0 Oct 29 10:30 /dev/ttyUSB0

✅ Pass if /dev/ttyUSB0 exists
❌ Fail if not found
```

**Test 15: Serial Port Permissions**
```bash
groups pi | grep dialout

Expected output:
pi : pi adm dialout ... (dialout should be listed)

✅ Pass if dialout in groups
❌ Fail if dialout missing (run: sudo usermod -a -G dialout pi)
```

**Test 16: Manual Serial Read**
```bash
sudo cat /dev/ttyUSB0

Expected output:
HEARTBEAT
HEARTBEAT
(Insert coin)
COIN:5.00

✅ Pass if messages appear
❌ Fail if blank or errors

Press Ctrl+C to stop
```

**Test 17: Laravel ESP32 Listener**
```bash
cd /home/pi/piso-print
php artisan esp32:listen --port=/dev/ttyUSB0 --baud=115200

Expected output:
Starting ESP32 listener on /dev/ttyUSB0 at 115200 baud...
ESP32 connected successfully
Listening for coin insertions...

(Insert ₱5 coin)

[10:30:45] Processed 1 message(s) - Total: 1

✅ Pass if message processed
❌ Fail if connection error
```

**Test 18: Laravel Logs**
```bash
# In another terminal
tail -f storage/logs/laravel.log

# Insert coin in Test 17
Expected log:
[2025-10-29 10:30:45] local.INFO: Coin inserted {"value":5,"esp32_id":"ESP32_COIN_001"}
[2025-10-29 10:30:45] local.INFO: Coin insertion processed successfully {"value":5,"new_balance":5}

✅ Pass if logs appear
❌ Fail if no logs or errors
```

**Test 19: Systemd Service**
```bash
sudo systemctl start piso-print-esp32
sudo systemctl status piso-print-esp32

Expected output:
● piso-print-esp32.service - PisoPrint ESP32 Coin Acceptor Listener
   Active: active (running)

✅ Pass if active (running)
❌ Fail if failed or inactive
```

**Test 20: Service Logs**
```bash
sudo journalctl -u piso-print-esp32 -f

Expected output:
Starting ESP32 listener...
ESP32 connected successfully
Listening for coin insertions...

✅ Pass if service running
❌ Fail if errors
```

---

## Common Test Failures & Solutions

### ❌ Test 1 Fail: No Serial Output

**Symptoms:** Serial Monitor blank

**Check:**
- Baud rate is 115200
- Correct COM port selected
- ESP32 powered (LED on)
- USB cable is data cable (not charge-only)

**Solution:**
1. Press RST button on ESP32
2. Try different USB cable
3. Reinstall CH340 driver
4. Re-upload firmware

---

### ❌ Test 2 Fail: Wrong Coin Amount

**Symptoms:** COIN:1.00 when expecting COIN:5.00

**Check:**
- Count pulses carefully (must be rapid)
- Wait > 500ms after last pulse

**Solution:**
1. Touch GPIO 25 to GND 5 times quickly (< 500ms total)
2. Release and wait 600ms
3. Should see COIN:5.00

---

### ❌ Test 6 Fail: No Pulses from Coin Acceptor

**Symptoms:** Multimeter doesn't beep when coin inserted

**Check:**
- 12V power connected
- Coin acceptor programmed correctly
- Using valid coin denomination

**Solution:**
1. Check LED on coin acceptor (should be green/ready)
2. Verify 12V power with multimeter
3. Reprogram coin acceptor (see README.md)
4. Test with different coin

---

### ❌ Test 7-10 Fail: Wrong Coin Values

**Symptoms:** ₱5 coin detected as ₱1 or unknown

**Check:**
- Coin acceptor programming
- Pulse configuration matches firmware

**Solution:**
1. Reprogram coin acceptor:
   - ₱1 = 1 pulse
   - ₱5 = 5 pulses
   - ₱10 = 10 pulses
   - ₱20 = 20 pulses
2. Test with multimeter first (Test 6)
3. Verify firmware COIN_X_PULSES constants

---

### ❌ Test 13 Fail: CH340 Not Found

**Symptoms:** lsusb doesn't show CH340

**Check:**
- USB cable connected
- ESP32 powered on
- USB hub working (if used)

**Solution:**
1. Try different USB port on Raspberry Pi
2. Try direct connection (remove hub)
3. Check `dmesg | grep usb` for errors
4. Test ESP32 on different computer

---

### ❌ Test 14 Fail: /dev/ttyUSB0 Missing

**Symptoms:** No /dev/ttyUSB0 device

**Check:**
- CH340 detected (Test 13)
- Driver loaded

**Solution:**
1. Load module: `sudo modprobe ch341`
2. Check kernel logs: `dmesg | tail -20`
3. Reboot Raspberry Pi
4. May be /dev/ttyUSB1 if multiple devices

---

### ❌ Test 17 Fail: Permission Denied

**Symptoms:** "Failed to open serial port"

**Check:**
- User in dialout group (Test 15)

**Solution:**
1. Add user to group: `sudo usermod -a -G dialout pi`
2. Log out and back in (or reboot)
3. Verify: `groups pi | grep dialout`

---

### ❌ Test 17 Fail: No Messages Processed

**Symptoms:** Listener starts but processes 0 messages

**Check:**
- ESP32 sending data (Test 16)
- Correct serial port
- Baud rate matches (115200)

**Solution:**
1. Stop listener (Ctrl+C)
2. Test manual read: `sudo cat /dev/ttyUSB0`
3. If blank, check ESP32 (press RST)
4. If working, restart listener

---

### ❌ Test 18 Fail: No Laravel Logs

**Symptoms:** Coin inserted but no log entries

**Check:**
- LOG_LEVEL in .env
- Laravel logging enabled
- Session exists

**Solution:**
1. Check .env: `LOG_LEVEL=debug`
2. Clear cache: `php artisan config:clear`
3. Check if guest session exists
4. Manually test: Insert coin via web UI

---

### ❌ Test 19 Fail: Service Failed

**Symptoms:** systemd service won't start

**Check:**
- Service file syntax
- File paths correct
- Permissions

**Solution:**
1. Check logs: `sudo journalctl -u piso-print-esp32 -n 50`
2. Verify paths in service file
3. Test command manually first
4. Check file permissions: `ls -la /var/www/piso-print`

---

## Test Results Template

Copy and fill out:

```
ESP32 Testing Results
=====================
Date: _______________
Tester: _______________

Pre-Installation Tests
[ ] Test 1: Basic Serial Communication
[ ] Test 2: Manual Pulse Simulation
[ ] Test 3: Heartbeat Timing

With Coin Acceptor
[ ] Test 4: Coin Acceptor Power
[ ] Test 5: Coin Acceptor LED
[ ] Test 6: COIN Signal Test
[ ] Test 7: ₱1 Coin Detection
[ ] Test 8: ₱5 Coin Detection
[ ] Test 9: ₱10 Coin Detection
[ ] Test 10: ₱20 Coin Detection
[ ] Test 11: Multiple Coins
[ ] Test 12: Rapid Coins

Raspberry Pi Integration
[ ] Test 13: USB Connection
[ ] Test 14: Serial Port Detection
[ ] Test 15: Serial Port Permissions
[ ] Test 16: Manual Serial Read
[ ] Test 17: Laravel ESP32 Listener
[ ] Test 18: Laravel Logs
[ ] Test 19: Systemd Service
[ ] Test 20: Service Logs

Overall Status: [ ] PASS  [ ] FAIL

Notes:
_________________________________
_________________________________
_________________________________
```

---

**Ready for Production:** All tests must pass ✅ before deployment to kiosk.
