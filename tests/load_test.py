"""
Eşzamanlı Kullanıcı Testi ve Race Condition Testi
Bu script birden fazla kullanıcının aynı anda sipariş oluşturmasını simüle eder
"""

import os
import sys
import django
import threading
import time
from decimal import Decimal

# Django setup
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'online_store.settings')
django.setup()

# Allow testserver for tests
from django.conf import settings
if 'testserver' not in settings.ALLOWED_HOSTS:
    settings.ALLOWED_HOSTS.append('testserver')

# Configure SQLite for concurrent access
if 'sqlite' in settings.DATABASES['default']['ENGINE']:
    settings.DATABASES['default']['OPTIONS'] = {
        'timeout': 20,  # 20 second timeout for concurrent writes
    }

from users.models import CustomUser
from products.models import Product, Category
from cart.models import Cart, CartItem
from orders.models import Order
from django.db import transaction


class ConcurrentOrderTest:
    """Eşzamanlı sipariş testi için test class'ı"""

    def __init__(self, num_users=10, product_stock=5):
        self.num_users = num_users
        self.product_stock = product_stock
        self.results = {
            'success': 0,
            'failed': 0,
            'errors': []
        }
        self.lock = threading.Lock()

    def setup_test_data(self):
        """Test için gerekli verileri hazırla"""
        print("🔧 Test verileri hazırlanıyor...")

        # Test kategorisi oluştur
        category, _ = Category.objects.get_or_create(
            name="Load Test Category",
            defaults={'description': 'Test için oluşturuldu'}
        )

        # Test ürünü oluştur (sınırlı stok ile)
        self.product = Product.objects.create(
            product_id=f"LOAD_TEST_{int(time.time())}",
            name=f"Load Test Product {int(time.time())}",
            model="Test Model",
            serial_number=f"SN_{int(time.time())}",
            description="Race condition test için ürün",
            quantity_in_stock=self.product_stock,
            price=Decimal('100.00'),
            warranty_status="1 Year",
            distributor="Test Distributor",
            category=category,
            is_active=True
        )

        print(f"✅ Ürün oluşturuldu: {self.product.name}")
        print(f"📦 Başlangıç stoku: {self.product.quantity_in_stock}")

        # Test kullanıcıları oluştur
        self.users = []
        for i in range(self.num_users):
            username = f"loadtest_user_{int(time.time())}_{i}"
            user, created = CustomUser.objects.get_or_create(
                username=username,
                defaults={
                    'email': f'{username}@test.com',
                    'first_name': f'Test{i}',
                    'last_name': 'User',
                    'role': 'customer'
                }
            )
            if created:
                user.set_password('testpass123')
                user.home_address = f"Test Address {i}"
                user.save()

            # Her kullanıcı için sepet oluştur
            cart, _ = Cart.objects.get_or_create(user=user)
            cart.items.all().delete()  # Eski item'ları temizle

            # Sepete test ürünü ekle (1 adet)
            CartItem.objects.create(
                cart=cart,
                product=self.product,
                quantity=1
            )

            self.users.append(user)

        print(f"✅ {len(self.users)} kullanıcı oluşturuldu ve sepetleri hazırlandı\n")

    def create_order(self, user, user_index):
        """Tek bir kullanıcı için sipariş oluştur"""
        try:
            from rest_framework.test import APIClient

            client = APIClient()
            client.force_authenticate(user=user)

            # Checkout endpoint'ine istek gönder (JSON format kullan)
            response = client.post('/api/orders/checkout/', {
                'payment': {
                    'card_number': '1234567890123456',
                    'cvv': '123',
                    'expiry': '12/25'
                }
            }, format='json')

            with self.lock:
                if response.status_code == 201:
                    self.results['success'] += 1
                    print(f"✅ Kullanıcı {user_index}: Sipariş başarılı")
                else:
                    self.results['failed'] += 1
                    error_msg = response.data.get('error', 'Bilinmeyen hata')
                    print(f"❌ Kullanıcı {user_index}: {error_msg}")
                    self.results['errors'].append({
                        'user': user.username,
                        'status': response.status_code,
                        'error': error_msg
                    })

        except Exception as e:
            with self.lock:
                self.results['failed'] += 1
                self.results['errors'].append({
                    'user': user.username,
                    'error': str(e)
                })
                print(f"❌ Kullanıcı {user_index}: Exception - {str(e)}")

    def run_concurrent_test(self):
        """Eşzamanlı sipariş testini çalıştır"""
        print(f"\n🚀 Eşzamanlı test başlıyor...")
        print(f"👥 Kullanıcı sayısı: {self.num_users}")
        print(f"📦 Ürün stoğu: {self.product_stock}")
        print(f"⚠️  Beklenen sonuç: İlk {self.product_stock} sipariş başarılı, kalanlar stok hatası almalı\n")
        print(f"ℹ️  Not: SQLite concurrent writes'da sınırlı, bazı database lock hataları beklenebilir\n")

        threads = []
        start_time = time.time()

        # Tüm kullanıcılar için thread'leri oluştur
        for i, user in enumerate(self.users):
            thread = threading.Thread(
                target=self.create_order,
                args=(user, i)
            )
            threads.append(thread)

        # Thread'leri küçük delay'lerle başlat (SQLite için)
        # Gerçek race condition hala var, ama SQLite lock contention'ını azaltır
        for i, thread in enumerate(threads):
            thread.start()
            if i < len(threads) - 1:  # Son thread için delay yok
                time.sleep(0.01)  # 10ms delay

        # Tüm thread'lerin bitmesini bekle
        for thread in threads:
            thread.join()

        end_time = time.time()

        # Ürünün son stok durumunu kontrol et
        self.product.refresh_from_db()

        # Test sonuçlarını göster
        self.print_results(end_time - start_time)

    def print_results(self, duration):
        """Test sonuçlarını göster"""
        print("\n" + "="*70)
        print("📊 TEST SONUÇLARI")
        print("="*70)
        print(f"⏱️  Süre: {duration:.2f} saniye")
        print(f"✅ Başarılı siparişler: {self.results['success']}")
        print(f"❌ Başarısız siparişler: {self.results['failed']}")
        print(f"📦 Kalan stok: {self.product.quantity_in_stock}")
        print(f"🔢 Ürün versiyonu: {self.product.version}")

        # Stok tutarlılık kontrolü
        expected_stock = self.product_stock - self.results['success']
        if self.product.quantity_in_stock == expected_stock:
            print(f"\n✅ STOK TUTARLILIĞI: BAŞARILI")
            print(f"   Beklenen stok: {expected_stock}")
            print(f"   Gerçek stok: {self.product.quantity_in_stock}")
        else:
            print(f"\n❌ STOK TUTARSIZLIĞI TESPİT EDİLDİ!")
            print(f"   Beklenen stok: {expected_stock}")
            print(f"   Gerçek stok: {self.product.quantity_in_stock}")
            print(f"   Fark: {abs(expected_stock - self.product.quantity_in_stock)}")

        # Race condition testi
        if self.results['success'] <= self.product_stock:
            print(f"\n✅ RACE CONDITION KORUMASINA: BAŞARILI")
            print(f"   Maksimum {self.product_stock} sipariş bekleniyordu")
            print(f"   {self.results['success']} sipariş oluşturuldu")
        else:
            print(f"\n❌ RACE CONDITION SORUNU TESPİT EDİLDİ!")
            print(f"   Maksimum {self.product_stock} sipariş bekleniyordu")
            print(f"   {self.results['success']} sipariş oluşturuldu (FAZLA!)")

        # Hata detayları
        if self.results['errors']:
            print(f"\n📋 Hata Detayları:")
            error_types = {}
            for error in self.results['errors']:
                error_msg = error.get('error', 'Bilinmeyen')
                if error_msg not in error_types:
                    error_types[error_msg] = 0
                error_types[error_msg] += 1

            for error_msg, count in error_types.items():
                print(f"   - {error_msg}: {count} kez")

        print("="*70 + "\n")

    def cleanup(self):
        """Test verilerini temizle"""
        print("🧹 Test verileri temizleniyor...")

        # Kullanıcıları ve ilgili verileri sil
        for user in self.users:
            Cart.objects.filter(user=user).delete()
            Order.objects.filter(user=user).delete()
            user.delete()

        # Test ürününü sil
        if hasattr(self, 'product'):
            self.product.delete()

        print("✅ Temizlik tamamlandı\n")


