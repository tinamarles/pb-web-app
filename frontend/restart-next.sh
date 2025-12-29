#!/bin/bash

echo "🔄 Restarting Next.js..."
echo ""

# Step 1: Kill Next.js processes
echo "🔪 Stopping dev server..."
pkill -f "next dev" || true
sleep 2  # ✅ Wait longer for processes to die

# Step 2: Clear caches more thoroughly
echo "🧹 Clearing caches..."
rm -rf .next
rm -rf .turbo  # ✅ Also clear Turbopack cache!
echo "✅ Caches cleared!"
echo ""

# Step 3: Check node_modules
echo "🔍 Checking node_modules..."
if [ ! -d "node_modules/@next/env" ]; then
  echo "⚠️  node_modules corrupted!"
  echo "📦 Reinstalling dependencies..."
  npm install
  echo "✅ Dependencies reinstalled!"
  echo ""
else
  echo "✅ node_modules OK!"
  echo ""
fi

# Step 4: Restart
echo "🚀 Starting dev server..."
npm run dev