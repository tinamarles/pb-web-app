// components/admin/Events/AddMembersModal.tsx
"use client";

// === MODIFICATION LOG ===
// Date: 2026-02-19 (FINAL FINAL CORRECTION)
// Modified by: Assistant
// Changes: Import handleAddMembers from @/data/tableHandlers (DEFINE ONCE, REUSE EVERYWHERE!)
// Pattern: Handler registry - create wrapper that binds context to handler
// Architecture: Handler logic in tableHandlers.tsx, component just wires it up
// ========================

import { useState, useEffect } from "react";
import { Modal, DataTable } from "@/ui";
import { EligibleMember } from "@/lib/definitions";
import { getEligibleMembersClient } from "@/lib/clientActions";
import { toast } from "sonner";
import { eligibleMembersTableConfig } from "@/data/tableConfig";
import { handleAddMembers } from "@/data/tableHandlers";

interface AddMembersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leagueId: number;
  onSuccess?: () => void; // Callback to refresh parent data
}

export function AddMembersModal({
  open,
  onOpenChange,
  leagueId,
  onSuccess,
}: AddMembersModalProps) {
  // ========================================
  // STATE
  // ========================================
  const [eligibleMembers, setEligibleMembers] = useState<EligibleMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // ========================================
  // FETCH ELIGIBLE MEMBERS
  // ========================================
  useEffect(() => {
    if (open) {
      fetchEligibleMembers();
    }
  }, [open, leagueId]);

  async function fetchEligibleMembers() {
    setIsLoading(true);
    try {
      const members = await getEligibleMembersClient(leagueId);
      setEligibleMembers(members);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to load eligible members";
      toast.error("Error loading members", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }

  // ========================================
  // HANDLERS (bind context to imported handler)
  // ========================================
  // ✅ Create wrapper that binds Modal context to the handler from tableHandlers.tsx
  // ✅ Handler name matches string reference in eligibleMembersTableConfig.bulkActions
  const handlers = {
    handleAddMembers: (selectedRows: EligibleMember[]) =>
      handleAddMembers(selectedRows, {
        leagueId,
        onSuccess,
        onClose: () => onOpenChange(false),
      }),
  };

  // ========================================
  // RENDER
  // ========================================
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Add Members to League"
      description="Select members to add to the league. They will be added with PENDING status."
      variant="large"
    >
      
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center p-8">
            <p className="text-on-surface-variant">
              Loading eligible members...
            </p>
          </div>
        )}

        {/* DataTable (config from data file, handler passed via handlers prop!) */}
        {!isLoading && eligibleMembers.length > 0 && (
          <DataTable
            config={eligibleMembersTableConfig}
            data={eligibleMembers}
            handlers={handlers}
          />
        )}

        {/* Empty State */}
        {!isLoading && eligibleMembers.length === 0 && (
          <div className="flex items-center justify-center p-8">
            <p className="text-on-surface-variant">
              No eligible members found. All club members may already be in this
              league.
            </p>
          </div>
        )}
      
    </Modal>
  );
}
