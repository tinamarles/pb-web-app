from django.contrib import admin
from django.contrib import messages
from django.shortcuts import redirect
from django.urls import path
from django.core.management import call_command

from .models import Address

# ==========================================
# ADDRESS ADMIN
# ==========================================

@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = (
        'city',
        'address_line1',
        'state_province',
        'postal_code',
        'country',
    )
    list_filter = ('state_province', 'country', 'city')
    search_fields = (
        'address_line1',
        'state_province',
        'city',
        'postal_code'
    )
    ordering = ('state_province', 'city', 'address_line1')
    
    fieldsets = (
        ('Street Address', {
            'fields': ('address_line1', 'address_line2')
        }),
        ('Location', {
            'fields': ('city', 'state_province', 'postal_code', 'country')
        }),
    )
    
    # ✅ ADD LOAD BUTTON!
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('load-addresses/', 
                 self.admin_site.admin_view(self.load_addresses_view), 
                 name='load_addresses'),
        ]
        return custom_urls + urls
    
    def load_addresses_view(self, request):
        """Load addresses from JSON fixture"""
        try:
            call_command('loaddata', 'data/production/addresses.json')
            messages.success(request, '✅ Addresses loaded successfully!')
        except Exception as e:
            messages.error(request, f'❌ Error: {str(e)}')
        return redirect('..')