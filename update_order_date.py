import os
import django
from datetime import timedelta

# Django setup
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'online_store.settings')
django.setup()

from django.utils import timezone
from orders.models import Order

# Update Order #57
ORDER_ID = 64

try:
    order = Order.objects.get(id=ORDER_ID)
    print(f"Found Order #{order.id}")
    print(f"Original Date: {order.created_at}")
    
    # Set date to 40 days ago
    new_date = timezone.now() - timedelta(days=40)
    order.created_at = new_date
    order.save()
    
    print(f"✅ Updated Date: {order.created_at}")
    print("✅ Test condition ready: Order is now older than 30 days.")
    
except Order.DoesNotExist:
    print(f"❌ Order #{ORDER_ID} not found in database.")
