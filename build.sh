#!/bin/bash
# Senbrua Build and Publish Script
# This script handles building, testing, and publishing Senbrua

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project info
PROJECT_NAME="Senbrua"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VERSION=$(grep -oP "version: '\K[^']+" "$PROJECT_DIR/meson.build" | head -1)

print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check dependencies
check_dependencies() {
    print_header "Checking Dependencies"
    
    local deps=("meson" "ninja" "npm" "gjs" "flatpak-builder")
    local missing=()
    
    for dep in "${deps[@]}"; do
        if command -v "$dep" &> /dev/null; then
            print_success "$dep found"
        else
            print_warning "$dep not found"
            missing+=("$dep")
        fi
    done
    
    if [ ${#missing[@]} -gt 0 ]; then
        print_warning "Some optional dependencies are missing: ${missing[*]}"
    fi
}

# Build the project
build() {
    print_header "Building $PROJECT_NAME v$VERSION"
    
    cd "$PROJECT_DIR"
    
    # Setup if builddir doesn't exist
    if [ ! -d "builddir" ]; then
        echo "Setting up build directory..."
        meson setup builddir
    fi
    
    # Compile
    echo "Compiling..."
    meson compile -C builddir
    
    print_success "Build completed successfully"
}

# Install the project
install_local() {
    print_header "Installing $PROJECT_NAME"
    
    cd "$PROJECT_DIR"
    
    echo "Installing (requires sudo)..."
    sudo ninja -C builddir install
    
    print_success "Installation completed"
}

# Run linting and formatting
lint() {
    print_header "Running Code Quality Checks"
    
    cd "$PROJECT_DIR"
    
    # Install npm dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo "Installing npm dependencies..."
        npm install
    fi
    
    echo "Running ESLint..."
    npm run lint || print_warning "Lint warnings found"
    
    echo "Running Prettier..."
    npm run format
    
    echo "Checking TypeScript..."
    npx tsc --noEmit
    
    print_success "Code quality checks completed"
}

# Build Flatpak
build_flatpak() {
    print_header "Building Flatpak"
    
    cd "$PROJECT_DIR"
    
    if ! command -v flatpak-builder &> /dev/null; then
        print_error "flatpak-builder not found. Install with: sudo apt install flatpak-builder"
        return 1
    fi
    
    echo "Building Flatpak package..."
    flatpak-builder --user --install --force-clean buildrepo io.github.senbrua.json
    
    print_success "Flatpak build completed"
    echo "Run with: flatpak run io.github.senbrua"
}

# Build Snap
build_snap() {
    print_header "Building Snap"
    
    cd "$PROJECT_DIR"
    
    if ! command -v snapcraft &> /dev/null; then
        print_error "snapcraft not found. Install with: sudo snap install snapcraft --classic"
        return 1
    fi
    
    echo "Building Snap package..."
    echo "Note: This requires LXD. Make sure you're in the 'lxd' group."
    echo ""
    
    # Use 'snapcraft pack' (new command)
    snapcraft pack
    
    print_success "Snap build completed"
    
    # Find the snap file
    SNAP_FILE=$(ls -t *.snap 2>/dev/null | head -1)
    if [ -n "$SNAP_FILE" ]; then
        echo "Install with: sudo snap install $SNAP_FILE --dangerous"
    fi
}

# Run the app
run_app() {
    print_header "Running $PROJECT_NAME"
    
    senbrua
}

# Clean build
clean() {
    print_header "Cleaning Build Artifacts"
    
    cd "$PROJECT_DIR"
    
    rm -rf builddir
    rm -rf buildrepo
    rm -rf .flatpak-builder
    rm -f *.snap
    
    print_success "Clean completed"
}

# Git release
git_release() {
    print_header "Creating Git Release"
    
    cd "$PROJECT_DIR"
    
    # Check for uncommitted changes
    if ! git diff-index --quiet HEAD --; then
        echo "You have uncommitted changes."
        read -p "Commit all changes? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            read -p "Enter commit message [Release v$VERSION]: " commit_msg
            commit_msg=${commit_msg:-"Release v$VERSION"}
            git add .
            git commit -m "$commit_msg"
        else
            print_warning "Skipping commit"
        fi
    fi
    
    # Create tag
    read -p "Create tag v$VERSION? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git tag -a "v$VERSION" -m "Release v$VERSION"
        print_success "Tag v$VERSION created"
    fi
    
    # Push
    read -p "Push to origin? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git push origin main --tags
        print_success "Pushed to origin"
    fi
}

# Show help
show_help() {
    echo "$PROJECT_NAME Build Script v$VERSION"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  build       Build the project"
    echo "  install     Build and install locally"
    echo "  lint        Run linting and formatting"
    echo "  flatpak     Build Flatpak package"
    echo "  snap        Build Snap package"
    echo "  run         Run the application"
    echo "  clean       Clean build artifacts"
    echo "  release     Create git release (commit, tag, push)"
    echo "  all         Run lint, build, and install"
    echo "  help        Show this help message"
    echo ""
    echo "Interactive mode:"
    echo "  Run without arguments for interactive menu"
}

# Interactive menu
interactive_menu() {
    print_header "$PROJECT_NAME Build Script v$VERSION"
    
    echo "What would you like to do?"
    echo ""
    echo "  1) Build"
    echo "  2) Build & Install"
    echo "  3) Run Lint & Format"
    echo "  4) Build Flatpak"
    echo "  5) Build Snap"
    echo "  6) Run Application"
    echo "  7) Clean Build"
    echo "  8) Git Release"
    echo "  9) Full Pipeline (lint → build → install)"
    echo "  0) Exit"
    echo ""
    
    read -p "Enter choice [1-9, 0]: " choice
    
    case $choice in
        1) build ;;
        2) build && install_local ;;
        3) lint ;;
        4) build_flatpak ;;
        5) build_snap ;;
        6) run_app ;;
        7) clean ;;
        8) git_release ;;
        9) lint && build && install_local ;;
        0) exit 0 ;;
        *) print_error "Invalid choice" ;;
    esac
}

# Main
cd "$PROJECT_DIR"

case "${1:-}" in
    build)
        build
        ;;
    install)
        build
        install_local
        ;;
    lint)
        lint
        ;;
    flatpak)
        build_flatpak
        ;;
    snap)
        build_snap
        ;;
    run)
        run_app
        ;;
    clean)
        clean
        ;;
    release)
        git_release
        ;;
    all)
        check_dependencies
        lint
        build
        install_local
        ;;
    help|--help|-h)
        show_help
        ;;
    "")
        interactive_menu
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
