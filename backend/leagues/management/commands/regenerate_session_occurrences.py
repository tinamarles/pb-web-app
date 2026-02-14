"""
Regenerate SessionOccurrence records for leagues.

Usage:
    python manage.py regenerate_session_occurrences --league-id 123
    python manage.py regenerate_session_occurrences --league-name "Rising Stars"
    python manage.py regenerate_session_occurrences --all
"""

from django.core.management.base import BaseCommand, CommandError
from leagues.models import League, LeagueSession


class Command(BaseCommand):
    help = 'Regenerate SessionOccurrence records for leagues'

    def add_arguments(self, parser):
        # Option 1: By league ID
        parser.add_argument(
            '--league-id',
            type=int,
            help='Regenerate occurrences for specific league ID',
        )
        
        # Option 2: By league name
        parser.add_argument(
            '--league-name',
            type=str,
            help='Regenerate occurrences for league by name (case-insensitive)',
        )
        
        # Option 3: All leagues
        parser.add_argument(
            '--all',
            action='store_true',
            help='Regenerate occurrences for ALL leagues',
        )

    def handle(self, *args, **options):
        league_id = options.get('league_id')
        league_name = options.get('league_name')
        all_leagues = options.get('all')

        # ========================================
        # VALIDATE: Must provide one option
        # ========================================
        if not any([league_id, league_name, all_leagues]):
            raise CommandError(
                'You must provide one of: --league-id, --league-name, or --all'
            )

        # ========================================
        # OPTION 1: Regenerate by League ID
        # ========================================
        if league_id:
            try:
                league = League.objects.get(id=league_id)
                self.regenerate_for_league(league)
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✅ Successfully regenerated occurrences for league: {league.name}'
                    )
                )
            except League.DoesNotExist:
                raise CommandError(f'League with ID {league_id} does not exist')

        # ========================================
        # OPTION 2: Regenerate by League Name
        # ========================================
        elif league_name:
            try:
                league = League.objects.get(name__iexact=league_name)
                self.regenerate_for_league(league)
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✅ Successfully regenerated occurrences for league: {league.name}'
                    )
                )
            except League.DoesNotExist:
                raise CommandError(f'League with name "{league_name}" does not exist')
            except League.MultipleObjectsReturned:
                raise CommandError(
                    f'Multiple leagues found with name "{league_name}". Use --league-id instead.'
                )

        # ========================================
        # OPTION 3: Regenerate ALL leagues
        # ========================================
        elif all_leagues:
            leagues = League.objects.all()
            total = leagues.count()
            
            self.stdout.write(
                self.style.WARNING(f'⚠️  About to regenerate occurrences for {total} leagues...')
            )
            
            success_count = 0
            error_count = 0
            
            for league in leagues:
                try:
                    self.regenerate_for_league(league)
                    success_count += 1
                    self.stdout.write(f'  ✅ {league.name}')
                except Exception as e:
                    error_count += 1
                    self.stdout.write(
                        self.style.ERROR(f'  ❌ {league.name}: {str(e)}')
                    )
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'\n✅ Completed! {success_count} success, {error_count} errors'
                )
            )

    def regenerate_for_league(self, league):
        """
        Regenerate SessionOccurrence records for a single league.
        
        How it works:
        1. Get all LeagueSession records for this league
        2. Call generate_occurrences() on each session
        3. This deletes old occurrences and creates new ones!
        """
        sessions = LeagueSession.objects.filter(league=league)
        
        if not sessions.exists():
            self.stdout.write(
                self.style.WARNING(f'⚠️  No sessions found for league: {league.name}')
            )
            return
        
        session_count = sessions.count()
        occurrence_count = 0
        
        for session in sessions:
            # 🔥 THIS IS THE MAGIC! Call the model's generate_occurrences() method
            session.generate_occurrences()
            
            # Count how many occurrences were created
            new_occurrences = session.occurrences.count()
            occurrence_count += new_occurrences
            
            self.stdout.write(
                f'  📅 {session.get_day_of_week_display()}: {new_occurrences} occurrences'
            )
        
        self.stdout.write(
            f'  🎯 Total: {occurrence_count} occurrences for {session_count} sessions'
        )