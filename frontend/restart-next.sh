#!/bin/bash

echo "🔥 NUCLEAR RESTART - Killing ALL caches..."

# Kill dev server
echo "🔪 Stopping dev server..."
pkill -f "next dev" || true
sleep 2

# Clear ALL the caches
echo "🧹 Clearing ALL caches (including Turbopack)..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf /tmp/next-*
rm -rf /var/folders/*/T/next-*
rm -rf ~/Library/Caches/next-*

# Clear Turbopack database files
echo "💣 Nuking Turbopack cache..."
find .next -name "*.sst" -delete 2>/dev/null || true
find .next -name "*.meta" -delete 2>/dev/null || true

echo "✅ All caches DESTROYED!"

# Check node_modules
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo "🚀 Starting fresh dev server..."
npm run dev