# === CORRECTED ADMIN.PY FOR MATCHES ===
# Date: 2025-12-01
# Corrected to match actual model fields
# ========================================

from django.contrib import admin
from .models import (
    Match,
    Team,
    Game,
    MLPTeam,
    TeamPlayer
)


class GameInline(admin.TabularInline):
    model = Game
    extra = 0
    fields = ('game_number', 'team1_score', 'team2_score', 'game_winner_team', 'game_loser_team', 'mlp_game_type')


class TeamInline(admin.TabularInline):
    model = Team
    extra = 0
    fields = ('team_name', 'mlp_team', 'mlp_game_type')
    show_change_link = True


@admin.register(Match)
class MatchAdmin(admin.ModelAdmin):
    list_display = (
        'match_id_display',
        'club',
        'league',
        'match_date',
        'match_type',
        'match_status',
        'court_location'
    )
    list_filter = (
        'match_status',
        'match_type',
        'match_format',
        'match_date'
    )
    search_fields = (
        'league__name',
        'club__name',
        'court_location__name'
    )
    ordering = ('-match_date',)
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Match Context', {
            'fields': ('club', 'league', 'organized_by')
        }),
        ('Match Details', {
            'fields': (
                'match_date',
                'match_type',
                'match_format',
                'score_format',
                'match_status'
            )
        }),
        ('Court Assignment', {
            'fields': ('court_location', 'court_number', 'user_booking')
        }),
        ('Results', {
            'fields': (
                'winning_team',
                'winning_mlp_team',
                'result_entered_by'
            )
        }),
        ('Notes', {
            'fields': ('notes', 'cancellation_reason'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    inlines = [TeamInline, GameInline]
    
    def match_id_display(self, obj):
        return f"Match #{obj.id}"
    match_id_display.short_description = 'Match ID'


class TeamPlayerInline(admin.TabularInline):
    model = TeamPlayer
    extra = 0
    fields = ('player',)


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = (
        'get_team_name',
        'match',
        'mlp_team',
        'mlp_game_type',
        'player_count'
    )
    list_filter = (
        'mlp_game_type',
    )
    search_fields = (
        'team_name',
        'match__league__name',
        'mlp_team__name'
    )
    ordering = ('-match__match_date', 'id')
    readonly_fields = ('created_at',)
    
    fieldsets = (
        ('Team Info', {
            'fields': ('match', 'team_name')
        }),
        ('MLP Details', {
            'fields': ('mlp_team', 'mlp_game_type')
        }),
        ('Metadata', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    inlines = [TeamPlayerInline]
    
    def get_team_name(self, obj):
        return str(obj)
    get_team_name.short_description = 'Team'
    
    def player_count(self, obj):
        return obj.team_players.count()
    player_count.short_description = 'Players'


@admin.register(Game)
class GameAdmin(admin.ModelAdmin):
    list_display = (
        'match',
        'game_number',
        'score_display',
        'game_winner_team',
        'mlp_game_type'
    )
    list_filter = (
        'mlp_game_type',
    )
    search_fields = (
        'match__league__name',
    )
    ordering = ('-match__match_date', 'game_number')
    readonly_fields = ('created_at',)
    
    fieldsets = (
        ('Game Info', {
            'fields': ('match', 'game_number', 'mlp_game_type')
        }),
        ('Scores', {
            'fields': ('team1_score', 'team2_score', 'game_winner_team', 'game_loser_team')
        }),
        ('Metadata', {
            'fields': ('created_at',)
        }),
    )
    
    def score_display(self, obj):
        return f"{obj.team1_score} - {obj.team2_score}"
    score_display.short_description = 'Score'


@admin.register(MLPTeam)
class MLPTeamAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'league',
        'is_active',
        'created_at'
    )
    list_filter = (
        'is_active',
        'created_at'
    )
    search_fields = (
        'name',
        'league__name'
    )
    ordering = ('name',)
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Team Info', {
            'fields': ('name', 'league', 'logo_url')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(TeamPlayer)
class TeamPlayerAdmin(admin.ModelAdmin):
    list_display = (
        'player',
        'team',
        'get_match',
        'created_at'
    )
    search_fields = (
        'player__username',
        'player__first_name',
        'player__last_name',
        'team__team_name'
    )
    ordering = ('-team__match__match_date', 'team', 'player__username')
    readonly_fields = ('created_at',)
    
    fieldsets = (
        ('Team Player Info', {
            'fields': ('team', 'player')
        }),
        ('Metadata', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    def get_match(self, obj):
        return f"Match #{obj.team.match.id} ({obj.team.match.match_date})"
    get_match.short_description = 'Match'