def main():
    """Ana test fonksiyonu"""
    print("\n" + "="*70)
    print("🧪 EŞZAMANLI KULLANICI VE RACE CONDITION TESTİ")
    print("="*70 + "\n")
    print("⚠️  SQLite Uyarısı: SQLite concurrent writes'da sınırlıdır.")
    print("    Production'da PostgreSQL/MySQL kullanılması önerilir.\n")
    print("    Bu test küçük senaryolarla race condition korumasını doğrular.\n")

    # Test senaryoları (SQLite için küçültülmüş)
    scenarios = [
        {
            'name': 'Senaryo 1: 3 kullanıcı, 3 stok (Herkes başarılı olmalı)',
            'num_users': 3,
            'product_stock': 3
        },
        {
            'name': 'Senaryo 2: 5 kullanıcı, 2 stok (İlk 2 başarılı, 3 stok hatası)',
            'num_users': 5,
            'product_stock': 2
        },
        {
            'name': 'Senaryo 3: 4 kullanıcı, 1 stok (İlk 1 başarılı, 3 stok hatası)',
            'num_users': 4,
            'product_stock': 1
        }
    ]

    for i, scenario in enumerate(scenarios, 1):
        print(f"\n{'='*70}")
        print(f"📋 {scenario['name']}")
        print(f"{'='*70}\n")

        test = ConcurrentOrderTest(
            num_users=scenario['num_users'],
            product_stock=scenario['product_stock']
        )

        try:
            test.setup_test_data()
            test.run_concurrent_test()
        finally:
            test.cleanup()

        if i < len(scenarios):
            print("\n⏸️  5 saniye bekleniyor...\n")
            time.sleep(5)

    print("="*70)
    print("✅ TÜM TESTLER TAMAMLANDI")
    print("="*70 + "\n")


if __name__ == '__main__':
    main()
