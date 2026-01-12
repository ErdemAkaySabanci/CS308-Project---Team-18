"""
Unit Test: Order Model
Tests the Order model functionality including status transitions.
"""

from django.test import TestCase
from decimal import Decimal
from users.models import CustomUser
from orders.models import Order


class OrderModelTest(TestCase):
    """Test Order model functionality"""

    def setUp(self):
        """Set up test data"""
        self.user = CustomUser.objects.create_user(
            username="orderuser",
            email="order@test.com",
            password="testpass123"
        )

    def test_create_order(self):
        """Test creating an order"""
        order = Order.objects.create(
            user=self.user,
            total_price=Decimal("199.99"),
            delivery_address="123 Test Street",
            invoice_number="INV-TEST-001"
        )
        self.assertEqual(order.user, self.user)
        self.assertEqual(order.total_price, Decimal("199.99"))

    def test_order_default_status(self):
        """Test order default status is processing"""
        order = Order.objects.create(
            user=self.user,
            total_price=Decimal("100.00"),
            delivery_address="Test Address",
            invoice_number="INV-TEST-002"
        )
        self.assertEqual(order.status, "processing")

    def test_order_str_representation(self):
        """Test order string representation"""
        order = Order.objects.create(
            user=self.user,
            total_price=Decimal("50.00"),
            delivery_address="Test Address",
            invoice_number="INV-TEST-003"
        )
        expected_str = f"Order #{order.id} - {self.user.username}"
        self.assertEqual(str(order), expected_str)

    def test_order_can_be_cancelled_when_processing(self):
        """Test order can be cancelled when status is processing"""
        order = Order.objects.create(
            user=self.user,
            total_price=Decimal("75.00"),
            delivery_address="Test Address",
            status="processing",
            invoice_number="INV-TEST-004"
        )
        self.assertTrue(order.can_be_cancelled)

    def test_order_cannot_be_cancelled_when_delivered(self):
        """Test order cannot be cancelled when status is delivered"""
        order = Order.objects.create(
            user=self.user,
            total_price=Decimal("75.00"),
            delivery_address="Test Address",
            status="delivered",
            invoice_number="INV-TEST-005"
        )
        self.assertFalse(order.can_be_cancelled)

    def test_order_can_be_refunded_when_delivered(self):
        """Test order can be refunded when status is delivered"""
        order = Order.objects.create(
            user=self.user,
            total_price=Decimal("200.00"),
            delivery_address="Test Address",
            status="delivered",
            invoice_number="INV-TEST-006"
        )
        self.assertTrue(order.can_be_refunded)

    def test_order_cannot_be_refunded_when_processing(self):
        """Test order cannot be refunded when status is processing"""
        order = Order.objects.create(
            user=self.user,
            total_price=Decimal("200.00"),
            delivery_address="Test Address",
            status="processing",
            invoice_number="INV-TEST-007"
        )
        self.assertFalse(order.can_be_refunded)

    def test_get_valid_next_statuses_from_processing(self):
        """Test valid next statuses from processing"""
        order = Order.objects.create(
            user=self.user,
            total_price=Decimal("100.00"),
            delivery_address="Test Address",
            status="processing",
            invoice_number="INV-TEST-008"
        )
        valid_statuses = order.get_valid_next_statuses()
        self.assertIn("in_transit", valid_statuses)
        self.assertIn("cancelled", valid_statuses)
