// data/tableConfig.ts
// Table column configurations (like navigation.ts pattern)
// DEFINE ONCE, REUSE EVERYWHERE

import type {
  TableConfig,
  ColumnDef,
  RowAction,
  BulkAction,
  TableAction,
} from "@/lib/tableTypes";
import * as R from "@/lib/routes";
import { Avatar, Badge, Icon } from "@/ui";
import { formatDate } from "@/ui/dateDisplay";
import { getIsActiveBadge } from "@/lib/badgeUtils";
import {
  AdminEventBase,
  AdminLeagueParticipant,
  EligibleMember,
} from "@/lib/definitions";
import {
  Gender,
  getLeagueParticipationStatusBadgeVariant,
  getLeagueParticipationStatusLabel,
  getMembershipStatusBadgeVariant,
  getMembershipStatusLabel,
  LeagueParticipationStatus,
} from "@/lib/constants";

// ============================================================================
// EVENTS TABLE CONFIGURATION
// ============================================================================

const eventColumns: ColumnDef<AdminEventBase>[] = [
  {
    id: "isEvent",
    label: "Type",
    accessor: "isEvent",
    sortable: true,
    render: (event) => (
      <Icon
        name={event.isEvent ? "event" : "leagues"}
        size="md"
        className="text-primary"
      />
    ),
    className: "text-left",
  },
  {
    id: "name",
    label: "Name",
    accessor: "name",
    sortable: true,
    className: "text-left",
  },
  {
    id: "start_date",
    label: "Start Date",
    accessor: "startDate",
    sortable: true,
    render: (event) => formatDate(event.startDate, "short"),
    className: "text-left",
  },
  {
    id: "end_date",
    label: "End Date",
    accessor: "endDate",
    sortable: true,
    render: (event) => formatDate(event.endDate, "short"),
    className: "text-left",
  },
  {
    id: "captain",
    label: "Captain",
    accessor: "captainInfo", // Assuming event.captainInfo has fullName and profilePictureUrl
    sortable: false,
    render: (event) => {
      return (
        <div className="flex gap-sm items-center">
          <Avatar
            src={event.captainInfo.profilePictureUrl}
            name={event.captainInfo.fullName}
            size="xs"
          />
          <span>{event.captainInfo.fullName}</span>
        </div>
      );
    },
    className: "text-left",
  },
  {
    id: "status",
    label: "Status",
    render: (event) => {
      const { variant, label } = getIsActiveBadge(event.isActive);
      return (
        <Badge
          variant={variant}
          label={label}
          className="w-fit py-md single-line-base"
        />
      );
    },
    className: "text-left",
  },
  {
    id: "participants",
    label: "Participants",
    render: (event) => {
      return event.isEvent
        ? `${event.maxParticipants || 0}`
        : `${event.participantsCount || 0}/${event.maxParticipants || 0}`;
    },
    className: "text-center",
  },
];

const eventRowActions: RowAction<AdminEventBase>[] = [
  {
    id: "edit",
    label: "Edit",
    icon: "edit",
    variant: "primary",
    // 🚨 TODO: Replace with actual href when implementing
    // href: (event) => `/admin/${event.clubInfo.id}/events/${event.id}/update`,
    href: R.getEventUpdateRoute,
    disabled: (event) => !event.userIsCaptain,
  },
  {
    id: "view",
    label: "View Details",
    icon: "show",
    variant: "secondary",
    // href: (event) =>
    //   event.isEvent
    //     ? `/admin/${event.clubInfo.id}/events/${event.id}/sessions`
    //     : `/admin/${event.clubInfo.id}/events/${event.id}/members/list`,
    href: R.getAdminEventTabRoute,
  },
  {
    id: "delete",
    label: "Delete",
    icon: "delete",
    variant: "error",
    disabled: (event) => !event.userIsCaptain,
    onClick: (event) => {
      if (confirm(`Are you sure you want to delete "${event.name}"?`)) {
        // 🚨 TODO: Call actual delete API
        console.log("Delete event:", event.id);
      }
    },
  },
];

const eventBulkActions: BulkAction<AdminEventBase>[] = [
  {
    id: "cancel",
    label: "Cancel Events",
    icon: "cancel",
    variant: "warning",
    onClick: (events) => {
      if (confirm(`Cancel ${events.length} event(s)?`)) {
        console.log(
          "Cancel events:",
          events.map((e) => e.id),
        );
      }
    },
  },
  {
    id: "activate",
    label: "Activate Events",
    icon: "activate",
    variant: "success",
    onClick: (events) => {
      console.log(
        "Activate events:",
        events.map((e) => e.id),
      );
    },
  },
  {
    id: "delete",
    label: "Delete Selected",
    icon: "delete",
    variant: "error",
    onClick: (events) => {
      if (confirm(`Delete ${events.length} event(s)? This cannot be undone.`)) {
        console.log(
          "Delete events:",
          events.map((e) => e.id),
        );
      }
    },
  },
];

export const eventsTableConfig: TableConfig<AdminEventBase> = {
  id: "events",
  label: "Leagues & Events",
  columns: eventColumns,
  rowActions: eventRowActions,
  rowClassifier: {
    getRowClassName: (event) =>
      event.userIsCaptain
        ? "border-l-4 border-l-tertiary border-b-outline-variant"
        : "border-outline-variant",
  },
  bulkActions: eventBulkActions,
  selectable: true,
  searchable: true,
  searchPlaceholder: "Search events...",
  getRowId: (event) => event.id,
};

// ============================================================================
// PARTICIPANTS TABLE CONFIGURATION
// ============================================================================

