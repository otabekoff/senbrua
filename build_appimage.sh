#!/bin/bash
# Create AppImage for Senbrua
# This script packages the built application as an AppImage for universal Linux distribution

set -e

PROJECT_DIR="/home/otabek/Downloads/senbrua"
BUILD_DIR="${PROJECT_DIR}/builddir"
APPIMAGE_WORK="${PROJECT_DIR}/appimage_build"

echo "=== Building Senbrua AppImage ==="

# 1. Ensure application is built
cd "$PROJECT_DIR"
if [ ! -f "$BUILD_DIR/data/uz.mohirlab.senbrua.desktop" ]; then
    echo "Building application..."
    meson setup builddir -Dprefix=/usr
    meson compile -C builddir
fi

# 2. Create AppImage work directory
mkdir -p "$APPIMAGE_WORK/AppDir/usr"
mkdir -p "$APPIMAGE_WORK/AppDir/usr/share/icons"

# 3. Install to AppDir
echo "Installing to AppDir..."
meson install -C builddir --destdir="$APPIMAGE_WORK/AppDir"

# 4. Copy icon
echo "Copying application icon..."
cp "$PROJECT_DIR/data/icons/hicolor/scalable/apps/uz.mohirlab.senbrua.svg" \
   "$APPIMAGE_WORK/AppDir/usr/share/icons/" || \
   cp "$BUILD_DIR/data/uz.mohirlab.senbrua.svg" \
   "$APPIMAGE_WORK/AppDir/usr/share/icons/" || true

# 5. Create AppRun executable
cat > "$APPIMAGE_WORK/AppDir/AppRun" << 'APPRUN'
#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
export PATH="$SCRIPT_DIR/usr/bin:$SCRIPT_DIR/usr/local/bin:$PATH"
export LD_LIBRARY_PATH="$SCRIPT_DIR/usr/lib:$SCRIPT_DIR/usr/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH"
export XDG_DATA_DIRS="$SCRIPT_DIR/usr/share:$XDG_DATA_DIRS"

# Find and run the application
if [ -f "$SCRIPT_DIR/usr/local/bin/senbrua" ]; then
    exec "$SCRIPT_DIR/usr/local/bin/senbrua" "$@"
elif [ -f "$SCRIPT_DIR/usr/bin/senbrua" ]; then
    exec "$SCRIPT_DIR/usr/bin/senbrua" "$@"
else
    echo "Error: Could not find senbrua binary"
    exit 1
fi
APPRUN

chmod +x "$APPIMAGE_WORK/AppDir/AppRun"

# 6. Create .desktop file for AppImage
cp "$BUILD_DIR/data/uz.mohirlab.senbrua.desktop" \
   "$APPIMAGE_WORK/AppDir/uz.mohirlab.senbrua.desktop"

# 7. Create AppImage using appimagetool
echo "Creating AppImage..."
if command -v appimagetool &> /dev/null; then
    appimagetool "$APPIMAGE_WORK/AppDir" \
                 "$PROJECT_DIR/senbrua-1.0.0-x86_64.AppImage"
else
    echo "⚠️  appimagetool not found. Install with:"
    echo "   wget https://github.com/AppImage/AppImageKit/releases/download/continuous/appimagetool-x86_64.AppImage"
    echo "   chmod +x appimagetool-x86_64.AppImage"
    echo "   sudo mv appimagetool-x86_64.AppImage /usr/local/bin/"
    exit 1
fi

# 8. Verify AppImage
if [ -f "$PROJECT_DIR/senbrua-1.0.0-x86_64.AppImage" ]; then
    echo ""
    echo "✅ AppImage created successfully!"
    ls -lh "$PROJECT_DIR/senbrua-1.0.0-x86_64.AppImage"
    echo ""
    echo "To use:"
    echo "  chmod +x senbrua-1.0.0-x86_64.AppImage"
    echo "  ./senbrua-1.0.0-x86_64.AppImage"
else
    echo "❌ AppImage creation failed"
    exit 1
fi
