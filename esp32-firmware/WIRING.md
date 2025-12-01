# ESP32 Wiring Diagram

## Complete System Wiring

```
                    PISO Print System Wiring Diagram
                    ================================

                                 ┌─────────────────────┐
                                 │   12V DC Power      │
                                 │   Supply (2A+)      │
                                 └──────┬──────┬───────┘
                                        │+12V  │GND
                                        │      │
                   ┌────────────────────┤      ├─────────────────────┐
                   │                    │      │                     │
                   │                    │      │                     │
         ┌─────────▼─────────┐          │      │          ┌──────────▼──────────┐
         │  ALLAN Universal  │          │      │          │   Raspberry Pi 4    │
         │  Coinslot 1239    │          │      │          │   (8GB RAM)         │
         │  PROMAX           │          │      │          │                     │
         │                   │          │      │          │  ┌──────────────┐   │
         │  ┌─────────────┐  │          │      │          │  │   Laravel    │   │
         │  │  Coin Slot  │  │          │      │          │  │   MySQL      │   │
         │  │   Insert    │  │          │      │          │  │   CUPS       │   │
         │  │   Coins     │  │          │      │          │  └──────────────┘   │
         │  └─────────────┘  │          │      │          │                     │
         │                   │          │      │          │  [USB Ports]        │
         │  LED: ●           │          │      │          │   │  │  │  │        │
         │                   │          │      │          │   │  │  │  │        │
         └──┬────┬───┬───────┘          │      │          └───┼──┼──┼──┼────────┘
            │    │   │                  │      │              │  │  │  │
           +12V GND COIN                │      │              │  │  │  └─→ Printer
            │    │   │                  │      │              │  │  │     (USB)
            │    │   │                  │      │              │  │  │
            └────┼───┼──────────────────┘      │              │  │  └─→ WiFi
                 │   │                         │              │  │      Adapter
                 │   │                         │              │  │
                 │   └─────────────────────────┼──────────────┘  └─→ Display
                 │                             │                     (DSI/HDMI)
                 │                             │
                 │      ┌──────────────────────┘
                 │      │
                 │      │
       ┌─────────▼──────▼──────────┐
       │   ESP32 Development Board │
       │   (CH340C, USB-C, 30-Pin) │
       │                            │
       │   ┌─────────────────┐      │
       │   │    ESP32-       │      │
       │   │    WROOM-32     │      │
       │   │                 │      │
       │   │  [CPU]  [WiFi]  │      │
       │   │         [BT]    │      │
       │   └─────────────────┘      │
       │                            │
       │  GPIO 25 ●────────────┘    │ ← COIN signal from acceptor
       │  GPIO 2  ● LED (onboard)   │
       │  GND     ●────────────┘    │ ← Common ground
       │  VIN     ● (5V from USB)   │
       │                            │
       │   ┌──────────┐             │
       │   │ USB-C ▢  │             │
       │   └──────┬───┘             │
       └──────────┼─────────────────┘
                  │
                  │ USB-C Cable
                  │
                  ▼
            Raspberry Pi USB Port
              (/dev/ttyUSB0)
```

---

## Pin Connection Details

### ALLAN Coin Acceptor

```
┌─────────────────────────────────────────┐
│  ALLAN 1239 PROMAX Coin Acceptor        │
│                                          │
│  Terminal Block:                         │
│  ┌──────────────────────────────┐        │
│  │  1  2  3  4  5  6  7  8     │        │
│  └──┬──┬──┬──┬──┬──┬──┬─────────┘        │
│     │  │  │  │  │  │  │                 │
│    +12V│  │  │  │  │  └─→ NC            │
│     │ GND │  │  │  └────→ NC            │
│     │  │  │  │  └───────→ NC            │
│     │  │ COIN │  └────────→ COUNTER     │
│     │  │  │   └────────────→ INHIBIT    │
│     │  │  └────────────────→ NC         │
│     │  │                                │
│     │  └─→ Connect to Common GND        │
│     └────→ Connect to 12V PSU (+)       │
│                                          │
└──────────────────────────────────────────┘

COIN Signal Wire Colors (varies by model):
- White or Yellow: COIN signal
- Black: GND
- Red: +12V
```

### ESP32 Dev Board (30-Pin Layout)

