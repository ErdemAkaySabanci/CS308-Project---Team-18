from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings
from products.models import Product


class CustomUser(AbstractUser):
    """Özel kullanıcı modeli"""
    tax_id = models.CharField(max_length=50, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    home_address = models.TextField(blank=True)

    USER_ROLES = (
        ('customer', 'Customer'),
        ('sales_manager', 'Sales Manager'),
        ('product_manager', 'Product Manager'),
        ('support_agent', 'Support Agent'),
    )
    role = models.CharField(max_length=20, choices=USER_ROLES, default='customer')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.username} ({self.role})"


class WishList(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='wishlist')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'product')
        ordering = ['-added_at']

    def __str__(self):
        return f"{self.user.username} - {self.product.name}"
