'use client';
import { EmptyState } from '@/components';
import { useAuth } from '@/providers/AuthUserProvider';
import { useState } from 'react';
import { NotificationType } from '@/lib/constants';
import { type MemberUser,type ClubMembership } from '@/lib/definitions';
import { Button } from '@/ui';
import Link from "next/link";

export function MembershipsPage() {

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

    // Handle if the user card clicks on a membership card
    const handleSelectMembership = (id: number) => {
        setSelectedMembershipId(id);
    };

    return (
        <div className='container flex-col w-full p-0'>
             {/* Title Section */}
             <div className='flex w-full justify-between items-center'>
                <p className='title-md emphasized'>Memberships</p>
                <Button 
                    size="sm"
                    variant='outlined'
                    icon='add'
                    href='/club/create'
                    label="Create Club"
                />
             </div>
             {/* Memberships Section */}
             <div className='panel'>
                <div className='panel-list bg-surface-container'>
                    {!hasMemberships && (
                        <EmptyState
                            icon='memberships'
                            title='No Memberships to show!'
                            description='You do not have any memberships yet. Join or create a club!'
                            className='text-on-surface bg-surface-container-lowest rounded-md'
                            actionLabel='Join a Club'
                            actionIcon='add'
                            href='/clubs'
                        />
                    )}
                </div>
                <div className='panel-detail bg-surface-container'>
                    
                </div>
             </div>

        </div>
    );
}