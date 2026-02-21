"""
Service to handle LeagueParticipation status changes

WHY: Centralize logic for creating/deleting LeagueAttendance records
HOW: Called from views when status is updated

STATUS TRANSITIONS:
- PENDING → ACTIVE: Create attendance records
- PENDING → CANCELLED: Delete attendance records (if any)
- ACTIVE → PENDING: Delete attendance records
- ACTIVE → CANCELLED: Delete attendance records
- CANCELLED → ACTIVE: Create attendance records
- CANCELLED → PENDING: No attendance records (stays PENDING)
"""

from leagues.models import LeagueParticipation, LeagueAttendance, LeagueSession, SessionOccurrence
from public.constants import LeagueParticipationStatus, LeagueAttendanceStatus

def handle_participation_status_change(participation, old_status, new_status):
    """
    Handle LeagueAttendance records when participation status changes
    
    Args:
        participation: LeagueParticipation instance
        old_status: Previous status (int)
        new_status: New status (int)
    
    Returns:
        dict: {
            "attendance_created": int,
            "attendance_deleted": int,
            "message": str
        }
    """
    
    # ========================================
    # CASE 1: Changing TO ACTIVE
    # ========================================
    if new_status == LeagueParticipationStatus.ACTIVE and (old_status == LeagueParticipationStatus.CANCELLED or old_status == LeagueParticipationStatus.PENDING):
        # WHY: Member confirmed participation → create attendance records
        # HOW: Create LeagueAttendance for all league sessions
        
        created_count = create_attendance_records(participation)
        
        return {
            "attendance_created": created_count,
            "attendance_deleted": 0,
            "message": f"Created {created_count} attendance records"
        }
    
    # ========================================
    # CASE 2: Changing FROM ACTIVE to non-ACTIVE (CANCELLED/PENDING)
    # ========================================
    elif old_status == LeagueParticipationStatus.ACTIVE and (new_status == LeagueParticipationStatus.CANCELLED or new_status == LeagueParticipationStatus.PENDING):
        # WHY: Member no longer participating → remove attendance records
        # HOW: Delete all LeagueAttendance for this participation
        
        deleted_count = delete_attendance_records(participation)
        
        return {
            "attendance_created": 0,
            "attendance_deleted": deleted_count,
            "message": f"Deleted {deleted_count} attendance records"
        }
    
    # ========================================
    # CASE 3: Other transitions (no attendance changes: no creation or deletion)
    # But some status changes require a change in Attendance status:
    #
    # MAPPING:
    # LeagueParticipationStatus <-> LeagueAttendanceStatus
    # ACTIVE                        ATTENDING
    # RESERVE                       WAITLIST
    # INJURED, HOLIDAY              ABSENT
    # ========================================
    else:
        # Examples:
        # - PENDING → CANCELLED: No attendance to delete
        # - CANCELLED → PENDING: No attendance to create
        
        # TODO: UPDATE LeagueAttendance.status based on MAPPING!!! 
        status_mapping = {
            LeagueParticipationStatus.ACTIVE: LeagueAttendanceStatus.ATTENDING,
            LeagueParticipationStatus.RESERVE: LeagueAttendanceStatus.WAITLIST,
            LeagueParticipationStatus.INJURED: LeagueAttendanceStatus.ABSENT,
            LeagueParticipationStatus.HOLIDAY: LeagueAttendanceStatus.ABSENT,
        }
        # get the new attendance status based on the new LeagueParticipation.status
        new_attendance_status = status_mapping.get(new_status)

        from django.utils import timezone
        today = timezone.localtime().date()

        # get all the future Attendance records for the LeagueParticipation
        records_to_update = LeagueAttendance.objects.filter(
            league_participation = participation,
            session_occurrence__session_date__gte=today 
        )
        
        # Prepare list for bulk_update
        records_to_update_list = list(records_to_update)
        
        # Update status for all records
        for record in records_to_update_list:
            record.status = new_attendance_status
        
        # Bulk update (efficient - single query!)
        if records_to_update_list:
            LeagueAttendance.objects.bulk_update(
                records_to_update_list,
                ['status'],  # Only update status field
                batch_size=100  # Process in batches of 100
            )

        return {
            "attendance_created": 0,
            "attendance_deleted": 0,
            "attendance_updated": len(records_to_update_list),
            "message": f"Updated {len(records_to_update_list)} attendance records"
        }

def create_attendance_records(participation):
    """
    Create LeagueAttendance records for all sessions
    
    HOW: Same logic as @receiver signal
    WHY: Reusable for both signal and manual status changes
    """
    league = participation.league

    # CHECK: Only do this for Leagues (not events)
    if league.is_event:
        return
    
    from django.utils import timezone
    today = timezone.localtime().date()

    future_occurrences = SessionOccurrence.objects.filter(
        league_session__league=league,
        session_date__gte=today # Only future sessions
    )

    # Create attendance records for all future sessions
    attendance_records = []
    for occurrence in future_occurrences:
        attendance_records.append(
            LeagueAttendance(
                league_participation=participation,
                session_occurrence=occurrence,
                status=LeagueAttendanceStatus.ATTENDING
            )
        )
    
    # Bulk create all attendance records
    if attendance_records:
        LeagueAttendance.objects.bulk_create(
            attendance_records,
            ignore_conflicts=True # In case records already exist
        )
   
    return len(attendance_records)


def delete_attendance_records(participation):
    """
    Delete all LeagueAttendance records for this participation
    
    WHY: Member is no longer participating (PENDING or CANCELLED)
    HOW: Delete all attendance records linked to this participation
    """
    deleted_count, _ = LeagueAttendance.objects.filter(
        league_participation=participation
    ).delete()
    
    return deleted_count