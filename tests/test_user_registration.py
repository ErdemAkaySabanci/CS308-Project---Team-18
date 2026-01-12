"""
Unit Test: User Registration API
Tests the user registration endpoint.
"""

from rest_framework.test import APITestCase
from rest_framework import status
from users.models import CustomUser


class UserRegistrationAPITest(APITestCase):
    """Test User Registration API functionality"""

    def test_successful_registration(self):
        """Test successful user registration"""
        data = {
            'username': 'newuser',
            'email': 'newuser@test.com',
            'password': 'StrongPass123!',
            'password2': 'StrongPass123!',
            'first_name': 'Test',
            'last_name': 'User'
        }
        response = self.client.post('/api/users/register/', data)
        self.assertIn(response.status_code, [status.HTTP_201_CREATED, status.HTTP_200_OK])

    def test_registration_creates_user_in_database(self):
        """Test that registration creates user in database"""
        initial_count = CustomUser.objects.count()
        data = {
            'username': 'dbuser',
            'email': 'dbuser@test.com',
            'password': 'StrongPass123!',
            'password2': 'StrongPass123!',
            'first_name': 'DB',
            'last_name': 'User'
        }
        self.client.post('/api/users/register/', data)
        self.assertEqual(CustomUser.objects.count(), initial_count + 1)

    def test_registration_with_missing_username(self):
        """Test registration fails without username"""
        data = {
            'email': 'nouser@test.com',
            'password': 'StrongPass123!',
            'password2': 'StrongPass123!'
        }
        response = self.client.post('/api/users/register/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_registration_with_duplicate_username(self):
        """Test registration fails with duplicate username"""
        CustomUser.objects.create_user(
            username='existinguser',
            email='existing@test.com',
            password='testpass123'
        )
        
        data = {
            'username': 'existinguser',
            'email': 'new@test.com',
            'password': 'StrongPass123!',
            'password2': 'StrongPass123!'
        }
        response = self.client.post('/api/users/register/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_registration_with_valid_email(self):
        """Test registration with valid email format"""
        data = {
            'username': 'emailuser',
            'email': 'valid@test.com',
            'password': 'StrongPass123!',
            'password2': 'StrongPass123!',
        }
        response = self.client.post('/api/users/register/', data)
        self.assertIn(response.status_code, [status.HTTP_201_CREATED, status.HTTP_200_OK])
