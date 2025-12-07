from django.db import models
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from django.utils import timezone
from functools import cached_property
from clubs.models import Club
from leagues.models import League, LeagueSession
from courts.models import UserCourtBooking, CourtLocation
from public.constants import MatchFormat, MatchType, MatchStatus, ScoreFormat, GenerationFormat, MLPGameType

User = get_user_model()

class Match(models.Model):
    """
    Core match entity.
    
    Can represent:
    - League matches (league_id set)
    - Club tournaments (club_id set)
    - Private matches (organized_by set)
    - MLP team matches (match_type='mlp')
    """
    
    # Match context
    club = models.ForeignKey(
        Club,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='matches',
        help_text='Club if club tournament'
    )
    league = models.ForeignKey(
        League,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='matches',
        help_text='League if league match'
    )
    organized_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='organized_matches',
        help_text='User who organized this match (for private matches)'
    )
    
    # Link to session (if league match)
    match_day = models.ForeignKey(
        LeagueSession,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='session_matches'  # session.session_matches.all()
    )

    # Match details
    match_date = models.DateField()
    match_format = models.IntegerField(
        choices=MatchFormat)
    match_type = models.IntegerField(
        choices=MatchType)
    score_format = models.IntegerField(
        choices=ScoreFormat)
    match_status = models.IntegerField(
        choices=MatchStatus,
        default=MatchStatus.PENDING
    )
    
    cancellation_reason = models.TextField(
        blank=True,
        help_text='Why was this match cancelled? (e.g., rain, insufficient players, abandoned mid-match)'
    )
    
    # Court assignment (from COURTS module)
    court_location = models.ForeignKey(
        CourtLocation,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='matches_played'
    )
    court_number = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        help_text='Specific court number (e.g., "1", "Court 2", "14")'
    )
    # ⭐ NEW: Round number for round-robin matches (2025-12-04)
    # Purpose: Track which round of a session this match belongs to
    # Use Case: Captain needs to regenerate future rounds after player leaves early
    #           System deletes rounds 4-8, regenerates with new player count
    round_number = models.IntegerField(
        null=True,
        blank=True,
        help_text='Round number (1-16) for round-robin format only. NULL for other formats.'
    )
    # ⭐ NEW: Generation format for league matches (2025-12-05)
    # Purpose: Store HOW these matches were generated (Round-Robin, King-of-Court, Manual)
    # Use Case: Display format on match results screen, filter matches by generation type
    #           All matches from same session occurrence share same generation_format
    generation_format = models.IntegerField(
        choices=GenerationFormat,
        blank=True,
        null=True,
        help_text='How matches were generated: Round-Robin, King-of-Court, or Manual. Set by captain when generating matches.'
    )
    # Link to user's manual booking (if private match)
    user_booking = models.OneToOneField(
        UserCourtBooking,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='match',
        help_text='Link to manual booking if this is a private match'
    )
    
    # Winner (set after match completion)
    # ❗️ NOTE: These two fields are MUTUALLY EXCLUSIVE
    #     - Regular match (singles/doubles): Use winning_team
    #     - MLP match: Use winning_mlp_team
    winning_team = models.ForeignKey(
        'Team',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='team_matches_won',
        help_text='Team that won (for singles/doubles matches)'
    )
    
    winning_mlp_team = models.ForeignKey(
        'MLPTeam',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='mlp_team_matches_won',
        help_text='MLP team that won (for MLP matches only)'
    )
    
    # Optional details
    notes = models.TextField(blank=True)
    
    # Result editing tracking (for self-reporting feature)
    result_entered_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='results_entered',
        help_text='User who entered the result (for audit trail)'
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-match_date']
        verbose_name_plural = 'Matches'
    
    def __str__(self):
        return f"Match on {self.match_date} - {self.get_match_format_display()}"
    
    def clean(self):
        """Validation rules"""
        # MLP matches MUST have league
        if self.match_type == 'mlp' and not self.league:
            raise ValidationError(
                "MLP matches must be associated with a league"
            )
    def save(self, *args, **kwargs):
        """Auto-set court_location from league_session for league matches."""
        
        if self.league_session:
            self.court_location = self.league_session.court_location
        
        super().save(*args, **kwargs) 

    def is_mlp(self):
        """Check if this is an MLP match."""
        return self.match_type == 'mlp'
    
    def get_participating_mlp_teams(self):
        """Get the two MLPTeam objects in this MLP match"""
        if not self.is_mlp():
            return None
        
        from matches.models import MLPTeam
        team_ids = self.teams.filter(
            mlp_team__isnull=False
        ).values_list('mlp_team_id', flat=True).distinct()
        
        return MLPTeam.objects.filter(id__in=team_ids)
    
