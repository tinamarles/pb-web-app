import { ModuleClientOnly as Module } from "@/shared";
import { PageProps, EmptyObject } from "@/lib/definitions";
import { Metadata } from "next";
import { getAdminClubEvent } from "@/lib/actions";
import { isApiError } from "@/lib/apiErrors";
import { handleApiError } from "@/lib/errorHandling";
import { redirect } from "next/navigation";
import { AdminEvent } from "@/lib/definitions";
import { Icon, Button, Avatar, Badge, Accordion, AccordionItem } from "@/ui";
import { formatDate } from "@/ui/dateDisplay";
import { formatDateRange, isRegistrationOpen, formatTimeRange } from "@/lib/dateUtils";
import { getIsActiveBadge } from "@/lib/badgeUtils";
import { getSkillLevelBadgeVariant, getSkillLevelLabel, SkillLevel, getDayOfWeekLabel, getRecurrenceTypeLabel } from "@/lib/constants";

import { AdminEventTabs } from "@/components/admin/Events/AdminEventTabs";
//import { MarkdownContent } from '@/components';

type Params = { clubId: string; eventId: string };
type SearchParams = EmptyObject;

// 🎯 EXPORT THIS - Next.js auto-calls it!
export async function generateMetadata({
  params,
}: PageProps<Params, SearchParams>): Promise<Metadata> {
  const { clubId, eventId } = await params;
  const event = await getAdminClubEvent(clubId, eventId);

  return {
    title: `${event.name} | Admin Event Details | PickleHub`,
    description: event.description || `View details for ${event.name}`,
  };
}

type LayoutContentProps = {
  event: AdminEvent;
  children: React.ReactNode;
};

function LayoutContent({
  event,
  children,
}: LayoutContentProps) {

  const titleText = event.isEvent ? 'Event Details' : 'League Details'

  const renderHeadline = () => {

    const buttonText = event.isEvent ? 'Update Event' : 'Update League';

    const { variant, label } = getIsActiveBadge(event.isActive);
    return (
      <div className="flex items-center justify-between">
        <div className="flex gap-md items-center">
          <h2 className="headline-md text-primary">Manage</h2>
          <div className="flex bg-primary text-on-primary px-sm py-xs items-center gap-sm rounded-md">
            <p className="headline-md">{event.name}</p>
            <Icon 
              name={event.isEvent ? 'event' : 'leagues'} 
              size='md' 
              bordered
              className="text-on-primary border-on-primary"
            />
          </div>
          <Badge
              variant={variant}
              label={label}
              className="w-fit h-auto px-sm py-xs headline-md rounded-md"
            />
        </div>
        <Button 
          variant='default' 
          size='md'
          label={buttonText}
          icon='edit'
          href={`/admin/${event.clubInfo.id}/events/${event.id}/update`}
        />
      </div>
    );
  };

  const renderDetails = () => {
    const participantsText = event.isEvent ? (
        `${event.maxParticipants || 0}`
        ) : (
        `${event.participantsCount || 0}/${event.maxParticipants || 0}`
        )
    const skillLevel = event.minimumSkillLevel || SkillLevel.OPEN
    const registrationVariant = (isRegistrationOpen(event.registrationStartDate, event.registrationEndDate) && !event.isEvent) ?
        'success' : 'default'
    const registrationLabel = (isRegistrationOpen(event.registrationStartDate, event.registrationEndDate) && !event.isEvent) ?
        'Registration Open' : 'Registration Closed'
    const hasSessions = event.leagueSessions.length > 0;
    return (
      <div className="flex flex-col gap-sm bg-surface-container-low">
      {/* Captain, Participants & Skill Level */}
        <div className='flex items-center justify-between'>
          {/* Captain */}
          <div className='flex items-center gap-md text-on-background'>
            <p className='title-md emphasized'>Captain:</p>
            <Avatar
              src={event.captainInfo.profilePictureUrl}
              name={event.captainInfo.fullName}
              size='sm'
            />
            <p className='title-md text-on-surface-variant'>{event.captainInfo.fullName}</p>
          </div>
          {/* Participants & Skill Level */}
          <div className='flex items-center gap-md text-on-background'>
            <p className='title-md emphasized'>Participants:</p>
            <p className='title-md'>{participantsText}</p>
            <Badge
              variant={getSkillLevelBadgeVariant(skillLevel)}
              label={getSkillLevelLabel(skillLevel)}
              className="w-fit h-auto py-sm title-sm rounded-md"
            />
          </div>
        </div>
      {/* Dates and Registration Badge */}
        <div className='flex items-center justify-between'>
          {/* Start and End Date */}
          <div className='flex items-center gap-md text-on-background'>
            <p className='title-md emphasized'>Dates:</p>
            <p className='title-md text-on-surface-variant'>{formatDateRange(event.startDate, event.endDate, 'weekday-short')}</p>
          </div>
          {!event.isEvent && (
            <Badge
              variant={registrationVariant}
              label={registrationLabel}
              className="w-fit h-auto py-sm title-sm rounded-md"
            />
          )}
        </div>
      {/* LeagueSessions */}
        {hasSessions && (
          <div className='flex items-start gap-md'>
          <p className='title-sm emphasized'>Sessions:</p>
          <div className='flex flex-col gap-sm'>
              {event.leagueSessions.map((session) => (
                <div
                  key={session.id}
                  className='flex items-center gap-md title-sm text-on-surface-variant p-0'>
                    <p className="w-24">{getDayOfWeekLabel(session.dayOfWeek)}</p>
                    <p>{formatTimeRange(session.startTime, session.endTime)}</p>
                    <p>{'('}{getRecurrenceTypeLabel(session.recurrenceType)}{')'}</p>
                    <p>{session.courtLocationInfo.name}</p>
                    <p>{'('}{session.courtsUsed}{' courts)'}</p>
                </div>
              ))}
          </div>
        </div>
        )}
        
      </div>
    );
 };
  /**
   * RENDER Layout Content
   */
  return (
    <div className="club-details">
        <div className="club-details-topSection px-0">
          <div className="flex flex-col mt-md gap-sm">
            {renderHeadline()}
            <Accordion type="single" defaultValue="details" className="rounded-md shadow-2xs shadow-on-surface/50">
              <AccordionItem value="details" title={titleText} headerClassName="headline-sm text-info">
                {renderDetails()}
              </AccordionItem>
            </Accordion>
          </div>
          <AdminEventTabs event={event} />
        </div>
        <div className="club-details-bottomSection px-0">{children}</div>
      </div>
  );
}

export default async function AdminEventLayout({
  children,
  params,
  searchParams,
}: PageProps<Params, SearchParams> & { children: React.ReactNode }) {
  const { clubId, eventId } = await params;
  const cache = true;
  try {
    const event: AdminEvent = await getAdminClubEvent(clubId, eventId, cache);
    return <LayoutContent event={event} children={children} />;
  } catch (error) {
    if (isApiError(error)) {
      handleApiError(error, `/admin/${clubId}/events/list`);
    }
    redirect("/dashboard/overview?error=unknown");
  }
}
