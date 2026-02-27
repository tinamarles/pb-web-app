#!/bin/bash

# ========================================
# BACKEND COMMITS
# ========================================

# Commit 1: Backend - Role model refactor (make club-specific)
git add backend/clubs/models.py \
        backend/clubs/migrations/0014_add_club_to_role.py \
        backend/clubs/migrations/0015_create_club_specific_roles.py \
        backend/clubs/migrations/0016_update_membership_roles.py \
        backend/clubs/migrations/0017_delete_global_roles.py \
        backend/clubs/migrations/0018_make_club_required.py \
        backend/clubs/signals.py \
        backend/clubs/apps.py
git commit -m "refactor(backend): migrate Role model from global to club-specific" \
           -m "- Add club foreign key to Role model (nullable first)" \
           -m "- Create club-specific roles for all existing clubs (5 default roles)" \
           -m "- Migrate ClubMembership.roles relationships to club-specific roles" \
           -m "- Delete old global roles and make club FK required" \
           -m "- Add signals to auto-create 5 default roles when new clubs created" \
           -m "- Split migration 4 into 4A/4B to avoid PostgreSQL trigger errors" \
           -m "- See: /nextJS/08-backend/2026-02-27-ROLE-MIGRATION-WALKTHROUGH.md"

# Commit 2: Backend - Admin panel enhancements with data load buttons
git add backend/clubs/admin.py \
        backend/leagues/admin.py \
        backend/public/admin.py \
        backend/users/admin.py \
        backend/clubs/templates/ \
        backend/leagues/templates/ \
        backend/notifications/templates/ \
        backend/public/templates/ \
        backend/users/templates/ \
        backend/setup_admin_templates.py
git commit -m "feat(backend): comprehensive admin panel enhancements" \
           -m "- Add 'Load from JSON' buttons for all major models" \
           -m "- Create custom admin templates with load buttons" \
           -m "- Add bulk update skill level action for ClubMemberships" \
           -m "- Enhance filtering: club, role, level, membership type filters" \
           -m "- Improve list displays with visual indicators and counts" \
           -m "- Add setup_admin_templates.py script for template creation"

# Commit 3: Backend - API refactor (serializers, views, filters, permissions)
git add backend/clubs/serializers.py \
        backend/clubs/views.py \
        backend/clubs/urls.py \
        backend/clubs/permissions.py \
        backend/clubs/filters.py \
        backend/leagues/serializers.py \
        backend/leagues/views.py \
        backend/leagues/urls.py \
        backend/leagues/filters.py \
        backend/leagues/models.py \
        backend/notifications/serializers.py \
        backend/notifications/views.py \
        backend/notifications/urls.py \
        backend/notifications/filters.py \
        backend/notifications/permissions.py \
        backend/courts/serializers.py \
        backend/users/serializers.py \
        backend/core/urls.py
git commit -m "refactor(backend): cleanup and enhance API layer across modules" \
           -m "- Update serializers for clubs, leagues, notifications, courts, users" \
           -m "- Add filters.py for clubs and notifications modules" \
           -m "- Update permissions to use club-specific roles" \
           -m "- Enhance viewsets with improved filtering and pagination" \
           -m "- Update URL patterns and routing" \
           -m "- Add league participant bulk-add endpoints"

# Commit 4: Backend - Test data and backups
git add backend/data/test/ \
        backend/clubs/backup/ \
        backend/leagues/backup/ \
        backend/notifications/backup/
git commit -m "chore(backend): add test data and backup directories" \
           -m "- Create test data fixtures for development" \
           -m "- Add backup directories for migration safety" \
           -m "- Support local development and testing workflows"

# Commit 5: Backend - VSCode settings
git add .vscode/settings.json
git commit -m "chore: update VSCode settings for Python/Django development"

# ========================================
# FRONTEND COMMITS
# ========================================

# Commit 6: Frontend - Error handling infrastructure
git add frontend/lib/apiErrors.ts \
        frontend/lib/errorHandling.ts \
        frontend/lib/validationErrors.ts
