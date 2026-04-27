"""
Cart Views — thin HTTP handlers. All logic in services.py.

Endpoints:
  GET    /api/v1/cart/              → get cart
  POST   /api/v1/cart/items/        → add item
  PATCH  /api/v1/cart/items/{id}/   → update quantity
  DELETE /api/v1/cart/items/{id}/   → remove item
  DELETE /api/v1/cart/clear/        → empty cart
"""
import logging
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema

from .models import CartItem
from .serializers import (
    AddItemSerializer, CartSerializer, UpdateQtySerializer
)
from .services import CartService

logger = logging.getLogger(__name__)


class CartView(APIView):
    """
    GET /api/v1/cart/
    Returns the current user's cart with all items, subtotal, item count.
    Auto-creates the cart if the user doesn't have one yet.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(tags=["Cart"])
    def get(self, request):
        cart = CartService.get_or_create_cart(request.user)
        return Response(CartSerializer(cart).data)


class CartItemListView(APIView):
    """
    POST /api/v1/cart/items/
    Add a product variant to the cart.
    If variant already in cart, increments quantity.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(tags=["Cart"], request=AddItemSerializer)
    def post(self, request):
        serializer = AddItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        cart = CartService.get_or_create_cart(request.user)
        CartService.add_item(
            cart       = cart,
            variant_id = str(serializer.validated_data["variant_id"]),
            quantity   = serializer.validated_data["quantity"],
        )

        # Always return the full updated cart
        return Response(CartSerializer(cart).data, status=status.HTTP_201_CREATED)


class CartItemDetailView(APIView):
    """
    PATCH  /api/v1/cart/items/{id}/  → update quantity (0 = remove)
    DELETE /api/v1/cart/items/{id}/  → remove item
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(tags=["Cart"], request=UpdateQtySerializer)
    def patch(self, request, pk):
        serializer = UpdateQtySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        cart = CartService.get_or_create_cart(request.user)
        CartService.update_qty(
            cart     = cart,
            item_id  = str(pk),
            quantity = serializer.validated_data["quantity"],
        )
        return Response(CartSerializer(cart).data)

    @extend_schema(tags=["Cart"])
    def delete(self, request, pk):
        cart = CartService.get_or_create_cart(request.user)
        CartService.remove_item(cart=cart, item_id=str(pk))
        return Response(CartSerializer(cart).data)


class CartClearView(APIView):
    """
    DELETE /api/v1/cart/clear/
    Removes all items from the cart. Cart record itself stays.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(tags=["Cart"])
    def delete(self, request):
        cart = CartService.get_or_create_cart(request.user)
        CartService.clear_cart(cart)
        return Response(CartSerializer(cart).data)