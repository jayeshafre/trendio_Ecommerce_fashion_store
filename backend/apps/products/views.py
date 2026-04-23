"""
Products Views.

Public endpoints (no auth):
  GET  /products/             list with filters + search + pagination
  GET  /products/<slug>/      detail
  GET  /products/search/      keyword search
  GET  /categories/           all active categories
  GET  /categories/<slug>/    category detail + child categories

Admin-only endpoints (IsAdminUser):
  POST   /products/                  create product
  PATCH  /products/<slug>/           update product
  DELETE /products/<slug>/           delete product (soft)
  POST   /products/<slug>/images/    upload image
  DELETE /products/<slug>/images/<id>/ remove image
  POST   /products/<slug>/variants/    add variant
  PATCH  /products/<slug>/variants/<id>/ update variant
  DELETE /products/<slug>/variants/<id>/ delete variant
  GET    /categories/                list categories
  POST   /categories/                create category
  PATCH  /categories/<slug>/         update category
"""
import csv
import io
import logging
from decimal import Decimal, InvalidOperation
from collections import defaultdict
from django.db.models import Q

from django.db import transaction
from rest_framework.parsers import MultiPartParser
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.utils import extend_schema


from .models import Category, Product, ProductVariant, ProductImage
from .serializers import (
    CategorySerializer, CategoryDetailSerializer, CategoryWriteSerializer,
    ProductListSerializer, ProductDetailSerializer, ProductWriteSerializer,
    ProductVariantSerializer, ProductVariantWriteSerializer,
    ProductImageSerializer, ProductImageWriteSerializer,
)
from .filters import ProductFilter

logger = logging.getLogger(__name__)

REQUIRED_COLUMNS = {"title", "brand", "category_slug", "base_price", "sku", "stock"}

class IsAdminOrReadOnly(permissions.BasePermission):
    """Read: anyone. Write: admin only."""
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated and request.user.role == "admin"


# ── Categories ────────────────────────────────────────────────────────────────
class CategoryListView(generics.ListCreateAPIView):
    """
    GET  → list all active top-level categories
    POST → create category (admin only)
    """
    queryset           = Category.objects.filter(is_active=True, parent=None).prefetch_related("children")
    permission_classes = [IsAdminOrReadOnly]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return CategoryWriteSerializer
        return CategorySerializer

    @extend_schema(tags=["Categories"])
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class CategoryDetailView(generics.RetrieveUpdateAPIView):
    """
    GET   → category detail with children
    PATCH → update category (admin only)
    """
    queryset           = Category.objects.filter(is_active=True)
    lookup_field       = "slug"
    permission_classes = [IsAdminOrReadOnly]
    http_method_names  = ["get", "patch"]

    def get_serializer_class(self):
        if self.request.method == "PATCH":
            return CategoryWriteSerializer
        return CategoryDetailSerializer

    @extend_schema(tags=["Categories"])
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


# ── Product List ──────────────────────────────────────────────────────────────
class ProductListView(generics.ListCreateAPIView):
    """
    GET  → paginated product listing with filters + ordering
    POST → create product (admin only)

    Query params:
      ?category=shirts
      ?brand=levis
      ?min_price=500&max_price=2000
      ?size=M&color=black
      ?in_stock=true
      ?ordering=base_price / -base_price / -created_at
      ?search=<keyword>   (searches title + brand + description)
    """
    permission_classes = [IsAdminOrReadOnly]
    filter_backends    = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class    = ProductFilter
    search_fields      = ["title", "brand", "description", "category__name"]
    ordering_fields    = ["base_price", "created_at", "title"]
    ordering           = ["-created_at"]

    def get_queryset(self):
        return (
            Product.objects.filter(is_active=True)
            .select_related("category")
            .prefetch_related("images", "variants")
        )

    def get_serializer_class(self):
        if self.request.method == "POST":
            return ProductWriteSerializer
        return ProductListSerializer

    @extend_schema(tags=["Products"])
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(tags=["Products - Admin"])
    def post(self, request, *args, **kwargs):
        serializer = ProductWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product = serializer.save()
        logger.info(f"Admin created product: {product.title}")
        return Response(ProductDetailSerializer(product).data, status=status.HTTP_201_CREATED)


