// data/tableHandlers.tsx
// Handler functions for DataTable actions
// DEFINE ONCE, REUSE EVERYWHERE
// === MODIFICATION LOG ===
// Date: 2026-02-19
// Modified by: Assistant
// Changes: Updated to use backend email sending (NO WINDOW OBJECT!)
// Previous: Used window.location.href with mailto: (DOM manipulation - BAD!)
// Update: 2026-02-19 - Added handleAddMembers for bulk adding eligible members to league
// ========================

import { AdminLeagueParticipant, EligibleMember } from "@/lib/definitions";
// import { sendBulkEmail } from "@/lib/actions";
import { addLeagueParticipantsClient } from "@/lib/clientActions";
import { toast } from "sonner";

/**
 * BULK ACTION HANDLER - Email Selected Members
 *
 * Opens email compose modal, then sends via backend
 * Creates in-app notifications for all selected members
 *
 * @param members - Array of selected AdminLeagueParticipant objects
 * @param context - Metadata (leagueId, eventName, clubId, captainName)
 *
 * NOTE: This handler opens an email compose modal (you'll need to create this)
 * The modal should call sendBulkEmail() action when user clicks "Send"
 *
 * BACKEND APPROACH - NO DOM MANIPULATION!
 * ✅ No window.location.href
 * ✅ No mailto: links
 * ✅ Pure backend email sending
 */
export async function handleEmailSelectedMembers(
  members: AdminLeagueParticipant[],
  context?: {
    leagueId?: number;
    eventName?: string;
    clubId?: number;
    captainName?: string;
  },
) {
  if (members.length === 0) {
    toast.error("No members selected");
    return;
  }

  // Extract email addresses
  const emails = members.map((m) => m.participant.memberDetail.email).filter(Boolean);

  if (emails.length === 0) {
    toast.error("No valid email addresses found");
    return;
  }

  // ============================================================================
  // TODO: OPEN EMAIL COMPOSE MODAL
  // ============================================================================

  // This should open a modal with:
  // - To: (showing count, e.g. "5 members")
  // - Subject: (pre-filled or editable)
  // - Message: (textarea)
  // - Send button (calls sendBulkEmail below)

  // For now, just show a prompt (you'll replace this with modal)
  console.log("TODO: Open email compose modal for", emails.length, "members");

  // Example of what the modal submit would do:
  const exampleEmailData = {
    recipientIds: members.map((m) => m.participant.id),
    subject: context?.eventName
      ? `Regarding ${context.eventName}`
      : "League Update",
    message: "Your message here...",
    leagueId: context?.leagueId,
    eventName: context?.eventName,
    captainName: context?.captainName,
  };

  // This would be called from modal submit:
  // await sendBulkEmail(exampleEmailData);

  toast.info("Email compose modal - TODO: Implement modal component");
}

/**
 * BULK ACTION HANDLER - Add Members to League
 * Adds multiple eligible members to a league with PENDING status
 *
 * @param members - Array of selected EligibleMember objects
 * @param context - Required context (leagueId, onSuccess, onClose)
 */
export async function handleAddMembers(
  members: EligibleMember[],
  context: {
    leagueId: number;
    onSuccess?: () => void;
    onClose?: () => void;
  },
) {
  if (members.length === 0) {
    toast.error("Please select at least one member");
    return;
  }

  try {
    const memberIds = members.map((m) => m.id);
    const result = await addLeagueParticipantsClient(
      context.leagueId,
      memberIds,
    );

    toast.success(`Added ${result.created} member(s)`, {
      description: "Members have been added with PENDING status",
    });

    // Close modal and refresh parent
    context.onClose?.();
    context.onSuccess?.();
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to add members";
    toast.error("Error adding members", {
      description: errorMessage,
    });
  }
}

// ============================================================================
// HANDLER REGISTRY
// ============================================================================

/**
 * Registry of all table handlers
 * Maps string references to actual functions
 *
 * Usage in tableConfig:
 * onClick: "handleAddMember"  // String reference
 *
 * DataTable resolves it:
 * handlers["handleAddMember"]()  // Gets actual function
 */
export const tableHandlers = {
  handleEmailSelectedMembers,
  handleAddMembers,
};