const participantColumns: ColumnDef<AdminLeagueParticipant>[] = [
  {
    id: "pictureUrl",
    label: "Img",
    accessor: "participant.fullName",
    sortable: true,
    render: (member) => {
      const avatarColor =
        member.participant.gender === Gender.FEMALE
          ? "bg-primary text-on-primary"
          : "bg-info text-on-info";
      return (
        <Avatar
          src={member.participant.profilePictureUrl}
          name={member.participant.fullName}
          size="xs"
          className={`${avatarColor}`}
        />
      );
    },
    className: "text-left",
  },
  {
    id: "firstName",
    label: "First Name",
    accessor: "participant.firstName",
    sortable: true,
    render: (member) => member.participant.firstName,
    className: "text-left",
  },
  {
    id: "lastName",
    label: "Last Name",
    accessor: "participant.lastName",
    sortable: true,
    render: (member) => member.participant.lastName,
    className: "text-left",
  },
  {
    id: "email",
    label: "Last Name",
    accessor: "participant.email",
    sortable: true,
    render: (member) => member.participant.email,
    className: "text-left",
  },
  {
    id: "phone",
    label: "Mobile Phone",
    accessor: "mobilePhone",
    sortable: true,
    render: (member) => member.participant.mobilePhone,
    className: "text-left",
  },
  {
    id: "skill",
    label: "Level",
    accessor: "participant.skillLevel",
    sortable: true,
    render: (member) => member.participant.skillLevel,
    className: "text-left",
  },
  {
    id: "status",
    label: "Status",
    accessor: "status",
    sortable: true,
    render: (member) => {
      const badgeVariant = getLeagueParticipationStatusBadgeVariant(
        member.status,
      );
      const badgeLabel = getLeagueParticipationStatusLabel(member.status);
      return (
        <Badge
          variant={badgeVariant}
          label={badgeLabel}
          className="w-fit py-md label-lg"
        />
      );
    },
    className: "text-left",
  },
];

const participantRowActions: RowAction<AdminLeagueParticipant>[] = [
  {
    id: "edit",
    label: "Edit",
    icon: "edit",
    variant: "primary",
    // href: (member) =>
    //   `/admin/${member.participant.clubInfo.id}/events/${member.leagueId}/members/${member.id}/update`,
    href: R.getEventMemberUpdateRoute,
  },
  {
    id: "view",
    label: "view",
    icon: "show",
    variant: "default",
    // href: (member) =>
    //   `/admin/${member.participant.clubInfo.id}/events/${member.leagueId}/members/${member.id}/attendance`,
    href: R.getEventMemberAttendanceRoute,
  },
  {
    id: "cancel",
    label: "cancel",
    icon: "cancel",
    variant: "warning",
    handler: "handleCancelMember",
  },
  {
    id: "activate",
    label: "activate",
    icon: "activate",
    variant: "secondary",
    disabled: (member) => member.status === LeagueParticipationStatus.ACTIVE,
    handler: "handleActivateMember",
  },
];

const participantBulkActions: BulkAction<AdminLeagueParticipant>[] = [
  {
    id: "email-selected",
    label: "Email Selected Members",
    icon: "mail",
    variant: "primary",
    handler: "handleEmailSelectedMembers", // ✅ Handler registry pattern!
  },
];

const participantTableActions: TableAction[] = [
  {
    id: "add-member",
    label: "Add Member",
    icon: "add",
    variant: "filled",
    onClick: "handleAddMember",
  },
];
export const participantTableConfig: TableConfig<AdminLeagueParticipant> = {
  id: "participants",
  label: "League Participants",
  columns: participantColumns,
  rowActions: participantRowActions,
  rowClassifier: {
    getRowClassName: (participant) =>
      participant.excludeFromRankings
        ? "border-l-4 border-l-warning border-b-outline-variant"
        : "border-outline-variant",
  },
  bulkActions: participantBulkActions,
  tableActions: participantTableActions,
  selectable: true,
  searchable: true,
  searchPlaceholder: "Search participants...",
  getRowId: (member) => member.id,
};

// ============================================================================
// ELIGIBLE MEMBERS TABLE CONFIGURATION
// ============================================================================

const eligibleMemberColumns: ColumnDef<EligibleMember>[] = [
  {
    id: "profilePicture",
    label: "",
    accessor: "userInfo.fullName",
    sortable: true,
    render: (member) => (
      <Avatar
        src={member.userInfo.profilePictureUrl}
        name={member.userInfo.fullName}
        size="xs"
      />
    ),
    className: "text-left",
  },
  {
    id: "fullName",
    label: "Name",
    accessor: "userInfo.fullName",
    sortable: true,
     render: (member) => member.userInfo.fullName,
    className: "text-left",
  },
  {
    id: "email",
    label: "Email",
    accessor: "email",
    sortable: true,
    className: "text-left",
  },
  {
    id: "status",
    label: "Status",
    accessor: "status",
    sortable: true,
    render: (member) => {
      const badgeLabel = getMembershipStatusLabel(member.status);
      const badgeVariant = getMembershipStatusBadgeVariant(member.status);
      return (
        <Badge
          variant={badgeVariant}
          label={badgeLabel}
          className="w-fit py-sm label-md"
        />
      );
    },
    className: "text-left",
  },
];

const eligibleMemberBulkActions: BulkAction<EligibleMember>[] = [
  {
    id: "add-to-league",
    label: "Add to League",
    icon: "add",
    variant: "filled",
    handler: "handleAddMembers", // ✅ Handler registry pattern!
  },
];

export const eligibleMembersTableConfig: TableConfig<EligibleMember> = {
  id: "eligible-members",
  label: "Select Members to Add",
  columns: eligibleMemberColumns,
  selectable: true,
  searchable: true,
  searchPlaceholder: "Search members...",
  getRowId: (member) => member.id,
  bulkActions: eligibleMemberBulkActions,
};
