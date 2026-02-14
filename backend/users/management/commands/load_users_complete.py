"""
Django management command to bulk load users + club memberships + league participation.

🚨 FIXES IN THIS VERSION:
- ✅ Dry-run now simulates EVERYTHING (not just users)
- ✅ Shows table of 5 example users with all created records
- ✅ Lists skipped users with emails and reasons
- ✅ Proper dry-run support in all helper methods

Usage:
    python manage.py load_users_complete path/to/users.csv --club="PSJ-St. Jerôme" --dry-run
    python manage.py load_users_complete path/to/users.csv --club="PSJ-St. Jerôme"

SAVE THIS FILE AS: backend/users/management/commands/load_users_complete.py
"""

import csv
from decimal import Decimal
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone
from django.contrib.auth import get_user_model
from clubs.models import Club, ClubMembership, ClubMembershipType, Role, ClubMembershipSkillLevel
from leagues.models import League, LeagueParticipation, LeagueAttendance, SessionOccurrence
from public.constants import Gender, RoleType, MembershipStatus, LeagueParticipationStatus, LeagueAttendanceStatus
from unidecode import unidecode  # pip install unidecode

User = get_user_model()


class Command(BaseCommand):
    help = 'Bulk load users with club memberships and league participation'

    def add_arguments(self, parser):
        parser.add_argument('csv_file', type=str, help='Path to CSV file')
        parser.add_argument(
            '--club',
            type=str,
            required=True,
            help='Club name (e.g., "PSJ-St. Jerôme")',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Run without actually creating records (test mode)',
        )

    def handle(self, *args, **options):
        csv_file = options['csv_file']
        club_name = options['club']
        dry_run = options['dry_run']

        if dry_run:
            self.stdout.write(self.style.WARNING('🔍 DRY RUN MODE - No records will be created\n'))

        # ========================================
        # SETUP: Validate club exists
        # ========================================
        try:
            # Try short_name first, then fall back to name
            club = Club.objects.filter(short_name__iexact=club_name).first()
            if not club:
                club = Club.objects.get(name__iexact=club_name)
            
            self.stdout.write(self.style.SUCCESS(f'✅ Found club: {club.name}\n'))
        except Club.DoesNotExist:
            raise CommandError(f'Club "{club_name}" not found!')

        # ========================================
        # MAPPINGS
        # ========================================
        GENDERS = {
            'Male': Gender.MALE,
            'Female': Gender.FEMALE,
            'Other': Gender.UNSPECIFIED,
            'Prefer Not to Say': Gender.UNSPECIFIED,
        }
        
        BOOLEAN_VALUES = {
            'true': True, 'false': False,
            'TRUE': True, 'FALSE': False,
            'yes': True, 'no': False,
            '1': True, '0': False,
            't': True, 'f': False,
            'y': True, 'n': False,
        }

        # ========================================
        # COUNTERS & TRACKING
        # ========================================
        users_created = 0
        users_skipped = 0
        memberships_created = 0
        participations_created = 0
        attendances_created = 0
        errors = 0
        
        # Track skipped users for reporting
        skipped_users = []
        
        # Track sample records for verification table (first 5 created users)
        sample_records = []

        # ========================================
        # PROCESS CSV
        # ========================================
        try:
            with open(csv_file, 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                
                # Validate headers
                required_fields = {
                    'firstName', 'lastName', 'email', 
                    'gender', 'membership_type'
                }
                
                if not required_fields.issubset(reader.fieldnames):
                    missing = required_fields - set(reader.fieldnames)
                    raise CommandError(f'Missing required columns: {missing}')

                self.stdout.write(self.style.SUCCESS(f'✅ CSV file validated\n'))
                self.stdout.write(self.style.SUCCESS(f'📊 Processing rows...\n'))

                with transaction.atomic():
                    for row_num, row in enumerate(reader, start=2):
                        try:
                            # ========================================
                            # EXTRACT & CLEAN DATA
                            # ========================================
                            first_name = row['firstName'].strip()
                            last_name = row['lastName'].strip()
                            email = row['email'].strip().lower()
                            mobile_phone = row.get('mobile_phone', '').strip()
                            home_phone = row.get('home_phone', '').strip()
                            dob = row.get('dob', '').strip() or None
                            location = row.get('location', '').strip() or ""  # ← FIX: Use "" not None (no null=True)
                            
                            # Skill level (decimal!)
                            skill_level_str = row.get('skill_level', '').strip()
                            if not skill_level_str:
                                skill_level = Decimal('2.5')  # Default
                            else:
                                try:
                                    skill_level = Decimal(skill_level_str)
                                except:
                                    self.stdout.write(
                                        self.style.ERROR(
                                            f'❌ Row {row_num}: Invalid skill_level "{skill_level_str}" '
                                            f'(must be decimal like 3.0, 3.5, 4.0) - SKIPPED'
                                        )
                                    )
                                    errors += 1
                                    skipped_users.append({
                                        'email': email,
                                        'name': f'{first_name} {last_name}',
                                        'reason': f'Invalid skill_level: {skill_level_str}'
                                    })
                                    continue
                            
                            # Gender
                            gender_str = row['gender'].strip()
                            gender = GENDERS.get(gender_str)
                            if gender is None:
                                self.stdout.write(
                                    self.style.ERROR(
                                        f'❌ Row {row_num}: Invalid gender "{gender_str}" - SKIPPED'
                                    )
                                )
                                errors += 1
                                skipped_users.append({
                                    'email': email,
                                    'name': f'{first_name} {last_name}',
                                    'reason': f'Invalid gender: {gender_str}'
                                })
                                continue
                            
                            # is_coach (boolean)
                            is_coach_str = row.get('is_coach', '').strip().lower()
                            is_coach = BOOLEAN_VALUES.get(is_coach_str, False)
                            
                            # Membership type
                            membership_type_name = row['membership_type'].strip()
                            
                            # Roles (pipe-separated)
                            roles_str = row.get('roles', 'Member').strip()
                            role_names = [r.strip() for r in roles_str.split('|') if r.strip()]
                            
                            # Skill levels (pipe-separated)
                            skill_levels_str = row.get('skill_levels', '').strip()
                            skill_level_short_names = [s.strip() for s in skill_levels_str.split('|') if s.strip()]
                            
                            # League (optional)
                            league_str = row.get('league', '').strip()

                            # ========================================
                            # VALIDATE REQUIRED FIELDS
                            # ========================================
                            if not all([first_name, last_name, email, gender_str, membership_type_name]):
                                self.stdout.write(
                                    self.style.ERROR(
                                        f'❌ Row {row_num}: Missing required field - SKIPPED'
                                    )
                                )
                                users_skipped += 1
                                skipped_users.append({
                                    'email': email,
                                    'name': f'{first_name} {last_name}',
                                    'reason': 'Missing required field'
                                })
                                continue

                            # ========================================
                            # STEP 1: CREATE OR GET USER
                            # ========================================
                            user, created = self._create_or_get_user(
                                email=email,
                                first_name=first_name,
                                last_name=last_name,
                                mobile_phone=mobile_phone,
                                home_phone=home_phone,
                                dob=dob,
                                location=location,
                                skill_level=skill_level,
                                gender=gender,
                                is_coach=is_coach,
                                dry_run=dry_run
                            )
                            
                            if created:
                                users_created += 1
                                self.stdout.write(
                                    self.style.SUCCESS(
                                        f'✅ Row {row_num}: Created user {user.username} ({first_name} {last_name})'
                                    )
                                )
                            else:
                                users_skipped += 1
                                self.stdout.write(
                                    self.style.WARNING(
                                        f'⚠️  Row {row_num}: User {email} already exists - checking membership'
                                    )
                                )
                                # DON'T skip! Continue to check/create membership

                            # ========================================
                            # STEP 2: CREATE CLUB MEMBERSHIP
                            # ========================================
                            membership, mem_created = self._create_club_membership(
                                user=user,
                                club=club,
                                membership_type_name=membership_type_name,
                                role_names=role_names,
                                skill_level_short_names=skill_level_short_names,
                                dry_run=dry_run
                            )
                            
                            if mem_created:
                                memberships_created += 1
                                self.stdout.write(
                                    self.style.SUCCESS(
                                        f'   ✅ Created club membership ({membership_type_name})'
                                    )
                                )
                            else:
                                self.stdout.write(
                                    self.style.WARNING(
                                        f'   ⚠️  Club membership already exists'
                                    )
                                )
                            
                            # ========================================
                            # STEP 3: CREATE LEAGUE PARTICIPATION (if league specified)
                            # ========================================
                            attendance_count = 0
                            league_name = None
                            
                            if league_str:
                                league = self._get_league(league_str, club)
                                
                                if league:
                                    league_name = league.name
                                    participation, part_created = self._create_league_participation(
                                        user=user,
                                        league=league,
                                        membership=membership,
                                        dry_run=dry_run
                                    )
                                    
                                    if part_created:
                                        participations_created += 1
                                        self.stdout.write(
                                            self.style.SUCCESS(
                                                f'   ✅ Enrolled in league: {league.name}'
                                            )
                                        )
                                        
                                        # ========================================
                                        # STEP 4: CREATE LEAGUE ATTENDANCE for all future sessions
                                        # ========================================
                                        attendance_count = self._create_attendance_records(
                                            participation=participation,
                                            league=league,
                                            dry_run=dry_run
                                        )
                                        
                                        attendances_created += attendance_count
                                        self.stdout.write(
                                            self.style.SUCCESS(
                                                f'   ✅ Created {attendance_count} attendance records'
                                            )
                                        )
                                    else:
                                        self.stdout.write(
                                            self.style.WARNING(
                                                f'   ⚠️  Already enrolled in {league.name}'
                                            )
                                        )
                                else:
                                    self.stdout.write(
                                        self.style.WARNING(
                                            f'   ⚠️  League "{league_str}" not found - skipping enrollment'
                                        )
                                    )
                            
                            # ========================================
                            # TRACK SAMPLE RECORDS (first 5 created users)
                            # ========================================
                            if created and len(sample_records) < 5:
                                sample_records.append({
                                    'username': user.username,
                                    'email': email,
                                    'name': f'{first_name} {last_name}',
                                    'membership_type': membership_type_name,
                                    'league': league_name or 'N/A',
                                    'attendance_count': attendance_count
                                })

                        except Exception as e:
                            self.stdout.write(
                                self.style.ERROR(
                                    f'❌ Row {row_num}: Error - {str(e)} - SKIPPED'
                                )
                            )
                            errors += 1
                            skipped_users.append({
                                'email': row.get('email', 'unknown'),
                                'name': f"{row.get('firstName', '')} {row.get('lastName', '')}",
                                'reason': str(e)
                            })
                            continue

                    if dry_run:
                        raise Exception("Dry run - rolling back")

        except Exception as e:
            if dry_run and "Dry run" in str(e):
                pass  # Expected rollback
            else:
                raise CommandError(f'Error processing CSV: {e}')

        # ========================================
        # SUMMARY
        # ========================================
        self.stdout.write('\n' + '='*80)
        self.stdout.write(self.style.SUCCESS(f'\n📊 SUMMARY:\n'))
        self.stdout.write(self.style.SUCCESS(f'   ✅ Users created: {users_created}'))
        self.stdout.write(self.style.WARNING(f'   ⚠️  Users skipped: {users_skipped}'))
        self.stdout.write(self.style.SUCCESS(f'   ✅ Club memberships created: {memberships_created}'))
        self.stdout.write(self.style.SUCCESS(f'   ✅ League enrollments: {participations_created}'))
        self.stdout.write(self.style.SUCCESS(f'   ✅ Attendance records: {attendances_created}'))
        self.stdout.write(self.style.ERROR(f'   ❌ Errors: {errors}'))
        
        # ========================================
        # SKIPPED USERS TABLE
        # ========================================
        if skipped_users:
            self.stdout.write('\n' + '='*80)
            self.stdout.write(self.style.WARNING(f'\n⚠️  SKIPPED USERS ({len(skipped_users)}):\n'))
            self.stdout.write(f'{"Email":<40} {"Name":<25} {"Reason":<30}')
            self.stdout.write('-' * 80)
            for user in skipped_users:
                self.stdout.write(
                    f"{user['email']:<40} {user['name']:<25} {user['reason']:<30}"
                )
        
        # ========================================
        # SAMPLE RECORDS TABLE (for verification)
        # ========================================
        if sample_records:
            self.stdout.write('\n' + '='*80)
            self.stdout.write(self.style.SUCCESS(f'\n✅ SAMPLE RECORDS (for verification):\n'))
            self.stdout.write(
                f'{"Username":<20} {"Email":<30} {"Membership":<15} {"League":<20} {"Attendance":<10}'
            )
            self.stdout.write('-' * 80)
            for record in sample_records:
                self.stdout.write(
                    f"{record['username']:<20} "
                    f"{record['email']:<30} "
                    f"{record['membership_type']:<15} "
                    f"{record['league']:<20} "
                    f"{record['attendance_count']:<10}"
                )
        
        self.stdout.write('\n' + '='*80 + '\n')

        if dry_run:
            self.stdout.write(
                self.style.WARNING('\n🔍 DRY RUN COMPLETE - No records were actually created\n')
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f'\n🎉 SUCCESS! Loaded {users_created} users with '
                    f'{memberships_created} club memberships and '
                    f'{participations_created} league enrollments!\n'
                )
            )

    # ========================================
    # HELPER METHODS
    # ========================================
    
    def _create_or_get_user(self, email, first_name, last_name, mobile_phone, 
                            home_phone, dob, location, skill_level, gender, 
                            is_coach, dry_run):
        """Create or get existing user by email."""
        
        # Check if user already exists
        existing_user = User.objects.filter(email=email).first()
        if existing_user:
            return existing_user, False
        
        if dry_run:
            # Create temporary user object for dry-run (unsaved)
            username = self._generate_username(first_name, last_name)
            return User(
                email=email,
                username=username,
                first_name=first_name,
                last_name=last_name,
                skill_level=skill_level,
                gender=gender,
                is_coach=is_coach
            ), True
        
        # Generate username
        username = self._generate_username(first_name, last_name)
        
        # Handle username collisions
        original_username = username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{original_username}{counter}"
            counter += 1
        
        # Create user
        user = User.objects.create_user(
            username=username,
            email=email,
            password='risingstars2026',  # Default password
            first_name=first_name,
            last_name=last_name,
            mobile_phone=mobile_phone,
            home_phone=home_phone,
            dob=dob if dob else None,
            location=location,  # ← FIX: Don't convert "" to None!
            skill_level=skill_level,
            gender=gender,
            is_coach=is_coach,
        )
        
        return user, True
    
    def _generate_username(self, first_name, last_name):
        """Generate username: @firstnamelastname (lowercase, no accents)."""
        username_base = f"{first_name}{last_name}"
        username_clean = unidecode(username_base)
        username_clean = username_clean.replace(' ', '').replace('-', '')
        return f"@{username_clean.lower()}"
    
    def _create_club_membership(self, user, club, membership_type_name, 
                                role_names, skill_level_short_names, dry_run):
        """Create club membership with type and roles."""
        
        # In dry-run, check if would exist
        if dry_run:
            existing = ClubMembership.objects.filter(
                member__email=user.email,  # Use email since user is unsaved
                club=club
            ).first()
            
            if existing:
                return existing, False
            
            # Create mock membership object (unsaved)
            membership_type = ClubMembershipType.objects.get(
                club=club,
                name__iexact=membership_type_name
            )
            
            return ClubMembership(
                member=user,
                club=club,
                type=membership_type,
                status=MembershipStatus.ACTIVE
            ), True
        
        # Check if membership already exists
        existing = ClubMembership.objects.filter(
            member=user,
            club=club
        ).first()
        
        if existing:
            return existing, False
        
        # Get membership type
        try:
            membership_type = ClubMembershipType.objects.get(
                club=club,
                name__iexact=membership_type_name
            )
        except ClubMembershipType.DoesNotExist:
            raise Exception(
                f'Membership type "{membership_type_name}" not found for club {club.name}'
            )
        
        # Create membership
        membership = ClubMembership.objects.create(
            member=user,
            club=club,
            type=membership_type,
            status=MembershipStatus.ACTIVE,
            membership_number=f"{club.short_name}-{user.id}"  # ← FIX: Generate unique membership number
        )
        
        # Add roles (pipe-separated in CSV)
        for role_name in role_names:
            try:
                # Map CSV string to RoleType constant
                role_mapping = {
                    'admin': RoleType.ADMIN,
                    'organizer': RoleType.ORGANIZER,
                    'captain': RoleType.CAPTAIN,
                    'instructor': RoleType.INSTRUCTOR,
                    'member': RoleType.MEMBER,
                    'club member': RoleType.MEMBER,
                }
                
                role_type = role_mapping.get(role_name.lower())
                if role_type:
                    role = Role.objects.get(name=role_type)
                    membership.roles.add(role)
                else:
                    self.stdout.write(
                        self.style.WARNING(
                            f'   ⚠️  Role "{role_name}" not recognized - skipping'
                        )
                    )
            except Role.DoesNotExist:
                self.stdout.write(
                    self.style.WARNING(
                        f'   ⚠️  Role "{role_name}" not found in database - skipping'
                    )
                )
                continue
        
        # Add skill levels (pipe-separated in CSV)
        for short_name in skill_level_short_names:
            try:
                skill_level = ClubMembershipSkillLevel.objects.get(short_name__iexact=short_name)
                membership.levels.add(skill_level)
            except ClubMembershipSkillLevel.DoesNotExist:
                self.stdout.write(
                    self.style.WARNING(
                        f'   ⚠️  Skill level "{short_name}" not found - skipping'
                    )
                )
                continue
        
        return membership, True
    
    def _get_league(self, league_identifier, club):
        """Get league by name or ID."""
        
        # Try by ID first
        if league_identifier.isdigit():
            try:
                return League.objects.get(id=int(league_identifier), club=club)
            except League.DoesNotExist:
                pass
        
        # Try by name
        try:
            return League.objects.get(name__iexact=league_identifier, club=club)
        except League.DoesNotExist:
            return None
    
    def _create_league_participation(self, user, league, membership, dry_run):
        """Create league participation."""
        
        # In dry-run, check if would exist
        if dry_run:
            existing = LeagueParticipation.objects.filter(
                member__email=user.email,  # Use email since user is unsaved
                league=league
            ).first()
            
            if existing:
                return existing, False
            
            # Create mock participation object (unsaved)
            return LeagueParticipation(
                league=league,
                member=user,
                club_membership=membership,
                status=LeagueParticipationStatus.ACTIVE
            ), True
        
        # Check if already participating
        existing = LeagueParticipation.objects.filter(
            member=user,
            league=league
        ).first()
        
        if existing:
            return existing, False
        
        # Create participation
        participation = LeagueParticipation.objects.create(
            league=league,
            member=user,
            club_membership=membership,
            status=LeagueParticipationStatus.ACTIVE
        )
        
        return participation, True
    
    def _create_attendance_records(self, participation, league, dry_run):
        """
        Auto-create LeagueAttendance records for all future SessionOccurrences.
        
        This is KEY for leagues - when a user enrolls, they're enrolled for the 
        ENTIRE SEASON, so we create attendance records for all upcoming sessions!
        """
        
        today = timezone.localtime().date()
        
        # Get all future session occurrences for this league
        future_occurrences = SessionOccurrence.objects.filter(
            league=league,
            session_date__gte=today,
            is_cancelled=False
        )
        
        if dry_run:
            # In dry-run, just count how many would be created
            return future_occurrences.count()
        
        attendance_records = []
        
        for occurrence in future_occurrences:
            # Check if attendance record already exists
            existing = LeagueAttendance.objects.filter(
                league_participation=participation,
                session_occurrence=occurrence
            ).first()
            
            if existing:
                continue
            
            # Create attendance record with default status = ATTENDING
            attendance = LeagueAttendance(
                league_participation=participation,
                session_occurrence=occurrence,
                status=LeagueAttendanceStatus.ATTENDING
            )
            
            attendance_records.append(attendance)
        
        # Bulk create all attendance records
        LeagueAttendance.objects.bulk_create(attendance_records)
        
        return len(attendance_records)