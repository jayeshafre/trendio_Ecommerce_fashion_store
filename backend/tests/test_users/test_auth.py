"""
Auth Module Tests — covers all critical auth flows.

Run:  pytest tests/test_users/ -v
"""
import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status

User = get_user_model()

@pytest.mark.django_db
# ─────────────────────────────────────────────────────────────
# FIXTURES
# ─────────────────────────────────────────────────────────────

@pytest.fixture
def user_data():
    return {
        "email":      "john.doe@test.com",
        "first_name": "John",
        "last_name":  "Doe",
        "phone":      "9876543210",
        "password":   "SecurePass@1",
        "password2":  "SecurePass@1",
    }


@pytest.fixture
def verified_user(db):
    user = User.objects.create_user(
        email      = "jane.doe@test.com",
        first_name = "Jane",
        last_name  = "Doe",
        phone      = "9999999999",
        password   = "SecurePass@1",
    )
    user.is_verified = True
    user.save()
    return user


@pytest.fixture
def auth_tokens(api_client, verified_user):
    """Returns login response with access + refresh tokens."""
    url = reverse("users:login")
    response = api_client.post(url, {
        "email":    "jane.doe@test.com",
        "password": "SecurePass@1",
    })
    assert response.status_code == status.HTTP_200_OK
    return response.data


@pytest.fixture
def authenticated_client(api_client, auth_tokens):
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {auth_tokens['access']}")
    return api_client


