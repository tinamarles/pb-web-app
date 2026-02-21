// components/admin/Events/StatusChangeModal.tsx
'use client';

// === MODIFICATION LOG ===
// Date: 2026-02-20
// Modified by: Assistant
// Changes: Created StatusChangeModal using EXISTING FormField + CustomSelect components (NO new CSS!)
// Pattern: Uses variant="select" like ProfileForm gender field - REUSE, don't reinvent!
// ========================

import { useState } from 'react';
import { Modal, ModalFooter, Button, FormField } from '@/ui';
import { 
  LeagueParticipationStatusLabels,
  getStatusChangeOptions,
} from '@/lib/constants';
import { AdminLeagueParticipant } from '@/lib/definitions';

interface StatusChangeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: AdminLeagueParticipant | null;
  isUpdating?: boolean;
  onStatusChange: (newStatus: number) => void | Promise<void>;
}

export function StatusChangeModal({
  open,
  onOpenChange,
  member,
  isUpdating = false,
  onStatusChange,
}: StatusChangeModalProps) {
  // ========================================
  // STATE
  // ========================================
  const [selectedStatusLabel, setSelectedStatusLabel] = useState<string>('');

  // Get status change options (returns StatusChangeOption[])
  const options = getStatusChangeOptions('participation');
  
  // Extract just the labels for FormField select variant
  const optionLabels = options.map(opt => opt.label);

  // Reset selection when modal opens
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedStatusLabel('');
    }
    onOpenChange(open);
  };

  // ========================================
  // HANDLERS
  // ========================================
  const handleConfirm = async () => {
    if (!selectedStatusLabel) return;
    
    // Find the status value from the label
    const selectedOption = options.find(opt => opt.label === selectedStatusLabel);
    if (!selectedOption) return;
    
    await onStatusChange(selectedOption.value);
    handleOpenChange(false);
  };

  // ========================================
  // RENDER
  // ========================================
  if (!member) return null;

  const currentStatusLabel = LeagueParticipationStatusLabels[member.status];
  const selectedOption = options.find(opt => opt.label === selectedStatusLabel);

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      title="Change Member Status"
      description={`${member.participant.fullName}`}
      variant="default"
      titleClassName='headline-md text-primary'
      descriptionClassName='title-lg strong text-secondary'
      bodyClassName='overflow-visible'
    >
      <div className='flex gap-md pb-md'>
        <span className='title-md emphasized'>Current Status: </span>
        <span className='title-md text-secondary'>{currentStatusLabel}</span>
      </div>
      

      {/* Status Selection - using FormField select variant (like ProfileForm gender!) */}
      <FormField
        variant="select"
        label="New Status"
        sublabel="Select the new status for this member"
        value={selectedStatusLabel}
        options={optionLabels}
        onChange={(value: string) => setSelectedStatusLabel(value as string)}
        placeholder="Select a status"
        disabled={isUpdating}
      />

      {/* Show description for selected option */}
      {selectedOption && (
        <div className="body-sm text-on-surface-variant p-md bg-surface-container rounded-md">
          {selectedOption.description}
        </div>
      )}

      {/* Footer Buttons */}
      <ModalFooter className='justify-between px-0 pb-0'>
          <Button
            variant="default"
            onClick={() => handleOpenChange(false)}
            disabled={isUpdating}
            label='Cancel'
          />
          <Button
            variant="filled"
            onClick={handleConfirm}
            disabled={!selectedStatusLabel || isUpdating}
            label={isUpdating ? 'Updating...' : 'Confirm Change'}
            className='rounded-sm'
          />
      </ModalFooter>
    </Modal>
  );
}