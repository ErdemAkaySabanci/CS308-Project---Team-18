from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from users.models import CustomUser


class UserModelTest(TestCase):
    """Test 5: User Model"""
    
    def test_create_user(self):
        """Test creating a regular user"""
        user = CustomUser.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='TestPass123!'
        )
        self.assertEqual(user.email, 'test@example.com')
        self.assertEqual(user.role, 'customer')
        self.assertTrue(user.check_password('TestPass123!'))


class UserRegistrationTest(APITestCase):
    """Test 6: User Registration"""
    
    def test_successful_registration(self):
        """Test user can register with valid data"""
        data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'TestPass123!',
            'first_name': 'Test',
            'last_name': 'User'
        }
        response = self.client.post('/api/users/register/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    
    def test_registration_invalid_email(self):
        """Test registration fails with invalid email"""
        data = {
            'username': 'testuser',
            'email': 'invalid-email',
            'password': 'TestPass123!'
        }
        response = self.client.post('/api/users/register/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_registration_weak_password(self):
        """Test registration fails with weak password"""
        data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': '123'
        }
        response = self.client.post('/api/users/register/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class UserLoginTest(APITestCase):
    """Test 7: User Login"""
    
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='TestPass123!'
        )
    
    def test_successful_login(self):
        """Test user can login with valid credentials"""
        data = {
            'email': 'test@example.com',
            'password': 'TestPass123!'
        }
        response = self.client.post('/api/users/login/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
    
    def test_login_wrong_password(self):
        """Test login fails with wrong password"""
        data = {
            'email': 'test@example.com',
            'password': 'WrongPassword!'
        }
        response = self.client.post('/api/users/login/', data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
