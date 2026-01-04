# Senbrua v1.0.0 - Installation Guide

Complete guide for installing **Senbrua** across all major Linux distributions.

---

## 🚀 Quick Install (Recommended)

### Ubuntu / Debian
```bash
# Download and install
wget https://github.com/otabekoff/senbrua/releases/download/v1.0.0/uz.mohirlab.senbrua_1.0.0-1_amd64.deb
sudo dpkg -i uz.mohirlab.senbrua_1.0.0-1_amd64.deb

# Run
senbrua
```

### Fedora / RHEL
```bash
# Coming soon - RPM package in development
```

### All Linux Distros (Universal)
```bash
# AppImage (works on any Linux with GLIBC)
wget https://github.com/otabekoff/senbrua/releases/download/v1.0.0/senbrua-1.0.0-x86_64.AppImage
chmod +x senbrua-1.0.0-x86_64.AppImage
./senbrua-1.0.0-x86_64.AppImage
```

---

## 📦 Installation Methods

### 1. **Debian / Ubuntu (.deb)**

**Best for**: Ubuntu 20.04+, Debian 11+  
**Pros**: System integration, auto-updates (if using PPA)  
**Cons**: Ubuntu/Debian only

#### Direct Installation
```bash
wget https://github.com/otabekoff/senbrua/releases/download/v1.0.0/uz.mohirlab.senbrua_1.0.0-1_amd64.deb
sudo dpkg -i uz.mohirlab.senbrua_1.0.0-1_amd64.deb
sudo apt --fix-broken install  # If dependency issues
```

#### Via PPA (Coming Soon)
```bash
sudo add-apt-repository ppa:otabekoff/senbrua-ppa
sudo apt update
sudo apt install senbrua

# Updates automatically with system
```

#### Uninstall
```bash
sudo apt remove senbrua
```

---

### 2. **AppImage (Universal)**

**Best for**: Any Linux distribution  
**Pros**: Works everywhere, no installation needed, portable  
**Cons**: Larger download size

```bash
# Download
wget https://github.com/otabekoff/senbrua/releases/download/v1.0.0/senbrua-1.0.0-x86_64.AppImage

# Make executable
chmod +x senbrua-1.0.0-x86_64.AppImage

# Run
./senbrua-1.0.0-x86_64.AppImage

# Optional: Create desktop shortcut
sudo cp senbrua-1.0.0-x86_64.AppImage /usr/local/bin/senbrua
sudo chmod +x /usr/local/bin/senbrua
```

---

### 3. **Snap Store** *(Waiting for Snap Store approval)*

**Best for**: Ubuntu, Fedora, Arch (with snap support)  
**Pros**: Secure sandbox, automatic updates  
**Cons**: Slower startup, more disk usage

```bash
# Once approved:
sudo snap install senbrua

# Run
senbrua

# Uninstall
sudo snap remove senbrua
```

---

### 4. **Flatpak** *(Waiting for Flathub approval)*

**Best for**: Any distribution with Flatpak  
**Pros**: Universal, sandboxed, always up-to-date  
**Cons**: Requires Flatpak runtime

```bash
# Once approved:
flatpak install flathub uz.mohirlab.senbrua

# Run
flatpak run uz.mohirlab.senbrua

# Uninstall
flatpak uninstall uz.mohirlab.senbrua
```

---

### 5. **From Source**

**Best for**: Developers, latest features  
**Requires**: Meson, Ninja, GJS, GTK4, libadwaita dev files

```bash
# Clone repository
git clone https://github.com/otabekoff/senbrua.git
cd senbrua

# Build
meson setup builddir
meson compile -C builddir

# Install
sudo meson install -C builddir

# Run
senbrua

# Uninstall
meson uninstall -C builddir
```

---

## 📊 Installation Methods Comparison