class Team(models.Model):
    """
    Team within a match.
    
    For singles: 1 player
    For doubles: 2 players
    For MLP: Links to MLPTeam, mlp_game_type indicates which game
    
    NOTE: For round-robin leagues, teams are temporary and change every match!
    """

    match = models.ForeignKey(
        Match,
        on_delete=models.CASCADE,
        related_name='teams'
    )
    
    # MLP-specific: What game type is this team for?
    mlp_game_type = models.IntegerField(
        choices=MLPGameType,
        blank=True,
        null=True,
        help_text='Type of MLP game. Match to Game.mlp_game_type to find teams.'
    )

    # Team name (optional, auto-generated if empty)
    team_name = models.CharField(
        max_length=100,
        blank=True,
        help_text='e.g., "Team A", "Joe & Tina", "Thunderstruck"'
    )
    
    # Link to MLP team (if MLP match)
    mlp_team = models.ForeignKey(
        'MLPTeam',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='match_teams',
        help_text='MLP team entity (if this is an MLP match)'
    )
    
    # Players in this team (through TeamPlayer)
    # players = models.ManyToManyField(User, through='TeamPlayer')
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['match', 'id']
        constraints = [
            # For MLP matches: Each (match, mlp_team, mlp_game_type) combo must be unique
            # Prevents duplicate teams like: Match 20, Thunderstruck, women_doubles appearing twice
            models.UniqueConstraint(
                fields=['match', 'mlp_team', 'mlp_game_type'],
                condition=models.Q(mlp_team__isnull=False),  # Only for MLP matches
                name='unique_mlp_team_per_game_type'
            )
        ]
    
    def __str__(self):
        if self.team_name:
            return self.team_name
        
        players = self.team_players.all()
        if not players:
            return f"Team (Match {self.match.id})"
        
        player_names = [tp.player.get_full_name() or tp.player.username for tp in players]
        return " & ".join(player_names)
    
class TeamPlayer(models.Model):
    """
    Links a player to a team for a specific match.
    
    For MLP matches, also tracks which sub-game they played in.
    """
    
    team = models.ForeignKey(
        Team,
        on_delete=models.CASCADE,
        related_name='team_players'
    )
    player = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='team_participations'
    )
    
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('team', 'player')
        ordering = ['team', 'id']
    
    def __str__(self):
        # Build player display name
        player_name = self.player.get_full_name() or self.player.username
        team_name = self.team.team_name or f"Team {self.team.id}"
        return f"{player_name} on {team_name}"
    
