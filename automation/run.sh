#!/bin/sh

mkdir -p /var/run/dbus
# Start the D-Bus service in the background
dbus-uuidgen --ensure
dbus-daemon --system --fork

# Add any additional configuration or setup steps here

# Start your application (e.g., Node.js) in the foreground
npm start