# ── Product Detail ────────────────────────────────────────────────────────────
class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    → full product detail (variants + images)
    PATCH  → update product fields (admin)
    DELETE → soft-delete (sets is_active=False) (admin)
    """
    queryset     = Product.objects.filter(is_active=True).select_related("category").prefetch_related("images", "variants")
    lookup_field = "slug"
    permission_classes = [IsAdminOrReadOnly]
    http_method_names  = ["get", "patch", "delete"]

    def get_serializer_class(self):
        if self.request.method == "PATCH":
            return ProductWriteSerializer
        return ProductDetailSerializer

    def destroy(self, request, *args, **kwargs):
        product = self.get_object()
        product.is_active = False
        product.save(update_fields=["is_active"])
        logger.info(f"Admin deactivated product: {product.slug}")
        return Response({"message": "Product deactivated."}, status=status.HTTP_200_OK)

    @extend_schema(tags=["Products"])
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


# ── Product Search ────────────────────────────────────────────────────────────
class ProductSearchView(generics.ListAPIView):
    """
    GET /products/search/?q=blue shirt
    Searches across title, brand, description, category name.
    Returns lightweight list serializer.
    """
    serializer_class   = ProductListSerializer
    permission_classes = [permissions.AllowAny]

    @extend_schema(tags=["Products"])
    def get_queryset(self):
        q = self.request.query_params.get("q", "").strip()
        if not q:
            return Product.objects.none()
        return (
            Product.objects.filter(is_active=True)
            .filter(
                Q(title__icontains=q)
                | Q(brand__icontains=q)
                | Q(description__icontains=q)
                | Q(category__name__icontains=q)
            )
            .select_related("category")
            .prefetch_related("images", "variants")
            .distinct()
        )


# ── Product Images ────────────────────────────────────────────────────────────
class ProductImageListView(generics.ListCreateAPIView):
    """
    GET  → list all images for a product
    POST → upload new image (admin, multipart)
    """
    serializer_class   = ProductImageSerializer
    permission_classes = [IsAdminOrReadOnly]
    parser_classes     = [MultiPartParser, FormParser]

    def get_product(self):
        return generics.get_object_or_404(Product, slug=self.kwargs["slug"])

    def get_queryset(self):
        return ProductImage.objects.filter(product__slug=self.kwargs["slug"])

    @extend_schema(tags=["Products - Admin"])
    def post(self, request, *args, **kwargs):
        product    = self.get_product()
        serializer = ProductImageWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        image = serializer.save(product=product)
        return Response(ProductImageSerializer(image).data, status=status.HTTP_201_CREATED)


class ProductImageDeleteView(generics.DestroyAPIView):
    """DELETE /products/<slug>/images/<id>/"""
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        return ProductImage.objects.filter(product__slug=self.kwargs["slug"])

    def destroy(self, request, *args, **kwargs):
        image = self.get_object()
        image.image.delete(save=False)   # delete from storage
        image.delete()
        return Response({"message": "Image deleted."}, status=status.HTTP_200_OK)


# ── Product Variants ──────────────────────────────────────────────────────────
class ProductVariantListView(generics.ListCreateAPIView):
    """
    GET  → list variants for a product
    POST → add variant (admin)
    """
    permission_classes = [IsAdminOrReadOnly]

    def get_product(self):
        return generics.get_object_or_404(Product, slug=self.kwargs["slug"])

    def get_queryset(self):
        return ProductVariant.objects.filter(product__slug=self.kwargs["slug"])

    def get_serializer_class(self):
        if self.request.method == "POST":
            return ProductVariantWriteSerializer
        return ProductVariantSerializer

    @extend_schema(tags=["Products - Admin"])
    def post(self, request, *args, **kwargs):
        product    = self.get_product()
        serializer = ProductVariantWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        variant = serializer.save(product=product)
        return Response(ProductVariantSerializer(variant).data, status=status.HTTP_201_CREATED)


class ProductVariantDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    → single variant
    PATCH  → update stock / price / size / color (admin)
    DELETE → remove variant (admin)
    """
    permission_classes = [IsAdminOrReadOnly]
    http_method_names  = ["get", "patch", "delete"]

    def get_queryset(self):
        return ProductVariant.objects.filter(product__slug=self.kwargs["slug"])

    def get_serializer_class(self):
        if self.request.method == "PATCH":
            return ProductVariantWriteSerializer
        return ProductVariantSerializer
    
