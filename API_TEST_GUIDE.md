# Order Status Update - Test Rehberi

## Test Sonuçları
✅ Mevcut siparişler bulundu
✅ Status transition validation çalışıyor
✅ Migration başarılı

## 1. Django Shell ile Test

```bash
python manage.py shell
```

```python
from orders.models import Order
from users.models import CustomUser

# Bir sipariş seç
order = Order.objects.get(id=36)
print(f"Current: {order.status}")
print(f"Valid next: {order.get_valid_next_statuses()}")

# Manager kullanıcısı bul veya oluştur
manager = CustomUser.objects.filter(role='sales_manager').first()

# Status güncelle
order.status = 'in_transit'
order.add_status_log('in_transit', updated_by=manager)
order.save()

# Log'u kontrol et
print(order.status_log)
```

## 2. API ile Test (curl)

### Adım 1: Manager Token Al
```bash
curl -X POST http://localhost:8000/api/users/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "manager_username",
    "password": "manager_password"
  }'
```

### Adım 2: Status Güncelle (GEÇERLİ)
```bash
# processing -> in_transit (GEÇERLİ)
curl -X PATCH http://localhost:8000/api/orders/36/update-status/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"status": "in_transit"}'

# Başarılı response:
# {
#   "message": "Order status updated successfully.",
#   "old_status": "processing",
#   "new_status": "in_transit",
#   "status_log": [...]
# }
```

### Adım 3: Geçersiz Geçiş Dene
```bash
# processing -> delivered (GEÇERSİZ - in_transit atlanıyor)
curl -X PATCH http://localhost:8000/api/orders/36/update-status/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"status": "delivered"}'

# Hata response:
# {
#   "error": "Invalid status transition. From 'processing' you can only transition to: in_transit, cancelled",
#   "current_status": "processing",
#   "valid_next_statuses": ["in_transit", "cancelled"]
# }
```

## 3. Postman ile Test

### Request Setup:
- **Method**: PATCH
- **URL**: `http://localhost:8000/api/orders/36/update-status/`
- **Headers**:
  - `Content-Type`: application/json
  - `Authorization`: Bearer YOUR_TOKEN
- **Body** (raw JSON):
```json
{
  "status": "in_transit"
}
```

## 4. Email Testi

Email gönderimini test etmek için:

```bash
# Django'yu development mode'da email console'a yazdıracak şekilde çalıştır
# settings.py'de:
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Status güncellemesi yaptığında email console'da görünecek
```

## 5. Otomatik Test Script

```bash
# Test scriptini çalıştır
python test_order_status.py
```

Bu script:
- ✅ Mevcut siparişleri listeler
- ✅ Geçerli status transition'ları gösterir
- ✅ Status log yapısını kontrol eder
- ✅ Test için gereken API komutlarını verir

## Status Flow Özeti

```
processing → in_transit → delivered → refund_requested → refunded
    ↓
cancelled
```

### Geçerli Geçişler:
- `processing` → `in_transit` ✅
- `processing` → `cancelled` ✅
- `in_transit` → `delivered` ✅
- `delivered` → `refund_requested` ✅
- `refund_requested` → `refunded` ✅

### Geçersiz Geçişler (hata verir):
- `processing` → `delivered` ❌ (in_transit atlanıyor)
- `in_transit` → `cancelled` ❌ (geri dönemez)
- `delivered` → `processing` ❌ (geri dönemez)

## Manager Kullanıcısı Oluşturma (eğer yoksa)

```python
# Django shell
python manage.py shell

from users.models import CustomUser

manager = CustomUser.objects.create_user(
    username='test_manager',
    email='manager@test.com',
    password='test1234',
    role='sales_manager'
)
print(f"Manager created: {manager.username}")
```
