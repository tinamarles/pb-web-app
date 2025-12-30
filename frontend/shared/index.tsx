// export { Header,
//         HeaderProps,
//         LinkItem } from './header';
export { Footer } from "./footer";
export {
  Header,
  type HeaderProps,
  type LinkItem,
  type SubmenuItem,
} from "./header";
export { Module } from "./module";
export { ModuleClientOnly } from './ModuleClientOnly';
export {
  BottomNav,
  type BottomNavItem,
  type BottomNavProps,
} from "./bottomNav";

// TYPES
export type { ActionHandler } from "./utils";
export type { ModuleProps } from "./types";

// UTILITIES
// Export utility functions

export {
  actionHandlers,
  executeAction,
  getAvailableActions,
  hasActionHandler,
  setHandlerDependencies,
} from "./utils";
