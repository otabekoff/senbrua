# Installation Methods for Senbrua

Senbrua can be installed through multiple methods on different Linux distributions.

## 1. **Direct Installation (Local)**

Build and install directly from source:

```bash
git clone https://github.com/otabekoff/senbrua.git
cd senbrua
meson setup builddir
meson compile -C builddir
meson compile -C builddir run   # optional: launch without installing
sudo meson install -C builddir
senbrua
```

**Requirements:**
- Meson 0.63+ and Ninja
- GJS 1.54+
- GTK 4, libadwaita 1, GStreamer 1.0 (player, pbutils)
- TypeScript 5+ (or use `-Dskip_ts=true`)
- Standard build toolchain (gcc/clang, pkg-config)

**Ubuntu/Debian build dependencies**

```bash
sudo apt install meson ninja-build gjs libgtk-4-dev libadwaita-1-dev \
	libgstreamer1.0-dev libgstreamer-plugins-good1.0-dev \
	libgstreamer-plugins-bad1.0-dev gobject-introspection gir1.2-gstreamer-1.0 \
	gir1.2-adw-1 node-typescript
```

---

## 2. **Flatpak** (Recommended for GNOME)

Install from Flathub or build locally:

### From Flathub (when published):
```bash
flatpak install flathub uz.mohirlab.senbrua
flatpak run uz.mohirlab.senbrua
```

### Build Locally:
```bash
git clone https://github.com/otabekoff/senbrua.git
cd senbrua
flatpak-builder --user --install --force-clean buildrepo uz.mohirlab.senbrua.json
flatpak run uz.mohirlab.senbrua
```

**Advantages:**
- Sandboxed for security
- Works on any Linux distribution with Flatpak
- Easy updates
- Isolated dependencies

---

## 3. **Snap** (For Ubuntu/Snapcraft)

Build and install as a Snap:

```bash
git clone https://github.com/otabekoff/senbrua.git
cd senbrua
snapcraft
snap install --dangerous senbrua_1.0.0_amd64.snap
senbrua
```

**Requirements:**
- snapcraft installed
- User in `lxd` group for building

---

## 4. **Debian/Ubuntu (.deb Package)**

Build a Debian package:

```bash
git clone https://github.com/otabekoff/senbrua.git
cd senbrua
debuild -us -uc
sudo dpkg -i uz.mohirlab.senbrua_1.0.0-1_amd64.deb
```

Or using dpkg-buildpackage:
```bash
dpkg-buildpackage -us -uc -b
sudo apt install ./uz.mohirlab.senbrua_1.0.0-1_amd64.deb
```

**Requirements:**
- build-essential
- debhelper
- devscripts

---

## 5. **AppImage** (Universal Linux)

Senbrua can be packaged as an AppImage for distribution-independent installation.

---

## Testing the Installation

After installing through any method, test the app:

```bash
# If installed via source/local
senbrua

# If installed via Flatpak
flatpak run uz.mohirlab.senbrua

# If installed via Snap
senbrua
```

---

## Recommended Installation Method by Distribution

| Distribution      | Recommended Method | Command                                |
| ----------------- | ------------------ | -------------------------------------- |
| **Ubuntu 22.04+** | Flatpak            | `flatpak install uz.mohirlab.senbrua`  |
| **Fedora 38+**    | Flatpak            | `flatpak install uz.mohirlab.senbrua`  |
| **Debian 12+**    | .deb package       | `sudo apt install uz.mohirlab.senbrua` |
| **Arch Linux**    | AUR                | `yay -S uz.mohirlab.senbrua`           |
| **Universal**     | Flatpak            | `flatpak install uz.mohirlab.senbrua`  |
| **Development**   | Local Build        | `git clone && meson install`           |

---

## Uninstallation

### Local Installation:
```bash
sudo ninja -C builddir uninstall
```

### Flatpak:
```bash
flatpak uninstall uz.mohirlab.senbrua
```

### Snap:
```bash
snap remove senbrua
```

### Debian/Ubuntu:
```bash
sudo apt remove uz.mohirlab.senbrua
```

---

## Troubleshooting

### Missing Dependencies

**Ubuntu/Debian:**
```bash
sudo apt install libgtk-4-dev libadwaita-1-dev libgstreamer1.0-dev gstreamer1.0-plugins-good
```

**Fedora:**
```bash
sudo dnf install gtk4-devel libadwaita-devel gstreamer1-devel gstreamer1-plugins-good
```

**Arch:**
```bash
sudo pacman -S gtk4 libadwaita gstreamer gst-plugins-good
```

### TypeScript Compilation Issues

If you encounter issues building from source, ensure TypeScript is installed:
```bash
npm install -g typescript
```

Or skip TypeScript compilation (useful for Flatpak):
```bash
meson setup builddir -Dskip_ts=true
```

---

## Contributing

For development and contributing, follow the [INSTRUCTIONS.md](INSTRUCTIONS.md) guide.
