#!/bin/bash
# Setup GitHub-hosted APT repository for Senbrua
# This script creates the necessary structure for users to install Senbrua via apt

set -e

PROJECT_DIR="/home/otabek/Downloads/senbrua"
REPO_DIR="${PROJECT_DIR}/apt-repo"
POOL_DIR="${REPO_DIR}/pool/main/s/senbrua"
DISTS_DIR="${REPO_DIR}/dists/focal"
GPG_KEY_ID="${1:-}"  # Optional GPG key ID for signing

echo "=== Setting up GitHub APT Repository ==="

# Create directory structure
mkdir -p "$POOL_DIR"
mkdir -p "$DISTS_DIR/main/binary-amd64"
mkdir -p "$DISTS_DIR/main/source"

# Copy Debian package to pool
if [ -f "/home/otabek/Downloads/uz.mohirlab.senbrua_1.0.0-1_amd64.deb" ]; then
    echo "Copying Debian package..."
    cp /home/otabek/Downloads/uz.mohirlab.senbrua_1.0.0-1_amd64.deb "$POOL_DIR/"
else
    echo "⚠️  Debian package not found at /home/otabek/Downloads/"
    echo "   Building package..."
    cd "$PROJECT_DIR"
    meson setup builddir --prefix=/usr
    meson compile -C builddir
    meson install -C builddir --destdir=/tmp/senbrua-install
    # Will handle packaging after this
fi

# Create Packages file
echo "Creating Packages file..."
cd "$DISTS_DIR/main/binary-amd64"
apt-ftparchive packages "$POOL_DIR" > Packages
gzip -c Packages > Packages.gz

# Create Release file
echo "Creating Release file..."
cd "$DISTS_DIR"
cat > Release << 'EOF'
Origin: Senbrua
Label: Senbrua Stable
Suite: focal
Codename: focal
Version: 20.04
Architectures: amd64
Components: main
Description: Senbrua - GNOME Sound Recorder
Date: $(date -R)
EOF

# Sign Release file if GPG key provided
if [ -n "$GPG_KEY_ID" ]; then
    echo "Signing Release file with GPG key: $GPG_KEY_ID"
    gpg --armor --batch --default-key "$GPG_KEY_ID" --sign --detach-sign -o Release.gpg Release
else
    echo "⚠️  No GPG key provided. Skipping signature."
    echo "   To sign: gpg --armor --batch --default-key <KEY_ID> --sign --detach-sign -o Release.gpg Release"
fi

echo ""
echo "✅ APT repository structure created at: $REPO_DIR"
echo ""
echo "Next steps:"
echo "1. Commit and push to GitHub:"
echo "   git add apt-repo/"
echo "   git commit -m 'feat: add GitHub-hosted APT repository'"
echo "   git push origin main"
echo ""
echo "2. Enable GitHub Pages for your repository (Settings > Pages > Source: main branch /apt-repo)"
echo ""
echo "3. Users can then install with:"
echo "   curl -s https://raw.githubusercontent.com/otabekoff/senbrua/main/apt-repo-setup.sh | bash"
echo ""
