#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR="$ROOT_DIR/builddir"
APP_BINARY="$BUILD_DIR/src/uz.mohirlab.senbrua"
GJS_BIN="${GJS:-$(command -v gjs)}"

if [[ ! -d "$BUILD_DIR" ]]; then
  echo "Build directory not found. Run 'meson setup builddir' first." >&2
  exit 1
fi

meson compile -C "$BUILD_DIR"

cleanup() {
  if [[ -n "${child_pid-}" ]]; then
    kill -INT "$child_pid" 2>/dev/null || true
    wait "$child_pid" 2>/dev/null || true
  fi
}
trap cleanup INT TERM

if [[ -z "$GJS_BIN" ]]; then
  echo "gjs is required in PATH" >&2
  exit 1
fi

env MESON_SOURCE_ROOT="$ROOT_DIR" MESON_BUILD_ROOT="$BUILD_DIR" \
  MESON_SUBDIR=src "$GJS_BIN" -m "$APP_BINARY" &
child_pid=$!
wait "$child_pid"
