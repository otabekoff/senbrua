<p align="center">
  <img src="data/icons/hicolor/scalable/apps/io.github.senbrua.svg" alt="Senbrua" width="128" height="128">
</p>

<h1 align="center">Senbrua</h1>

<p align="center">
  <strong>A simple, modern sound recorder for GNOME</strong>
</p>

<p align="center">
  <a href="https://github.com/senbrua/senbrua/releases">
    <img src="https://img.shields.io/github/v/release/senbrua/senbrua" alt="Release">
  </a>
  <a href="https://github.com/senbrua/senbrua/blob/main/COPYING">
    <img src="https://img.shields.io/github/license/senbrua/senbrua" alt="License">
  </a>
</p>

## About

Senbrua is a simple and elegant sound recorder application for the GNOME desktop. It allows you to record audio using your microphone and play it back with a beautiful waveform visualization.

## Features

- 🎙️ **Record audio** in multiple formats (Opus, Vorbis, FLAC, MP3)
- 🎵 **Playback recordings** with interactive waveform visualization
- ✏️ **Rename recordings** for easy organization
- 📤 **Export recordings** to your preferred location
- 🌙 **Dark mode support** with libadwaita
- 📱 **Responsive design** - works on desktop and mobile
- 🌍 **Internationalization** - supports multiple languages

## Screenshots

<!-- Add screenshots here -->

## Installation

### Flatpak (Recommended)

```bash
flatpak install flathub io.github.senbrua
```

### Building from Source

#### Dependencies

- meson (>= 0.63.0)
- gjs (>= 1.54.0)
- gtk4 (>= 4.10.0)
- libadwaita-1 (>= 1.4)
- gstreamer-1.0
- gstreamer-player-1.0 (>= 1.12)
- gstreamer-pbutils-1.0
- gobject-introspection (>= 1.31.6)
- typescript (>= 5.0)

#### Build Instructions

```bash
# Clone the repository
git clone https://github.com/senbrua/senbrua.git
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
meson setup builddir -Dprofile=development
meson compile -C builddir
sudo meson install -C builddir
```

### Snap

```bash
snap install senbrua
```

## Usage

1. Click the **Record** button to start recording
2. Click **Stop** when you're done
3. Your recordings will appear in the list
4. Click on a recording to play it back
5. Use the menu to rename, export, or delete recordings

### Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Start Recording | `Ctrl+R` |
| Pause/Resume | `Space` |
| Stop Recording | `S` |
| Delete | `Delete` |
| Rename | `F2` |
| Export | `Ctrl+S` |
| Seek Backward | `B` |
| Seek Forward | `N` |
| Quit | `Ctrl+Q` |
| Show Shortcuts | `Ctrl+?` |

## Audio Formats

Senbrua supports the following audio formats:

| Format | Extension | Description |
|--------|-----------|-------------|
| Opus | `.opus` | High-quality, low-latency codec |
| Vorbis | `.ogg` | Open-source lossy codec |
| FLAC | `.flac` | Lossless audio codec |
| MP3 | `.mp3` | Universal compatibility |

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
