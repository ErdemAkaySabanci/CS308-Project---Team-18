#!/usr/bin/env python
"""
Test script for order status update functionality
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'online_store.settings')
django.setup()

from orders.models import Order
from users.models import CustomUser
from django.utils import timezone

def test_order_status_transitions():
    print("=" * 60)
    print("TESTING ORDER STATUS UPDATE FUNCTIONALITY")
    print("=" * 60)

    # 1. Liste mevcut siparişleri
    print("\n1. Mevcut Siparişler:")
    print("-" * 60)
    orders = Order.objects.all()[:5]

    if not orders:
        print("❌ Hiç sipariş yok! Önce bir sipariş oluşturun.")
        return

    for order in orders:
        print(f"Order #{order.id} - Invoice: {order.invoice_number}")
        print(f"  User: {order.user.username}")
        print(f"  Current Status: {order.status}")
        print(f"  Created: {order.created_at}")
        print(f"  Status Log Entries: {len(order.status_log) if isinstance(order.status_log, list) else 0}")
        print()

    # 2. İlk siparişi al
    test_order = orders.first()
    print(f"\n2. Test Siparişi: Order #{test_order.id}")
    print("-" * 60)
    print(f"Current Status: {test_order.status}")
    print(f"Valid Next Statuses: {test_order.get_valid_next_statuses()}")

    # 3. Status log'u göster
    print(f"\n3. Status Log History:")
    print("-" * 60)
    if test_order.status_log:
        for idx, log_entry in enumerate(test_order.status_log, 1):
            print(f"{idx}. Status: {log_entry['status']}")
            print(f"   Time: {log_entry['timestamp']}")
            print(f"   Updated By: {log_entry['updated_by']}")
    else:
        print("Status log boş (eski sipariş - migration öncesi)")

    # 4. Test durum değişikliği (sadece gösterim, gerçek değişiklik yapmıyor)
    print(f"\n4. Test Senaryosu:")
    print("-" * 60)

    valid_transitions = test_order.get_valid_next_statuses()
    if valid_transitions:
        next_status = valid_transitions[0]
        print(f"✓ '{test_order.status}' -> '{next_status}' geçişi GEÇERLİ")
        print(f"\nAPI ile test etmek için:")
        print(f"PATCH /api/orders/{test_order.id}/update-status/")
        print(f'Body: {{"status": "{next_status}"}}')
        print(f"Header: Authorization: Bearer <token>")

        # Geçersiz bir geçiş örneği
        all_statuses = [s[0] for s in Order.ORDER_STATUS]
        invalid_statuses = [s for s in all_statuses if s not in valid_transitions and s != test_order.status]
        if invalid_statuses:
            invalid_status = invalid_statuses[0]
            print(f"\n✗ '{test_order.status}' -> '{invalid_status}' geçişi GEÇERSİZ")
            print(f"Bu geçiş hata döndürecektir.")
    else:
        print(f"⚠ Status '{test_order.status}' için başka geçiş yok (final state)")

    print("\n" + "=" * 60)
    print("TEST TAMAMLANDI")
    print("=" * 60)


def test_status_log_manually():
    """Manuel olarak status log test et"""
    print("\n5. Manuel Status Log Testi:")
    print("-" * 60)

    # Test için bir sipariş bul
    test_order = Order.objects.filter(status='processing').first()

    if not test_order:
        print("⚠ 'processing' durumunda sipariş bulunamadı")
        return

    print(f"Test Order: #{test_order.id}")
    print(f"Current Status: {test_order.status}")

    # Bir manager kullanıcısı bul
    manager = CustomUser.objects.filter(role__in=['sales_manager', 'product_manager']).first()

    if not manager:
        print("⚠ Manager kullanıcısı bulunamadı. Manuel test yapılamıyor.")
        return

    # Status log ekle (gerçek değişiklik yapmadan test)
    print(f"\n✓ add_status_log() methodu çalışıyor")
    old_log = test_order.status_log.copy() if test_order.status_log else []
    test_order.add_status_log('in_transit', updated_by=manager)
    print(f"Log entry eklendi: {test_order.status_log[-1]}")

    # Geri al (test için)
    test_order.status_log = old_log
    print("(Test için geri alındı - database'e kaydedilmedi)")


if __name__ == "__main__":
    test_order_status_transitions()
    test_status_log_manually()
