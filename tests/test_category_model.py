"""
Unit Test: Category Model
Tests the Category model creation and string representation.
"""

from django.test import TestCase
from products.models import Category


class CategoryModelTest(TestCase):
    """Test Category model functionality"""

    def test_category_creation(self):
        """Test category is created with correct name"""
        category = Category.objects.create(name="Electronics")
        self.assertEqual(category.name, "Electronics")
        self.assertIsNotNone(category.id)

    def test_category_str_representation(self):
        """Test category string representation returns name"""
        category = Category.objects.create(name="Sports Equipment")
        self.assertEqual(str(category), "Sports Equipment")

    def test_category_with_description(self):
        """Test category with description"""
        category = Category.objects.create(
            name="Clothing",
            description="All types of sports clothing"
        )
        self.assertEqual(category.description, "All types of sports clothing")

    def test_category_unique_name(self):
        """Test that category names must be unique"""
        Category.objects.create(name="Unique Category")
        with self.assertRaises(Exception):
            Category.objects.create(name="Unique Category")

    def test_category_timestamps(self):
        """Test that created_at and updated_at are set"""
        category = Category.objects.create(name="Timestamp Test")
        self.assertIsNotNone(category.created_at)
        self.assertIsNotNone(category.updated_at)
