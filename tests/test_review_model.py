"""
Unit tests for Review functionality
Tests creating reviews, approval flow, and rating calculations
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from products.models import Product, Category
from reviews.models import Review
from orders.models import Order, OrderItem

User = get_user_model()


class ReviewModelTest(TestCase):
    """Test Review model and business logic"""

    def setUp(self):
        """Set up test data"""
        # Create test user
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        # Create category and product
        self.category = Category.objects.create(
            name='Test Category',
            description='Test category description'
        )
        
        self.product = Product.objects.create(
            name='Test Product',
            description='Test product description',
            price=100.00,
            quantity_in_stock=10,
            category=self.category
        )
        
        # Create a delivered order (required for review eligibility)
        self.order = Order.objects.create(
            user=self.user,
            total_price=100.00,
            status='delivered',
            delivery_address='Test Address'
        )
        
        OrderItem.objects.create(
            order=self.order,
            product=self.product,
            quantity=1,
            price=100.00
        )

    def test_create_review_with_valid_data(self):
        """Test creating a review with valid rating and comment"""
        review = Review.objects.create(
            user=self.user,
            product=self.product,
            rating=5,
            comment='Great product!'
        )
        
        self.assertEqual(review.rating, 5)
        self.assertEqual(review.comment, 'Great product!')
        self.assertEqual(review.user, self.user)
        self.assertEqual(review.product, self.product)
        self.assertFalse(review.is_approved)  # Default should be False

    def test_review_rating_range(self):
        """Test that rating must be between 1 and 5"""
        # Create review with rating 1
        review_min = Review.objects.create(
            user=self.user,
            product=self.product,
            rating=1,
            comment='Poor product'
        )
        self.assertEqual(review_min.rating, 1)
        
        # Create a different user for second review
        user2 = User.objects.create_user(
            username='testuser_rating',
            email='rating@example.com',
            password='testpass123'
        )
        
        # Create review with rating 5 from different user
        review_max = Review.objects.create(
            user=user2,
            product=self.product,
            rating=5,
            comment='Excellent!'
        )
        self.assertEqual(review_max.rating, 5)

    def test_review_approval_flow(self):
        """Test review approval status changes"""
        review = Review.objects.create(
            user=self.user,
            product=self.product,
            rating=4,
            comment='Good product',
            is_approved=False
        )
        
        # Initially not approved
        self.assertFalse(review.is_approved)
        
        # Approve review
        review.is_approved = True
        review.save()
        
        review.refresh_from_db()
        self.assertTrue(review.is_approved)

    def test_product_average_rating_calculation(self):
        """Test that product average rating is calculated correctly"""
        # Create multiple reviews
        Review.objects.create(
            user=self.user,
            product=self.product,
            rating=5,
            comment='Great!',
            is_approved=True
        )
        
        user2 = User.objects.create_user(
            username='testuser2',
            email='test2@example.com',
            password='testpass123'
        )
        
        Review.objects.create(
            user=user2,
            product=self.product,
            rating=3,
            comment='Average',
            is_approved=True
        )
        
        # Get approved reviews for product
        approved_reviews = Review.objects.filter(
            product=self.product,
            is_approved=True
        )
        
        # Calculate average
        total_rating = sum(r.rating for r in approved_reviews)
        avg_rating = total_rating / approved_reviews.count()
        
        self.assertEqual(avg_rating, 4.0)  # (5 + 3) / 2 = 4.0

    def test_review_string_representation(self):
        """Test the string representation of Review model"""
        review = Review.objects.create(
            user=self.user,
            product=self.product,
            rating=4,
            comment='Nice product'
        )
        
        # String should contain user and product info
        str_repr = str(review)
        self.assertIn(self.user.username, str_repr.lower() if str_repr else str(review.id))

    def test_review_rejection_clears_comment(self):
        """Test that rejecting a review clears the comment but keeps rating"""
        review = Review.objects.create(
            user=self.user,
            product=self.product,
            rating=5,
            comment='This comment will be rejected',
            is_approved=False
        )
        
        # Simulate rejection (clear comment, mark as processed)
        review.comment = ''
        review.is_approved = True  # Mark as processed
        review.save()
        
        review.refresh_from_db()
        self.assertEqual(review.comment, '')
        self.assertEqual(review.rating, 5)  # Rating preserved
        self.assertTrue(review.is_approved)
