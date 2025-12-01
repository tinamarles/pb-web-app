from django.db import models
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from django.utils import timezone
from functools import cached_property
from clubs.models import Club
from leagues.models import League
from courts.models import UserCourtBooking, CourtLocation

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
    
    MATCH_FORMAT_CHOICES = [
        ('best_of_1', 'Best of 1 (Single Game)'),
        ('best_of_3', 'Best of 3'),
        ('best_of_5', 'Best of 5'),
    ]
    
    MATCH_TYPE_CHOICES = [
        ('singles', 'Singles'),
        ('doubles', 'Doubles'),
        ('mlp', 'MLP Team Match'),
    ]
    
    SCORE_FORMAT_CHOICES = [
        ('sideout', 'Side-out Scoring'),
        ('rally', 'Rally Scoring'),
    ]
    
    MATCH_STATUS_CHOICES = [
        ('pending', 'Pending - Players invited'),       # Private matches: awaiting player confirmation
        ('accepted', 'Accepted - All players confirmed'),  # Private matches: all players confirmed
        ('scheduled', 'Scheduled'),                     # League/Tournament: awaiting results
        ('in_progress', 'In Progress'),                 # Optional: live match
        ('completed', 'Completed - Results entered'),   # Results entered
        ('cancelled', 'Cancelled'),                     # Not played (rain, abandoned, etc.)
    ]
    
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
    
    # Match details
    match_date = models.DateField()
    match_format = models.CharField(max_length=20, choices=MATCH_FORMAT_CHOICES)
    match_type = models.CharField(max_length=20, choices=MATCH_TYPE_CHOICES)
    score_format = models.CharField(max_length=20, choices=SCORE_FORMAT_CHOICES)
    match_status = models.CharField(
        max_length=20,
        choices=MATCH_STATUS_CHOICES,
        default='pending'
    )
    
    cancellation_reason = models.TextField(
        blank=True,
        null=True,
        help_text='Why was this match cancelled? (e.g., rain, insufficient players, abandoned mid-match)'
    )
    
    # Court assignment (from COURTS module)
    court_location = models.ForeignKey(
        CourtLocation,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='matches'
    )
    court_number = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        help_text='Specific court number (e.g., "1", "Court 2", "14")'
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
        related_name='matches_won',
        help_text='Team that won (for singles/doubles matches)'
    )
    
    winning_mlp_team = models.ForeignKey(
        'MLPTeam',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='matches_won',
        help_text='MLP team that won (for MLP matches only)'
    )
    
    # Optional details
    notes = models.TextField(blank=True, null=True)
    
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
    MLP_GAME_TYPE_CHOICES = [
        ('women_doubles', "Women's Doubles"),
        ('men_doubles', "Men's Doubles"),
        ('mixed_doubles_1', 'Mixed Doubles 1'),
        ('mixed_doubles_2', 'Mixed Doubles 2'),
        ('dreambreaker', 'DreamBreaker'),
    ]

    match = models.ForeignKey(
        Match,
        on_delete=models.CASCADE,
        related_name='teams'
    )
    
    # MLP-specific: What game type is this team for?
    mlp_game_type = models.CharField(
        max_length=20,
        choices=MLP_GAME_TYPE_CHOICES,
        blank=True,
        null=True,
        help_text='Type of MLP game. Match to Game.mlp_game_type to find teams.'
    )

    # Team name (optional, auto-generated if empty)
    team_name = models.CharField(
        max_length=100,
        blank=True,
        null=True,
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
    
    MLP_GAME_TYPE_CHOICES = [
        ('women_doubles', "Women's Doubles"),
        ('men_doubles', "Men's Doubles"),
        ('mixed_doubles_1', 'Mixed Doubles 1'),
        ('mixed_doubles_2', 'Mixed Doubles 2'),
        ('dreambreaker', 'DreamBreaker'),
    ]
    
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
    mlp_game_type = models.CharField(
        max_length=20,
        choices=MLP_GAME_TYPE_CHOICES,
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
    logo_url = models.URLField(max_length=200, blank=True, null=True)
    
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