#!/bin/bash
# Senbrua APT Repository Setup Script
# Run this script to add Senbrua APT repository and install the application
# Usage: curl -s https://raw.githubusercontent.com/otabekoff/senbrua/main/apt-repo-setup.sh | bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     Senbrua APT Repository Setup                           ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then
   echo -e "${RED}Error: Please do not run this script as root${NC}"
   echo "       Run without 'sudo': bash apt-repo-setup.sh"
   exit 1
fi

# Detect Ubuntu/Debian version
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS_NAME=$ID
    OS_VERSION=$VERSION_CODENAME
else
    echo -e "${RED}Error: Cannot detect OS version${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Detected: $PRETTY_NAME ($OS_VERSION)"
echo ""

# Map Ubuntu versions to repository codenames
case $OS_VERSION in
    focal) REPO_CODENAME="focal" ;;
    jammy) REPO_CODENAME="focal" ;;  # Use focal as base for compatibility
    noble) REPO_CODENAME="focal" ;;  # Ubuntu 24.04
    *) REPO_CODENAME="focal" ;;       # Default to focal
esac

echo "Setting up Senbrua APT repository..."
echo ""

# Add GPG key (if available)
echo "Adding GPG key..."
sudo apt-key adv --keyserver keyserver.ubuntu.com --recv-keys <YOUR_GPG_KEY_ID> 2>/dev/null || {
    echo -e "${YELLOW}⚠ ${NC}GPG key setup skipped (key not yet published)"
}

# Add repository
REPO_URL="https://raw.githubusercontent.com/otabekoff/senbrua/main/apt-repo"
REPO_LINE="deb [trusted=yes] $REPO_URL $REPO_CODENAME main"

echo "Adding repository..."
echo "$REPO_LINE" | sudo tee /etc/apt/sources.list.d/senbrua.list > /dev/null

echo -e "${GREEN}✓${NC} Repository added"
echo ""

# Update and install
echo "Updating package cache..."
sudo apt update

echo ""
echo -e "${GREEN}✓${NC} Repository setup complete!"
echo ""
echo "To install Senbrua, run:"
echo -e "${GREEN}  sudo apt install senbrua${NC}"
echo ""
echo "Or visit: https://github.com/otabekoff/senbrua/releases"
