"""
Products filters — django-filter based.

Supports:
  ?category=shirts
  ?brand=levis
  ?min_price=500&max_price=2000
  ?size=M
  ?color=black
  ?in_stock=true
  ?ordering=price / -price / -created_at
"""
import django_filters
from .models import Product


class ProductFilter(django_filters.FilterSet):
    # Category filter — accepts slug
    category   = django_filters.CharFilter(field_name="category__slug", lookup_expr="iexact")
    brand      = django_filters.CharFilter(lookup_expr="iexact")
    min_price  = django_filters.NumberFilter(field_name="base_price", lookup_expr="gte")
    max_price  = django_filters.NumberFilter(field_name="base_price", lookup_expr="lte")
    # Filter by variant attributes
    size       = django_filters.CharFilter(method="filter_by_size")
    color      = django_filters.CharFilter(method="filter_by_color")
    in_stock   = django_filters.BooleanFilter(method="filter_in_stock")

    class Meta:
        model  = Product
        fields = ["category", "brand", "min_price", "max_price"]

    def filter_by_size(self, queryset, name, value):
        return queryset.filter(
            variants__size__iexact=value,
            variants__is_active=True,
            variants__stock__gt=0,
        ).distinct()

    def filter_by_color(self, queryset, name, value):
        return queryset.filter(
            variants__color__icontains=value,
            variants__is_active=True,
        ).distinct()

    def filter_in_stock(self, queryset, name, value):
        if value:
            return queryset.filter(variants__stock__gt=0).distinct()
        return queryset