"""
Notifications URL patterns — all under /api/v1/notifications/

GET    /notifications/               → list (paginated)
GET    /notifications/unread-count/  → badge count
POST   /notifications/mark-all-read/ → mark all read
DELETE /notifications/clear/         → delete all
PATCH  /notifications/{id}/read/     → mark single read
DELETE /notifications/{id}/          → delete single
"""
from django.urls import path
from .views import (
    NotificationListView,
    UnreadCountView,
    MarkAllReadView,
    MarkReadView,
    NotificationDeleteView,
    ClearAllNotificationsView,
)

app_name = "notifications"

urlpatterns = [
    # ── Bulk actions (before {id}/ to avoid conflicts) ────
    path("unread-count/",  UnreadCountView.as_view(),          name="unread-count"),
    path("mark-all-read/", MarkAllReadView.as_view(),          name="mark-all-read"),
    path("clear/",         ClearAllNotificationsView.as_view(),name="clear-all"),

    # ── List ──────────────────────────────────────────────
    path("",               NotificationListView.as_view(),     name="list"),

    # ── Single ────────────────────────────────────────────
    path("<uuid:pk>/read/",NotifMarkReadView := MarkReadView.as_view(),  name="mark-read"),
    path("<uuid:pk>/",     NotificationDeleteView.as_view(),             name="delete"),
]