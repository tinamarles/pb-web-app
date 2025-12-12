/**
 * Centralized Action Handlers for Module Component
 * 
 * All button click handlers are defined here to keep the Module component clean.
 * Each handler function should match the actionId from the module data.
 * * DEPENDENCY INJECTION PATTERN:
 * - This file uses dependency injection to access auth context
 * - Providers.tsx calls setHandlerDependencies() to inject the isMemberUser function
 * - Handlers can then use dependencies.isMemberUser() to check user type
 */

// Type for creating handlers with dependencies (user, router, etc.)
export type HandlerDependencies = { 
  isMemberUser?: boolean; 
};

// Storage for injected dependencies
let dependencies: HandlerDependencies = {};

/**
 * Inject dependencies from Providers.tsx
 * This allows handlers to access auth context without circular imports
 * 
 * @param deps - Object containing isMemberUser function
 */
export const setHandlerDependencies = (deps: HandlerDependencies) => {
  dependencies = deps;
};

// Type for handler functions
export type ActionHandler = () => void;

// Handler functions object - maps actionId to function
export const actionHandlers: Record<string, ActionHandler> = {
  
  // Auth related actions
  handleSignIn: () => {
    console.log('🔐 Navigate to Sign In');
    // Later: setCurrentPage("auth") with signin view
  },
  
  handleSignUp: () => {
    console.log('✨ Navigate to Sign Up'); 
    // Later: setCurrentPage("auth") with signup view
  },
  
  handleSignOut: () => {
    console.log('👋 Navigate to Landing');
    // Later: setCurrentPage("landing") and clear user
  },
  
  // Dashboard actions
  handleExport: () => {
    console.log('📤 Export Data');
    // Later: trigger export functionality
  },
  
  handleCreateLeague: () => {
    console.log('🏆 Create New League');
    // Later: open create league modal
  },
  
  handleSettings: () => {
    console.log('⚙️ Open Settings');
    // Later: navigate to settings page
  },
  
  handleSave: () => {
    console.log('💾 Save Changes');
    // Later: save functionality
  },
  
  // Profile actions
  handleEditProfile: () => {
    console.log('✏️ Edit Profile');
    // Later: enable edit mode or navigate to edit page
  },
  
  handleChangePassword: () => {
    console.log('🔑 Change Password');
    // Later: open change password modal
  },
  
  // Admin actions
  handleManageUsers: () => {
    console.log('👥 Manage Users');
    // Later: navigate to user management
  },
  
  handleViewReports: () => {
    console.log('📊 View Reports');
    // Later: navigate to reports dashboard
  },
  
  // League management actions
  handleJoinLeague: () => {
    console.log('🎾 Join League');
    // Later: open join league modal
  },
  
  handleLeaveLeague: () => {
    console.log('🚪 Leave League');
    // Later: confirm and leave league
  },

  /**
   * Navigate to Dashboard (conditional routing based on user type)
   * - Member users (with club affiliations) → /dashboard/member
   * - Public users (no affiliations) → /dashboard/public
   */
  handleNavigateToDashboard: () => {
    console.log('📊 Navigate to Dashboard');
    
    // Check if we have the isMemberUser value (injected from Providers)
    if (dependencies.isMemberUser !== undefined) {
      const isMember = dependencies.isMemberUser; // ← Changed: Now it's a value, not a function call
      const route = isMember ? '/dashboard/overview' : '/feed/discover';
      
      console.log(`🎯 User type: ${isMember ? 'Member' : 'Public'} → Navigating to: ${route}`);
      
      // In Next.js, use router.push(route) from next/navigation
      // For now, using window.location as placeholder
      window.location.href = route;
    } else {
      // Fallback if dependency not injected yet
      console.warn('⚠️ isMemberUser value not available. Make sure Providers.tsx is calling setHandlerDependencies()');
      window.location.href = '/dashboard';
    }
  },

};

/**
 * Execute an action handler by actionId
 * 
 * @param actionId - The action identifier from module data
 * @returns void
 */
export const executeAction = (actionId: string): void => {
  // Get the handler function
  const handler = actionHandlers[actionId];
  
  if (handler) {
    // Execute the handler
    handler();
  } else {
    // Log unknown actions for debugging
    console.warn(`⚠️ Unknown action: ${actionId}. Available actions:`, Object.keys(actionHandlers));
  }
};

/**
 * Check if an action handler exists
 * 
 * @param actionId - The action identifier to check
 * @returns boolean indicating if handler exists
 */
export const hasActionHandler = (actionId: string): boolean => {
  return actionId in actionHandlers;
};

/**
 * Get all available action IDs
 * 
 * @returns Array of all registered action IDs
 */
export const getAvailableActions = (): string[] => {
  return Object.keys(actionHandlers);
};