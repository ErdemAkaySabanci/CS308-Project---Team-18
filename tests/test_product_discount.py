"""
Unit Test: Product Discount Price Calculation
Tests the discounted_price property of the Product model.
"""

from django.test import TestCase
from decimal import Decimal
from products.models import Product, Category


class ProductDiscountPriceTest(TestCase):
    """Test product discount price calculation"""

    def setUp(self):
        """Set up test data"""
        self.category = Category.objects.create(name="Test Category")
        self.product = Product.objects.create(
            product_id="TEST001",
            name="Test Product",
            model="Model X",
            serial_number="SN001",
            description="Test description",
            quantity_in_stock=100,
            price=Decimal("100.00"),
            warranty_status="1 Year",
            distributor="Test Distributor",
            category=self.category,
            discount_rate=Decimal("0.00")
        )

    def test_no_discount_returns_original_price(self):
        """Test that price without discount returns original price"""
        self.product.discount_rate = Decimal("0.00")
        self.product.save()
        self.assertEqual(self.product.discounted_price, Decimal("100.00"))

    def test_ten_percent_discount(self):
        """Test 10% discount calculation"""
        self.product.discount_rate = Decimal("10.00")
        self.product.save()
        expected_price = Decimal("100.00") * (1 - Decimal("10.00") / 100)
        self.assertEqual(self.product.discounted_price, expected_price)

    def test_fifty_percent_discount(self):
        """Test 50% discount calculation"""
        self.product.discount_rate = Decimal("50.00")
        self.product.save()
        expected_price = Decimal("100.00") * Decimal("0.50")
        self.assertEqual(self.product.discounted_price, expected_price)

    def test_hundred_percent_discount(self):
        """Test 100% discount makes product free"""
        self.product.discount_rate = Decimal("100.00")
        self.product.save()
        self.assertEqual(self.product.discounted_price, Decimal("0.00"))
