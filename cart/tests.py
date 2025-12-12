from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from decimal import Decimal
from products.models import Product, Category
from users.models import CustomUser
from cart.models import Cart, CartItem


class CartModelTest(TestCase):
    """Test 10: Cart Model"""
    
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='TestPass123!'
        )
        self.category = Category.objects.create(name="Sports")
        self.product = Product.objects.create(
            name="Tennis Racket",
            price=Decimal("199.99"),
            category=self.category,
            quantity_in_stock=10
        )
        self.cart = Cart.objects.create(user=self.user)
    
    def test_cart_creation(self):
        """Test cart is created for user"""
        self.assertEqual(self.cart.user.email, 'test@example.com')
    
    def test_add_item_to_cart(self):
        """Test adding item to cart"""
        cart_item = CartItem.objects.create(
            cart=self.cart,
            product=self.product,
            quantity=2
        )
        self.assertEqual(cart_item.quantity, 2)
        self.assertEqual(cart_item.product.name, "Tennis Racket")
    
    def test_cart_item_subtotal(self):
        """Test cart item subtotal calculation"""
        cart_item = CartItem.objects.create(
            cart=self.cart,
            product=self.product,
            quantity=3
        )
        expected_total = self.product.discounted_price * 3
        self.assertEqual(cart_item.subtotal, expected_total)
    
    def test_cart_total_price(self):
        """Test cart total price calculation"""
        CartItem.objects.create(
            cart=self.cart,
            product=self.product,
            quantity=2
        )
        expected_total = self.product.discounted_price * 2
        self.assertEqual(self.cart.total_price, expected_total)
    
    def test_cart_total_items(self):
        """Test cart total items count"""
        CartItem.objects.create(
            cart=self.cart,
            product=self.product,
            quantity=5
        )
        self.assertEqual(self.cart.total_items, 5)


class CartAPITest(APITestCase):
    """Cart API Tests"""
    
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='TestPass123!'
        )
        self.category = Category.objects.create(name="Sports")
        self.product = Product.objects.create(
            name="Basketball",
            price=Decimal("49.99"),
            category=self.category,
            quantity_in_stock=20
        )
        self.client.force_authenticate(user=self.user)
    
    def test_get_cart_authenticated(self):
        """Test authenticated user can view their cart"""
        response = self.client.get('/api/cart/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_get_cart_unauthenticated(self):
        """Test unauthenticated user cannot view cart"""
        self.client.force_authenticate(user=None)
        response = self.client.get('/api/cart/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_add_to_cart(self):
        """Test adding product to cart via POST"""
        data = {
            'product_id': self.product.id,
            'quantity': 2
        }
        response = self.client.post('/api/cart/', data)
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])
    
    def test_clear_cart(self):
        """Test clearing cart"""
        # First add an item
        Cart.objects.create(user=self.user)
        response = self.client.delete('/api/cart/clear/')
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_204_NO_CONTENT])
