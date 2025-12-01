/*
 * PISO Print Vending Machine - ESP32 Firmware
 * Version: 1.7 (Full Tolerance Mode)
 * PROBLEM: Mechanical noise causes coins to register extra pulses (e.g., 5 -> 6 or 7).
 * SOLUTION: Added acceptance ranges for ALL coin types.
 */

#include <Arduino.h>

// ==========================================
// PINS & SETTINGS
// ==========================================
#define COIN_PIN 25             
#define LED_BUILTIN 2           

// TIMING
#define DEBOUNCE_TIME 30        // Standard debounce
#define PULSE_TIMEOUT 2000      // Wait 2 seconds for coins to finish

#define HEARTBEAT_INTERVAL 30000 
#define SERIAL_BAUD_RATE 115200 

volatile unsigned long pulseCount = 0;
volatile unsigned long lastPulseTime = 0;

// ==========================================
// INTERRUPT
// ==========================================
void IRAM_ATTR coinPulseISR() {
    unsigned long currentTime = millis();
    if (currentTime - lastPulseTime > DEBOUNCE_TIME) {
        pulseCount++;
        lastPulseTime = currentTime;
    }
}

// ==========================================
// SETUP
// ==========================================
void setup() {
    Serial.begin(SERIAL_BAUD_RATE);
    pinMode(LED_BUILTIN, OUTPUT);
    digitalWrite(LED_BUILTIN, LOW);
    
    pinMode(COIN_PIN, INPUT_PULLUP);
    attachInterrupt(digitalPinToInterrupt(COIN_PIN), coinPulseISR, FALLING);
    
    delay(500);
    Serial.println("STATUS:READY");
    blinkLED(3, 100);
}

// ==========================================
// MAIN LOOP
// ==========================================
void loop() {
    processCoins();
    processIncomingMessages();
    
    static unsigned long lastHeartbeat = 0;
    if (millis() - lastHeartbeat >= HEARTBEAT_INTERVAL) {
        Serial.println("HEARTBEAT");
        lastHeartbeat = millis();
    }
    delay(10);
}

// ==========================================
// LOGIC (The Tolerance Fix)
// ==========================================
void processCoins() {
    if (pulseCount > 0 && (millis() - lastPulseTime > PULSE_TIMEOUT)) {
        
        noInterrupts();
        unsigned long safeCount = pulseCount;
        pulseCount = 0;
        interrupts();

        float coinValue = 0.0;
        
        // --- TOLERANCE RANGES ---
        // We accept the exact number AND slightly higher numbers (ghost pulses)
        switch (safeCount) {
            
            // 1 PESO (Target: 1) -> Accept 1 or 2
            case 1: 
            case 2: 
                coinValue = 1.00; break;

            // 5 PESOS (Target: 5) -> Accept 5, 6, or 7
            case 5: 
            case 6: 
            case 7: 
                coinValue = 5.00; break;

            // 10 PESOS (Target: 10) -> Accept 10, 11, or 12
            case 10: 
            case 11: 
            case 12: 
                coinValue = 10.00; break;
            
            // 20 PESOS (Target: 20) -> Accept 20, 21, or 22
            case 20: 
            case 21: 
            case 22: 
                coinValue = 20.00; break;

            default:
                Serial.print("ERROR:UNKNOWN_PULSE:");
                Serial.println(safeCount);
                blinkLED(5, 50); 
                return;
        }
        
        if (coinValue > 0) {
            Serial.print("COIN:");
            Serial.println(coinValue, 2);
            blinkLED(1, 100);
        }
    }
}

// ==========================================
// HELPERS
// ==========================================
void processIncomingMessages() {
    if (Serial.available() > 0) {
        String msg = Serial.readStringUntil('\n');
        msg.trim();
        if (msg.startsWith("ACK")) blinkLED(2, 50);
    }
}

void blinkLED(int times, int delayMs) {
    for (int i = 0; i < times; i++) {
        digitalWrite(LED_BUILTIN, HIGH);
        delay(delayMs);
        digitalWrite(LED_BUILTIN, LOW);
        delay(delayMs);
    }
}