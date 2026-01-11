"""
Demo için kategori ve ürün hazırlama scripti
"""

import os
import django
from datetime import datetime, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'online_store.settings')
django.setup()

from products.models import Product, Category
from users.models import CustomUser
from orders.models import Order

def setup_demo_category():
    """Demo kategorisi oluştur ve 4 ürün ekle"""
    
    # Demo kategorisi oluştur veya al
    demo_category, created = Category.objects.get_or_create(
        name="Demo Products",
        defaults={"description": "Products for final demo presentation"}
    )
    
    if created:
        print("✓ 'Demo Products' kategorisi oluşturuldu")
    else:
        print("✓ 'Demo Products' kategorisi zaten var")
    
    # Mevcut aktif ürünlerden ilk 4'ünü al
    existing_products = Product.objects.filter(is_active=True).exclude(
        category=demo_category
    )[:4]
    
    if len(existing_products) < 4:
        print(f"⚠ Sadece {len(existing_products)} ürün bulundu")
        return
    
    # Ürünleri Demo kategorisine ekle
    demo_products = []
    for i, product in enumerate(existing_products, 1):
        old_category = product.category.name if product.category else "No category"
        product.category = demo_category
        product.save()
        demo_products.append(product)
        print(f"✓ Product {chr(64+i)}: '{product.name}' ({old_category} → Demo Products)")
    
    return demo_products

def check_users():
    """Gerekli kullanıcıları kontrol et"""
    print("\n=== KULLANICILAR ===")
    
    roles_needed = ['customer', 'product_manager', 'sales_manager', 'support_agent']
    
    for role in roles_needed:
        users = CustomUser.objects.filter(role=role)
        if users.exists():
            user = users.first()
            print(f"✓ {role}: {user.username} ({user.email})")
        else:
            print(f"✗ {role}: EKSIK - Oluşturulmalı!")

def check_orders():
    """Siparişleri kontrol et"""
    print("\n=== SİPARİŞLER ===")
    orders = Order.objects.all().order_by('-created_at')[:5]
    
    if orders.exists():
        for order in orders:
            print(f"Order #{order.id}: {order.user.username} - {order.status} - ${order.total_price} - {order.created_at.strftime('%Y-%m-%d')}")
    else:
        print("⚠ Hiç sipariş yok")

if __name__ == '__main__':
    print("=== DEMO HAZIRLIK ===\n")
    setup_demo_category()
    check_users()
    check_orders()
    print("\n=== TAMAMLANDI ===")
