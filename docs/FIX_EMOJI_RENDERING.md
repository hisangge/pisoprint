# Fix Emoji Rendering on Raspberry Pi

## Problem
Emojis (📁 📄 💰 🖨️ ⚙️ etc.) are not displaying correctly on the Raspberry Pi kiosk. They appear as empty boxes or squares instead of colorful emojis.

## Root Cause
The Raspberry Pi OS does not include emoji fonts by default. The system needs color emoji fonts to properly render Unicode emoji characters used throughout the Piso Print application.

## Solution

### Step 1: Install Emoji Fonts

```bash
# Install Noto Color Emoji font (the only emoji font available on Raspberry Pi OS)
sudo apt install -y fonts-noto-color-emoji
```

### Step 2: Refresh Font Cache

```bash
# Clear and rebuild font cache
fc-cache -f -v
```

### Step 3: Restart Chromium

```bash
# Kill existing Chromium process
DISPLAY=:0 killall chromium-browser

# Wait a moment
sleep 2

# Start kiosk mode again
DISPLAY=:0 ~/start-kiosk.sh &
```

### Step 4: Verify Installation

```bash
# Check if emoji fonts are installed
fc-list | grep -i emoji

# Expected output:
# /usr/share/fonts/truetype/noto/NotoColorEmoji.ttf: Noto Color Emoji:style=Regular
```

## Pages That Use Emojis

The following pages display emojis and should now render correctly:

1. **Home Page** (`/kiosk`)
   - 💰 "Black & White 💰" pricing
   - 📁 "Choose Upload Method"
   - 💰 "Insert Coins & Print!"
   - ⚡ "Fast • 💰 Affordable • ✅ Easy"

2. **File Selection** (`/kiosk/upload`)
   - 📁 "Choose Your Document"
   - 📄 "PDF Files Only"

3. **Print Preview** (`/kiosk/preview`)
   - 📄 "Your Document is Ready"
   - 📄 "Portrait" orientation

4. **Payment Page** (`/kiosk/payment`)
   - 💰 "Insert Coins Now"

5. **Print Status** (`/kiosk/status`)
   - 📄 "Your document has been printed successfully!"

## Quick One-Liner Fix

If you need a single command to run all steps:

```bash
sudo apt install -y fonts-noto-color-emoji && fc-cache -f -v && DISPLAY=:0 killall chromium-browser && sleep 2 && DISPLAY=:0 ~/start-kiosk.sh &
```

## Troubleshooting

### Emojis Still Not Showing

If emojis still don't appear after installing fonts:

1. **Check font installation:**
   ```bash
   dpkg -l | grep fonts-noto
   ```
   Should show `fonts-noto-color-emoji` package.

2. **Verify Chromium is using the new fonts:**
   ```bash
   ps aux | grep chromium
   ```
   Make sure Chromium was restarted after font installation.

3. **Check system locale:**
   ```bash
   locale
   ```
   Make sure UTF-8 locale is set (e.g., `LANG=en_US.UTF-8`).

4. **Reboot if necessary:**
   ```bash
   sudo reboot
   ```
   After reboot, the kiosk should auto-start with emoji support.

### Alternative: Install All Noto Fonts

For comprehensive font coverage (if you need international character support):

```bash
sudo apt install -y fonts-noto fonts-noto-color-emoji fonts-noto-cjk fonts-noto-cjk-extra
```

**Note:** `fonts-noto-emoji` package does not exist on Raspberry Pi OS. Only `fonts-noto-color-emoji` is available.

## Additional Information

- **Font Package Size:** ~10-15 MB
- **Installation Time:** ~1-2 minutes
- **Chromium Restart:** Required for changes to take effect
- **Performance Impact:** Minimal (fonts are loaded once)

## Package Information

On Raspberry Pi OS (Debian-based), only the following Noto emoji packages are available:
- ✅ `fonts-noto-color-emoji` - Color emoji font (recommended)
- ❌ `fonts-noto-emoji` - Does not exist on Raspberry Pi OS

The `fonts-noto-color-emoji` package provides full color emoji support and is sufficient for all emoji rendering needs in the Piso Print application.

## References

- Noto Color Emoji: https://fonts.google.com/noto/specimen/Noto+Color+Emoji
- Font Configuration: https://www.freedesktop.org/wiki/Software/fontconfig/

---

**Last Updated:** November 2, 2025  
**Tested On:** Raspberry Pi 4, Raspberry Pi OS (Debian 13 Trixie 64-bit)
