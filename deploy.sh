#!/usr/bin/env bash
# Deployment helper for Senbrua packaging targets

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_ID="uz.mohirlab.senbrua"
VERSION=$(grep -oP "version: '\K[^']+" "$PROJECT_DIR/meson.build" | head -1)
TIMESTAMP=$(date +%Y%m%d%H%M)

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m'

heading() {
    echo -e "\n${BLUE}== $1 ==${NC}\n"
}

success() {
    echo -e "${GREEN}✓ $1${NC}"
}

error() {
    echo -e "${RED}✗ $1${NC}" >&2
}

warn() {
    echo -e "${YELLOW}⚠ $1${NC}" >&2
}

ensure() {
    if ! command -v "$1" >/dev/null 2>&1; then
        error "Missing required tool: $1"
        exit 1
    fi
}

flatpak_release() {
    ensure flatpak-builder
    heading "Building Flatpak release"
    cd "$PROJECT_DIR"
    rm -rf flatpak-release-build flatpak-release-repo

    # Build without fetching from remote - use local sources
    flatpak-builder \
        --force-clean \
        --disable-download \
        --default-branch=stable \
        --repo=flatpak-release-repo \
        flatpak-release-build \
        "$APP_ID.json" || {
        # If --disable-download fails, the manifest requires remote sources
        # Fall back to normal build
        echo "Note: Building with network access..."
        flatpak-builder \
            --force-clean \
            --default-branch=stable \
            --repo=flatpak-release-repo \
            flatpak-release-build \
            "$APP_ID.json"
    }

    flatpak build-bundle \
        flatpak-release-repo \
        "${APP_ID}_${VERSION}.flatpak" \
        "$APP_ID" \
        stable \
        --runtime-repo=https://flathub.org/repo/flathub.flatpakrepo

    success "Flatpak bundle created: ${APP_ID}_${VERSION}.flatpak"
    echo
    echo "To install locally:"
    echo "  flatpak install --user ${APP_ID}_${VERSION}.flatpak"
    echo
    echo "For Flathub submission:"
    echo "  1. Fork https://github.com/flathub/flathub"
    echo "  2. Create branch with app ID: $APP_ID"
    echo "  3. Add $APP_ID.json manifest"
    echo "  4. Submit pull request"
}

snap_release() {
    ensure snapcraft
    heading "Building Snap release"
    cd "$PROJECT_DIR"

    if [ ! -f snap/snapcraft.yaml ]; then
        error "snap/snapcraft.yaml not found"
        return 1
    fi

    # Try remote build first (uses Launchpad, works from any system)
    # Falls back to destructive-mode if remote fails
    echo "Attempting remote build via Launchpad..."
    if ! snapcraft remote-build --launchpad-accept-public-upload; then
        warn "Remote build failed, trying LXD..."
        snapcraft pack --use-lxd
    fi
    SNAP_FILE=$(ls -t *.snap 2>/dev/null | head -1)

    if [ -n "${SNAP_FILE:-}" ]; then
        success "Snap artifact: ${SNAP_FILE}"
        echo
        echo "To install locally:"
        echo "  sudo snap install --dangerous ${SNAP_FILE}"
        echo
        echo "To upload to Snap Store:"
        echo "  snapcraft login"
        echo "  snapcraft upload ${SNAP_FILE} --release=stable"
    fi
}

deb_release() {
    ensure dpkg-buildpackage
    heading "Building Debian package"
    cd "$PROJECT_DIR"

    if [ ! -d debian ]; then
        error "debian/ directory not found"
        return 1
    fi

    if command -v debclean >/dev/null 2>&1; then
        debclean >/dev/null 2>&1 || true
    fi

    dpkg-buildpackage -us -uc -b

    DEB_FILE=$(ls -t ../*.deb 2>/dev/null | head -1)
    if [ -n "${DEB_FILE:-}" ]; then
        success "Debian package: ${DEB_FILE}"

        if command -v lintian >/dev/null 2>&1; then
            echo
            echo "Running lintian checks..."
            lintian "${DEB_FILE}" || true
        fi

        echo
        echo "To install locally:"
        echo "  sudo dpkg -i ${DEB_FILE}"
        echo
        echo "For PPA upload:"
        echo "  dput ppa:<your-ppa> ../*.changes"
    fi
}

trigger_github() {
    if ! command -v gh >/dev/null 2>&1; then
        error "GitHub CLI (gh) not installed"
        echo "Install with: sudo apt install gh"
        echo "Then: gh auth login"
        return 1
    fi

    heading "Triggering GitHub workflow"
    cd "$PROJECT_DIR"

    if [ ! -f .github/workflows/release.yml ]; then
        echo "No .github/workflows/release.yml found"
        echo "Creating one is recommended for CI/CD"
        return 1
    fi

    gh workflow run release.yml --ref main --field version="${VERSION}" --field timestamp="${TIMESTAMP}"
    success "Workflow triggered"
    echo "Check status: gh run list --workflow release.yml"
}

show_usage() {
    echo "Senbrua Deployment Helper v${VERSION}"
    echo
    echo "Usage: $(basename "$0") <command>"
    echo
    echo "Commands:"
    echo "  flatpak   Build Flatpak bundle for distribution"
    echo "  snap      Build Snap package"
    echo "  deb       Build Debian package"
    echo "  github    Trigger release GitHub Actions workflow"
    echo "  all       Run flatpak, snap, deb targets sequentially"
    echo "  help      Show this help"
    echo
    echo "For local development builds, use ./build.sh instead."
}

case "${1:-}" in
    flatpak)
        flatpak_release
        ;;
    snap)
        snap_release
        ;;
    deb)
        deb_release
        ;;
    github)
        trigger_github
        ;;
    all)
        flatpak_release
        snap_release
        deb_release
        ;;
    help|--help|-h|"")
        show_usage
        ;;
    *)
        error "Unknown command: $1"
        show_usage
        exit 1
        ;;
esac
