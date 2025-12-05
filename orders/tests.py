from django.test import TestCase
from django.contrib.auth import get_user_model
from products.models import Product, Category
from orders.models import Order, OrderItem
from cart.models import Cart, CartItem
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()

class OrderTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='password123')
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
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_create_order_success(self):
        # Add item to cart
        cart = Cart.objects.create(user=self.user)
        CartItem.objects.create(cart=cart, product=self.product, quantity=2)

        # Place order
        response = self.client.post('/api/orders/create/', {'delivery_address': '123 Test St'})
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Order.objects.count(), 1)
        self.assertEqual(OrderItem.objects.count(), 1)
        
        # Check stock reduction
        self.product.refresh_from_db()
        self.assertEqual(self.product.quantity_in_stock, 8) # 10 - 2
        
        # Check cart cleared
        self.assertEqual(CartItem.objects.count(), 0)

    def test_create_order_insufficient_stock(self):
        # Add item to cart with quantity > stock
        cart = Cart.objects.create(user=self.user)
        CartItem.objects.create(cart=cart, product=self.product, quantity=11)

        # Place order
        response = self.client.post('/api/orders/create/', {'delivery_address': '123 Test St'})
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Order.objects.count(), 0)
        
        # Check stock unchanged
        self.product.refresh_from_db()
        self.assertEqual(self.product.quantity_in_stock, 10)

    def test_list_orders(self):
        # Create an order manually
        order = Order.objects.create(
            user=self.user,
            total_price=2000.00,
            delivery_address='123 Test St',
            invoice_number='INV123'
        )
        OrderItem.objects.create(order=order, product=self.product, quantity=2, price=1000.00)

        response = self.client.get('/api/orders/list/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Handle pagination
        if 'results' in response.data:
            results = response.data['results']
        else:
            results = response.data
            
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['id'], order.id)
