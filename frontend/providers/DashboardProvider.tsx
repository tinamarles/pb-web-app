'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthUserProvider';
import { type MemberUser,type ClubMembership } from '@/lib/definitions';

interface DashboardContextType {
  /** Currently selected club ID */
  selectedClubId: number | null;
  /** Set the selected club */
  setSelectedClub: (clubId: number) => void;
  /** Current membership object (derived from selectedClubId) */
  currentMembership: ClubMembership | null;
  /** All user's club memberships */
  memberships: ClubMembership[];
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

interface DashboardProviderProps {
  children: ReactNode;
}

export function DashboardProvider({ children }: DashboardProviderProps) {
    const { user, isMemberUser } = useAuth();

    // Get all memberships
    const memberships = isMemberUser
        ? (user as MemberUser).clubMemberships
        : [];

    // Get initial club (preferred club or first one)
    const getInitialClubId = (): number | null => {
        const preferredMembership = memberships.find(m => m.isPreferredClub);
        if (preferredMembership) {
            return preferredMembership.club.id ?? null;
        }
        if (memberships[0]) {
            return memberships[0].club.id ?? null;
        }
        return null;
    };

    // State for selected club ID
    const [selectedClubId, setSelectedClubId] = useState<number | null>(getInitialClubId());

    // Update selected club when user changes (e.g., after login)
    useEffect(() => {
        const initialClubId = getInitialClubId();
        if (initialClubId && selectedClubId === null) {
        setSelectedClubId(initialClubId);
        }
    }, [memberships.length]); // Re-run when memberships change

    // Get current membership based on selectedClubId
    const currentMembership = selectedClubId
        ? memberships.find(m => m.club.id === selectedClubId) || null
        : null;

    const setSelectedClub = (clubId: number) => {
        setSelectedClubId(clubId);
        console.log('Dashboard: Club changed to ID:', clubId);
    };

    return (
    <DashboardContext.Provider
      value={{
        selectedClubId,
        setSelectedClub,
        currentMembership,
        memberships,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

/**
 * Hook to access dashboard context
 * 
 * Usage:
 * const { selectedClubId, setSelectedClub, currentMembership } = useDashboard();
 */
export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}