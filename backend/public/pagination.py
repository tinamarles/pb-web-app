# public/pagination.py

"""
Shared pagination classes for all ViewSets

DEFINE ONCE, REUSE EVERYWHERE!
"""

from rest_framework.pagination import PageNumberPagination

class StandardPagination(PageNumberPagination):
    """
    Standard pagination for all list endpoints
    
    Used by:
    - ClubViewSet (clubs/views.py)
    - LeagueViewSet (leagues/views.py)
    - Any other ViewSet that needs pagination
    
    Settings:
    - Default: 20 items per page
    - Client can request different size via ?page_size=N
    - Maximum: 100 items per page
    
    Usage:
    ```python
    from public.pagination import StandardPagination
    
    class YourViewSet(viewsets.ModelViewSet):
        pagination_class = StandardPagination
    ```
    """
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100
