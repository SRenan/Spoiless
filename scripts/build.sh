#!/bin/bash
set -e

# Clean previous builds
rm -f spoiless-*.zip

# Get version from manifest
VERSION=$(grep '"version"' manifest.json | cut -d'"' -f4)

# Files to include
FILES="manifest.json content.js content.css liquipedia.js liquipedia.css popup.html popup.js popup.css icons/"

# Build Firefox version (includes browser_specific_settings)
zip -r "spoiless-${VERSION}-firefox.zip" $FILES
echo "✓ Built spoiless-${VERSION}-firefox.zip"

# Build Chrome version (same for now, may diverge later)
zip -r "spoiless-${VERSION}-chrome.zip" $FILES
echo "✓ Built spoiless-${VERSION}-chrome.zip"
