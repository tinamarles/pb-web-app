#!/bin/bash

# ========================================
# BACKEND COMMITS
# ========================================

# Commit 1: Backend - Add league member status change functionality
git add backend/leagues/permissions.py backend/leagues/services/status_change.py
git commit -m "feat(backend): add league member status change service and permissions" -m "- Add permissions.py for granular league access control" -m "- Add status_change.py service for handling member status transitions" -m "- Implement business logic for status validation and updates" -m "- Support role-based permissions for league management"

# Commit 2: Backend - Update league models and admin
git add backend/leagues/admin.py backend/leagues/models.py backend/public/constants.py
git commit -m "feat(backend): enhance league models and admin interface" -m "- Update LeagueEvent and LeagueMember models with new fields" -m "- Enhance admin interface for better league management" -m "- Update constants.py with new status values and choices" -m "- Add support for event member management" -m "- Improve model field configurations"

# Commit 3: Backend - Add league API endpoints
git add backend/leagues/serializers.py backend/leagues/urls.py backend/leagues/views.py
git commit -m "feat(backend): implement league member management API endpoints" -m "- Add serializers for league event members and status changes" -m "- Create endpoints for adding members to events" -m "- Add bulk status change endpoint for member management" -m "- Implement event member list filtering and permissions" -m "- Add comprehensive validation for member operations"

# Commit 4: Backend - Update core configuration
git add backend/core/urls.py backend/clubs/serializers.py backend/clubs/views.py .vscode/settings.json
git commit -m "chore(backend): update API routing and club endpoints" -m "- Update core/urls.py with new league endpoints" -m "- Enhance club serializers with additional fields" -m "- Update club views with improved permission handling" -m "- Update VSCode settings for better development experience"

# ========================================
# FRONTEND COMMITS  
# ========================================

# Commit 5: Frontend - Add admin event member management
git add frontend/components/admin/Events/AdminEventMembers.tsx frontend/components/admin/Events/AddMembersModal.tsx frontend/components/admin/Events/StatusChangeModal.tsx
git commit -m "feat(frontend): implement admin event member management" -m "- Add AdminEventMembers component with DataTable integration" -m "- Create AddMembersModal for adding members to events" -m "- Add StatusChangeModal for bulk status updates" -m "- Support member search, filtering, and selection" -m "- Implement optimistic UI updates with rollback on failure" -m "- Add comprehensive error handling and user feedback"

# Commit 6: Frontend - Add admin event tabs and navigation
git add frontend/components/admin/Events/AdminEventTabs.tsx frontend/components/admin/Events/AdminEventSessions.tsx frontend/components/admin/Events/AdminEventSchedule.tsx frontend/components/admin/Events/AdminEventAnnouncements.tsx frontend/components/admin/Events/AdminEventUpdate.tsx
git commit -m "feat(frontend): add admin event tabs with manage/update views" -m "- Create AdminEventTabs component for event management navigation" -m "- Add AdminEventSessions placeholder (schedule display)" -m "- Add AdminEventSchedule placeholder (time management)" -m "- Add AdminEventAnnouncements placeholder (communication)" -m "- Add AdminEventUpdate component for event editing" -m "- Support tab-based navigation within event management"

# Commit 7: Frontend - Refactor admin event routing
git add -A frontend/app/\(sidebarLayout\)/admin/\[clubId\]/events/\[eventId\]/ 
git rm frontend/app/\(sidebarLayout\)/admin/\[clubId\]/events/\[eventId\]/page.tsx
git rm frontend/components/admin/Events/AdminEventDetail.tsx
git add frontend/app/\(sidebarLayout\)/admin/\[clubId\]/events/list/page.tsx frontend/components/admin/Events/AdminEventsList.tsx
git commit -m "refactor(frontend): restructure admin event routing with parallel routes" -m "- Remove old admin event detail page (single page approach)" -m "- Add (manage) parallel route for event management tabs" -m "- Add update route for event editing" -m "- Update AdminEventsList with improved table configuration" -m "- Fix routing to avoid parent/child page conflicts" -m "- Align with parallel routes architecture pattern"

# Commit 8: Frontend - Add admin members routing
git add -A frontend/app/\(sidebarLayout\)/admin/members/
git commit -m "feat(frontend): add admin members routing placeholder" -m "- Add admin/members directory structure" -m "- Prepare for future member management features" -m "- Align with club-centric admin routing pattern"

