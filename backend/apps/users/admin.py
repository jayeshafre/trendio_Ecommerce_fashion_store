"""
Admin registration — gives Trendio admin team full visibility
into users, OTP logs, and active sessions.
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html

from .models import OTPCode, User, UserSession


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display  = ["email", "full_name_display", "role", "is_verified", "is_active", "date_joined"]
    list_filter   = ["role", "is_verified", "is_active", "date_joined"]
    search_fields = ["email", "first_name", "last_name", "phone"]
    ordering      = ["-date_joined"]
    readonly_fields = ["id", "date_joined", "updated_at"]

    fieldsets = (
        ("Identity",   {"fields": ("id", "email", "phone", "first_name", "last_name")}),
        ("Role",       {"fields": ("role", "is_verified", "is_active")}),
        ("Permissions",{"fields": ("is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Timestamps", {"fields": ("date_joined", "updated_at", "last_login")}),
    )

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields":  ("email", "first_name", "last_name", "password1", "password2", "role"),
        }),
    )

    def full_name_display(self, obj):
        return obj.get_full_name()
    full_name_display.short_description = "Full Name"


@admin.register(OTPCode)
class OTPCodeAdmin(admin.ModelAdmin):
    list_display  = ["identifier", "purpose", "is_used", "attempts", "expires_at", "status_badge"]
    list_filter   = ["purpose", "is_used"]
    search_fields = ["identifier"]
    readonly_fields = ["id", "code", "created_at"]
    ordering = ["-created_at"]

    def status_badge(self, obj):
        if obj.is_used:
            color, label = "#84cc16", "Used"
        elif obj.is_expired:
            color, label = "#D97757", "Expired"
        else:
            color, label = "#C2A98A", "Active"
        return format_html(
            '<span style="color:{}; font-weight:600;">{}</span>', color, label
        )
    status_badge.short_description = "Status"


@admin.register(UserSession)
class UserSessionAdmin(admin.ModelAdmin):
    list_display  = ["user", "device_info", "ip_address", "expires_at", "created_at"]
    list_filter   = ["created_at"]
    search_fields = ["user__email", "ip_address"]
    readonly_fields = ["id", "refresh_token", "created_at"]
    ordering = ["-created_at"]
    raw_id_fields = ["user"]