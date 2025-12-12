from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from products.models import Product, Category
from cart.models import Cart
from rest_framework import status

User = get_user_model()

class GuestCartTest(TestCase):
    def setUp(self):
        # Create category
        self.category = Category.objects.create(name="Test Category")
        
        # Create a product
        self.product = Product.objects.create(
            name="Test Product",
            category=self.category,
            price=10.00,
            description="Test Description",
            quantity_in_stock=100
        )
        self.client = Client()

    def test_guest_cart_flow(self):
        print("\n--- Starting Guest Cart Flow Test ---")
        
        # 1. Add item to cart as guest
        response = self.client.post('/api/cart/', {
            'product_id': self.product.id,
            'quantity': 2
        }, content_type='application/json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        print("1. Guest added item to cart (Success)")
        
        # Verify guest cart exists
        session_key = self.client.session.session_key
        guest_cart = Cart.objects.get(session_key=session_key)
        self.assertEqual(guest_cart.items.count(), 1)
        print(f"   Guest cart created with session key: {session_key}")

        # 2. Register/Login
        email = "testuser@example.com"
        password = "password123"
        username = "testuser"
        
        # Register
        response = self.client.post('/api/users/register/', {
            'username': username,
            'email': email,
            'password': password,
            'first_name': "Test",
            'last_name': "User"
        }, content_type='application/json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        print("2. User registered (Success)")

        # Login
        response = self.client.post('/api/users/login/', {
            'email': email,
            'password': password
        }, content_type='application/json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        token = response.data['access']
        print("3. User logged in (Success)")

        # 3. Verify item is now in user cart
        user = User.objects.get(email=email)
        user_cart = Cart.objects.get(user=user)
        self.assertEqual(user_cart.items.count(), 1)
        item = user_cart.items.first()
        self.assertEqual(item.product.id, self.product.id)
        self.assertEqual(item.quantity, 2)
        print("4. Verified item merged into user cart")
        
        # Verify guest cart is gone
        with self.assertRaises(Cart.DoesNotExist):
            Cart.objects.get(session_key=session_key, user__isnull=True)
        print("5. Verified old guest cart is deleted")
        
        print("--- Test Passed ---")
