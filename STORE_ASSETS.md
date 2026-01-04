# Store Publishing Assets Guide

This document lists all the assets required to publish Senbrua to Flathub and the Snap Store.

## Required Assets Summary

| Asset | Dimensions | Format | Required By |
|-------|------------|--------|-------------|
| App Icon | 128×128 | SVG | Both |
| Symbolic Icon | 16×16 | SVG | Both |
| Screenshot 1 (Light) | 1920×1080 | PNG | Both |
| Screenshot 2 (Dark) | 1920×1080 | PNG | Both |
| Screenshot 3 (Recording) | 1920×1080 | PNG | Recommended |
| Banner/Hero | 1248×702 | PN| Banner/Hero | 1248×702 | PNG | Flathub |
G | Flathub |

---

## 1. App Icon (Already exists)

**Location:** `data/icons/hicolor/scalable/apps/io.github.senbrua.svg`

**Requirements:**
- Format: SVG (scalable vector graphics)
- Base size: 128×128 pixels
- Should look good at 16×16, 32×32, 48×48, 64×64, 128×128, and 256×256
- Follow [GNOME Icon Guidelines](https://developer.gnome.org/hig/guidelines/app-icons.html)
- Use the GNOME color palette
- No shadows or effects (they're added by the system)

**Verification:**
```bash
ls -la data/icons/hicolor/scalable/apps/io.github.senbrua.svg
```

---

## 2. Symbolic Icon (Already exists)

**Location:** `data/icons/hicolor/symbolic/apps/io.github.senbrua-symbolic.svg`

**Requirements:**
- Format: SVG
- Size: 16×16 pixels
- Monochrome (single color)
- Used in notifications, menus, and small contexts

**Verification:**
```bash
ls -la data/icons/hicolor/symbolic/apps/io.github.senbrua-symbolic.svg
```

---

## 3. Screenshots (You need to create these)

**Location:** `data/screenshots/`

**Requirements:**
- Format: PNG (no compression artifacts)
- Size: 1920×1080 pixels (16:9 aspect ratio)
- Show the app in realistic use
- No personal data visible
- Include both light and dark mode variants

**Recommended Screenshots:**

1. **screenshot-01-main.png** - Main window with recordings list (light mode)
2. **screenshot-02-dark.png** - Main window in dark mode
3. **screenshot-03-recording.png** - Recording in progress with waveform
4. **screenshot-04-sidebar.png** - Showing the sidebar controls

**How to Take Screenshots:**

```bash
# Launch the app
senbrua

# Use GNOME Screenshot (press Print Screen) or:
gnome-screenshot -w -f screenshot.png

# Or use Flameshot:
flameshot gui
```

**Naming in AppStream:**
Screenshots must be referenced in `data/io.github.senbrua.metainfo.xml.in.in`:

```xml
<screenshots>
  <screenshot type="default">
    <caption>Record audio with a beautiful interface</caption>
    <image>https://raw.githubusercontent.com/senbrua/senbrua/main/data/screenshots/screenshot-01-main.png</image>
  </screenshot>
  <screenshot>
    <caption>Dark mode support</caption>
    <image>https://raw.githubusercontent.com/senbrua/senbrua/main/data/screenshots/screenshot-02-dark.png</image>
  </screenshot>
</screenshots>
```

---

## 4. Banner/Hero Image (Flathub)

**Location:** `data/screenshots/banner.png`

**Requirements:**
- Size: 1248×702 pixels
- Format: PNG
- Shows the app in an attractive way
- Can include branding/logo
- Used on the Flathub app page header

---

## 5. AppStream Metadata

**Location:** `data/io.github.senbrua.metainfo.xml.in.in`

**Required Fields:**
- `<id>` - App ID (io.github.senbrua)
- `<name>` - App name (Senbrua)
- `<summary>` - One-line description
- `<description>` - Detailed description
- `<screenshots>` - Screenshot URLs
- `<releases>` - Release history
- `<content_rating>` - OARS content rating
- `<categories>` - App categories
- `<keywords>` - Search keywords
- `<url>` - Homepage, bugtracker, help, etc.

**Validate AppStream:**
```bash
appstreamcli validate data/io.github.senbrua.metainfo.xml.in.in
```

---

## 6. Desktop Entry

**Location:** `data/io.github.senbrua.desktop.in.in`

**Required Fields:**
- `Name` - App name
- `Comment` - Short description
- `Icon` - Icon name
- `Exec` - Command to run
- `Categories` - Menu categories

**Validate Desktop Entry:**
```bash
desktop-file-validate builddir/data/io.github.senbrua.desktop
```

---

## Flathub Submission Checklist

1. [ ] Create a GitHub release with a tag (e.g., `v1.0.0`)
2. [ ] Ensure `io.github.senbrua.json` manifest is correct
3. [ ] Fork https://github.com/flathub/flathub
4. [ ] Create a new branch with your app ID
5. [ ] Add your manifest file
6. [ ] Submit a pull request
7. [ ] Wait for review (usually 1-7 days)

**Flathub Guidelines:** https://docs.flathub.org/docs/for-app-authors/requirements

---

## Snap Store Submission Checklist

1. [ ] Register at https://snapcraft.io/
2. [ ] Register the snap name: `snapcraft register senbrua`
3. [ ] Build the snap: `snapcraft`
4. [ ] Login: `snapcraft login`
5. [ ] Upload: `snapcraft upload senbrua_*.snap --release=stable`
6. [ ] Add store listing details at https://snapcraft.io/senbrua/listing

**Snap Store Guidelines:** https://snapcraft.io/docs/releasing-your-app

---

## Quick Asset Creation Tips

### Taking Perfect Screenshots

1. Set your display to 1920×1080 resolution
2. Use GNOME's "Night Light" OFF for accurate colors
3. Close notifications
4. Use a clean state (no personal recordings visible)
5. Capture window only (not full screen) for cleaner results

### Creating a Banner

You can use tools like:
- **GIMP** - Free, open-source
- **Inkscape** - For vector graphics
- **Figma** - Web-based design tool

### Icon Design Resources

- [GNOME Icon Development Kit](https://gitlab.gnome.org/Teams/Design/icon-development-kit)
- [GNOME Color Palette](https://developer.gnome.org/hig/reference/palette.html)
- [App Icon Guidelines](https://developer.gnome.org/hig/guidelines/app-icons.html)

---

## File Structure After Adding Assets

```
data/
├── icons/
│   └── hicolor/
│       ├── scalable/
│       │   └── apps/
│       │       └── io.github.senbrua.svg       ✅ (exists)
│       └── symbolic/
│           └── apps/
│               └── io.github.senbrua-symbolic.svg  ✅ (exists)
├── screenshots/
│   ├── screenshot-01-main.png                  ❌ (create)
│   ├── screenshot-02-dark.png                  ❌ (create)
│   ├── screenshot-03-recording.png             ❌ (create)
│   └── banner.png                              ❌ (create)
├── io.github.senbrua.desktop.in.in             ✅ (exists)
└── io.github.senbrua.metainfo.xml.in.in        ✅ (exists, needs screenshot URLs)
```
