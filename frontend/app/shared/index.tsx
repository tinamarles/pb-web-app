// export { Header,
//         HeaderProps,
//         LinkItem } from './header';
export { Footer } from "./footer";
export { Header, type HeaderProps, type LinkItem, type SubmenuItem } from './header';
export { Module } from './module';

// TYPES
export type {
    ActionHandler,
} from './utils';

// UTILITIES
// Export utility functions

export { actionHandlers,
         executeAction,
         getAvailableActions,
         hasActionHandler,
         setHandlerDependencies
       } from './utils';
