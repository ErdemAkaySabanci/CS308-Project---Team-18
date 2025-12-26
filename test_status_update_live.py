#!/usr/bin/env python
"""
Interactive test script for order status updates
Gerçek database'de status güncelleme yapar
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'online_store.settings')
django.setup()

from orders.models import Order
from users.models import CustomUser
from orders.views import send_status_update_email

def main():
    print("\n" + "=" * 70)
    print("ORDER STATUS UPDATE - INTERACTIVE TEST")
    print("=" * 70)

    # 1. Processing durumundaki siparişleri bul
    orders = Order.objects.filter(status='processing')[:5]

    if not orders:
        print("\n❌ 'processing' durumunda sipariş yok!")
        print("Farklı durumları dene:")
        for status_code, status_name in Order.ORDER_STATUS:
            count = Order.objects.filter(status=status_code).count()
            print(f"  - {status_code}: {count} sipariş")
        return

    print(f"\n✅ {orders.count()} adet 'processing' siparişi bulundu\n")

    # 2. İlk siparişi seç
    order = orders.first()
    print("Seçilen Sipariş:")
    print("-" * 70)
    print(f"Order ID: #{order.id}")
    print(f"Invoice: {order.invoice_number}")
    print(f"User: {order.user.username} ({order.user.email})")
    print(f"Current Status: {order.status}")
    print(f"Total: {order.total_price} TL")
    print(f"Created: {order.created_at.strftime('%Y-%m-%d %H:%M')}")

    # 3. Geçerli transition'ları göster
    valid_transitions = order.get_valid_next_statuses()
    print(f"\n✓ Geçerli Geçişler: {', '.join(valid_transitions)}")

    # 4. Manager bul veya oluştur
    manager = CustomUser.objects.filter(role='sales_manager').first()

    if not manager:
        print("\n⚠ Sales Manager bulunamadı. Oluşturuluyor...")
        manager = CustomUser.objects.create_user(
            username='test_sales_manager',
            email='manager@test.com',
            password='test1234',
            role='sales_manager'
        )
        print(f"✓ Manager oluşturuldu: {manager.username}")

    # 5. Test yapılacak değişikliği sor
    print("\n" + "=" * 70)
    print("TEST SEÇENEKLERİ:")
    print("=" * 70)
    print("1. processing → in_transit (GEÇERLİ)")
    print("2. processing → delivered (GEÇERSİZ - hata vermeli)")
    print("3. processing → cancelled (GEÇERLİ)")
    print("4. Sadece status log ekle (durumu değiştirme)")
    print("5. Email testi (email gönder ama değişiklik yapma)")
    print("0. İptal")

    try:
        choice = input("\nSeçiminiz (0-5): ").strip()

        if choice == "0":
            print("\n❌ İptal edildi.")
            return

        elif choice == "1":
            print("\n📝 'processing' → 'in_transit' güncelleniyor...")
            old_status = order.status
            order.status = 'in_transit'
            order.add_status_log('in_transit', updated_by=manager)
            order.save()
            print(f"✅ Status güncellendi: {old_status} → {order.status}")

            # Email gönder
            print("📧 Email gönderiliyor...")
            send_status_update_email(order, 'in_transit')
            print("✅ Email gönderildi (console'u kontrol edin)")

            # Log'u göster
            print("\n📊 Status Log:")
            for idx, log in enumerate(order.status_log, 1):
                print(f"  {idx}. {log['status']} - {log['timestamp']} by {log['updated_by']}")

        elif choice == "2":
            print("\n⚠ GEÇERSİZ geçiş deneniyor: 'processing' → 'delivered'")
            print("Bu normalde API'de hata verir. Burada gösterim amaçlı:")

            if 'delivered' in valid_transitions:
                print("❌ BUG! Bu geçiş geçerli olmamalıydı!")
            else:
                print(f"✅ Doğru! Geçiş geçersiz.")
                print(f"   İzin verilen: {valid_transitions}")
                print(f"   Denenen: delivered")

        elif choice == "3":
            print("\n📝 'processing' → 'cancelled' güncelleniyor...")
            old_status = order.status
            order.status = 'cancelled'
            order.add_status_log('cancelled', updated_by=manager)
            order.save()
            print(f"✅ Status güncellendi: {old_status} → {order.status}")

            # Email gönder
            print("📧 Email gönderiliyor...")
            send_status_update_email(order, 'cancelled')
            print("✅ Email gönderildi")

        elif choice == "4":
            print("\n📝 Sadece status log ekleniyor (durum değişmiyor)...")
            order.add_status_log(order.status, updated_by=manager)
            order.save()
            print("✅ Log eklendi")

            print("\n📊 Status Log:")
            for idx, log in enumerate(order.status_log, 1):
                print(f"  {idx}. {log['status']} - {log['timestamp']} by {log['updated_by']}")

        elif choice == "5":
            print("\n📧 Email testi (değişiklik yapılmıyor)...")
            send_status_update_email(order, order.status)
            print("✅ Email gönderildi (console'u kontrol edin)")

        else:
            print("\n❌ Geçersiz seçim!")
            return

        # Son durumu göster
        order.refresh_from_db()
        print("\n" + "=" * 70)
        print("SON DURUM:")
        print("-" * 70)
        print(f"Order ID: #{order.id}")
        print(f"Status: {order.status}")
        print(f"Status Log Entries: {len(order.status_log)}")
        print(f"Valid Next Transitions: {order.get_valid_next_statuses()}")
        print("=" * 70)

    except KeyboardInterrupt:
        print("\n\n❌ İptal edildi.")
    except Exception as e:
        print(f"\n❌ HATA: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
