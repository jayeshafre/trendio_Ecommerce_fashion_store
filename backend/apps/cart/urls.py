from django.urls import path
from .views import CartView, CartItemListView, CartItemDetailView, CartClearView

app_name = "cart"

urlpatterns = [
    path("",          CartView.as_view(),           name="cart"),
    path("items/",    CartItemListView.as_view(),    name="cart-items"),
    path("items/<uuid:pk>/", CartItemDetailView.as_view(), name="cart-item-detail"),
    path("clear/",    CartClearView.as_view(),       name="cart-clear"),
]