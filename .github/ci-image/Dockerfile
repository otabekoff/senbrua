FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

# Install core build deps used across CI: meson, ninja, pkg-config, gjs, gtk, gstreamer, desktop utils
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    build-essential \
    meson \
    ninja-build \
    pkg-config \
    gettext \
    python3-pip \
    python3-setuptools \
    gjs \
    libgjs-1.0-dev \
    libgtk-4-dev \
    libadwaita-1-dev \
    libgstreamer1.0-dev \
    libgstreamer-plugins-bad1.0-dev \
    libgstreamer-plugins-base1.0-dev \
    libgstreamer-plugins-good1.0-dev \
    gir1.2-gstreamer-1.0 \
    gir1.2-gst-plugins-base-1.0 \
    gir1.2-gst-plugins-bad-1.0 \
    gir1.2-adw-1 \
    gir1.2-gtk-4.0 \
    desktop-file-utils \
    appstream \
    dconf-cli \
    pkgconf \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

# Install meson via pip to ensure a recent version
RUN python3 -m pip install --no-cache-dir --upgrade pip setuptools meson

# Create a non-root user for running CI tasks
RUN useradd -m -u 1000 ciuser
USER ciuser
WORKDIR /home/ciuser

# Ensure local pip bin is on PATH
ENV PATH=/home/ciuser/.local/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

CMD ["/bin/bash"]
