from django.db import models
from django.conf import settings
from products.models import Product
from decimal import Decimal
from django.utils import timezone


class EncryptedTextField(models.TextField):
    """Custom field that encrypts data at rest."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

    def get_prep_value(self, value):
        """Encrypt before saving to database."""
        if value is None or value == '':
            return value
        try:
            from utils.security import encrypt_data
            return encrypt_data(str(value))
        except Exception:
            return value

    def from_db_value(self, value, expression, connection):
        """Decrypt when reading from database."""
        if value is None or value == '':
            return value
        try:
            from utils.security import decrypt_data
            return decrypt_data(value)
        except Exception:
            return value


class Order(models.Model):
    ORDER_STATUS = (
        ('processing', 'Processing'),
        ('in_transit', 'In Transit'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
        ('refund_requested', 'Refund Requested'),
        ('refunded', 'Refunded'),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='orders')
    status = models.CharField(max_length=20, choices=ORDER_STATUS, default='processing')
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    delivery_address = EncryptedTextField()  # Encrypted for privacy
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # --- YENİ EKLENEN ALANLAR (Fatura ve Ödeme İçin) ---
    payment_confirmed = models.BooleanField(default=False)
    payment_method = models.CharField(max_length=50, default="Credit Card")
    card_last_4 = models.CharField(max_length=4, blank=True)  # Last 4 digits only for security
    invoice_number = models.CharField(max_length=100, unique=True, blank=True)
    transaction_id = EncryptedTextField(blank=True, null=True)  # Encrypted transaction ID
    invoice_file = models.FileField(upload_to='invoices/', null=True, blank=True)
    # ---------------------------------------------------

    # Status log - tracks status changes
    status_log = models.JSONField(default=list, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Order #{self.id} - {self.user.username}"

    @property
    def can_be_cancelled(self):
        return self.status == 'processing'

    @property
    def can_be_refunded(self):
        return self.status == 'delivered'

    def add_status_log(self, new_status, updated_by=None):
        """Add status change to status log"""
        if not isinstance(self.status_log, list):
            self.status_log = []

        self.status_log.append({
            'status': new_status,
            'timestamp': timezone.now().isoformat(),
            'updated_by': updated_by.username if updated_by else 'System'
        })

    def get_valid_next_statuses(self):
        """Get valid next statuses based on current status"""
        transitions = {
            'processing': ['in_transit', 'cancelled'],
            'in_transit': ['delivered'],
            'delivered': ['refund_requested'],
            'cancelled': [],
            'refund_requested': ['refunded'],
            'refunded': []
        }
        return transitions.get(self.status, [])


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.IntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.quantity}x {self.product.name}"

    @property
    def subtotal(self):
        return self.quantity * self.price


class Refund(models.Model):
    REFUND_STATUS = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='refunds')
    order_item = models.ForeignKey(OrderItem, on_delete=models.CASCADE)
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=REFUND_STATUS, default='pending')
    refund_amount = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    processed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='processed_refunds')

    def __str__(self):
        return f"Refund for Order #{self.order.id}"