# ─────────────────────────────────────────────────────────────
# REGISTER TESTS
# ─────────────────────────────────────────────────────────────
@pytest.mark.django_db
class TestRegister:

    def test_register_success(self, api_client, db, user_data):
        url = reverse("users:register")
        response = api_client.post(url, user_data)
        assert response.status_code == status.HTTP_201_CREATED
        assert "user_id" in response.data
        assert User.objects.filter(email=user_data["email"]).exists()

    def test_register_duplicate_email(self, api_client, db, user_data):
        url = reverse("users:register")
        api_client.post(url, user_data)  # first registration
        response = api_client.post(url, user_data)  # duplicate
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "already exists" in response.data["detail"].lower()

    def test_register_passwords_mismatch(self, api_client, db, user_data):
        user_data["password2"] = "WrongPassword@1"
        response = api_client.post(reverse("users:register"), user_data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_register_invalid_email(self, api_client, db, user_data):
        user_data["email"] = "not-an-email"
        response = api_client.post(reverse("users:register"), user_data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_register_weak_password(self, api_client, db, user_data):
        user_data["password"] = user_data["password2"] = "123"
        response = api_client.post(reverse("users:register"), user_data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_register_new_user_is_unverified(self, api_client, db, user_data):
        api_client.post(reverse("users:register"), user_data)
        user = User.objects.get(email=user_data["email"])
        assert user.is_verified is False


# ─────────────────────────────────────────────────────────────
# LOGIN TESTS
# ─────────────────────────────────────────────────────────────
@pytest.mark.django_db
class TestLogin:

    def test_login_success(self, api_client, verified_user):
        response = api_client.post(reverse("users:login"), {
            "email":    "jane.doe@test.com",
            "password": "SecurePass@1",
        })
        assert response.status_code == status.HTTP_200_OK
        assert "access"  in response.data
        assert "refresh" in response.data
        assert "user"    in response.data
        assert response.data["user"]["email"] == "jane.doe@test.com"

    def test_login_wrong_password(self, api_client, verified_user):
        response = api_client.post(reverse("users:login"), {
            "email":    "jane.doe@test.com",
            "password": "WrongPassword",
        })
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_login_nonexistent_email(self, api_client, db):
        response = api_client.post(reverse("users:login"), {
            "email":    "nobody@test.com",
            "password": "Whatever@1",
        })
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_login_returns_jwt_claims(self, api_client, verified_user):
        import jwt as pyjwt
        from django.conf import settings
        response = api_client.post(reverse("users:login"), {
            "email":    "jane.doe@test.com",
            "password": "SecurePass@1",
        })
        payload = pyjwt.decode(
            response.data["access"],
            settings.SECRET_KEY,
            algorithms=["HS256"],
        )
        assert payload["email"] == "jane.doe@test.com"
        assert payload["role"]  == "customer"


# ─────────────────────────────────────────────────────────────
# ME TESTS
# ─────────────────────────────────────────────────────────────
@pytest.mark.django_db
class TestMe:

    def test_me_returns_user(self, authenticated_client, verified_user):
        response = authenticated_client.get(reverse("users:me"))
        assert response.status_code == status.HTTP_200_OK
        assert response.data["email"] == "jane.doe@test.com"

    def test_me_unauthenticated(self, api_client):
        response = api_client.get(reverse("users:me"))
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_me_patch_name(self, authenticated_client, verified_user):
        response = authenticated_client.patch(reverse("users:me"), {
            "first_name": "Janet",
        })
        assert response.status_code == status.HTTP_200_OK
        assert response.data["first_name"] == "Janet"


# ─────────────────────────────────────────────────────────────
# LOGOUT TESTS
# ─────────────────────────────────────────────────────────────
@pytest.mark.django_db
class TestLogout:

    def test_logout_success(self, authenticated_client, auth_tokens):
        response = authenticated_client.post(
            reverse("users:logout"),
            {"refresh": auth_tokens["refresh"]},
        )
        assert response.status_code == status.HTTP_200_OK

    def test_logout_unauthenticated(self, api_client):
        response = api_client.post(reverse("users:logout"), {"refresh": "fake"})
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


# ─────────────────────────────────────────────────────────────
# OTP TESTS
# ─────────────────────────────────────────────────────────────
@pytest.mark.django_db
class TestOTP:

    def test_send_otp_success(self, api_client, verified_user):
        response = api_client.post(reverse("users:otp-send"), {
            "identifier": "9999999999",
            "purpose":    "otp_login",
        })
        assert response.status_code == status.HTTP_200_OK

    def test_verify_otp_invalid_code(self, api_client, db):
        from apps.users import services
        services.generate_otp("9876543210", "otp_login")
        response = api_client.post(reverse("users:otp-verify"), {
            "identifier": "9876543210",
            "code":       "000000",
            "purpose":    "otp_login",
        })
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_verify_otp_correct_code(self, api_client, verified_user):
        from apps.users import services
        code = services.generate_otp("9999999999", "otp_login")
        response = api_client.post(reverse("users:otp-verify"), {
            "identifier": "9999999999",
            "code":       code,
            "purpose":    "otp_login",
        })
        assert response.status_code == status.HTTP_200_OK
        assert "access" in response.data


# ─────────────────────────────────────────────────────────────
# PASSWORD RESET TESTS
# ─────────────────────────────────────────────────────────────
@pytest.mark.django_db
class TestPasswordReset:

    def test_forgot_password_always_200(self, api_client, db):
        """Should return 200 even for non-existent emails (no enumeration)."""
        response = api_client.post(reverse("users:password-forgot"), {
            "email": "nobody@test.com",
        })
        assert response.status_code == status.HTTP_200_OK

    def test_forgot_password_valid_email(self, api_client, verified_user):
        response = api_client.post(reverse("users:password-forgot"), {
            "email": "jane.doe@test.com",
        })
        assert response.status_code == status.HTTP_200_OK

    def test_reset_password_success(self, api_client, verified_user):
        from apps.users import services
        code = services.generate_otp("jane.doe@test.com", "password_reset")
        response = api_client.post(reverse("users:password-reset"), {
            "email":     "jane.doe@test.com",
            "otp":       code,
            "password":  "NewPass@123",
            "password2": "NewPass@123",
        })
        assert response.status_code == status.HTTP_200_OK
        # Verify new password works
        verified_user.refresh_from_db()
        assert verified_user.check_password("NewPass@123")

    def test_reset_password_wrong_otp(self, api_client, verified_user):
        response = api_client.post(reverse("users:password-reset"), {
            "email":     "jane.doe@test.com",
            "otp":       "000000",
            "password":  "NewPass@123",
            "password2": "NewPass@123",
        })
        assert response.status_code == status.HTTP_400_BAD_REQUEST