class Game(models.Model):
    """
    Individual game within a match.
    
    ⚠️ CRITICAL: Game record ONLY exists for COMPLETED games!
    - No Game record = Not played yet
    - Game record = Was played, has winner AND loser (both REQUIRED!)
    """
    
    match = models.ForeignKey(
        'Match',
        on_delete=models.CASCADE,
        related_name='games'
    )
    
    game_number = models.IntegerField()
    
    # Scores
    team1_score = models.IntegerField()
    team2_score = models.IntegerField()
    
    # Winner (REQUIRED!)
    game_winner_team = models.ForeignKey(
        'Team',
        on_delete=models.PROTECT,
        related_name='games_won',
        help_text='REQUIRED! Game only exists if completed.'
    )
    
    # Loser (REQUIRED! - Simplifies stats queries)
    game_loser_team = models.ForeignKey(
        'Team',
        on_delete=models.PROTECT,
        related_name='games_lost',
        help_text='REQUIRED! Simplifies queries for stats.'
    )
    
    # MLP-specific
    mlp_game_type = models.IntegerField(
        choices=MLPGameType,
        blank=True,
        null=True
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('match', 'game_number')
        ordering = ['match', 'game_number']
        constraints = [
            models.CheckConstraint(
                check=~models.Q(game_winner_team=models.F('game_loser_team')),
                name='winner_not_equal_loser',
                violation_error_message='Winner and loser cannot be same team!'
            )
        ]
    
    def __str__(self):
        mlp_type = f" ({self.get_mlp_game_type_display()})" if self.mlp_game_type else ""
        return f"Game {self.game_number} - {self.team1_score}:{self.team2_score}{mlp_type}"
    
    def get_players(self):
        """Get all players who played in THIS game (works for ALL match types!)"""
        if self.mlp_game_type:
            # MLP: Filter teams by mlp_game_type
            teams = self.match.teams.filter(mlp_game_type=self.mlp_game_type)
        else:
            # Regular: All teams play all games
            teams = self.match.teams.all()
        
        player_ids = teams.values_list('team_players__player', flat=True)
        return User.objects.filter(id__in=player_ids).distinct()

class MLPTeam(models.Model):
    """
    MLP Team entity - permanent roster of 4+ players.
    
    ARCHITECTURE:
    - ALL MLP teams MUST belong to a league
    - Get club via: mlp_team.league.club
    - For club events: Create League with type='mlp'
    
    NO GENDER VALIDATION:
    - Captain has full control
    - Optional UX hints only (can dismiss)
    """
    
    # Basic info
    name = models.CharField(max_length=100, unique=True)
    
    league = models.ForeignKey(
        League,
        on_delete=models.CASCADE,
        related_name='mlp_teams',
        help_text='REQUIRED! MLP league this team plays in'
    )
    
    # Team logo/colors
    logo_url = models.URLField(max_length=200, blank=True)
    
    # Status
    is_active = models.BooleanField(default=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        verbose_name = 'MLP Team'
        constraints = [
            models.UniqueConstraint(
                fields=['league', 'name'],
                name='unique_mlp_team_per_league'
            )
        ]
    
    def __str__(self):
        return self.name
    
    @cached_property
    def current_roster_version(self):
        """Returns currently active roster version (cached)"""
        return self.roster_versions.filter(
            effective_from__lte=timezone.now().date()
        ).order_by('-effective_from').first()
    
    def get_current_roster(self):
        """Get the current active roster version."""
        return self.roster_versions.filter(is_active=True).first()
    
    def get_roster_at_date(self, date):
        """Get roster version that was active on a specific date."""
        return self.roster_versions.filter(
            effective_from__lte=date,
            is_active=True
        ).order_by('-effective_from').first()
    
class MLPTeamRosterVersion(models.Model):
    """
    Versioned roster snapshot for an MLP team.
    
    PURPOSE: Track roster changes over time
    - New version created when players added/removed
    - Historical record of who played when
    - Supports mid-season roster changes
    
    BUSINESS RULES:
    - Only ONE active version per team at a time
    - New version must have effective_from >= previous version
    - Rosters are versioned, not edited in place
    
    EXAMPLE TIMELINE:
    - Feb 1: Initial roster (Mike, Sarah, John, Lisa)
    - Mar 15: Add Alex, remove Mike → New version!
    - Apr 20: Add Emma → New version!
    """
    
    mlp_team = models.ForeignKey(
        MLPTeam,
        on_delete=models.CASCADE,
        related_name='roster_versions',
        help_text='Which MLP team this roster belongs to'
    )
    
    # Version metadata
    version_number = models.IntegerField(
        help_text='Auto-incremented version (1, 2, 3, ...)'
    )
    effective_from = models.DateField(
        help_text='Date this roster version became active'
    )
    is_active = models.BooleanField(
        default=True,
        help_text='Is this the current active roster?'
    )
    
    # Change tracking
    changed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='mlp_roster_changes_made',
        help_text='Admin/captain who made this roster change'
    )
    change_notes = models.TextField(
        blank=True,
        help_text='Optional notes about roster change (e.g., "Added John after Mike injured")'
    )
    
    # M2M to User via MLPTeamRosterPlayer through-table
    players = models.ManyToManyField(
        User,
        through='MLPTeamRosterPlayer',
        related_name='mlp_roster_versions',
        help_text='Players in this roster version'
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('mlp_team', 'version_number')
        ordering = ['mlp_team', '-version_number']
        verbose_name = 'MLP Team Roster Version'
        constraints = [
            # Only one active roster per team
            models.UniqueConstraint(
                fields=['mlp_team'],
                condition=models.Q(is_active=True),
                name='one_active_roster_per_team'
            )
        ]
    
    def __str__(self):
        return f"{self.mlp_team.name} - Roster v{self.version_number} (from {self.effective_from})"
    
    def clean(self):
        """Validation rules"""
        # If creating new version, ensure effective_from is after previous version
        if self.mlp_team_id:
            previous = self.mlp_team.roster_versions.filter(
                version_number__lt=self.version_number
            ).order_by('-version_number').first()
            
            if previous and self.effective_from < previous.effective_from:
                raise ValidationError(
                    f"New roster version must have effective_from >= {previous.effective_from}"
                )
    
    def save(self, *args, **kwargs):
        """Auto-increment version_number if not set"""
        if not self.version_number:
            last_version = self.mlp_team.roster_versions.order_by('-version_number').first()
            self.version_number = (last_version.version_number + 1) if last_version else 1
        
        # If setting this as active, deactivate all other versions for this team
        if self.is_active:
            MLPTeamRosterVersion.objects.filter(
                mlp_team=self.mlp_team
            ).exclude(id=self.id).update(is_active=False)
        
        super().save(*args, **kwargs)
    
    def get_player_count(self):
        """Get number of players in this roster version"""
        return self.roster_players.count()
    
    def get_players_by_gender(self):
        """Get player counts by gender (for validation hints)"""
        from django.db.models import Count
        return self.roster_players.values('player__gender').annotate(
            count=Count('id')
        )
    
class MLPTeamRosterPlayer(models.Model):
    """
    Links a player to a specific roster version.
    
    PURPOSE: Track which players are in which roster version
    - Through-table for MLPTeamRosterVersion.players M2M
    - Allows additional metadata per player (jersey number, position, etc.)
    
    EXAMPLE:
    Roster v1 (Feb 1): Mike, Sarah, John, Lisa
    Roster v2 (Mar 15): Sarah, John, Lisa, Alex (Mike removed, Alex added)
    
    This table has separate records for each player in each version.
    """
    
    roster_version = models.ForeignKey(
        MLPTeamRosterVersion,
        on_delete=models.CASCADE,
        related_name='roster_players',
        help_text='Which roster version this player belongs to'
    )
    player = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='mlp_roster_positions',
        help_text='Player in this roster'
    )
    
    # Optional metadata (future features)
    jersey_number = models.CharField(
        max_length=10,
        blank=True,
        null=True,
        help_text='Optional jersey number for this player'
    )
    position_notes = models.CharField(
        max_length=200,
        blank=True,
        help_text='Optional position notes (e.g., "Primary for women\'s doubles")'
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('roster_version', 'player')
        ordering = ['roster_version', 'id']
        verbose_name = 'MLP Team Roster Player'
    
    def __str__(self):
        player_name = self.player.get_full_name() or self.player.username
        return f"{player_name} in {self.roster_version}"