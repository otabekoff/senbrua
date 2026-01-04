<p align="center">
  <img src="data/icons/hicolor/scalable/apps/uz.mohirlab.senbrua.svg" alt="Senbrua" width="128" height="128">
</p>

<h1 align="center">Senbrua</h1>

<p align="center">
  <strong>A simple, modern sound recorder for GNOME</strong>
</p>

<p align="center">
  <a href="https://github.com/AkromDev/senbrua/releases">
    <img src="https://img.shields.io/github/v/release/AkromDev/senbrua" alt="Release">
  </a>
  <a href="https://github.com/AkromDev/senbrua/blob/main/COPYING">
    <img src="https://img.shields.io/github/license/AkromDev/senbrua" alt="License">
  </a>
</p>

> **Note:** Senbrua is a modern remake of [Vocalis](https://gitlab.gnome.org/World/vocalis), bringing advanced noise cancellation and a refined user experience to the GNOME desktop.

## About

Senbrua – An elegant Linux GNOME desktop voice recorder with advanced noise cancellation, designed for high-quality recordings in any environment. Built to be simple, efficient, and user-friendly, supporting multiple audio formats and real-time noise suppression.

## Features

- 🎙️ **Record audio** in multiple formats (Opus, Vorbis, FLAC, MP3)
- 🎵 **Playback recordings** with interactive waveform visualization
- ✏️ **Rename recordings** for easy organization
- 📤 **Export recordings** to your preferred location
- 🔇 **Noise reduction** powered by RNNoise (toggleable)
- 🌙 **Dark mode support** with libadwaita
- 📱 **Responsive design** - works on desktop and mobile
- 🌍 **Internationalization** - supports multiple languages

## Screenshots

<!-- Add screenshots here -->

## Installation

### 📦 Package Managers (Recommended)

#### Debian / Ubuntu (.deb)
```bash
wget https://github.com/otabekoff/senbrua/releases/download/v1.0.0/uz.mohirlab.senbrua_1.0.0-1_amd64.deb
sudo dpkg -i uz.mohirlab.senbrua_1.0.0-1_amd64.deb
```

#### Flatpak
```bash
flatpak install flathub uz.mohirlab.senbrua
```

#### Snap
```bash
sudo snap install senbrua
```

#### AppImage (Universal)
```bash
wget https://github.com/otabekoff/senbrua/releases/download/v1.0.0/senbrua-1.0.0-x86_64.AppImage
chmod +x senbrua-1.0.0-x86_64.AppImage
./senbrua-1.0.0-x86_64.AppImage
```

For more installation methods and detailed instructions, see [INSTALLATION_METHODS.md](INSTALLATION_METHODS.md).

### Building from Source

#### Dependencies

- meson (>= 0.63.0)
- gjs (>= 1.54.0)
- gtk4 (>= 4.10.0)
- libadwaita-1 (>= 1.4)
- gstreamer-1.0
- gstreamer-player-1.0 (>= 1.12)
- gstreamer-pbutils-1.0
- gstreamer-plugins-bad-1.0 (for RNNoise)
- librnnoise
- gobject-introspection (>= 1.31.6)
- typescript (>= 5.0)

#### Build Instructions

```bash
# Clone the repository
git clone https://github.com/AkromDev/senbrua.git
cd senbrua

# Configure the build
meson setup builddir

# Build
meson compile -C builddir

# Install (requires root privileges)
sudo meson install -C builddir

# Run
senbrua
```

#### Development Build

For development with additional debugging features:

```bash
meson setup builddir -Dprofile=development --reconfigure
meson compile -C builddir
sudo meson install -C builddir
```

### Running from the Build Tree

During development you can launch Senbrua without installing:

```bash
meson compile -C builddir run
```

The `run` target wraps `gjs -m builddir/src/uz.mohirlab.senbrua` with the right environment, so it works even when the launcher script is not installed system-wide.

If you prefer to avoid Meson’s stack trace when cancelling with `Ctrl+C`, run the helper script instead:

```bash
./tools/dev-run.sh
```

### Additional Installation Methods

See [INSTALLATION.md](INSTALLATION.md) for Flatpak, Snap, Debian packages, and other distribution-specific instructions.

### Release and Store Submission

Publishing guides for Flathub, Snapcraft, and Debian/Ubuntu repositories live in [INSTRUCTIONS.md](INSTRUCTIONS.md#publishing).

### Snap

```bash
snap install senbrua
```

## Usage

1. Click the **Record** button to start recording
2. Click **Stop** when you're done
3. Your recordings will appear in the list
4. Click on a recording to play it back
5. Use the row actions to rename, export, or delete recordings
6. Toggle **Noise Reduction** from the sidebar when you want RNNoise suppression on or off

### Keyboard Shortcuts

| Action          | Shortcut |
| --------------- | -------- |
| Start Recording | `Ctrl+R` |
| Pause/Resume    | `Space`  |
| Stop Recording  | `S`      |
| Delete          | `Delete` |
| Rename          | `F2`     |
| Export          | `Ctrl+S` |
| Seek Backward   | `B`      |
| Seek Forward    | `N`      |
| Quit            | `Ctrl+Q` |
| Show Shortcuts  | `Ctrl+?` |

## Audio Formats

Senbrua supports the following audio formats:

| Format | Extension | Description                     |
| ------ | --------- | ------------------------------- |
| Opus   | `.opus`   | High-quality, low-latency codec |
| Vorbis | `.ogg`    | Open-source lossy codec         |
| FLAC   | `.flac`   | Lossless audio codec            |
| MP3    | `.mp3`    | Universal compatibility         |

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Translations

Help translate Senbrua into your language! Translation files are located in the `po/` directory.

1. Copy the template file `po/senbrua.pot` to `po/YOUR_LANGUAGE_CODE.po`
2. Translate the strings in the new file
3. Add your language code to `po/LINGUAS`
4. Submit a pull request

## License

Senbrua is licensed under the GNU General Public License v3.0 or later. See [COPYING](COPYING) for details.

## Acknowledgments

- Based on code from [Vocalis](https://gitlab.gnome.org/World/vocalis) and [GNOME Sound Recorder](https://gitlab.gnome.org/GNOME/gnome-sound-recorder)
- Thanks to all contributors and translators
