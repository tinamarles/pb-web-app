"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminLeagueParticipant } from "@/lib/definitions";
import { DataTable } from "@/ui";
import { participantTableConfig } from "@/data/tableConfig";
import { EmptyState } from "@/components/EmptyState";
import { AddMembersModal } from "./AddMembersModal";
import { StatusChangeModal } from "./StatusChangeModal";
import { updateParticipationStatusClient } from "@/lib/clientActions";
import { toast } from "sonner";
import { LeagueParticipationStatus, LeagueParticipationStatusLabels, LeagueParticipationStatusValue } from "@/lib/constants";

interface AdminEventMembersProps {
  participants: AdminLeagueParticipant[];
  clubId: string;
  eventId: string;
}

export function AdminEventMembersPage({
  participants,
  clubId,
  eventId: leagueId,
}: AdminEventMembersProps) {
  // ========================================
  // STATE & DATA
  // ========================================
  const router = useRouter();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<AdminLeagueParticipant | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const participantsAvailable = participants.length > 0;

  // ========================================
  // HANDLERS
  // ========================================
  const handlers = {
    handleAddMember: () => {
      console.log("Add League Participant for league:", leagueId);
      setIsAddModalOpen(true);
    },
    /**
     * Handle Activate Member action
     * Changes status to ACTIVE, creates attendance records
     */
    handleActivateMember: async (member: AdminLeagueParticipant) => {
      try {
        // Update status to ACTIVE
        const result = await updateParticipationStatusClient(
          member.id,
          LeagueParticipationStatus.ACTIVE
        );

        // Show success message
        const newStatusLabel = LeagueParticipationStatusLabels[LeagueParticipationStatus.ACTIVE];
        toast.success(
          `${member.participant.memberDetail.fullName} set to ${newStatusLabel}`,
          {
            description: result.attendanceChanges?.[0]?.message || "Status updated successfully"
          }
        );

        // Refresh data
        router.refresh();
      } catch (error: any) {
        console.error("Failed to activate member:", error);
        const errorData = error.errorData
        toast.error(errorData?.error || 'Error', {
          description: errorData?.detail,
        });
      }
    },

    /**
     * Handle Cancel/Change Status Member action
     * Opens StatusChangeModal for user to select new status
     */
    handleCancelMember: (member: AdminLeagueParticipant) => {
      setSelectedMember(member);
      setIsStatusModalOpen(true);
    },

    // TODO: Add handleEmailSelectedMembers handler
    // NOTE: Cannot use window.location.href or document.createElement (DOM violation!)
    // SOLUTION 1: Use Next.js Link component with mailto: href
    // SOLUTION 2: Create custom EmailModal that copies emails to clipboard
    // SOLUTION 3: Server-side email sending through API
  };

  /**
   * Handle status change confirmation from modal
   */
  async function handleStatusChange(newStatus: number) {
    if (!selectedMember) return;
    
    setIsUpdating(true);
    try {
      const result = await updateParticipationStatusClient(selectedMember.id, newStatus);

      // Show success message
      const newStatusLabel = LeagueParticipationStatusLabels[newStatus as LeagueParticipationStatusValue];
     
      toast.success(
        `${selectedMember.participant.memberDetail.fullName} set to ${newStatusLabel}`,
        {
          description: result.attendanceChanges?.[0]?.message || "Status updated successfully"
        }
      );

      // Refresh data
      router.refresh();
    } catch (error: any) {
        console.error("Failed to update status:", error);
        const errorData = error.errorData
        toast.error(errorData?.error || 'Error', {
          description: errorData?.detail,
        });
      } finally {
      setIsUpdating(false);
    }
  }

  const handleAddSuccess = () => {
    router.refresh();
  };

  // ========================================
  // DATA FILTERING
  // ========================================

  // ========================================
  // FUNCTIONS & COMPONENTS
  // ========================================

  const AdminParticipantList = () => {
    return (
      <DataTable
        config={participantTableConfig}
        data={participants}
        handlers={handlers}
      />
    );
  };
  // ========================================
  // RENDER
  // ========================================
  return (
    <>
      <div className="container p-0 mx-auto">
        {participantsAvailable ? (
          <AdminParticipantList />
        ) : (
          <EmptyState
            icon="members"
            title="There are no participants yet!"
            description="League Participants will appear here once they have joined this League."
            className="text-on-surface bg-surface-container-lowest rounded-md"
            actionLabel="Add a Participant"
            actionIcon="add"
            onAction={() => setIsAddModalOpen(true)}
          />
        )}
      </div>
      {/* Add Members Modal */}
      <AddMembersModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        leagueId={parseInt(leagueId)}
        onSuccess={handleAddSuccess}
      />
      {/* Status Change Modal */}
      <StatusChangeModal
        open={isStatusModalOpen}
        onOpenChange={setIsStatusModalOpen}
        member={selectedMember}
        isUpdating={isUpdating}
        onStatusChange={handleStatusChange}
      />
    </>
  );
}
