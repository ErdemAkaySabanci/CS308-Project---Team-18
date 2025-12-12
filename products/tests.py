from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from decimal import Decimal
from products.models import Product, Category


class CategoryModelTest(TestCase):
    """Test 1: Category Model"""
    
    def setUp(self):
        self.category = Category.objects.create(name="Basketball")
    
    def test_category_creation(self):
        """Test category is created correctly"""
        self.assertEqual(self.category.name, "Basketball")
        self.assertEqual(str(self.category), "Basketball")


class ProductModelTest(TestCase):
    """Test 2: Product Model"""
    
    def setUp(self):
        self.category = Category.objects.create(name="Basketball")
        self.product = Product.objects.create(
            name="Basketball Shoes",
            description="Professional basketball shoes",
            price=Decimal("299.99"),
            category=self.category,
            quantity_in_stock=50
        )
    
    def test_product_creation(self):
        """Test product is created with correct attributes"""
        self.assertEqual(self.product.name, "Basketball Shoes")
        self.assertEqual(self.product.price, Decimal("299.99"))
        self.assertEqual(self.product.category.name, "Basketball")
    
    def test_product_str_method(self):
        """Test product string representation"""
        self.assertEqual(str(self.product), "Basketball Shoes")
    
    def test_product_in_stock(self):
        """Test product stock status"""
        self.assertTrue(self.product.is_in_stock)
        self.product.quantity_in_stock = 0
        self.product.save()
        self.assertFalse(self.product.is_in_stock)


class ProductAPITest(APITestCase):
    """Test 3: Product API Endpoints"""
    
    def setUp(self):
        self.category = Category.objects.create(name="Football")
        self.product = Product.objects.create(
            name="Football",
            description="Official match ball",
            price=Decimal("149.99"),
            category=self.category,
            quantity_in_stock=100
        )
    
    def test_get_product_list(self):
        """Test retrieving product list"""
        response = self.client.get('/api/products/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_get_product_detail(self):
        """Test retrieving single product"""
        response = self.client.get(f'/api/products/{self.product.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Football')


class CategoryAPITest(APITestCase):
    """Test 4: Category API Endpoints"""
    
    def setUp(self):
        Category.objects.create(name="Tennis")
        Category.objects.create(name="Swimming")
    
    def test_get_category_list(self):
        """Test retrieving category list"""
        response = self.client.get('/api/categories/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # En az 2 kategori olmalı (diğer testler de kategori oluşturuyor)
        self.assertGreaterEqual(len(response.data), 2)
