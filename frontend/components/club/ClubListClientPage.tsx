'use client';
// === MODIFICATION LOG ===
// Date: 2026-01-04
// Created by: Assistant
// Purpose: Client component for displaying club list with join mode filtering
// ========================
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthUserProvider";
import { Club, MemberUser } from "@/lib/definitions";
import { Button, Icon, Avatar, Badge } from "@/ui";
import { EmptyState } from "../EmptyState";
import Image from "next/image";

interface ClubListClientProps {
    clubs: Club[];
    isJoinMode: boolean;
}

export function ClubListClient({ clubs, isJoinMode }: ClubListClientProps) {
    // ========================================
    // STATE & DATA
    // ========================================
    const router = useRouter();
    const { user, isMemberUser } = useAuth();
    const [selectedClub, setSelectedClub] = useState<Club | null>(null);
    const [isJoining, setIsJoining] = useState(false);

    // 🎯 Filter clubs in join mode - exclude clubs user is already a member of
    const memberships = isMemberUser ? (user as MemberUser).clubMemberships : [];
    const memberClubIds = memberships.map(m => m.club.id);
    
    const clubsToList = isJoinMode 
        ? clubs.filter(club => !memberClubIds.includes(club.id))
        : clubs;
    const clubsAvailable = clubsToList.length > 0;
    
    // ========================================
    // EVENT HANDLERS
    // ========================================
    
    // 🎯 Handle card click - navigate to details
    const handleCardClick = (clubId: number) => {
        const url = isJoinMode 
        ? `/club/${clubId}?intent=join`
        : `/club/${clubId}`;
        router.push(url);
    };

    // 🎯 Handle join button - open confirmation dialog
    const handleJoinClick = (e: React.MouseEvent, club: Club) => {
        e.stopPropagation(); // Prevent card click
        setSelectedClub(club);
    };

    // 🎯 Confirm join
    const handleConfirmJoin = async () => {
        if (!selectedClub) return;
        
        setIsJoining(true);
        try {
            // TODO: API call to join club
            // await post(`clubs/${selectedClub.clubId}/join`, {});
            
            // Refresh page to update list
            router.refresh();
            setSelectedClub(null);
        } catch (error) {
            console.error('Failed to join club:', error);
        } finally {
            setIsJoining(false);
        }
    };

    // 🎯 Cancel join
    const handleCancelJoin = () => {
        setSelectedClub(null);
    };

    // ========================================
    // ClubList
    // ========================================
    function ClubList() {
        console.log('clubs:', clubsToList)
        const imageUrl = 'https://res.cloudinary.com/dvjri35p2/image/upload/v1767506132/sarasota-guide-NhWBUz2qov8-unsplash_lndj5g.jpg'; 

        return (
            <div className="container p-0 mx-auto">
                {/* Show Header */}
                <div className="container relative p-0 ">
                    <div 
                        className="clubList-Header" 
                        style={{
                            backgroundImage: `url("${imageUrl}")`,
                        }}
                    >
                    </div>
                    <h1 className="clubList-Header-text">
                            {`${isJoinMode ? "Select a club to join" : "Browse all our clubs"}`}
                    </h1>
                    <div className="clubList-search"></div>
                </div>
                {/* Action buttons */}
                <div className="flex justify-between items-center border-b border-outline-variant">
                    <div className="flex flex-1">
                        <p className="body-md text-info">
                            Click a card to view more Information about the club.
                        </p>
                    </div>
                
                    <div className='flex gap-md pb-sm justify-end'>
                        <Button
                            variant="default"
                            size="sm"
                            icon="add"
                            label="Create a Club"
                        />
                    </div>
                </div>

                {/* Show Club Cards */}
                <div className="clubList-container grid-3 xl:grid-cols-4">
                    {clubsToList.map((club) => {

                       const memberLabel = club.members!.length == 1 ? 'Member' : 'Members';
                       const isMember = memberClubIds.includes(club.id);
                       return (
                            <div
                                key={club.id}
                                className="panel-list-item flex-col border rounded-md bg-surface-container-lowest p-sm w-[300px]"
                                onClick={() => handleCardClick(club.id!)}
                            >
                                <div className="container relative p-0 w-full">
                                    <Image 
                                        src={club.bannerUrl ?? 'https://res.cloudinary.com/dvjri35p2/image/upload/v1767524737/defaultBanner_jrhhus.png'} 
                                        width={320} 
                                        height={100} 
                                        alt={club.shortName ? `${club.shortName}'s banner` : "Club banner"}
                                    />
                                </div>
                                {isMember ? (
                                    <Badge
                                        variant="tertiary"
                                        label="Joined"
                                        className="absolute ml-56 mt-4 w-fit rounded-sm"
                                    />
                                ) : (
                                    <Button
                                        variant="outlined"
                                        size="sm"
                                        icon="add"
                                        label="Join"
                                        className="absolute ml-53 mt-40 w-fit py-xs"
                                    />
                                )}

                                <Avatar
                                    src={club.logoUrl || undefined}
                                    name={club.name}
                                    size="lg"
                                    className="absolute mt-15 ml-4 rounded-full border border-secondary shadow-sm shadow-secondary"
                                />
                                {/* Content */}
                                <div className="flex flex-col w-full mt-8">
                                    <p className="body-md emphasized text-secondary">{club.name}</p>
                                    <p className="body-sm">{club.address?.city}</p>
                                    <p className="label-sm text-secondary">{club.members?.length} {' '} {memberLabel}</p>
                                </div>  
                            </div>
                       );
                    })}
                </div>
            </div>
        )
    }
    // ========================================
    // RENDER
    // ========================================

    return (
        <>
        {clubsAvailable ? (
            <ClubList />
        ) : (
            <EmptyState
              icon="clubs"
              title="No Clubs to show!"
              description={`${isJoinMode ? "You are already a member of all available clubs!" : "No clubs available yet!"}`}
              className="text-on-surface bg-surface-container-lowest rounded-md"
              actionLabel="Create a club"
              actionIcon="add"
              href="/club/create"
            />
        )}

        </>
    );
}
