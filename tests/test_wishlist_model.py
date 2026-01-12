"""
Unit Test: Wishlist Model
Tests the WishList model functionality.
"""

from django.test import TestCase
from decimal import Decimal
from users.models import CustomUser, WishList
from products.models import Product, Category


class WishListModelTest(TestCase):
    """Test WishList model functionality"""

    def setUp(self):
        """Set up test data"""
        self.user = CustomUser.objects.create_user(
            username="wishlistuser",
            email="wishlist@test.com",
            password="testpass123"
        )
        self.category = Category.objects.create(name="Wishlist Category")
        self.product = Product.objects.create(
            product_id="WISH001",
            name="Wishlist Product",
            model="Model W",
            serial_number="SN-WISH-001",
            description="Product for wishlist testing",
            quantity_in_stock=20,
            price=Decimal("99.99"),
            warranty_status="1 Year",
            distributor="Wishlist Store",
            category=self.category
        )

    def test_add_product_to_wishlist(self):
        """Test adding a product to wishlist"""
        wishlist_item = WishList.objects.create(
            user=self.user,
            product=self.product
        )
        self.assertEqual(wishlist_item.user, self.user)
        self.assertEqual(wishlist_item.product, self.product)

    def test_wishlist_str_representation(self):
        """Test wishlist string representation"""
        wishlist_item = WishList.objects.create(
            user=self.user,
            product=self.product
        )
        expected_str = f"{self.user.username} - {self.product.name}"
        self.assertEqual(str(wishlist_item), expected_str)

    def test_user_can_have_multiple_wishlist_items(self):
        """Test user can have multiple products in wishlist"""
        product2 = Product.objects.create(
            product_id="WISH002",
            name="Second Wishlist Product",
            model="Model W2",
            serial_number="SN-WISH-002",
            description="Second product",
            quantity_in_stock=15,
            price=Decimal("149.99"),
            warranty_status="1 Year",
            distributor="Wishlist Store",
            category=self.category
        )
        
        WishList.objects.create(user=self.user, product=self.product)
        WishList.objects.create(user=self.user, product=product2)
        
        self.assertEqual(self.user.wishlist.count(), 2)

    def test_unique_together_constraint(self):
        """Test that user cannot add same product twice"""
        WishList.objects.create(user=self.user, product=self.product)
        
        with self.assertRaises(Exception):
            WishList.objects.create(user=self.user, product=self.product)

    def test_wishlist_added_at_timestamp(self):
        """Test that added_at timestamp is set"""
        wishlist_item = WishList.objects.create(
            user=self.user,
            product=self.product
        )
        self.assertIsNotNone(wishlist_item.added_at)