class BulkProductUploadView(APIView):
    """
    POST /api/v1/products/bulk-upload/
    Upload a CSV file to create multiple products + variants at once.
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes     = [MultiPartParser]
 
    @extend_schema(tags=["Products - Admin"])
    def post(self, request):
        # ── 1. Validate request ───────────────────────────────────
        if request.user.role != "admin":
            return Response(
                {"detail": "Admin access required."},
                status=status.HTTP_403_FORBIDDEN,
            )
 
        file = request.FILES.get("file")
        if not file:
            return Response(
                {"detail": "No file uploaded. Send a CSV with field name 'file'."},
                status=status.HTTP_400_BAD_REQUEST,
            )
 
        if not file.name.endswith(".csv"):
            return Response(
                {"detail": "Only .csv files are accepted."},
                status=status.HTTP_400_BAD_REQUEST,
            )
 
        # ── 2. Parse CSV ──────────────────────────────────────────
        try:
            content = file.read().decode("utf-8-sig")  # utf-8-sig handles Excel BOM
            reader  = csv.DictReader(io.StringIO(content))
        except Exception:
            return Response(
                {"detail": "Could not read the file. Make sure it is a valid UTF-8 CSV."},
                status=status.HTTP_400_BAD_REQUEST,
            )
 
        # Validate headers
        if not reader.fieldnames:
            return Response(
                {"detail": "CSV file is empty or has no headers."},
                status=status.HTTP_400_BAD_REQUEST,
            )
 
        headers = {h.strip().lower() for h in reader.fieldnames}
        missing = REQUIRED_COLUMNS - headers
        if missing:
            return Response(
                {
                    "detail": f"Missing required columns: {', '.join(sorted(missing))}",
                    "required_columns": sorted(REQUIRED_COLUMNS),
                    "found_columns":    sorted(headers),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
 
        rows = list(reader)
        if not rows:
            return Response(
                {"detail": "CSV has headers but no data rows."},
                status=status.HTTP_400_BAD_REQUEST,
            )
 
        # ── 3. Process ────────────────────────────────────────────
        result = self._process_rows(rows)
 
        status_code = (
            status.HTTP_207_MULTI_STATUS  # partial success
            if result["errors"]
            else status.HTTP_201_CREATED
        )
 
        logger.info(
            f"Bulk upload by {request.user.email}: "
            f"{result['products_created']} products, "
            f"{result['variants_created']} variants, "
            f"{len(result['skipped_skus'])} skipped, "
            f"{len(result['errors'])} errors"
        )
 
        return Response(result, status=status_code)
 
    @transaction.atomic
    def _process_rows(self, rows):
        """
        Groups rows by (title, brand) → creates/updates Product.
        Each row → one ProductVariant.
        All or nothing per product group (atomic).
        """
        result = {
            "products_created": 0,
            "variants_created": 0,
            "skipped_skus":     [],
            "errors":           [],
        }
 
        # Group rows by product identity: title + brand
        groups = defaultdict(list)
        for i, row in enumerate(rows, start=2):  # start=2 because row 1 is header
            # Clean all values
            clean = {k.strip().lower(): v.strip() for k, v in row.items() if k}
            title = clean.get("title", "")
            brand = clean.get("brand", "")
            if not title:
                result["errors"].append({
                    "row": i,
                    "error": "Missing 'title'. Row skipped.",
                })
                continue
            groups[(title, brand)].append((i, clean))
 
        # Process each product group
        for (title, brand), row_group in groups.items():
            first_row_num, first_row = row_group[0]
 
            try:
                # ── Resolve or create category ────────────────────
                category_slug = first_row.get("category_slug", "").lower()
                category = None
                if category_slug:
                    category, _ = Category.objects.get_or_create(
                        slug=category_slug,
                        defaults={"name": category_slug.replace("-", " ").title()},
                    )
 
                # ── Resolve prices ────────────────────────────────
                base_price = self._parse_decimal(first_row.get("base_price"), "base_price", first_row_num)
                if base_price is None:
                    result["errors"].append({
                        "row":   first_row_num,
                        "title": title,
                        "error": "Invalid base_price. Product skipped.",
                    })
                    continue
 
                sale_price_raw = first_row.get("sale_price", "").strip()
                sale_price = None
                if sale_price_raw:
                    sale_price = self._parse_decimal(sale_price_raw, "sale_price", first_row_num)
                    if sale_price and sale_price >= base_price:
                        result["errors"].append({
                            "row":   first_row_num,
                            "title": title,
                            "error": "sale_price must be less than base_price. Product skipped.",
                        })
                        continue
 
                # ── Get or create Product ─────────────────────────
                product, product_created = Product.objects.get_or_create(
                    title=title,
                    brand=brand,
                    defaults={
                        "description": first_row.get("description", ""),
                        "category":    category,
                        "base_price":  base_price,
                        "sale_price":  sale_price,
                        "is_active":   True,
                    },
                )
 
                if product_created:
                    result["products_created"] += 1
 
                # ── Process each variant row ──────────────────────
                for row_num, row in row_group:
                    sku   = row.get("sku", "").strip().upper()
                    stock = self._parse_int(row.get("stock", "0"), row_num)
 
                    if not sku:
                        result["errors"].append({
                            "row": row_num, "title": title,
                            "error": "Missing SKU. Variant skipped.",
                        })
                        continue
 
                    # Skip duplicate SKUs
                    if ProductVariant.objects.filter(sku=sku).exists():
                        result["skipped_skus"].append({
                            "row": row_num, "sku": sku,
                            "reason": "SKU already exists.",
                        })
                        continue
 
                    # Variant price override (optional)
                    variant_price_raw = row.get("price", "").strip()
                    variant_price = None
                    if variant_price_raw:
                        variant_price = self._parse_decimal(variant_price_raw, "price", row_num)
 
                    ProductVariant.objects.create(
                        product   = product,
                        size      = row.get("size", "").strip(),
                        color     = row.get("color", "").strip(),
                        color_hex = row.get("color_hex", "").strip(),
                        sku       = sku,
                        price     = variant_price,
                        stock     = stock if stock is not None else 0,
                        is_active = True,
                    )
                    result["variants_created"] += 1
 
            except Exception as e:
                result["errors"].append({
                    "row":   first_row_num,
                    "title": title,
                    "error": str(e),
                })
 
        return result
 
    def _parse_decimal(self, value, field_name, row_num):
        try:
            return Decimal(str(value).strip())
        except (InvalidOperation, TypeError, ValueError):
            return None
 
    def _parse_int(self, value, row_num):
        try:
            return int(str(value).strip())
        except (ValueError, TypeError):
            return 0
 