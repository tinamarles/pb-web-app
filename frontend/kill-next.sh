#!/bin/bash
echo "🔪 Killing Next.js dev server..."

# Kill by port (safest)
lsof -ti:3000 | xargs kill -9 2>/dev/null

# Also kill by process name (backup)
pkill -9 -f "next dev" 2>/dev/null

echo "✅ Next.js processes killed!"
echo ""
echo "🧹 Clearing caches..."

# Clear caches
rm -rf .next
rm -rf node_modules/.cache
find /var/folders -name "next-*" -type f -delete 2>/dev/null

echo "✅ Caches cleared!"
echo ""
echo "Run 'npm run dev' to restart."