| Method | Distro | Size | Install Time | Auto-Update | Effort |
|--------|--------|------|--------------|------------|--------|
| **Debian (.deb)** | Ubuntu, Debian | 880 KB | 10s | ✅ PPA | ⭐ |
| **AppImage** | Any Linux | ~120 MB | 5s (no install) | ❌ Manual | ⭐ |
| **Snap** | Ubuntu, Fedora | 80 MB | 30s | ✅ Auto | ⭐⭐ |
| **Flatpak** | Any distro | 100 MB | 30s | ✅ Auto | ⭐⭐ |
| **Source** | Any distro | ~10 MB | 2-5 min | ❌ Manual | ⭐⭐⭐ |

---

## 🔧 Requirements

### Minimal
- Linux kernel 4.4+
- 500 MB disk space
- GLIBC 2.29+ (for AppImage)
- PulseAudio or PipeWire (for audio)

### Debian/Ubuntu
- GTK 4.0+
- libadwaita 1.0+
- GStreamer 1.0+
- GJS 1.70+

---

## ❌ Troubleshooting

### "Command not found: senbrua"
**Cause**: Installation path issue  
**Solution**:
```bash
# Check if installed
dpkg -l | grep senbrua
snap list | grep senbrua
flatpak list --app | grep senbrua

# Try full path
/snap/bin/senbrua              # If snap
/usr/bin/senbrua               # If .deb
flatpak run uz.mohirlab.senbrua # If flatpak
```

### "E: Unable to locate package senbrua"
**Cause**: Repository not added  
**Solution**:
```bash
# For .deb:
wget https://github.com/otabekoff/senbrua/releases/download/v1.0.0/uz.mohirlab.senbrua_1.0.0-1_amd64.deb
sudo dpkg -i uz.mohirlab.senbrua_1.0.0-1_amd64.deb
```

### "Error: could not open shared object file"
**Cause**: Missing dependencies  
**Solution**:
```bash
# For .deb:
sudo apt --fix-broken install

# For AppImage (run from terminal):
./senbrua-1.0.0-x86_64.AppImage -v
```

### AppImage Won't Run
**Cause**: Missing FUSE or permissions  
**Solution**:
```bash
# Install FUSE (if using AppImage)
sudo apt install libfuse2

# Or use AppImage in extract mode:
./senbrua-1.0.0-x86_64.AppImage --appimage-extract
./squashfs-root/usr/local/bin/senbrua
```

### Audio Not Working
**Cause**: PulseAudio/PipeWire not configured  
**Solution**:
```bash
# Check audio system
pactl info                    # For PulseAudio
pactl set-default-sink 0     # Set default output

# Or check PipeWire
pactl info
pacmd list-sinks             # List audio devices
```

---

## 🔒 Security & Privacy

- ✅ **No telemetry** - Completely offline
- ✅ **No external calls** - All processing local
- ✅ **Open source** - Code is publicly auditable
- ✅ **GNU GPL-3.0** - Free software license
- ✅ **Sandboxed** - Snap/Flatpak versions confined

### Permissions (Snap/Flatpak)
- `audio-record` - Microphone access
- `audio-playback` - Speaker output
- `home` - Save/load files from home
- `removable-media` - USB drives (if needed)

---

## 📝 System Compatibility

### Tested & Supported
- ✅ Ubuntu 20.04 LTS (Focal)
- ✅ Ubuntu 22.04 LTS (Jammy)
- ✅ Ubuntu 24.04 LTS (Noble)
- ✅ Debian 11 (Bullseye)
- ✅ Debian 12 (Bookworm)
- ✅ Fedora 39, 40 (AppImage)
- ✅ Arch Linux (AppImage)

### Should Work
- Mint, Elementary, Pop!_OS (AppImage)
- openSUSE, Manjaro (AppImage)
- Any systemd-based distro (AppImage)

---

## 📖 Next Steps

1. **Install** using your preferred method above
2. **Launch** from applications menu or terminal
3. **Grant permissions** when prompted (audio access)
4. **Start recording** your first audio

---

**Version**: Senbrua 1.0.0  
**License**: GNU General Public License v3.0 or later  
**Repository**: https://github.com/otabekoff/senbrua  
**Issues**: https://github.com/otabekoff/senbrua/issues
