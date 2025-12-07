"""
Round-Robin Match Generator Service

Generates matches from rotation patterns stored in RoundRobinPattern model.
Maps player positions to actual User objects.
"""

from leagues.models import RoundRobinPattern
from public.constants import MatchFormat, MatchType, ScoreFormat, MatchStatus

class RoundRobinGenerator:
    """
    Generates round-robin matches from rotation patterns.
    
    Maps player positions to actual User objects.
    """
    
    def __init__(self, league_session, session_date, attending_players):
        """
        Args:
            league_session: LeagueSession object
            session_date: Date for this match day
            attending_players: List of User objects (ORDERED!)
        """
        self.league_session = league_session
        self.session_date = session_date
        self.attending_players = list(attending_players)
        self.num_players = len(attending_players)
        self.num_courts = league_session.courts_used
        
        # Get rotation pattern
        self.pattern = self._get_rotation_pattern()
    
    def _get_rotation_pattern(self):
        """Get rotation pattern from database."""
        try:
            pattern_obj = RoundRobinPattern.objects.get(
                num_courts=self.num_courts,
                num_players=self.num_players
            )
            return pattern_obj.pattern_data
        except RoundRobinPattern.DoesNotExist:
            raise ValueError(
                f"No rotation pattern found for {self.num_courts} courts "
                f"and {self.num_players} players. Please add pattern to database."
            )
    
    def generate_matches(self):
        """
        Generate matches with player assignments.
        
        Returns:
            List of Match objects with teams and players assigned
        """
        matches = []
        
        for round_data in self.pattern['rounds']:
            round_num = round_data['round_num']
            
            for court_num in range(1, self.num_courts + 1):
                court_key = f'court_{court_num}'
                
                if court_key not in round_data:
                    continue
                
                # Get team positions
                team1_positions, team2_positions = round_data[court_key]
                
                # Map positions to actual players
                # IMPORTANT: Positions are 1-based!
                team1_players = [
                    self.attending_players[pos - 1]
                    for pos in team1_positions
                ]
                team2_players = [
                    self.attending_players[pos - 1]
                    for pos in team2_positions
                ]
                
                # Create match
                match = self._create_match(
                    round_num=round_num,
                    court_number=court_num,
                    team1_players=team1_players,
                    team2_players=team2_players
                )
                
                matches.append(match)
        
        return matches
    
    def _create_match(self, round_num, court_number, team1_players, team2_players):
        """Create match with teams and players."""
        from matches.models import Match, Team, TeamPlayer
        
        # Create Match
        match = Match.objects.create(
            match_date=self.session_date,
            match_format=MatchFormat.BEST_OF_1,  # Use your actual choice constant
            match_type=MatchType.DOUBLES,
            score_format=ScoreFormat.SIDEOUT,
            match_status=MatchStatus.PENDING,
            league=self.league_session.league,
            court_location=self.league_session.court_location,
            court_number=str(court_number)
        )
        
        # Create Team 1
        team1 = Team.objects.create(
            match=match,
            team_name=f"Round {round_num} Court {court_number}A"
        )
        for player in team1_players:
            TeamPlayer.objects.create(team=team1, player=player)
        
        # Create Team 2
        team2 = Team.objects.create(
            match=match,
            team_name=f"Round {round_num} Court {court_number}B"
        )
        for player in team2_players:
            TeamPlayer.objects.create(team=team2, player=player)
        
        return match