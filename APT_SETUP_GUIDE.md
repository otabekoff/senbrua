# Senbrua APT Installation Guide

This guide explains how to install Senbrua using APT package manager on Ubuntu/Debian.

## Quick Start (Recommended)

### Option 1: Direct Installation from GitHub Release

The simplest method - download and install the .deb package directly:

```bash
# Download the latest .deb package
wget https://github.com/otabekoff/senbrua/releases/download/v1.0.0/uz.mohirlab.senbrua_1.0.0-1_amd64.deb

# Install it
sudo dpkg -i uz.mohirlab.senbrua_1.0.0-1_amd64.deb

# Verify installation
senbrua --version
```

**Pros**: Simple, no repository needed, offline installation possible
**Cons**: Manual updates required, must download new .deb for updates

---

## Option 2: GitHub-Hosted APT Repository

Set up an APT repository from GitHub for automatic updates.

### Setup (One-time)

```bash
# Add the repository
echo "deb [trusted=yes] https://raw.githubusercontent.com/otabekoff/senbrua/main/apt-repo focal main" | \
  sudo tee /etc/apt/sources.list.d/senbrua.list

# Update package cache
sudo apt update
```

### Install

```bash
sudo apt install senbrua
```

### Update

```bash
sudo apt update
sudo apt upgrade  # Updates all packages including senbrua
```

**Pros**: Automatic updates, clean installation, repository-based
**Cons**: Requires GitHub accessibility, no GPG signature (currently trusted)

---

## Option 3: Launchpad PPA (When Available)

Once set up, this is the most convenient method for Ubuntu users:

```bash
# Add PPA
sudo add-apt-repository ppa:otabekoff/senbrua
sudo apt update

# Install
sudo apt install senbrua

# Update automatically
sudo apt upgrade
```

**Pros**: Official Ubuntu integration, automatic updates, GPG signed
**Cons**: Requires Launchpad account setup, 24-48 hour review

**Status**: [Planned] - PPA setup instructions coming soon

---

## Option 4: Self-Hosted APT Repository

For organizations or personal servers.

### Prerequisites

```bash
apt-ftparchive  # Usually in apt-utils package
dpkg-dev        # For package utilities
```

### Setup

```bash
# Clone repository
git clone https://github.com/otabekoff/senbrua.git
cd senbrua

# Generate Packages files
./setup-apt-repo.sh

# Commit to git
git add apt-repo/
git commit -m "chore: update APT repository"
git push
```

### Client Configuration

```bash
# Add your self-hosted repository
echo "deb [trusted=yes] https://your-apt-server.com/path/to/apt-repo focal main" | \
  sudo tee /etc/apt/sources.list.d/senbrua.list

sudo apt update
sudo apt install senbrua
```

---

## Supported Platforms

| Platform | Status | Notes |
|----------|--------|-------|
| Ubuntu 20.04 LTS | ✅ Tested | Focal Fossa |
| Ubuntu 22.04 LTS | ✅ Compatible | Jammy Jellyfish |
| Ubuntu 24.04 LTS | ✅ Compatible | Noble Numbat |
| Debian 11 | ✅ Compatible | Bullseye |
| Debian 12 | ✅ Compatible | Bookworm |
| Linux Mint 20+ | ✅ Compatible | Based on Ubuntu |

---

## Troubleshooting

### "Package not found" error

```bash
# Clear cache and retry
sudo apt clean
sudo apt update
sudo apt install senbrua
```

### Repository not accessible

```bash
# Test repository connectivity
curl -I https://raw.githubusercontent.com/otabekoff/senbrua/main/apt-repo/dists/focal/Release

# If failed, check:
# - Internet connectivity
# - Firewall rules
# - Repository URL in sources.list
```

### Dependency issues

```bash
# Show required dependencies
apt-cache depends senbrua

# Install missing dependencies
sudo apt install -f
```

### Remove repository

```bash
# Option 1: Remove specific repository
sudo rm /etc/apt/sources.list.d/senbrua.list
sudo apt update

# Option 2: Edit sources.list directly
sudo nano /etc/apt/sources.list
# (Remove senbrua lines, save, exit)
```

---

## Advanced: Building Your Own APT Repository

### Structure

```
apt-repo/
├── pool/
│   └── main/
│       └── s/
│           └── senbrua/
│               └── uz.mohirlab.senbrua_1.0.0-1_amd64.deb
└── dists/
    └── focal/
        ├── main/
        │   ├── binary-amd64/
        │   │   ├── Packages
        │   │   └── Packages.gz
        │   └── source/
        ├── Release
        └── Release.gpg (optional, with GPG signing)
```

### Automation with GitHub Actions

Create `.github/workflows/apt-release.yml`:

```yaml
name: Update APT Repository

on:
  release:
    types: [published]

jobs:
  update-apt:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Update APT repository
        run: |
          ./setup-apt-repo.sh
          git add apt-repo/
          git commit -m "ci: update APT repository for release"
          git push
```

---

## Installation Methods Comparison

| Method | Setup Time | Updates | Security | Complexity |
|--------|-----------|---------|----------|-----------|
| Direct .deb | 1 min | Manual | ✓ Checksum | Low |
| GitHub APT | 2 min | Automatic | ◐ Trusted | Low |
| Launchpad PPA | 5 min | Automatic | ✓ GPG signed | Medium |
| Self-hosted | 15 min | Auto (CI/CD) | ✓ Configurable | High |

---

## Getting Help

- **GitHub Issues**: https://github.com/otabekoff/senbrua/issues
- **GitHub Discussions**: https://github.com/otabekoff/senbrua/discussions
- **APT Repository Issues**: Report package problems on GitHub

---

## For Maintainers

### Updating the APT Repository

When releasing a new version:

1. Build Debian package
2. Place .deb in `apt-repo/pool/main/s/senbrua/`
3. Run `./setup-apt-repo.sh`
4. Commit changes: `git commit -m "chore: update APT repository to v1.x.x"`
5. Push to main branch

The repository will auto-update as users run `apt update`.

### Signing Packages with GPG

```bash
# Generate GPG key (one-time)
gpg --gen-key

# Export public key
gpg --armor --export YOUR_KEY_ID > pubkey.asc

# Sign Release file
gpg --armor --batch --default-key YOUR_KEY_ID --sign --detach-sign -o Release.gpg Release

# Users import key
wget https://your-repo/pubkey.asc
sudo apt-key add pubkey.asc
```

---

**Last Updated**: January 4, 2026
**Senbrua Version**: 1.0.0
