'use client';
import { EmptyState } from '@/components';
import { MembershipStatusBadge } from '@/components';
import { ExpiryDate, PeriodDate, Button } from '@/ui';
import { isRegistrationOpen } from '@/lib/dateUtils';
import { useDashboard } from '@/providers/DashboardProvider';
import { useAuth } from '@/providers/AuthUserProvider';
import { NotificationType } from '@/lib/constants';
import { PendingInvitations } from './PendingInvitations';

export function OverviewPage() {

  const { notifications, markNotificationAsRead } = useAuth();
  const { currentMembership } = useDashboard();

  // Filter event invitations
  const eventInvitations = notifications.filter(
    n => n.notificationType === NotificationType.EVENT_INVITATION && !n.isRead
  );
  console.log('Event Invitations:', eventInvitations);
  console.log('Notifications from Auth:', notifications)

  const openCreateEventModal = () => {
      console.log('Create Event clicked!')
  };

  const handleRegister = () => {
      console.log('Register Button clicked')
  };

  return (
    <div className=''>
      {/* Hero Section */}
      <div className='flex flex-col lg:flex-row bg-secondary'>
        {/* Left column: Todays activities */}
        <div className = 'flex flex-col flex-1 flex-start p-md'>
          <p className='title-md emphasized text-on-secondary mb-md'>My Activities Today</p>
          <EmptyState
            icon='Calendar'
            title='No events today'
            description='Check back later or create your own event'
            actionLabel='Create Event'
            onAction={openCreateEventModal}
            className='text-on-surface bg-surface-container-lowest rounded-md'
          />
        </div>
        {/* Right Column */}
        <div className = 'flex flex-col flex-1 flex-start p-md gap-md'>
          {/* Club Announcement */}
          <div className = ''>
              <p className='title-md emphasized text-on-secondary mb-md'>Latest Club Announcement</p>
              <EmptyState
                  icon='Announcements'
                  title='No Announcements at present'
                  description='Check back later'
                  className='text-on-surface bg-surface-container-lowest rounded-md'
              />
          </div>
          {/* Membership Information */}
          {currentMembership && (
            
              <div className='flex flex-col gap-sm bg-surface-container-lowest rounded-md p-sm'>
                {/* Membership Header */}
                <div className='flex items-center justify-between gap-sm '>
                  <div className='flex flex-col sm:flex-row items-center gap-sm '>
                    <p className='title-md emphasized text-on-surface'>My Membership</p>
                    <MembershipStatusBadge status={currentMembership.status} />
                  </div>
                  <div className='flex flex-col sm:flex-row items-center gap-sm '>
                    <p className='title-sm emphasized text-on-surface-variant'>Expiry Date:</p>
                    <ExpiryDate
                      date={currentMembership.registrationEndDate}
                      format='short'
                      nullText='Lifetime'
                      warningDays={30}
                      className='title-sm emphasized'
                    />
                  </div>
                </div>
                <p className='title-sm emphasized'>Registration Renewal Period:</p>
                <div className='flex gap-md items-center'>
                  <PeriodDate
                    date={currentMembership.type.registrationOpenDate}
                    openDate={currentMembership.type.registrationOpenDate}
                    closeDate={currentMembership.type.registrationCloseDate}
                    format='short'
                    warningDays={30}
                    className='body-sm emphasized'
                  />
                  <span className='body-sm text-info'>to</span> 
                  <PeriodDate
                    date={currentMembership.type.registrationCloseDate}
                    openDate={currentMembership.type.registrationOpenDate}
                    closeDate={currentMembership.type.registrationCloseDate}
                    format='short'
                    warningDays={30}
                    className='body-sm emphasized'
                  />
                </div>
                {/* Membership Actions */}
                <div className='flex items-center justify-between'>
                  <Button
                    variant='filled'
                    size='sm'
                    disabled={!isRegistrationOpen(
                      currentMembership.type.registrationOpenDate,
                      currentMembership.type.registrationCloseDate
                    )}
                    onClick={() => handleRegister()}
                    label='Register'
                    icon='register'
                  />
                  {(currentMembership.canManageMembers || currentMembership.canManageClub) && (
                    <Button
                      variant='outlined'
                      size='sm'
                      label='Edit Membership'
                      icon='edit'
                      href={`/admin/members/${currentMembership.id}`}
                    />
                  )}
                  <Button
                    variant='outlined' 
                    size='sm'
                    disabled={true}
                    label='Subscriptions'
                    icon='subscriptions'
                  />
                </div>
              </div>
            
          )}
          {/* Club Stats */}
          <div className = ''>
              <p className='title-md emphasized text-on-secondary mb-md'>My Club Statistics</p>
              <EmptyState
                  icon='Performance'
                  title='Not available at the moment'
                  description='Check back later'
                  className='text-on-surface bg-surface-container-lowest rounded-md'
              />
          </div>
        </div>
        
      </div>
      {/* Action Buttons */}
      <div className='flex gap-md p-md'>
        <Button
          variant="default"
          size="sm"
          icon="events"
          label="All Events"
        />
        <Button
          variant="default"
          size="sm"
          icon="calendar"
          label="My Activities"
        />
        <Button
          variant="default"
          size="sm"
          icon="add"
          label="Event"
        />
      </div>
      {/* Pending Invitations */}
      <div className='bg-surface-container'>
        
        {/* Content container */}
        <div className='flex flex-col p-md gap-sm'>
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className="title-md emphasized text-on-surface">
              Pending Invitations
            </span>
            {notifications.length > 3 && (
              <Button 
                variant="highlighted"
                size="sm"
                href="/notifications"
                label={`View All (${notifications.length})`}
              />
            )}
          </div>
          {/* List container */}
          <div className=''>
            {eventInvitations.length > 0 && (
              <PendingInvitations 
                notifications={eventInvitations}
                onNotificationClick={(id) => markNotificationAsRead(id)}
              />
            )}
          </div>
        </div>
      </div>
      {/* Upcoming Events */}
      <div className='bg-background'>
        {/* Content container */}
        <div className='flex flex-col p-md gap-sm'>
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className="title-md emphasized text-on-surface">
              Upcoming Events
            </span>
            <Button 
              variant="highlighted"
              size="sm"
              href="/notifications"
              label="View All"
            />
          </div>
          <EmptyState
            icon='events'
            title='No upcoming events yet'
            description='Check back later!'
            className='text-on-surface bg-surface-container-lowest rounded-md'
          />

        </div>
      </div>
    </div>
  );
}
