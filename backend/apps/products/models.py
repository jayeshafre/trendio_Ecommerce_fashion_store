"""
Products Module — Models

Entities:
  Category      → hierarchical (Men → Shirts → Casual)
  Product       → core catalog item
  ProductVariant → size + color + stock + price
  ProductImage  → multiple images per product, one primary
"""
import uuid
from django.db import models
from django.utils.text import slugify


class Category(models.Model):
    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name       = models.CharField(max_length=100)
    slug       = models.SlugField(max_length=120, unique=True)
    parent     = models.ForeignKey(
        "self", null=True, blank=True,
        on_delete=models.SET_NULL, related_name="children"
    )
    image      = models.ImageField(upload_to="categories/", null=True, blank=True)
    is_active  = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table  = "categories"
        ordering  = ["name"]
        verbose_name_plural = "Categories"
        indexes   = [models.Index(fields=["slug"]), models.Index(fields=["parent"])]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    @property
    def full_path(self):
        """Returns 'Men > Shirts > Casual Shirts'"""
        if self.parent:
            return f"{self.parent.full_path} > {self.name}"
        return self.name


class Product(models.Model):
    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title       = models.CharField(max_length=255, db_index=True)
    slug        = models.SlugField(max_length=280, unique=True)
    description = models.TextField(blank=True)
    brand       = models.CharField(max_length=100, blank=True, db_index=True)
    category    = models.ForeignKey(
        Category, on_delete=models.SET_NULL,
        null=True, related_name="products"
    )
    base_price  = models.DecimalField(max_digits=10, decimal_places=2)
    # sale_price: if set, displayed instead of base_price
    sale_price  = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    is_active   = models.BooleanField(default=True, db_index=True)
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "products"
        ordering = ["-created_at"]
        indexes  = [
            models.Index(fields=["slug"]),
            models.Index(fields=["category", "is_active"]),
            models.Index(fields=["brand"]),
            models.Index(fields=["base_price"]),
        ]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.title)
            slug = base
            n = 1
            while Product.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base}-{n}"
                n += 1
            self.slug = slug
        super().save(*args, **kwargs)

    @property
    def effective_price(self):
        return self.sale_price if self.sale_price else self.base_price

    @property
    def discount_percent(self):
        if self.sale_price and self.base_price > self.sale_price:
            return int(((self.base_price - self.sale_price) / self.base_price) * 100)
        return 0

    @property
    def primary_image(self):
        img = self.images.filter(is_primary=True).first()
        if not img:
            img = self.images.first()
        return img.image.url if img and img.image else None

    @property
    def total_stock(self):
        return sum(v.stock for v in self.variants.all())

    @property
    def is_in_stock(self):
        return self.total_stock > 0


class ProductVariant(models.Model):
    id        = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product   = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="variants")
    size      = models.CharField(max_length=20, blank=True)   # XS S M L XL XXL
    color     = models.CharField(max_length=50, blank=True)
    color_hex = models.CharField(max_length=7, blank=True)    # #FFFFFF
    sku       = models.CharField(max_length=100, unique=True)
    price     = models.DecimalField(
        max_digits=10, decimal_places=2,
        null=True, blank=True,
        help_text="Override base_price for this variant. Leave blank to use product price."
    )
    stock     = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "product_variants"
        ordering = ["size", "color"]
        indexes  = [
            models.Index(fields=["product", "is_active"]),
            models.Index(fields=["sku"]),
        ]

    def __str__(self):
        parts = [self.product.title]
        if self.size:  parts.append(self.size)
        if self.color: parts.append(self.color)
        return " / ".join(parts)

    @property
    def effective_price(self):
        return self.price if self.price else self.product.effective_price


class ProductImage(models.Model):
    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product    = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="images")
    image      = models.ImageField(upload_to="products/")
    alt_text   = models.CharField(max_length=255, blank=True)
    is_primary = models.BooleanField(default=False)
    order      = models.PositiveSmallIntegerField(default=0)

    class Meta:
        db_table = "product_images"
        ordering = ["order", "-is_primary"]

    def __str__(self):
        return f"{self.product.title} — Image {self.order}"

    def save(self, *args, **kwargs):
        # Ensure only one primary image per product
        if self.is_primary:
            ProductImage.objects.filter(
                product=self.product, is_primary=True
            ).exclude(pk=self.pk).update(is_primary=False)
        super().save(*args, **kwargs)

class BulkUpload(models.Model):
 
    class Status(models.TextChoices):
        UPLOADED   = "uploaded",   "Uploaded"
        PROCESSING = "processing", "Processing"
        COMPLETED  = "completed",  "Completed"
        FAILED     = "failed",     "Failed"
 
    id             = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    file           = models.FileField(upload_to="csvs/uploads/")
    status         = models.CharField(max_length=20, choices=Status.choices, default=Status.UPLOADED)
 
    # Progress counters — updated live by Celery task
    total_records  = models.PositiveIntegerField(default=0)
    processed      = models.PositiveIntegerField(default=0)
    success_count  = models.PositiveIntegerField(default=0)
    failure_count  = models.PositiveIntegerField(default=0)
 
    # Error report — a generated CSV file
    error_file     = models.FileField(upload_to="csvs/errors/", null=True, blank=True)
 
    created_by     = models.ForeignKey(
        "users.User", on_delete=models.SET_NULL,
        null=True, related_name="bulk_uploads"
    )
    created_at     = models.DateTimeField(auto_now_add=True)
    completed_at   = models.DateTimeField(null=True, blank=True)
 
    class Meta:
        db_table = "bulk_uploads"
        ordering = ["-created_at"]
 
    def __str__(self):
        return f"BulkUpload({self.status} | {self.success_count}/{self.total_records})"
 