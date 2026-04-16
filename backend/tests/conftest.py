"""
Global pytest fixtures — available in all test modules.
"""

import pytest
from rest_framework.test import APIClient


@pytest.fixture
def api_client():
    """Unauthenticated DRF test client."""
    return APIClient()


@pytest.fixture
def authenticated_client(api_client, create_user):
    """DRF test client with JWT token attached."""
    from rest_framework_simplejwt.tokens import RefreshToken

    token = RefreshToken.for_user(create_user)
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(token.access_token)}")
    return api_client


@pytest.fixture
def create_user(db):
    """Factory to create a regular user."""
    from django.contrib.auth import get_user_model

    User = get_user_model()

    def make_user(**kwargs):
        defaults = {
            "email": "testuser@trendio.com",
            "username": "testuser",
            "password": "StrongPass@123",
        }
        defaults.update(kwargs)
        return User.objects.create_user(**defaults)

    return make_user()


@pytest.fixture
def create_admin(db):
    """Factory to create an admin user."""
    from django.contrib.auth import get_user_model

    User = get_user_model()
    return User.objects.create_superuser(
        email="admin@trendio.com",
        username="admin",
        password="AdminPass@123",
    )
