"""
Unit Test: Product Stock Status
Tests the is_in_stock property of the Product model.
"""

from django.test import TestCase
from decimal import Decimal
from products.models import Product, Category


class ProductStockStatusTest(TestCase):
    """Test product stock status functionality"""

    def setUp(self):
        """Set up test data"""
        self.category = Category.objects.create(name="Stock Test Category")
        self.product = Product.objects.create(
            product_id="STOCK001",
            name="Stock Test Product",
            model="Model Stock",
            serial_number="SN-STOCK-001",
            description="Product for stock testing",
            quantity_in_stock=10,
            price=Decimal("50.00"),
            warranty_status="6 Months",
            distributor="Stock Distributor",
            category=self.category
        )

    def test_product_in_stock_when_quantity_positive(self):
        """Test product is in stock when quantity > 0"""
        self.product.quantity_in_stock = 10
        self.product.save()
        self.assertTrue(self.product.is_in_stock)

    def test_product_out_of_stock_when_quantity_zero(self):
        """Test product is out of stock when quantity = 0"""
        self.product.quantity_in_stock = 0
        self.product.save()
        self.assertFalse(self.product.is_in_stock)

    def test_product_in_stock_with_one_item(self):
        """Test product is in stock with exactly 1 item"""
        self.product.quantity_in_stock = 1
        self.product.save()
        self.assertTrue(self.product.is_in_stock)

    def test_product_in_stock_with_large_quantity(self):
        """Test product is in stock with large quantity"""
        self.product.quantity_in_stock = 10000
        self.product.save()
        self.assertTrue(self.product.is_in_stock)
