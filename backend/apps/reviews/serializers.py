"""
Reviews Serializers

ReviewSerializer      → read (list + detail) — includes user name, product title
ReviewWriteSerializer → input for POST (create) and PATCH (update)
"""
from rest_framework import serializers
from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    user_name   = serializers.SerializerMethodField()
    product_title = serializers.CharField(source="product.title", read_only=True)

    class Meta:
        model  = Review
        fields = [
            "id",
            "user_name",
            "product_title",
            "rating",
            "title",
            "body",
            "created_at",
            "updated_at",
        ]

    def get_user_name(self, obj):
        name = obj.user.get_full_name()
        return name if name.strip() else obj.user.email.split("@")[0]


class ReviewWriteSerializer(serializers.Serializer):
    rating = serializers.IntegerField(min_value=1, max_value=5)
    title  = serializers.CharField(
        required=False, allow_blank=True, max_length=150
    )
    body   = serializers.CharField(min_length=10, max_length=2000)