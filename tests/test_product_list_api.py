"""
Unit Test: Product List API
Tests the product list API endpoint functionality.
"""

from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from decimal import Decimal
from products.models import Product, Category


class ProductListAPITest(APITestCase):
    """Test Product List API endpoint"""

    def setUp(self):
        """Set up test data"""
        self.category = Category.objects.create(name="API Test Category")
        
        for i in range(5):
            Product.objects.create(
                product_id=f"API{i:03d}",
                name=f"API Test Product {i}",
                model=f"Model {i}",
                serial_number=f"SN-API-{i:03d}",
                description=f"Description for product {i}",
                quantity_in_stock=10 * (i + 1),
                price=Decimal(f"{(i + 1) * 100}.00"),
                warranty_status="1 Year",
                distributor="API Distributor",
                category=self.category,
                is_active=True
            )

    def test_get_product_list_success(self):
        """Test successful retrieval of product list"""
        response = self.client.get('/api/products/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_product_list_returns_all_active_products(self):
        """Test that list returns all active products"""
        response = self.client.get('/api/products/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data['results']), 5)

    def test_product_list_excludes_inactive_products(self):
        """Test that inactive products are not returned"""
        Product.objects.create(
            product_id="INACTIVE001",
            name="Inactive Product",
            model="Inactive Model",
            serial_number="SN-INACTIVE",
            description="This product is inactive",
            quantity_in_stock=100,
            price=Decimal("999.99"),
            warranty_status="1 Year",
            distributor="Test",
            category=self.category,
            is_active=False
        )
        
        response = self.client.get('/api/products/')
        product_names = [p['name'] for p in response.data['results']]
        self.assertNotIn("Inactive Product", product_names)

    def test_product_list_contains_required_fields(self):
        """Test that product list contains required fields"""
        response = self.client.get('/api/products/')
        if response.data['results']:
            product = response.data['results'][0]
            self.assertIn('id', product)
            self.assertIn('name', product)
            self.assertIn('price', product)
