from django.test import TestCase, RequestFactory
from django.contrib.auth import get_user_model
from django.core.exceptions import PermissionDenied
from django.http import HttpResponse
from users.permissions import role_required

User = get_user_model()

class RolePermissionTests(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        
        # Create users with different roles
        self.customer = User.objects.create_user(
            username='customer', password='password', role='customer'
        )
        self.pm = User.objects.create_user(
            username='pm', password='password', role='product_manager'
        )
        self.sales = User.objects.create_user(
            username='sales', password='password', role='sales_manager'
        )

    def test_role_decorator_allow(self):
        """Test that user with allowed role can access the view"""
        @role_required(['product_manager'])
        def dummy_view(request):
            return HttpResponse("OK")

        request = self.factory.get('/')
        request.user = self.pm
        
        response = dummy_view(request)
        self.assertEqual(response.status_code, 200)

    def test_role_decorator_deny(self):
        """Test that user with disallowed role receives PermissionDenied"""
        @role_required(['product_manager'])
        def dummy_view(request):
            return HttpResponse("OK")

        request = self.factory.get('/')
        request.user = self.sales  # Sales manager should be denied
        
        with self.assertRaises(PermissionDenied):
            dummy_view(request)

    def test_role_decorator_anonymous(self):
        """Test that anonymous user is redirected or denied"""
        @role_required(['product_manager'])
        def dummy_view(request):
            return HttpResponse("OK")
            
        request = self.factory.get('/')
        from django.contrib.auth.models import AnonymousUser
        request.user = AnonymousUser()
        
        response = dummy_view(request)
        # Should redirect to login (302)
        self.assertEqual(response.status_code, 302)