```
┌───────────────────────────────────────────────────────────────┐
│                    ESP32 Development Board                     │
│                       (Top View)                               │
│                                                                │
│  Left Side:              Center:          Right Side:         │
│                                                                │
│  3V3  ●                USB-C ▢              ● GND             │
│  EN   ●              ┌────────┐            ● GPIO 23          │
│  VP   ●              │CH340C  │            ● GPIO 22          │
│  VN   ●              │USB-TTL │            ● GPIO 1 (TX)      │
│  GPIO 34 ●           └────────┘            ● GPIO 3 (RX)      │
│  GPIO 35 ●                                 ● GPIO 21          │
│  GPIO 32 ●                                 ● GPIO 19          │
│  GPIO 33 ●                                 ● GPIO 18          │
│  GPIO 25 ● ←─── COIN SIGNAL               ● GPIO 5           │
│  GPIO 26 ●                                 ● GPIO 17          │
│  GPIO 27 ●                                 ● GPIO 16          │
│  GPIO 14 ●                                 ● GPIO 4           │
│  GPIO 12 ●                                 ● GPIO 2  (LED)    │
│  GPIO 13 ●                                 ● GPIO 15          │
│  GND     ● ←─── COMMON GROUND              ● GND             │
│  VIN     ●                                 ● 3V3             │
│                                                                │
└───────────────────────────────────────────────────────────────┘

Key Pins Used:
- GPIO 25: COIN signal input (with internal pull-up)
- GPIO 2:  Built-in LED indicator
- GND:     Common ground
- VIN:     5V power from USB (auto-connected)
- USB-C:   Data + Power to Raspberry Pi
```

---

## Physical Connection Steps

### Step 1: Connect Coin Acceptor Power

```
12V Power Supply
    │
    ├──[+12V]─────→ ALLAN Terminal 1 (RED wire)
    │
    └──[GND]──────→ ALLAN Terminal 2 (BLACK wire)
                    │
                    └────→ ESP32 GND (common ground)
```

**Important:**
- Use 12V DC power supply (minimum 2A)
- Check polarity carefully (reversing may damage unit)
- Ensure stable voltage (11.5-12.5V DC)

### Step 2: Connect COIN Signal

```
ALLAN Terminal 3 (COIN)
    │
    └──[WHITE/YELLOW wire]─────→ ESP32 GPIO 25
```

**Notes:**
- Wire color varies by model (white, yellow, or green)
- Keep wire short (< 30cm) to minimize noise
- Optionally add 0.1µF capacitor between GPIO 25 and GND for filtering

### Step 3: Connect ESP32 to Raspberry Pi

```
ESP32 USB-C Port
    │
    └──[USB-C to USB-A Cable]─────→ Raspberry Pi USB Port
```

**Notes:**
- Use quality USB cable with data lines (not charge-only)
- Connect to USB 2.0 or 3.0 port on Raspberry Pi
- Cable provides both power and data
- Will appear as /dev/ttyUSB0 on Raspberry Pi

---

## Grounding

```
All grounds must be connected together:

    12V PSU GND ────┬──── ALLAN GND (Terminal 2)
                    │
                    ├──── ESP32 GND (Pin)
                    │
                    └──── Raspberry Pi GND (via USB)
                           (automatically connected)

Common Ground = Critical for reliable operation!
```

**Warning:** Failing to connect grounds will cause:
- Erratic pulse detection
- Communication errors
- Potential component damage

---

## Power Distribution

```
Power Flow:

12V PSU (2A)
    │
    ├──[12V @ 1A]──→ ALLAN Coin Acceptor
    │
    └──[Common GND]

Raspberry Pi (5V 3A PSU)
    │
    ├──[5V @ 500mA]──→ ESP32 (via USB)
    │
    ├──[5V @ 500mA]──→ WiFi Adapter
    │
    └──[5V @ 1A]──→ 7" Display

Total Power Requirements:
- 12V PSU: 2A minimum (for coin acceptor)
- 5V PSU: 3A minimum (for Raspberry Pi + peripherals)
```

---

## USB Cable Requirements

