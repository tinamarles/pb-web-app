# clubs/management/commands/update_psj_suspended_memberships.py

from django.core.management.base import BaseCommand
from django.db import transaction
from clubs.models import Club, ClubMembership, MembershipStatus
from datetime import date


class Command(BaseCommand):
    help = 'Update PSJ-St. Jerôme SUSPENDED Non-Resident memberships to EXPIRED with 2025 dates'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Run without making changes (preview mode)',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        if dry_run:
            self.stdout.write(self.style.WARNING('🔍 DRY RUN MODE - No changes will be made'))
        
        try:
            # Get the PSJ-St. Jerôme club
            club = Club.objects.get(short_name='PSJ-St. Jerôme')
            self.stdout.write(f"✅ Found club: {club.name} ({club.short_name})")
            
        except Club.DoesNotExist:
            self.stdout.write(self.style.ERROR('❌ Club "PSJ-St. Jerôme" not found!'))
            return
        
        # Filter memberships
        memberships = ClubMembership.objects.filter(
            club=club,
            status=MembershipStatus.SUSPENDED,
            type__name='Non-Resident'
        )
        
        count = memberships.count()
        self.stdout.write(f"\n📊 Found {count} memberships matching criteria:")
        self.stdout.write(f"   - Club: PSJ-St. Jerôme")
        self.stdout.write(f"   - Status: SUSPENDED")
        self.stdout.write(f"   - Type: Non-Resident")
        
        if count == 0:
            self.stdout.write(self.style.WARNING('\n⚠️  No memberships found to update.'))
            return
        
        if count != 24:
            self.stdout.write(self.style.WARNING(f'\n⚠️  Expected 24 records, but found {count}'))
            response = input('Continue anyway? (yes/no): ')
            if response.lower() != 'yes':
                self.stdout.write(self.style.WARNING('❌ Cancelled by user'))
                return
        
        # Preview the memberships
        self.stdout.write(f"\n📋 Memberships to update:")
        for membership in memberships[:5]:  # Show first 5 as preview
            self.stdout.write(
                f"   • {membership.member.get_full_name()} - "
                f"Status: {membership.get_status_display()} - "
                f"Type: {membership.type}"
            )
        
        if count > 5:
            self.stdout.write(f"   ... and {count - 5} more")
        
        # Define new values
        new_status = MembershipStatus.EXPIRED
        new_start_date = date(2025, 1, 1)
        new_end_date = date(2025, 12, 31)
        
        self.stdout.write(f"\n🔄 Changes to apply:")
        self.stdout.write(f"   - Status: SUSPENDED → EXPIRED")
        self.stdout.write(f"   - Registration Start Date: → 2025-01-01")
        self.stdout.write(f"   - Registration End Date: → 2025-12-31")
        
        if dry_run:
            self.stdout.write(self.style.SUCCESS(f'\n✅ DRY RUN: Would update {count} memberships'))
            return
        
        # Confirm before proceeding
        self.stdout.write(self.style.WARNING(f'\n⚠️  About to update {count} memberships!'))
        response = input('Are you sure? (yes/no): ')
        
        if response.lower() != 'yes':
            self.stdout.write(self.style.WARNING('❌ Cancelled by user'))
            return
        
        # Perform the update
        try:
            with transaction.atomic():
                updated_count = 0
                
                for membership in memberships:
                    membership.status = new_status
                    membership.registration_start_date = new_start_date
                    membership.registration_end_date = new_end_date
                    membership.save()
                    updated_count += 1
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f'\n✅ Successfully updated {updated_count} memberships!'
                    )
                )
                
                # Summary
                self.stdout.write(f"\n📊 Summary:")
                self.stdout.write(f"   - Memberships updated: {updated_count}")
                self.stdout.write(f"   - New status: EXPIRED")
                self.stdout.write(f"   - Date range: 2025-01-01 to 2025-12-31")
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'\n❌ Error during update: {str(e)}')
            )
            raise