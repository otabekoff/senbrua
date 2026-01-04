#!/usr/bin/env bash
# Senbrua build helper

set -euo pipefail

PROJECT_NAME="Senbrua"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VERSION=$(grep -oP "version: '\K[^']+" "$PROJECT_DIR/meson.build" | head -1)

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

heading() {
    echo -e "\n${BLUE}== $1 ==${NC}\n"
}

success() {
    echo -e "${GREEN}✓ $1${NC}"
}

warn() {
    echo -e "${YELLOW}• $1${NC}"
}

error() {
    echo -e "${RED}✗ $1${NC}" >&2
}

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

check_dependencies() {
    heading "Dependency check"
    local required=(meson ninja gjs)
    local optional=(npm flatpak-builder snapcraft dpkg-buildpackage)
    local missing_required=()
    local missing_optional=()

    for dep in "${required[@]}"; do
        command_exists "$dep" || missing_required+=("$dep")
    done

    for dep in "${optional[@]}"; do
        command_exists "$dep" || missing_optional+=("$dep")
    done

    if [ ${#missing_required[@]} -gt 0 ]; then
        error "Missing required tools: ${missing_required[*]}"
        exit 1
    fi

    success "Required tools available: ${required[*]}"

    if [ ${#missing_optional[@]} -gt 0 ]; then
        warn "Optional tools missing: ${missing_optional[*]}"
    else
        success "All optional tools available"
    fi
}

ensure_builddir() {
    cd "$PROJECT_DIR"
    if [ ! -d builddir ]; then
        heading "Configuring Meson"
        meson setup builddir
    elif [ ! -f builddir/build.ninja ]; then
        heading "Reconfiguring Meson"
        meson setup builddir --reconfigure
    fi
}

do_build() {
    ensure_builddir
    heading "Building $PROJECT_NAME v$VERSION"
    meson compile -C "$PROJECT_DIR/builddir"
    success "Build completed"
}

do_install() {
    ensure_builddir
    heading "Installing (sudo required)"
    sudo meson install -C "$PROJECT_DIR/builddir"
    success "Installation completed"
}

do_lint() {
    heading "Running code quality checks"
    cd "$PROJECT_DIR"
    if [ ! -d node_modules ]; then
        warn "Installing npm dependencies"
        npm install
    fi
    npm run lint || warn "ESLint reported issues"
    npm run format
    npx tsc --noEmit
    success "Linting finished"
}

do_flatpak() {
    heading "Flatpak build"
    if ! command_exists flatpak-builder; then
        error "flatpak-builder missing. Install with: sudo apt install flatpak-builder"
        return 1
    fi
    cd "$PROJECT_DIR"
    flatpak-builder --user --install --force-clean buildrepo uz.mohirlab.senbrua.json
    success "Flatpak build finished"
    echo "Run with: flatpak run uz.mohirlab.senbrua"
}

do_snap() {
    heading "Snap build"
    if ! command_exists snapcraft; then
        error "snapcraft missing. Install with: sudo snap install snapcraft --classic"
        return 1
    fi
    cd "$PROJECT_DIR"
    snapcraft --use-lxd
    success "Snap build finished"
}

do_deb() {
    heading "Debian package build"
    if ! command_exists dpkg-buildpackage; then
        error "dpkg-buildpackage not found (install devscripts)"
        return 1
    fi
    cd "$PROJECT_DIR"
    if command_exists debclean; then
        debclean >/dev/null 2>&1 || true
    fi
    dpkg-buildpackage -us -uc -b
    success "Debian package built"
}

do_run() {
    heading "Running from build tree"
    cd "$PROJECT_DIR"
    if [ -x ./tools/dev-run.sh ]; then
        ./tools/dev-run.sh
    else
        ensure_builddir
        do_build
        gjs -m builddir/src/uz.mohirlab.senbrua
    fi
}

do_run_installed() {
    heading "Running installed application"
    senbrua
}

do_clean() {
    heading "Cleaning build artefacts"
    cd "$PROJECT_DIR"
    rm -rf builddir buildrepo .flatpak-builder *.snap
    success "Clean completed"
}

do_git_release() {
    heading "Preparing git release"
    cd "$PROJECT_DIR"
    if ! git diff-index --quiet HEAD --; then
        warn "Working tree dirty"
        read -rp "Commit all changes now? [y/N]: " reply
        if [[ $reply =~ ^[Yy]$ ]]; then
            read -rp "Commit message [Release v$VERSION]: " message
            message=${message:-"Release v$VERSION"}
            git add .
            git commit -m "$message"
        else
            warn "Skipping commit"
        fi
    fi

    read -rp "Tag release v$VERSION? [y/N]: " tag_reply
    if [[ $tag_reply =~ ^[Yy]$ ]]; then
        git tag -a "v$VERSION" -m "Release v$VERSION"
        success "Created tag v$VERSION"
    fi

    read -rp "Push to origin? [y/N]: " push_reply
    if [[ $push_reply =~ ^[Yy]$ ]]; then
        git push --follow-tags
        success "Pushed to origin"
    fi
}

show_help() {
    echo "$PROJECT_NAME build helper v$VERSION"
    echo
    echo "Usage: $0 [command]"
    echo
    echo "Commands:"
    echo "  deps            Check for required tools"
    echo "  build           Compile the project"
    echo "  install         Build and install system-wide"
    echo "  lint            Run TypeScript linting/formatting"
    echo "  flatpak         Build the Flatpak package"
    echo "  snap            Build the Snap package"
    echo "  deb             Build Debian packages"
    echo "  run             Run from build tree (Ctrl+C safe)"
    echo "  run-installed   Run installed binary"
    echo "  clean           Remove build artefacts"
    echo "  release         Commit, tag and optionally push"
    echo "  all             deps -> lint -> build -> install"
    echo "  help            Show this message"
    echo
    echo "Run with no arguments to enter interactive mode."
}

interactive_menu() {
    while true; do
        heading "$PROJECT_NAME build helper v$VERSION"
        echo "  1) Check dependencies"
        echo "  2) Build"
        echo "  3) Build & install"
        echo "  4) Lint & format"
        echo "  5) Build Flatpak"
        echo "  6) Build Snap"
        echo "  7) Build Debian package"
        echo "  8) Run (build tree)"
        echo "  9) Run installed binary"
        echo " 10) Clean"
        echo " 11) Git release helper"
        echo " 12) Full pipeline (deps -> lint -> build -> install)"
        echo "  0) Exit"
        echo
        read -rp "Select option: " choice
        case $choice in
            1) check_dependencies ;;
            2) do_build ;;
            3) do_build && do_install ;;
            4) do_lint ;;
            5) do_flatpak ;;
            6) do_snap ;;
            7) do_deb ;;
            8) do_run ;;
            9) do_run_installed ;;
            10) do_clean ;;
            11) do_git_release ;;
            12) check_dependencies && do_lint && do_build && do_install ;;
            0) exit 0 ;;
            *) warn "Invalid choice" ;;
        esac
    done
}

case "${1:-}" in
    deps)
        check_dependencies
        ;;
    build)
        do_build
        ;;
    install)
        do_build
        do_install
        ;;
    lint)
        do_lint
        ;;
    flatpak)
        do_flatpak
        ;;
    snap)
        do_snap
        ;;
    deb)
        do_deb
        ;;
    run)
        do_run
        ;;
    run-installed)
        do_run_installed
        ;;
    clean)
        do_clean
        ;;
    release)
        do_git_release
        ;;
    all)
        check_dependencies
        do_lint
        do_build
        do_install
        ;;
    help|--help|-h)
        show_help
        ;;
    "")
        interactive_menu
        ;;
    *)
        error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