### ✅ Correct Cable (DATA + POWER)
```
USB-C Connector               USB-A Connector
┌──────────────┐             ┌───────────────┐
│              │             │               │
│  ▇▇▇▇▇▇▇▇    │────────────→│  ▇▇▇▇         │
│              │             │               │
└──────────────┘             └───────────────┘

Wires inside:
- VBUS (5V) ✅
- D+ (Data) ✅
- D- (Data) ✅
- GND       ✅
```

### ❌ Wrong Cable (CHARGE ONLY)
```
USB-C Connector               USB-A Connector
┌──────────────┐             ┌───────────────┐
│              │             │               │
│  ▇▇▇▇▇▇▇▇    │─ ─ ─ ─ ─ ─→│  ▇▇▇▇         │
│              │             │               │
└──────────────┘             └───────────────┘

Wires inside:
- VBUS (5V) ✅
- D+ (Data) ❌ Missing!
- D- (Data) ❌ Missing!
- GND       ✅

Result: ESP32 powers on but no communication!
```

**How to Test Cable:**
1. Connect ESP32 to computer
2. Check if new COM port appears
3. If no COM port = charge-only cable
4. Replace with data cable

---

## Testing Points

### Multimeter Test Points

**Test 1: 12V Power**
```
Multimeter in DC Voltage mode:
    RED probe  → ALLAN Terminal 1 (+12V)
    BLACK probe → ALLAN Terminal 2 (GND)
    
Expected: 11.5 - 12.5 V DC
```

**Test 2: COIN Signal (No Coin)**
```
Multimeter in DC Voltage mode:
    RED probe  → ALLAN Terminal 3 (COIN)
    BLACK probe → GND
    
Expected: ~5V (HIGH state)
```

**Test 3: COIN Signal (With Coin)**
```
Multimeter in DC Voltage mode + Insert coin:
    RED probe  → ALLAN Terminal 3 (COIN)
    BLACK probe → GND
    
Expected: Pulses from 5V to 0V
          Number of pulses = coin value
```

**Test 4: ESP32 Power**
```
Multimeter in DC Voltage mode:
    RED probe  → ESP32 VIN or 3V3 pin
    BLACK probe → ESP32 GND
    
Expected: ~5V on VIN, ~3.3V on 3V3
```

**Test 5: Continuity**
```
Multimeter in Continuity mode:
    Probe 1 → ALLAN GND (Terminal 2)
    Probe 2 → ESP32 GND
    
Expected: Beep (continuity exists)
```

---

## Safety Notes

⚠️ **WARNING:**
- Never connect 12V directly to ESP32 (will destroy it)
- Always check polarity before powering on
- Use appropriate gauge wire (20-22 AWG for signals, 18 AWG for power)
- Ensure all connections are secure (no loose wires)
- Keep coin acceptor away from water and moisture
- Disconnect power before making wiring changes

🔌 **POWER SEQUENCE:**
1. Connect all wires (with power OFF)
2. Double-check all connections
3. Power on 12V supply for coin acceptor
4. Power on Raspberry Pi (which powers ESP32)
5. Wait for system to boot
6. Verify LED blinks on ESP32

---

## Troubleshooting Wiring Issues

| Problem | Check | Solution |
|---------|-------|----------|
| No LED on ESP32 | USB cable, USB port | Try different cable/port |
| No COIN detection | GPIO 25 connection | Re-solder or re-connect |
| Erratic pulse counts | Common ground | Connect all grounds together |
| ESP32 keeps resetting | USB power insufficient | Use powered USB hub |
| Coin acceptor LED off | 12V power | Check voltage with multimeter |
| /dev/ttyUSB0 missing | USB data cable | Replace with data cable |

---

## Cable Management Tips

```
Recommended Wire Routing:

1. ALLAN to ESP32:
   - Use twisted pair for COIN + GND
   - Keep length < 30cm
   - Route away from power cables

2. ESP32 to Raspberry Pi:
   - Use quality USB-C cable (< 1m)
   - Avoid sharp bends
   - Secure with cable ties

3. 12V Power:
   - Use appropriate gauge wire
   - Keep separate from signal wires
   - Label clearly

4. Inside Kiosk:
   - Bundle cables neatly
   - Leave slack for maintenance
   - Label all connections
   - Use cable management clips
```

---

**Ready to Wire?** Follow the steps in order, test each connection, and refer to the testing guide for verification.
