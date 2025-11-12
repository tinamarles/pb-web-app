"use client";
import { memo, ReactNode } from "react";
import { Header, HeaderProps, LinkItem } from "./header";
import { Footer } from "./footer";
import { ModuleConfig, apiResponseModule } from "@/app/data/apiResponseModule";
import {
  Icon,
  ButtonVariant,
  ButtonSize,
  ButtonItem,
  NavigationButtonItem,
  LogoConfig,
} from "@/app/ui";

// Import action handlers for dynamic function calling
import { executeAction } from "./utils";

export interface ModuleProps {
  type: string; // Module type (matches JSON data)
  children: ReactNode; // Page content to render inside module
  title?: string; // Optional title override for dashboard modules
}

export const Module = memo(function Module({
  type,
  children,
  title,
}: ModuleProps) {
  // 1. Get data from TypeScript config based on type
  const getModuleData = (moduleType: string): ModuleConfig => {
    console.log("🔍 Module: Looking for type:", moduleType);
    console.log(
      "📋 Available configs:",
      apiResponseModule.map((c) => c.type)
    );

    const config = apiResponseModule.find((m) => m.type === moduleType);
    if (config) {
      console.log("✅ Found config for:", moduleType);
      return config;
    }

    console.log(
      "⚠️ Config not found for:",
      moduleType,
      "- falling back to landing"
    );
    const fallbackConfig = apiResponseModule.find((m) => m.type === "landing");

    if (!fallbackConfig) {
      console.error("❌ Critical: No landing fallback found, using default");
      // Should never happen with our TypeScript data, but safety first
      return {
        id: 0,
        type: "default",
        title: null,
        showLogo: true,
        navigation: [],
        search: false,
        actions: [],
      };
    }

    return fallbackConfig;
  };

  // 2. Dynamic action handler - delegates to utils/action-handlers
  const handleAction = (actionId: string) => {
    executeAction(actionId);
  };

  // 3. Prep headerProps with JSON data
  const prepHeaderProps = (): HeaderProps => {
    const moduleData = getModuleData(type);

    // Convert JSON navigation to LinkItem[] format (with submenu support)
    const links: LinkItem[] = (moduleData.navigation || []).map((nav) => ({
      label: nav.label || "Unknown",
      href: nav.url || "#",
      icon: nav.icon || undefined, // Pass string icon name, not component
      active: false,
      disabled: false,
      submenu: nav.submenu
        ? nav.submenu.map((sub) => ({
            icon: sub.icon,
            label: sub.label,
            url: sub.url,
          }))
        : undefined,
    }));

    // Convert JSON actions to ButtonItem[] format with onClick handlers
    const buttons: ButtonItem[] = (moduleData.actions || []).map((action) => ({
      label: action.label || "Action",
      variant: (action.variant as ButtonVariant) || "subtle",
      size: (action.size as ButtonSize) || "md",
      icon: action.icon || undefined,
      onClick: () => handleAction(action.onClick || "unknown"),
      // disabled: action.disabled || false
    }));

    // Convert JSON navigationButtons to NavigationButtonItem[] format (no onClick, just href)
    const navigationButtons: NavigationButtonItem[] = (moduleData.navigationButtons || []).map(navBtn => ({
      label: navBtn.label,
      variant: (navBtn.variant as ButtonVariant) || 'subtle',
      size: (navBtn.size as ButtonSize) || 'md',
      icon: navBtn.icon || undefined,
      href: navBtn.href,
    }));

    // Build header configuration
    const headerProps: HeaderProps = {
      logo: moduleData.showLogo ? { variant: "full", size: "md" } : undefined,
      title: title || moduleData.title || undefined,
      links,
      buttons,
      navigationButtons,
      showSearch: moduleData.search || false,
      showHelp: moduleData.help || false,
      showNotifications: moduleData.notifications || false,
      showAvatar: moduleData.avatar || false,
    };

    return headerProps;
  };

  // 4. Render Module with Header and Footer
  const headerProps = prepHeaderProps();
  console.log("🎯 Module: Rendering with headerProps:", headerProps);

  return (
    <div className="module-container">
      <Header {...headerProps} />
      {children}
      <Footer />
    </div>
  );
});
