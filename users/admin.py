from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ['username', 'email', 'role', 'is_staff']
    list_filter = ['role', 'is_staff', 'is_active']

    fieldsets = UserAdmin.fieldsets + (
        ('Additional Info', {
            'fields': ('tax_id', 'phone', 'home_address', 'role')
        }),
    )