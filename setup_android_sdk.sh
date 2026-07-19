#!/bin/bash
set -e

SDK_DIR="/app/applet/android-sdk"

echo "=== Creating Android SDK directory ==="
mkdir -p "$SDK_DIR/cmdline-tools"

echo "=== Downloading Android Command Line Tools ==="
wget -q -O /tmp/cmdline-tools.zip https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip

echo "=== Extracting tools ==="
unzip -q /tmp/cmdline-tools.zip -d "$SDK_DIR/cmdline-tools"
mv "$SDK_DIR/cmdline-tools/cmdline-tools" "$SDK_DIR/cmdline-tools/latest"

echo "=== Accepting Android Licenses ==="
yes | "$SDK_DIR/cmdline-tools/latest/bin/sdkmanager" --sdk_root="$SDK_DIR" --licenses

echo "=== Installing required platforms and build-tools ==="
"$SDK_DIR/cmdline-tools/latest/bin/sdkmanager" --sdk_root="$SDK_DIR" "platform-tools" "platforms;android-34" "platforms;android-35" "platforms;android-36" "build-tools;34.0.0" "build-tools;35.0.0" "build-tools;36.0.0"

echo "=== Android SDK setup completed successfully ==="

