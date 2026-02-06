#!/bin/bash

echo "🔧 Fixing Next.js..."

# Step 1: Stop any running dev servers (silently)
pkill -f "next dev" 2>/dev/null
sleep 1

# Step 2: Delete the cache folder (wait if slow)
echo "🗑️  Deleting .next folder (this might take a minute)..."
rm -rf .next

# Step 3: Clean other caches
rm -rf node_modules/.cache .turbo 2>/dev/null

echo "✅ Ready! Now run: npm run dev"