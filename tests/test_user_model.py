"""
Unit Test: User Model
Tests the CustomUser model functionality including roles.
"""

from django.test import TestCase
from users.models import CustomUser


class CustomUserModelTest(TestCase):
    """Test CustomUser model functionality"""

    def test_create_customer_user(self):
        """Test creating a customer user"""
        user = CustomUser.objects.create_user(
            username="customer1",
            email="customer@test.com",
            password="testpass123",
            role="customer"
        )
        self.assertEqual(user.role, "customer")
        self.assertEqual(user.username, "customer1")

    def test_create_sales_manager(self):
        """Test creating a sales manager user"""
        user = CustomUser.objects.create_user(
            username="salesmanager1",
            email="sales@test.com",
            password="testpass123",
            role="sales_manager"
        )
        self.assertEqual(user.role, "sales_manager")

    def test_create_product_manager(self):
        """Test creating a product manager user"""
        user = CustomUser.objects.create_user(
            username="productmanager1",
            email="product@test.com",
            password="testpass123",
            role="product_manager"
        )
        self.assertEqual(user.role, "product_manager")

    def test_create_support_agent(self):
        """Test creating a support agent user"""
        user = CustomUser.objects.create_user(
            username="supportagent1",
            email="support@test.com",
            password="testpass123",
            role="support_agent"
        )
        self.assertEqual(user.role, "support_agent")

    def test_user_str_representation(self):
        """Test user string representation includes username and role"""
        user = CustomUser.objects.create_user(
            username="testuser",
            email="test@test.com",
            password="testpass123",
            role="customer"
        )
        self.assertEqual(str(user), "testuser (customer)")

    def test_default_role_is_customer(self):
        """Test that default role is customer"""
        user = CustomUser.objects.create_user(
            username="defaultuser",
            email="default@test.com",
            password="testpass123"
        )
        self.assertEqual(user.role, "customer")

    def test_user_with_additional_fields(self):
        """Test user with tax_id, phone, and home_address"""
        user = CustomUser.objects.create_user(
            username="fulluser",
            email="full@test.com",
            password="testpass123",
            tax_id="123456789",
            phone="+90555123456",
            home_address="Test Address 123"
        )
        self.assertEqual(user.tax_id, "123456789")
        self.assertEqual(user.phone, "+90555123456")
        self.assertEqual(user.home_address, "Test Address 123")
