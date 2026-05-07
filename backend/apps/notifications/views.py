"""
Notifications Views

GET    /api/v1/notifications/              → paginated list (newest first)
GET    /api/v1/notifications/unread-count/ → { count: N }
POST   /api/v1/notifications/mark-all-read/→ marks all as read
PATCH  /api/v1/notifications/{id}/read/   → marks single as read
DELETE /api/v1/notifications/{id}/        → delete single notification
DELETE /api/v1/notifications/clear/       → delete all for user
"""
import logging
from rest_framework import permissions, status
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema

from .models import Notification
from .serializers import NotificationSerializer

logger = logging.getLogger(__name__)


class NotificationPagination(PageNumberPagination):
    page_size             = 15
    page_size_query_param = "page_size"
    max_page_size         = 50


# ── List ──────────────────────────────────────────────────────
class NotificationListView(APIView):
    """
    GET /notifications/
    Supports ?unread_only=true to filter unread notifications.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(tags=["Notifications"])
    def get(self, request):
        qs = Notification.objects.filter(user=request.user)

        if request.query_params.get("unread_only") == "true":
            qs = qs.filter(is_read=False)

        paginator = NotificationPagination()
        page      = paginator.paginate_queryset(qs, request)
        serializer = NotificationSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


# ── Unread count ──────────────────────────────────────────────
class UnreadCountView(APIView):
    """
    GET /notifications/unread-count/
    Used by navbar badge — lightweight, no pagination.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(tags=["Notifications"])
    def get(self, request):
        count = Notification.objects.filter(
            user=request.user, is_read=False
        ).count()
        return Response({"count": count})


# ── Mark all read ─────────────────────────────────────────────
class MarkAllReadView(APIView):
    """
    POST /notifications/mark-all-read/
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(tags=["Notifications"])
    def post(self, request):
        updated = Notification.objects.filter(
            user=request.user, is_read=False
        ).update(is_read=True)

        return Response({
            "message": f"{updated} notification{'s' if updated != 1 else ''} marked as read."
        })


# ── Mark single read ──────────────────────────────────────────
class MarkReadView(APIView):
    """
    PATCH /notifications/{id}/read/
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(tags=["Notifications"])
    def patch(self, request, pk):
        try:
            notif = Notification.objects.get(id=pk, user=request.user)
        except Notification.DoesNotExist:
            return Response(
                {"detail": "Notification not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        notif.is_read = True
        notif.save(update_fields=["is_read"])
        return Response(NotificationSerializer(notif).data)


# ── Delete single ─────────────────────────────────────────────
class NotificationDeleteView(APIView):
    """
    DELETE /notifications/{id}/
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(tags=["Notifications"])
    def delete(self, request, pk):
        try:
            notif = Notification.objects.get(id=pk, user=request.user)
        except Notification.DoesNotExist:
            return Response(
                {"detail": "Notification not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        notif.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ── Clear all ─────────────────────────────────────────────────
class ClearAllNotificationsView(APIView):
    """
    DELETE /notifications/clear/
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(tags=["Notifications"])
    def delete(self, request):
        deleted, _ = Notification.objects.filter(user=request.user).delete()
        return Response({
            "message": f"{deleted} notification{'s' if deleted != 1 else ''} cleared."
        })