#!/bin/bash

# Configuration
MOUNT_ROOT="/mnt/usb"
API_URL="http://127.0.0.1/kiosk/api/kiosk/usb/detected"
LOG_FILE="/var/log/usb-manager.log"
WEB_UID=33 # www-data
WEB_GID=33 # www-data

# Argument 1 comes from the service call: "add" or "remove"
# Argument 2 comes from the %i in the service filename: "sda1"
ACTION=$1
DEVICE_NAME=$2 

DEVICE_PATH="/dev/$DEVICE_NAME"
MOUNT_POINT="$MOUNT_ROOT/$DEVICE_NAME"

log() {
    echo "$(date) - $1" >> "$LOG_FILE"
}

if [ "$ACTION" == "add" ]; then
    # Wait for device to be ready
    sleep 2

    mkdir -p "$MOUNT_POINT"

    # Try to mount with permissions
    MOUNT_OUTPUT=$(mount -o uid=$WEB_UID,gid=$WEB_GID,umask=0022 "$DEVICE_PATH" "$MOUNT_POINT" 2>&1)

    if [ $? -eq 0 ]; then
        log "Success: Mounted $DEVICE_NAME to $MOUNT_POINT"

        # Notify Laravel
        curl -X POST "$API_URL" \
             -H "Content-Type: application/json" \
             -d "{\"device\":\"$DEVICE_NAME\", \"status\":\"mounted\"}" \
             --max-time 2 > /dev/null 2>&1 &
    else
        log "Error: Failed to mount $DEVICE_NAME. System said: $MOUNT_OUTPUT"
        # Cleanup failed directory
        rmdir "$MOUNT_POINT"
    fi

elif [ "$ACTION" == "remove" ]; then
    umount -l "$MOUNT_POINT"
    rmdir "$MOUNT_POINT"
    log "Success: Unmounted $DEVICE_NAME"
fi