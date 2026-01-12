"""
Unit Test: Cart Model
Tests the Cart and CartItem model functionality.
"""

from django.test import TestCase
from decimal import Decimal
from users.models import CustomUser
from products.models import Product, Category
from cart.models import Cart, CartItem


class CartModelTest(TestCase):
    """Test Cart model functionality"""

    def setUp(self):
        """Set up test data"""
        self.user = CustomUser.objects.create_user(
            username="cartuser",
            email="cart@test.com",
            password="testpass123"
        )
        self.category = Category.objects.create(name="Cart Category")
        self.product = Product.objects.create(
            product_id="CART001",
            name="Cart Product",
            model="Model C",
            serial_number="SN-CART-001",
            description="Product for cart testing",
            quantity_in_stock=50,
            price=Decimal("75.00"),
            warranty_status="1 Year",
            distributor="Cart Store",
            category=self.category
        )

    def test_create_cart_for_user(self):
        """Test creating a cart for a user"""
        cart = Cart.objects.create(user=self.user)
        self.assertEqual(cart.user, self.user)
        self.assertIsNotNone(cart.id)

    def test_cart_str_representation_with_user(self):
        """Test cart string representation with user"""
        cart = Cart.objects.create(user=self.user)
        self.assertEqual(str(cart), f"Cart - {self.user.username}")

    def test_create_guest_cart(self):
        """Test creating a guest cart with session key"""
        cart = Cart.objects.create(session_key="test_session_key_123")
        self.assertEqual(cart.session_key, "test_session_key_123")
        self.assertIsNone(cart.user)

    def test_cart_str_representation_guest(self):
        """Test cart string representation for guest"""
        cart = Cart.objects.create(session_key="guest_session_456")
        self.assertEqual(str(cart), "Cart - Guest guest_session_456")

    def test_empty_cart_total_price(self):
        """Test empty cart has zero total price"""
        cart = Cart.objects.create(user=self.user)
        self.assertEqual(cart.total_price, 0)

    def test_empty_cart_total_items(self):
        """Test empty cart has zero total items"""
        cart = Cart.objects.create(user=self.user)
        self.assertEqual(cart.total_items, 0)


class CartItemModelTest(TestCase):
    """Test CartItem model functionality"""

    def setUp(self):
        """Set up test data"""
        self.user = CustomUser.objects.create_user(
            username="cartitemuser",
            email="cartitem@test.com",
            password="testpass123"
        )
        self.category = Category.objects.create(name="CartItem Category")
        self.product = Product.objects.create(
            product_id="CARTITEM001",
            name="CartItem Product",
            model="Model CI",
            serial_number="SN-CARTITEM-001",
            description="Product for cart item testing",
            quantity_in_stock=30,
            price=Decimal("50.00"),
            warranty_status="1 Year",
            distributor="CartItem Store",
            category=self.category,
            discount_rate=Decimal("0.00")
        )
        self.cart = Cart.objects.create(user=self.user)

    def test_add_item_to_cart(self):
        """Test adding an item to cart"""
        cart_item = CartItem.objects.create(
            cart=self.cart,
            product=self.product,
            quantity=2
        )
        self.assertEqual(cart_item.quantity, 2)
        self.assertEqual(cart_item.product, self.product)

    def test_cart_item_str_representation(self):
        """Test cart item string representation"""
        cart_item = CartItem.objects.create(
            cart=self.cart,
            product=self.product,
            quantity=3
        )
        self.assertEqual(str(cart_item), f"3x {self.product.name}")

    def test_cart_item_subtotal(self):
        """Test cart item subtotal calculation"""
        cart_item = CartItem.objects.create(
            cart=self.cart,
            product=self.product,
            quantity=4
        )
        expected_subtotal = 4 * Decimal("50.00")
        self.assertEqual(cart_item.subtotal, expected_subtotal)

    def test_cart_total_price_with_items(self):
        """Test cart total price with multiple items"""
        product2 = Product.objects.create(
            product_id="CARTITEM002",
            name="Second Product",
            model="Model CI2",
            serial_number="SN-CARTITEM-002",
            description="Second product",
            quantity_in_stock=20,
            price=Decimal("30.00"),
            warranty_status="1 Year",
            distributor="Store",
            category=self.category,
            discount_rate=Decimal("0.00")
        )
        
        CartItem.objects.create(cart=self.cart, product=self.product, quantity=2)
        CartItem.objects.create(cart=self.cart, product=product2, quantity=3)
        
        self.assertEqual(self.cart.total_price, Decimal("190.00"))

    def test_cart_total_items_with_items(self):
        """Test cart total items count"""
        CartItem.objects.create(cart=self.cart, product=self.product, quantity=5)
        self.assertEqual(self.cart.total_items, 5)
