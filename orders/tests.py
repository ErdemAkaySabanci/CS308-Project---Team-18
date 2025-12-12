from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from decimal import Decimal
from products.models import Product, Category
from users.models import CustomUser
from orders.models import Order, OrderItem


class OrderModelTest(TestCase):
    """Order Model Tests"""
    
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='TestPass123!'
        )
        self.category = Category.objects.create(name="Sports")
        self.product = Product.objects.create(
            name="Football",
            price=Decimal("99.99"),
            category=self.category,
            quantity_in_stock=10
        )
    
    def test_order_creation(self):
        """Test order is created correctly"""
        order = Order.objects.create(
            user=self.user,
            total_price=Decimal("99.99"),
            status='pending'
        )
        self.assertEqual(order.user.email, 'test@example.com')
        self.assertEqual(order.status, 'pending')
    
    def test_order_item_creation(self):
        """Test order item is created correctly"""
        order = Order.objects.create(
            user=self.user,
            total_price=Decimal("199.98"),
            status='pending'
        )
        order_item = OrderItem.objects.create(
            order=order,
            product=self.product,
            quantity=2,
            price=Decimal("99.99")
        )
        self.assertEqual(order_item.quantity, 2)
        self.assertEqual(order_item.product.name, "Football")


class OrderAPITest(APITestCase):
    """Order API Tests"""
    
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='TestPass123!'
        )
        self.client.force_authenticate(user=self.user)
    
    def test_get_orders_authenticated(self):
        """Test authenticated user can view their orders"""
        response = self.client.get('/api/orders/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_get_orders_unauthenticated(self):
        """Test unauthenticated user cannot view orders"""
        self.client.force_authenticate(user=None)
        response = self.client.get('/api/orders/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
