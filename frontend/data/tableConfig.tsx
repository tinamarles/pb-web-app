// data/tableConfig.ts
// Table column configurations (like navigation.ts pattern)
// DEFINE ONCE, REUSE EVERYWHERE

import type { TableConfig, ColumnDef, RowAction, BulkAction } from '@/lib/tableTypes';
import { Badge } from '@/ui';
import { formatDate } from '@/lib/dateUtils';
import { getIsActiveBadge } from '@/lib/badgeUtils';
import { Event } from '@/lib/definitions'; // Replace with actual Event type when implementing

// ============================================================================
// EXAMPLE: EVENTS TABLE CONFIGURATION
// ============================================================================


const eventColumns: ColumnDef<Event>[] = [
  {
    id: 'name',
    label: 'Name',
    accessor: 'name',
    sortable: true,
    className: 'text-left',
  },
  {
    id: 'start_date',
    label: 'Start Date',
    accessor: 'startDate',
    sortable: true,
    render: (event) => formatDate(event.startDate, 'short'),
    className: 'text-left',
  },
  {
    id: 'end_date',
    label: 'End Date',
    accessor: 'endDate',
    sortable: true,
    render: (event) => formatDate(event.endDate, 'short'),
    className: 'text-left',
  },
  {
    id: 'status',
    label: 'Status',
    render: (event) => {
      const { variant, label } = getIsActiveBadge(event.isActive);
      return <Badge variant={variant} label={label} className='w-fit py-md single-line-base'/>;
    },
    className: 'text-left',
  },
  {
    id: 'participants',
    label: 'Participants',
    render: (event) => `${event.participantsCount || 0}/${event.maxParticipants || 0}`,
    className: 'text-center',
  },
];

const eventRowActions: RowAction<Event>[] = [
  {
    id: 'edit',
    label: 'Edit',
    icon: 'edit',
    variant: 'primary',
    // 🚨 TODO: Replace with actual href when implementing
    href: (event) => `/admin/${event.clubInfo.id}/events/${event.id}`,
  },
  {
    id: 'view',
    label: 'View Details',
    icon: 'show',
    variant: 'secondary',
    href: (event) => `/event/${event.id}`,
  },
  {
    id: 'delete',
    label: 'Delete',
    icon: 'delete',
    variant: 'error',
    onClick: (event) => {
      if (confirm(`Are you sure you want to delete "${event.name}"?`)) {
        // 🚨 TODO: Call actual delete API
        console.log('Delete event:', event.id);
      }
    },
  },
];

const eventBulkActions: BulkAction<Event>[] = [
  {
    id: 'cancel',
    label: 'Cancel Events',
    icon: 'cancel',
    variant: 'warning',
    onClick: (events) => {
      if (confirm(`Cancel ${events.length} event(s)?`)) {
        console.log('Cancel events:', events.map(e => e.id));
      }
    },
  },
  {
    id: 'activate',
    label: 'Activate Events',
    icon: 'activate',
    variant: 'success',
    onClick: (events) => {
      console.log('Activate events:', events.map(e => e.id));
    },
  },
  {
    id: 'delete',
    label: 'Delete Selected',
    icon: 'delete',
    variant: 'error',
    onClick: (events) => {
      if (confirm(`Delete ${events.length} event(s)? This cannot be undone.`)) {
        console.log('Delete events:', events.map(e => e.id));
      }
    },
  },
];

export const eventsTableConfig: TableConfig<Event> = {
  id: 'events',
  label: 'Leagues & Events',
  columns: eventColumns,
  rowActions: eventRowActions,
  bulkActions: eventBulkActions,
  selectable: true,
  searchable: true,
  searchPlaceholder: 'Search events...',
  getRowId: (event) => event.id,
};