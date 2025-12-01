#!/usr/bin/env python3
"""
PISO Print - ESP32 Coin Listener
Posts coin data to the Laravel /kiosk/coin-deposit endpoint

Usage:
    python3 coin_listener.py
    python3 coin_listener.py --port /dev/ttyUSB0

Requirements:
    pip3 install pyserial requests
"""

import argparse
import os
import signal
import sys
import time

import serial
import requests

# Configuration
SERIAL_PORT = os.environ.get('ESP32_SERIAL_PORT', '/dev/ttyUSB0')
BAUD_RATE = 115200
MACHINE_ID = os.environ.get('ESP32_ID', 'ESP32_COIN_001')
LARAVEL_URL = os.environ.get('LARAVEL_URL', 'http://localhost')

running = True


def post_coin(amount: float):
    """Post coin to Laravel /kiosk/coin-deposit endpoint."""
    try:
        response = requests.post(
            f"{LARAVEL_URL}/kiosk/coin-deposit",
            json={'amount': amount, 'machine_id': MACHINE_ID},
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        if response.status_code == 200:
            print(f"✓ Coin ₱{amount:.2f} deposited")
        else:
            print(f"✗ Server error: {response.status_code}")
    except Exception as e:
        print(f"✗ Failed to post coin: {e}")


def main():
    global running
    
    parser = argparse.ArgumentParser(description='ESP32 Coin Listener')
    parser.add_argument('--port', default=SERIAL_PORT, help='Serial port')
    args = parser.parse_args()
    
    # Graceful shutdown
    signal.signal(signal.SIGINT, lambda s, f: setattr(sys.modules[__name__], 'running', False))
    signal.signal(signal.SIGTERM, lambda s, f: setattr(sys.modules[__name__], 'running', False))
    
    print(f"Connecting to ESP32 on {args.port}...")
    
    while running:
        try:
            with serial.Serial(args.port, BAUD_RATE, timeout=1) as ser:
                print(f"Connected! Listening for coins...")
                
                while running:
                    line = ser.readline().decode('utf-8', errors='ignore').strip()
                    
                    if line.startswith('COIN:'):
                        amount = float(line.split(':')[1])
                        post_coin(amount)
                        ser.write(f"ACK\n".encode())
                    elif line == 'HEARTBEAT':
                        pass  # ESP32 is alive
                    elif line:
                        print(f"ESP32: {line}")
                        
        except serial.SerialException as e:
            print(f"Serial error: {e}. Reconnecting in 5s...")
            time.sleep(5)
        except Exception as e:
            print(f"Error: {e}")
            time.sleep(1)
    
    print("Stopped.")


if __name__ == '__main__':
    main()
