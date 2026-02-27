from django_filters import rest_framework as filters
from django_filters import BaseInFilter, CharFilter, BooleanFilter, NumberFilter
from .models import ClubMembership, Club
from public.constants import ClubType

class ClubMembershipFilter(filters.FilterSet):
    """
    Filter for ClubMembership model (user queries)
    
    USED BY:
    - ClubMembershipViewSet (endpoint: /api/memberships/)
    
    Query params:
    - club: Club ID (integer)
    - member: member ID (integer) - filters by member ID (eg all ClubMemberships of User)
    
    Usage:
    - GET /api/memberships/?club=5
    - GET /api/memberships/?member=1 (all ClubMemberships for the user with id=1)
    
    """
    
    # ✅ Filter by club ID REQUIRED
    club = NumberFilter(
        field_name='club__id',
        help_text='Filter by club ID (integer)'
    )

    member = NumberFilter(
        field_name='member__id',
        help_text='Filter by User ID (integer)'
    )
    
    class Meta:
        model = ClubMembership
        fields = ['club', 'member']
        # All fields use explicit filters defined above

class AdminClubMembershipFilter(filters.FilterSet):
    """
    Filter for ClubMembership model (admin queries ONLY)
    
    USED BY:
    - AdminClubMembershipViewSet (endpoint: /api/memberships/)
    
    SUPPORTED FILTERS:
    
    1. STATUS FILTERS:
       - ?status=1                    → Active memberships
       - ?status=2                    → Pending memberships
       - ?status=3                    → Inactive memberships
    
    2. CLUB FILTERS:
       - ?club=5                      → Memberships for club 5
       - ?club__in=5,6,7              → Memberships for clubs 5, 6, or 7
    
    3. ROLE FILTERS (ManyToMany):
       - ?role=1                      → Memberships with ADMIN role
       - ?role=3                      → Memberships with CAPTAIN role
       - ?role=1,3                    → Memberships with ADMIN OR CAPTAIN role
       - ?role_all=1,3                → Memberships with BOTH ADMIN AND CAPTAIN roles
    
    4. MEMBER FILTERS:
       - ?member=10                   → Specific member's memberships
       - ?member__in=10,20,30         → Multiple members' memberships
    
    5. BOOLEAN FILTERS:
       - ?is_preferred_club=true      → Preferred club memberships only
    
    6. COMBINED FILTERS:
       - ?club=5&status=1&role=1      → Active admin memberships in club 5
    
    IMPORTANT:
    - Uses constants from public.constants:
      - MembershipStatus ✅ (constant!)
    - ClubMembershipType is a MODEL, NOT a constant!
      - Each club creates their own membership types dynamically
      - Filter by type ID (e.g., ?type=3)
      - Frontend must fetch types from API: GET /api/clubs/{club_id}/membership-types/
    """
    # ========================================
    # SIMPLE FILTERS
    # ========================================
    status = NumberFilter(field_name='status')
    club = NumberFilter(field_name='club')
    member = NumberFilter(field_name='member')
    is_preferred_club = BooleanFilter(field_name='is_preferred_club')
    
    # ========================================
    # MULTIPLE VALUE FILTERS (using __in)
    # ========================================
    club__in = BaseInFilter(field_name='club', lookup_expr='in')
    member__in = BaseInFilter(field_name='member', lookup_expr='in')
    
    # ========================================
    # MANYTOMANY FILTER (OR logic)
    # ========================================
    role = BaseInFilter(field_name='roles', lookup_expr='in')
    
    # ========================================
    # MANYTOMANY FILTER (AND logic - custom)
    # ========================================
    role_all = CharFilter(method='filter_by_all_roles')
    
    def filter_by_all_roles(self, queryset, name, value):
        """
        Filter memberships that have ALL specified roles.
        
        Example: ?role_all=1,3
        Returns: Only memberships with BOTH admin (1) AND captain (3) roles
        
        Logic: Applies filter for each role sequentially (AND condition)
        """
        try:
            role_ids = [int(x.strip()) for x in value.split(',')]
        except ValueError:
            return queryset.none()  # Invalid input
        
        # Apply filter for each role (creates AND condition)
        for role_id in role_ids:
            queryset = queryset.filter(roles=role_id)
        
        return queryset
    
    class Meta:
        model = ClubMembership
        fields = [
            'status',
            'club',
            'club__in',
            'member',
            'member__in',
            'is_preferred_club',
            'role',
            'role_all',
        ]
         
class ClubFilter(filters.FilterSet):
    """
    Custom filter for Club model.
    
    FILTERS:
    - type: Filter by club type (1=PERSONAL, 2=OFFICIAL)
    - autoapproval: Filter by autoapproval (true/false)
    
    USAGE:
    - ?type=1              → Personal clubs only
    - ?type=2              → Official clubs only
    - ?autoapproval=true      → only clubs that autoapprove join requests
    - ?autoapproval=false     → clubs that require approval of join requests
    - ?type=2&autoapproval=true → official clubs that do not require approval of join requests
    """
    
    # Exact match on club_type
    club_type = NumberFilter(field_name='club_type')
    
    # Boolean filter for is_active
    autoapproval = BooleanFilter(field_name='autoapproval')
    
    class Meta:
        model = Club
        fields = ['club_type', 'autoapproval']