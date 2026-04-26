"""
Bulk Upload Views — REPLACE the old bulk_upload_view.py with this file.

Endpoints:
  POST   /api/v1/products/bulk-upload/        upload CSV → triggers Celery task
  GET    /api/v1/products/bulk-upload/         list all uploads (admin)
  GET    /api/v1/products/bulk-upload/{id}/    status + progress (for polling)
  GET    /api/v1/products/bulk-upload/{id}/errors/  download error CSV

The image encoding error is fixed:
  - parser_classes = [MultiPartParser, FormParser]  ← enforces multipart
  - 'file' field is validated before any processing
"""
import logging

from django.http import FileResponse
from rest_framework import permissions, serializers, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema

from .models import BulkUpload
from .tasks import process_bulk_upload

logger = logging.getLogger(__name__)

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "admin"


# ── Serializers ───────────────────────────────────────────────────────────────
class BulkUploadSerializer(serializers.ModelSerializer):
    error_file_url = serializers.SerializerMethodField()

    class Meta:
        model  = BulkUpload
        fields = [
            "id", "status",
            "total_records", "processed", "success_count", "failure_count",
            "error_file_url", "created_at", "completed_at",
        ]

    def get_error_file_url(self, obj):
        if obj.error_file:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(f"/media/{obj.error_file}")
        return None


# ── Upload + List ─────────────────────────────────────────────────────────────
class BulkUploadListCreateView(APIView):
    """
    POST → upload CSV, trigger Celery task, return BulkUpload id
    GET  → list all uploads for this admin (newest first)
    """
    permission_classes = [IsAdmin]
    parser_classes     = [MultiPartParser, FormParser]   # ← CRITICAL: enforces multipart

    @extend_schema(tags=["Products - Admin"])
    def post(self, request):
        # ── 1. File presence check ────────────────────────────
        file = request.FILES.get("file")
        if not file:
            return Response(
                {
                    "detail": (
                        "No file received. Make sure you are sending a multipart/form-data "
                        "request with a field named 'file'. "
                        "In Postman: Body → form-data → Key: file → Type: File."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ── 2. File type check ────────────────────────────────
        if not file.name.lower().endswith(".csv"):
            return Response(
                {"detail": "Only .csv files are accepted."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ── 3. File size check ────────────────────────────────
        if file.size > MAX_FILE_SIZE:
            mb = file.size / (1024 * 1024)
            return Response(
                {"detail": f"File too large ({mb:.1f} MB). Maximum is 10 MB."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ── 4. Save record and trigger Celery ─────────────────
        upload = BulkUpload.objects.create(
            file       = file,
            status     = BulkUpload.Status.UPLOADED,
            created_by = request.user,
        )

        # Fire-and-forget — Celery processes in background
        process_bulk_upload.delay(str(upload.id))

        logger.info(
            f"BulkUpload {upload.id} created by {request.user.email}. "
            f"File: {file.name} ({file.size} bytes)"
        )

        return Response(
            {
                "id":      str(upload.id),
                "status":  upload.status,
                "message": "Upload received. Processing started in the background.",
                "poll_url": f"/api/v1/products/bulk-upload/{upload.id}/",
            },
            status=status.HTTP_202_ACCEPTED,
        )

    @extend_schema(tags=["Products - Admin"])
    def get(self, request):
        uploads = BulkUpload.objects.filter(created_by=request.user)[:20]
        data    = BulkUploadSerializer(uploads, many=True, context={"request": request}).data
        return Response(data)


# ── Status (for polling) ──────────────────────────────────────────────────────
class BulkUploadDetailView(APIView):
    """
    GET /api/v1/products/bulk-upload/{id}/

    Frontend polls this every 2 seconds to update the progress bar.
    Returns complete when status is 'completed' or 'failed'.
    """
    permission_classes = [IsAdmin]

    @extend_schema(tags=["Products - Admin"])
    def get(self, request, pk):
        try:
            upload = BulkUpload.objects.get(id=pk, created_by=request.user)
        except BulkUpload.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        data = BulkUploadSerializer(upload, context={"request": request}).data
        return Response(data)


# ── Error report download ─────────────────────────────────────────────────────
class BulkUploadErrorReportView(APIView):
    """
    GET /api/v1/products/bulk-upload/{id}/errors/
    Returns the error CSV as a file download.
    """
    permission_classes = [IsAdmin]

    def get(self, request, pk):
        try:
            upload = BulkUpload.objects.get(id=pk, created_by=request.user)
        except BulkUpload.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        if not upload.error_file:
            return Response(
                {"detail": "No error report for this upload."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            f = upload.error_file.open("rb")
            return FileResponse(
                f,
                as_attachment=True,
                filename=f"errors_{str(upload.id)[:8]}.csv",
                content_type="text/csv",
            )
        except Exception:
            return Response(
                {"detail": "Error file could not be opened."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )