'use client';
import { EmptyState } from '@/components';
import { useAuth } from '@/providers/AuthUserProvider';
import { useState } from 'react';
import { type MemberUser,type ClubMembership } from '@/lib/definitions';
import { Avatar, Button, Icon, Badge, Sheet } from '@/ui';
import { RoleTypeLabels, RoleBadgeVariants, RoleType } from '@/lib/constants';
import { getMembershipBadgeVariant } from '@/lib/badgeUtils';
import Link from "next/link";

export function MembershipsPage() {

    // ========================================
    // STATE & DATA
    // ========================================
    const { notifications } = useAuth();
    const { user, isMemberUser } = useAuth();
    const [selectedMembershipId, setSelectedMembershipId] = useState<number | null>(null);
    
    // Check if AuthProvider has loaded user yet
    if (!user) {
        return (
            <div className='container mx-auto min-w-1/2 bg-surface-container-highest p-md rounded-md border border-outline'>
                <p className='title-md emphasized'>Loading memberships...</p>
            </div>
        )
    }

    // Get all memberships
    const memberships = isMemberUser
        ? (user as MemberUser).clubMemberships
        : [];

    const hasMemberships = memberships.length > 0

    // Select the first membership by default
    let selectedMembership = null;

    if (hasMemberships) {
        selectedMembership = selectedMembershipId
            ? memberships.find(m => m.id === selectedMembershipId)
            : memberships[0];
    }

    // ========================================
    // EVENT HANDLERS
    // ========================================

    // Handle if the user card clicks on a membership card
    const handleSelectMembership = (id: number) => {
        setSelectedMembershipId(id);
    };

    const handleCloseMembership = () => {
        setSelectedMembershipId(null);
    }

    // ========================================
    // MEMBERSHIPS LIST (INSIDE - has access to memberships & notifications!)
    // ========================================
    function MembershipsList ({
        selectedMembershipId,
        onSelect
    }: {
        selectedMembershipId: number | null;
        onSelect: (id: number) => void;    
    }) {
        return (
            <>
                {memberships.map((membership) => {
                const badgeVariant = getMembershipBadgeVariant(membership.club.id, notifications);
                const isSelected = selectedMembershipId === membership.id;
                return (
                <div 
                    key={membership.id} 
                    className={`panel-list-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => onSelect(membership.id!)}
                >
                    <Avatar
                        src={membership.club.logoUrl || undefined}
                        name={membership.club.name}
                        size="sm"
                        className="rounded-sm"
                    />
                    {/* Content */}
                    <div className='flex flex-col w-full'>
                        <div className='flex gap-sm items-center'>
                            <div className='flex flex-1 grow gap-sm'>
                                <p className='title-sm emphasized'>{membership.club.shortName}</p>
                                {membership.isPreferredClub && (
                                    <Icon name="star" className="text-tertiary fill-tertiary" />
                                )}
                                {/* 🚨 NEW: Error/Warning Badge */}
                                {badgeVariant && (
                                    <Icon name={`${badgeVariant}`} size='sm' className={`text-${badgeVariant}`}/>                       
                                )}
                            </div>
                            {/* Manager Badge */} 
                            {(membership.canManageClub || membership.canManageMembers) && (
                                <Badge
                                    variant={RoleBadgeVariants[RoleType.ADMIN]}
                                    label={RoleTypeLabels[RoleType.ADMIN]}
                                    className="w-auto"
                                />
                            )}
                            <Icon 
                                name='chevronright'
                                size='md'
                            />
                        </div>
                        {/* Location */}
                        <p className='label-sm text-on-surface-variant'>{membership.club.address?.city}</p>
                    </div>
                </div>
                );
                })}
            </>
        );
    }

    // ========================================
    // MEMBERSHIP DETAILS COMPONENT
    // 🎯 KEY: This component is used in TWO places:
    //    1. Inside .panel-detail (desktop/tablet)
    //    2. Inside .sheet-body (mobile)
    // ========================================
    function MembershipDetails({ membership }: { membership: ClubMembership}) {
        return (
            <div className='container'>
                <p>Details Section</p>
                <p>{membership.club.shortName}</p>
            </div>
        );
    }

    // ========================================
    // RENDER
    // ========================================
    return (
        <div className='container flex-col w-full h-full p-0'>
             {/* =============== TITLE SECTION =============== */}
             <div className='flex w-full justify-between items-center border-b border-outline-variant pb-sm'>
                <p className='title-md emphasized'>My Memberships</p>
                <Button 
                    size="sm"
                    variant='outlined'
                    icon='add'
                    href='/club/create'
                    label="Create Club"
                />
             </div>
             
             {/* =============== PANEL SECTION =============== */}
             {/* Memberships Section */}
             <div className='panel'>
                {/* 
                    LEFT SIDE: Memberships List 
                    - Always visible on all screen sizes
                */}
                <div className='panel-list'>
                    {hasMemberships ? (
                        <MembershipsList 
                            selectedMembershipId={selectedMembershipId}
                            onSelect={handleSelectMembership}/> 
                    ) : (    
                        <EmptyState
                            icon='memberships'
                            title='No Memberships to show!'
                            description='You do not have any memberships yet. Join or create a club!'
                            className='text-on-surface bg-surface-container-lowest rounded-md'
                            actionLabel='Join a Club'
                            actionIcon='add'
                            href='/club'
                        />
                    )}
                    <div className='flex justify-end pt-sm'>
                        <Button 
                            size="sm"
                            variant='outlined'
                            icon='add'
                            href='/club'
                            label="Join another Club"
                        />
                    </div>
                </div>
                {/* 
                    RIGHT SIDE: Details Panel (DESKTOP/TABLET ONLY)
                    - CSS: hidden on mobile, md:flex on tablet+
                    - This is RENDER LOCATION #1 for MembershipDetails

                    1. Page loads
                        ├─ selectedMembershipId = null
                        ├─ selectedMembership = memberships[0] (auto-selected!)
                        ├─ Panel shows first membership ✅
                        └─ Sheet component exists but CSS hides it (md:hidden) ✅

                    2. User clicks membership #5
                        ├─ selectedMembershipId = 5
                        ├─ selectedMembership = memberships[5]
                        └─ Panel updates to show #5 ✅
                */}
                <div className='panel-detail'>
                    {selectedMembership && (
                        <MembershipDetails membership={selectedMembership} />
                    )}
                </div>
             </div>
             {/* 
                MOBILE ONLY: Sheet Overlay
                - Only renders when selectedMembership exists
                - md:hidden hides this entire section on tablet+
                - This is RENDER LOCATION #2 for MembershipDetails
            */}
            {/*  
                1. Page loads
                    ├─ selectedMembershipId = null
                    ├─ selectedMembership = memberships[0] (auto-selected!)
                    ├─ open={!!null} = false
                    └─ Sheet is CLOSED ✅

                2. User clicks membership #5
                    ├─ selectedMembershipId = 5
                    ├─ selectedMembership = memberships[5]
                    ├─ open={!!5} = true
                    └─ Sheet OPENS ✅

                3. User clicks backdrop or X
                    ├─ onOpenChange(false) → handleCloseMembership()
                    ├─ selectedMembershipId = null
                    ├─ selectedMembership = memberships[0] (auto-select again)
                    ├─ open={!!null} = false
                    └─ Sheet CLOSES ✅
            */}
            <div className='md:hidden'>
                <Sheet
                    open={!!selectedMembershipId} // <- only this controls visibility
                    onOpenChange={(open) => {
                        if (!open) handleCloseMembership();
                    }}
                    title={selectedMembership?.club.shortName}
                    mode='responsive-right'
                >
                    {selectedMembership && (
                        <MembershipDetails membership={selectedMembership} />
                    )}
                </Sheet>
            </div>
        </div>
    );
}