# Commit 9: Frontend - Add DataTable handlers and improve table system
git add frontend/data/tableHandlers.tsx frontend/data/tableConfig.tsx frontend/lib/tableTypes.ts frontend/ui/dataTable.tsx
git commit -m "feat(frontend): enhance DataTable with handlers and improved configuration" -m "- Add tableHandlers.tsx for reusable action handlers" -m "- Update tableConfig.tsx with event member configurations" -m "- Enhance tableTypes.ts with new type definitions" -m "- Improve dataTable.tsx with better bulk actions and selection" -m "- Support optimistic updates and error recovery" -m "- Follow DRY principle: centralized handler logic"

# Commit 10: Frontend - Add league API endpoints and routing
git add frontend/app/api/league/ frontend/lib/routes.ts
git commit -m "feat(frontend): add league API routes and centralized route definitions" -m "- Create /api/league endpoints for member management" -m "- Add add-members endpoint for bulk member addition" -m "- Add change-status endpoint for status updates" -m "- Create routes.ts for centralized route path management" -m "- Support frontend-to-backend API communication"

# Commit 11: Frontend - Update core libraries and utilities
git add frontend/lib/actions.ts frontend/lib/clientActions.ts frontend/lib/hooks.ts frontend/lib/dateUtils.ts frontend/lib/constants.ts frontend/lib/definitions.ts frontend/lib/apiResponseTypes.ts
git commit -m "feat(frontend): update core libraries with new utilities and types" -m "- Add new server actions for league member operations" -m "- Update clientActions with status change functionality" -m "- Add useEventMembers hook for member data management" -m "- Enhance dateUtils with new formatting functions" -m "- Update constants with league event status values" -m "- Add new type definitions for event members and modals" -m "- Update apiResponseTypes with league API responses"

# Commit 12: Frontend - Update UI components
git add frontend/ui/accordion.tsx frontend/ui/button.tsx frontend/ui/modal.tsx frontend/ui/dateDisplay.tsx frontend/ui/periodDate.tsx frontend/ui/index.tsx
git commit -m "feat(frontend): add accordion and enhance UI components" -m "- Add accordion.tsx component for collapsible content" -m "- Update button.tsx with new variants and improvements" -m "- Enhance modal.tsx with better accessibility and UX" -m "- Improve dateDisplay.tsx with additional formatting options" -m "- Update periodDate.tsx for better date range display" -m "- Update barrel exports in index.tsx"

# Commit 13: Frontend - Fix sidebar fixed positioning
git add frontend/app/\(sidebarLayout\)/layout.tsx frontend/app/globals.css frontend/ui/sidebar.tsx
git commit -m "fix(frontend): implement proper sidebar sticky positioning" -m "- Add sidebar-margin class to page__content for fixed sidebar" -m "- Update globals.css with responsive margin calculations" -m "- Prepare for sidebar position: fixed implementation" -m "- Fix sidebar scrolling behavior on all screen sizes" -m "- Support tablet and desktop breakpoints"

# Commit 14: Frontend - Update dashboard and profile components
git add frontend/components/dashboard/overviewPage.tsx frontend/components/profile/ProfileForm.tsx frontend/components/profile/membershipsPage.tsx
git commit -m "refactor(frontend): update dashboard and profile components" -m "- Update overviewPage with improved data handling" -m "- Enhance ProfileForm with better validation" -m "- Update membershipsPage with improved member display" -m "- Align components with new API patterns"

# Commit 15: Frontend - Update event components
git add frontend/components/event/EventDetailsClientPage.tsx frontend/components/event/SessionCard.tsx
git commit -m "refactor(frontend): improve event detail and session components" -m "- Update EventDetailsClientPage with better error handling" -m "- Enhance SessionCard with improved date display" -m "- Align with new dateUtils formatting functions"

# Commit 16: Frontend - Update navigation
git add frontend/data/navigation.ts
git commit -m "refactor(frontend): update navigation with new admin routes" -m "- Add admin event management routes to navigation" -m "- Update sidebar navigation structure" -m "- Align with new parallel routes architecture"

# Commit 17: Frontend - Add commit script
git add commit.sh
git commit -m "chore: add commit script for structured git workflow" -m "- Add commit.sh for organized multi-commit process" -m "- Separate backend and frontend commits logically" -m "- Support feature development workflow"

echo "✅ All commits created successfully!"
echo ""
echo "📊 Summary:"
echo "  - Backend: 4 commits (status change, models, API, config)"
echo "  - Frontend: 13 commits (admin events, DataTable, routing, UI)"
echo "  - Total: 17 commits"
