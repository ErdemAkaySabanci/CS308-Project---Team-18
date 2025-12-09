from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse  # URL'leri dinamik almak icin
from products.models import Product, Category
from orders.models import Order, OrderItem
from cart.models import Cart, CartItem
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()

class OrderTests(TestCase):
    def setUp(self):
        # Test kullanıcısı oluştur
        self.user = User.objects.create_user(username='testuser', password='password123')
        
        # Kategori ve Ürün oluştur
        self.category = Category.objects.create(name='Electronics')
        self.product = Product.objects.create(
            product_id='P001',
            name='Laptop',
            model='X1',
            serial_number='SN123',
            description='Test Laptop',
            quantity_in_stock=10,
            price=1000.00,
            category=self.category,
            distributor='TestDist'
        )
        
        # API Client ve Authentication
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        
        # URL Tanımları (urls.py'daki 'name' parametrelerine uygun olmalı)
        # Eğer name kullanmıyorsanız '/api/orders/create/' şeklinde string kullanmaya devam edebilirsiniz.
        self.create_order_url = '/api/orders/create/' 
        self.list_order_url = '/api/orders/list/'

    def test_create_order_success(self):
        """Successful order creation, inventory reduction and basket cleaning testing"""
        # Add item to shooing cart
        cart = Cart.objects.create(user=self.user)
        CartItem.objects.create(cart=cart, product=self.product, quantity=2)

        # Create order
        response = self.client.post(self.create_order_url, {'delivery_address': '123 Test St'})
        
        # 1. Status Check
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # 2. DB ccontrols
        self.assertEqual(Order.objects.count(), 1)
        self.assertEqual(OrderItem.objects.count(), 1)
        
        # 3. Stock controls (10-2=8)
        self.product.refresh_from_db()
        self.assertEqual(self.product.quantity_in_stock, 8)
        
        # 4. Shopping chart check 
        self.assertEqual(CartItem.objects.count(), 0)

   def test_create_order_insufficient_stock(self):
        """Test order rejection when stock is insufficient"""
        # Add items exceeding stock quantity (Stock: 10, Request: 11)
        cart = Cart.objects.create(user=self.user)
        CartItem.objects.create(cart=cart, product=self.product, quantity=11)

        # Attempt to create order
        response = self.client.post(self.create_order_url, {'delivery_address': '123 Test St'})
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Order.objects.count(), 0)
        
        # Verify stock remains unchanged
        self.product.refresh_from_db()
        self.assertEqual(self.product.quantity_in_stock, 10)

    def test_create_order_empty_cart(self):
        """Test preventing order placement with an empty cart"""
        # Create an empty cart (no items added)
        Cart.objects.create(user=self.user)

        # Attempt to create order
        response = self.client.post(self.create_order_url, {'delivery_address': '123 Test St'})
        
        # Expect HTTP 400 Bad Request
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Order.objects.count(), 0)
        
    def test_list_orders(self):
        """Kullanıcının kendi siparişlerini listeleyebilmesi testi"""
        # Manuel order
        order = Order.objects.create(
            user=self.user,
            total_price=2000.00,
            delivery_address='123 Test St',
            invoice_number='INV123'
        )
        OrderItem.objects.create(order=order, product=self.product, quantity=2, price=1000.00)

        # Pull list 
        response = self.client.get(self.list_order_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Pagination check
        if 'results' in response.data:
            results = response.data['results']
        else:
            results = response.data
            
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['id'], order.id)