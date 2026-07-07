#!/bin/sh
set -e

# Keep node_modules in sync when package.json / lockfile change (dev bind-mount setup).
npm ci

exec "$@"