git commit -m "feat(frontend): add comprehensive error handling infrastructure" \
           -m "- Create apiErrors.ts for API error type definitions" \
           -m "- Add errorHandling.ts with error parsing utilities" \
           -m "- Add validationErrors.ts for form validation errors" \
           -m "- Support centralized error handling across app"

# Commit 7: Frontend - API routes and core actions
git add frontend/app/api/auth/user/route.ts \
        frontend/app/api/league/[leagueId]/participants/bulk-add/route.ts \
        frontend/app/api/league/participation/[participationId]/status/route.ts \
        frontend/lib/actions.ts \
        frontend/lib/clientActions.ts \
        frontend/templates/Routes.ts
git commit -m "feat(frontend): update API routes and server actions" \
           -m "- Update auth/user route with improved error handling" \
           -m "- Add league participant bulk-add route" \
           -m "- Add league participation status change route" \
           -m "- Update actions.ts with new server actions" \
           -m "- Enhance clientActions.ts with league operations" \
           -m "- Add Routes.ts template for route definitions"

# Commit 8: Frontend - Type definitions and API responses
git add frontend/lib/definitions.ts \
        frontend/lib/apiResponseTypes.ts \
        frontend/lib/badgeUtils.ts
git commit -m "refactor(frontend): update type definitions and utilities" \
           -m "- Update definitions.ts with club-specific role types" \
           -m "- Enhance apiResponseTypes.ts with league API responses" \
           -m "- Update badgeUtils.ts with new status badge helpers" \
           -m "- Align types with backend API changes"

# Commit 9: Frontend - Club components
git add frontend/app/club/[clubId]/home/page.tsx \
        frontend/app/club/[clubId]/page.tsx \
        frontend/app/event/my-clubs/page.tsx \
        frontend/components/club/ClubCard.tsx \
        frontend/components/club/ClubDetailsClientPage.tsx \
        frontend/components/club/ClubListClientPage.tsx
git commit -m "refactor(frontend): update club components and pages" \
           -m "- Update club pages with improved data fetching" \
           -m "- Enhance ClubCard with better visual indicators" \
           -m "- Update ClubDetailsClientPage with error handling" \
           -m "- Improve ClubListClientPage with loading states"

# Commit 10: Frontend - Dashboard and admin components
git add frontend/components/dashboard/DashboardSidebar.tsx \
        frontend/components/dashboard/overviewPage.tsx \
        frontend/components/admin/AdminSidebar.tsx \
        frontend/components/admin/Events/AdminEventMembers.tsx
git commit -m "refactor(frontend): update dashboard and admin components" \
           -m "- Update DashboardSidebar with new navigation items" \
           -m "- Enhance overviewPage with improved data display" \
           -m "- Update AdminSidebar with club-based filtering" \
           -m "- Improve AdminEventMembers with better member management"

# Commit 11: Frontend - Event components
git add frontend/components/event/PlayersModal.tsx
git commit -m "refactor(frontend): update event components" \
           -m "- Enhance PlayersModal with improved UX" \
           -m "- Add better error handling and loading states"

# Commit 12: Frontend - Navigation and data
git add frontend/data/navigation.ts
git commit -m "refactor(frontend): update navigation data structure" \
           -m "- Update navigation.ts with new admin routes" \
           -m "- Align with club-centric architecture"

# Commit 13: Frontend - UI components
git add frontend/ui/menuItem.tsx \
        frontend/ui/sidebar.tsx
git commit -m "refactor(frontend): update UI components" \
           -m "- Update menuItem.tsx with improved active state handling" \
           -m "- Enhance sidebar.tsx with better responsive behavior"

# Commit 14: Frontend - Global styles
git add frontend/app/globals.css
git commit -m "style(frontend): update global styles with design system tokens" \
           -m "- Update spacing, colors, and typography tokens" \
           -m "- Align with team design system specifications" \
           -m "- Ensure consistent styling across all components"

echo ""
echo "✅ All commits created successfully!"
echo ""
echo "📊 Summary:"
echo "  - Backend: 5 commits (role refactor, admin, API, test data, config)"
echo "  - Frontend: 9 commits (errors, routes, types, components, styles)"
echo "  - Total: 14 commits"
echo ""
echo "🔍 Git log preview:"
git log --oneline -14 --no-pager
