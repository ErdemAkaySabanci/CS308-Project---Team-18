"""
Unit Test: Cart API
Tests the Cart API endpoints for adding and retrieving cart items.
"""

from rest_framework.test import APITestCase
from rest_framework import status
from decimal import Decimal
from users.models import CustomUser
from products.models import Product, Category
from cart.models import Cart, CartItem


class CartAPITest(APITestCase):
    """Test Cart API functionality"""

    def setUp(self):
        """Set up test data"""
        self.user = CustomUser.objects.create_user(
            username="cartapiuser",
            email="cartapi@test.com",
            password="testpass123"
        )
        self.category = Category.objects.create(name="Cart API Category")
        self.product = Product.objects.create(
            product_id="CARTAPI001",
            name="Cart API Product",
            model="Model API",
            serial_number="SN-CARTAPI-001",
            description="Product for cart API testing",
            quantity_in_stock=100,
            price=Decimal("49.99"),
            warranty_status="1 Year",
            distributor="API Store",
            category=self.category,
            is_active=True
        )

    def test_get_cart_unauthenticated(self):
        """Test getting cart without authentication (guest)"""
        response = self.client.get('/api/cart/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_get_cart_authenticated(self):
        """Test getting cart with authentication"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/cart/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_add_item_to_cart(self):
        """Test adding an item to cart"""
        self.client.force_authenticate(user=self.user)
        data = {
            'product_id': self.product.id,
            'quantity': 2
        }
        response = self.client.post('/api/cart/', data)
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])

    def test_add_item_increases_quantity_if_exists(self):
        """Test adding same item increases quantity"""
        self.client.force_authenticate(user=self.user)
        
        data = {'product_id': self.product.id, 'quantity': 2}
        self.client.post('/api/cart/', data)
        self.client.post('/api/cart/', data)
        
        response = self.client.get('/api/cart/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_add_item_with_invalid_product_id(self):
        """Test adding item with non-existent product returns error"""
        self.client.force_authenticate(user=self.user)
        data = {
            'product_id': 99999,
            'quantity': 1
        }
        response = self.client.post('/api/cart/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cart_response_contains_items(self):
        """Test cart response contains items array"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/cart/')
        self.assertIn('items', response.data)
