'use client';
import { memo, useMemo } from "react";
import Link from "next/link";
import { Icon, Avatar, Button, MenuItem, Sheet } from "@/ui";
import { useAuth } from "@/providers/AuthUserProvider";
import { MORE_MENU_SECTIONS, MORE_MENU_FOOTER_LINKS } from "@/data";
import { calculateBadge } from "@/lib/badgeUtils";
import { SidebarItem } from "@/ui";

export interface MoreMenuSheetProps {
    isOpen: boolean;
    onClose: () => void;
}

/**
 * MoreMenuSheet - Sheet component for mobile/tablet "More" menu
 * 
 * Slides from bottom (mobile < 640px) / right (tablet >= 640px)
 * Uses existing sheet CSS classes from globals.css
 * Reuses THREE LAYER ARCHITECTURE from MorePage:
 * - LAYER 1 (Definition): NavItem[] from navigation.ts (semantic - NotificationTypeValue)
 * - LAYER 2 (Transform): This component transforms to SidebarItem[] (concrete - number + BadgeVariant)
 * - LAYER 3 (Display): MenuItem receives SidebarItem and just renders (DUMB)
 * 
 * USAGE:
 * <MoreMenuSheet isOpen={isOpen} onClose={() => setIsOpen(false)} />
 */

export const MoreMenuSheet = memo(function MoreMenuSheet({
    isOpen,
    onClose
}: MoreMenuSheetProps) {
    const { user, logout, notifications } = useAuth();

    // ✅ LAYER 2: Transform NavSection[] → sections with SidebarItem[]
    // Memoize to prevent unnecessary recalculations
    const transformedSections = useMemo(() => {
        return MORE_MENU_SECTIONS.map((section) => ({
            ...section,
            items: section.items.map((item) => {
                // Calculate badge using unified logic
                const badge = calculateBadge(item.badgeCount, notifications);
                
                // Transform NavItem → SidebarItem (concrete props)
                return {
                    icon: item.icon,
                    label: item.label,
                    href: item.href,
                    badgeCount: badge?.count,      // ✅ number (concrete)
                    badgeVariant: badge?.variant,  // ✅ BadgeVariant (concrete)
                    disabled: item.disabled,
                } as SidebarItem;
            }),
        }));
    }, [notifications]);

    // Handle sign out
    const handleSignOut = async () => {
        await logout();
        onClose();
    };

    // Handle menu item click - close sheet on navigation
    const handleMenuItemClick = () => {
        onClose();
    };

    if (!user) return null;

    // ========================================
    // RENDER
    // ========================================
    return (
        <Sheet 
            open={isOpen}
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
            title="More"
            mode="responsive-right"
        >
            <div className="more-menu__top-section">
                {/* Profile Card - Centered with flex container */}
                <Link 
                    href="/profile/details" 
                    className="more-menu__profile-card"
                    onClick={handleMenuItemClick}
                >
                    <Avatar
                        size="lg"
                        src={user.profilePictureUrl || undefined}
                        name={
                            user.firstName && user.lastName
                            ? `${user.firstName} ${user.lastName}`
                            : user.username
                        }
                        className="avatar-container"
                    />
                    <div className="flex-1">
                        <p className="title-md emphasized">
                            {user.firstName && user.lastName
                            ? `${user.firstName} ${user.lastName}`
                            : user.username}
                        </p>
                        <p className="body-sm text-primary">View Profile</p>
                    </div>
                    <Icon
                        name="chevronright"
                        className="icon-md text-on-surface-variant"
                    />
                </Link>

                {/* Sign Out Button - Centered */}
                <Button
                    onClick={handleSignOut}
                    variant="outlined"
                    icon="signout"
                    label="Sign Out"
                    size="sm"
                />
            </div>
            {/* Menu Sections - Single map! */}
            {/* ✅ LAYER 3: Pass SidebarItem[] to MenuItem (concrete props) */}
            {transformedSections.map((section, sectionIndex) => (
                <div key={section.id} className="more-menu__section">
                    {/* Separator before section (except first section) - matches sidebar.tsx pattern */}
                    {section.separator && sectionIndex > 0 && (
                        <div className="separator" />
                    )}
                
                    <div className="more-menu__section-header">
                        <div className="more-menu__section-header-inner">
                            <h3 className="more-menu__section-title">{section.title}</h3>
                        </div>
                    </div>
                    <div className="more-menu__section-content">
                        {section.items.map((item) => (
                            <MenuItem
                                key={item.href || item.label}
                                context="moremenu"
                                item={item}
                                showTrailing
                                trailingIcon="chevronright"
                                onClick={handleMenuItemClick}
                            />
                        ))}
                    </div>
                </div>
            ))}
            {/* Separator before footer */}
            <div className="separator" />

            {/* Footer Links */}
            <div className="more-menu__footer-links mb-lg">
                {MORE_MENU_FOOTER_LINKS.map((link) => (
                <Link
                    key={link.href}
                    href={link.href}
                    className="more-menu__footer-link"
                    onClick={handleMenuItemClick}
                >
                    {link.label}
                </Link>
                ))}
            </div>
        </Sheet>
    );
});