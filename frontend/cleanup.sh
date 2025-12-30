#!/bin/bash
# Nuclear Next.js cleanup script

echo "🔪 Killing Node processes..."
pkill -9 node

echo "🧹 Cleaning build artifacts..."
rm -rf .next
rm -rf .turbo
rm -rf package-lock.json

echo "🗑️  Removing node_modules (this takes a minute)..."
mkdir empty_temp
rsync -a --delete empty_temp/ node_modules/ 2>/dev/null
rm -rf empty_temp node_modules

echo "✅ Cleanup complete! Run 'npm install' to reinstall."