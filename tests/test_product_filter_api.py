"""
Unit Test: Product Filter API
Tests the product filtering functionality (price range, category, stock).
"""

from rest_framework.test import APITestCase
from rest_framework import status
from decimal import Decimal
from products.models import Product, Category


class ProductFilterAPITest(APITestCase):
    """Test Product Filter API functionality"""

    def setUp(self):
        """Set up test data with various products"""
        self.category1 = Category.objects.create(name="Category A")
        self.category2 = Category.objects.create(name="Category B")
        
        Product.objects.create(
            product_id="CHEAP001",
            name="Cheap Product",
            model="Budget",
            serial_number="SN-CHEAP",
            description="Affordable item",
            quantity_in_stock=50,
            price=Decimal("25.00"),
            warranty_status="3 Months",
            distributor="Budget Store",
            category=self.category1,
            is_active=True
        )
        
        Product.objects.create(
            product_id="EXPENSIVE001",
            name="Expensive Product",
            model="Premium",
            serial_number="SN-EXPENSIVE",
            description="Premium item",
            quantity_in_stock=10,
            price=Decimal("500.00"),
            warranty_status="2 Years",
            distributor="Premium Store",
            category=self.category2,
            is_active=True
        )
        
        Product.objects.create(
            product_id="OUTOFSTOCK001",
            name="Out of Stock Product",
            model="Unavailable",
            serial_number="SN-OUTOFSTOCK",
            description="Currently unavailable",
            quantity_in_stock=0,
            price=Decimal("100.00"),
            warranty_status="1 Year",
            distributor="General Store",
            category=self.category1,
            is_active=True
        )

    def test_filter_by_min_price(self):
        """Test filtering products by minimum price"""
        response = self.client.get('/api/products/', {'min_price': '100'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for product in response.data['results']:
            self.assertGreaterEqual(Decimal(product['price']), Decimal('100'))

    def test_filter_by_max_price(self):
        """Test filtering products by maximum price"""
        response = self.client.get('/api/products/', {'max_price': '50'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for product in response.data['results']:
            self.assertLessEqual(Decimal(product['price']), Decimal('50'))

    def test_filter_by_price_range(self):
        """Test filtering products by price range"""
        response = self.client.get('/api/products/', {'min_price': '20', 'max_price': '100'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for product in response.data['results']:
            price = Decimal(product['price'])
            self.assertGreaterEqual(price, Decimal('20'))
            self.assertLessEqual(price, Decimal('100'))

    def test_filter_by_category(self):
        """Test filtering products by category"""
        response = self.client.get('/api/products/', {'category': self.category1.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_filter_in_stock_only(self):
        """Test filtering to show only in-stock products"""
        response = self.client.get('/api/products/', {'in_stock': 'true'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for product in response.data['results']:
            self.assertGreater(product['quantity_in_stock'], 0)
