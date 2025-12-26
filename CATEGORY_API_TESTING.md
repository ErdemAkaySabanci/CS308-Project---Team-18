# Category CRUD API - Test Kılavuzu

## API Endpoints

```
GET    /api/categories-crud/           - Tüm kategorileri listele (public)
GET    /api/categories-crud/<id>/      - Tek kategori detayı (public)
POST   /api/categories-crud/           - Yeni kategori oluştur (Product Manager only)
PUT    /api/categories-crud/<id>/      - Kategori güncelle (Product Manager only)
PATCH  /api/categories-crud/<id>/      - Kategori kısmi güncelle (Product Manager only)
DELETE /api/categories-crud/<id>/      - Kategori sil (Product Manager only)
```

---

## Yöntem 1: Test Script ile (ÖNERİLEN)

Hazır test script'i çalıştırın:

```bash
python test_category_api.py
```

Bu script otomatik olarak:
- Test kullanıcıları oluşturur (Product Manager ve Customer)
- Tüm CRUD işlemlerini test eder
- Role kontrollerini doğrular
- Ürünlü kategori silme engelini test eder

---

## Yöntem 2: cURL ile Test

### 1. JWT Token Alma (Login)

Önce Product Manager kullanıcısı ile login olun:

```bash
# Login - Token al
curl -X POST http://localhost:8000/api/users/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "product_manager_test",
    "password": "test123"
  }'
```

Response:
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Token'ı kopyalayın ve aşağıdaki komutlarda <YOUR_TOKEN> yerine yapıştırın!**

### 2. GET - Kategori Listesi (Public - Token gerekmez)

```bash
curl -X GET http://localhost:8000/api/categories-crud/
```

### 3. POST - Yeni Kategori Oluştur (Product Manager)

```bash
curl -X POST http://localhost:8000/api/categories-crud/ \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Category",
    "description": "Test description"
  }'
```

### 4. GET - Tek Kategori Detayı (Public)

```bash
curl -X GET http://localhost:8000/api/categories-crud/1/
```

### 5. PUT - Kategori Güncelle (Product Manager)

```bash
curl -X PUT http://localhost:8000/api/categories-crud/1/ \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Category",
    "description": "Updated description"
  }'
```

### 6. PATCH - Kısmi Güncelleme (Product Manager)

```bash
curl -X PATCH http://localhost:8000/api/categories-crud/1/ \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Only description updated"
  }'
```

### 7. DELETE - Kategori Sil (Product Manager)

```bash
curl -X DELETE http://localhost:8000/api/categories-crud/1/ \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

---

## Yöntem 3: Postman / Thunder Client ile Test

### Adım 1: Token Alma

1. **Request Type:** POST
2. **URL:** `http://localhost:8000/api/users/login/`
3. **Headers:**
   - Content-Type: application/json
4. **Body (raw JSON):**
   ```json
   {
     "username": "product_manager_test",
     "password": "test123"
   }
   ```
5. **Send** butonuna tıklayın
6. Response'dan **access** token'ı kopyalayın

### Adım 2: Kategori Oluşturma

1. **Request Type:** POST
2. **URL:** `http://localhost:8000/api/categories-crud/`
3. **Headers:**
   - Authorization: Bearer <YOUR_TOKEN>
   - Content-Type: application/json
4. **Body (raw JSON):**
   ```json
   {
     "name": "New Category",
     "description": "Category description"
   }
   ```
5. **Send** butonuna tıklayın

### Adım 3: Kategori Listesi (Token gerektirmez)

1. **Request Type:** GET
2. **URL:** `http://localhost:8000/api/categories-crud/`
3. **Send** butonuna tıklayın

### Adım 4: Kategori Güncelleme

1. **Request Type:** PUT veya PATCH
2. **URL:** `http://localhost:8000/api/categories-crud/<category_id>/`
3. **Headers:**
   - Authorization: Bearer <YOUR_TOKEN>
   - Content-Type: application/json
4. **Body (raw JSON):**
   ```json
   {
     "name": "Updated Name",
     "description": "Updated Description"
   }
   ```

### Adım 5: Kategori Silme

1. **Request Type:** DELETE
2. **URL:** `http://localhost:8000/api/categories-crud/<category_id>/`
3. **Headers:**
   - Authorization: Bearer <YOUR_TOKEN>

---

## Yöntem 4: Django Shell ile Manuel Test

```bash
python manage.py shell
```

```python
from users.models import CustomUser
from products.models import Category
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

# API Client oluştur
client = APIClient()

# Product Manager kullanıcısı al
pm = CustomUser.objects.get(username='product_manager_test')

# Token oluştur
refresh = RefreshToken.for_user(pm)
token = str(refresh.access_token)

# Token ile authentication yap
client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

# Kategori oluştur
response = client.post('/api/categories-crud/', {
    'name': 'Shell Test Category',
    'description': 'Created from Django shell'
}, format='json', SERVER_NAME='localhost')

print(f"Status: {response.status_code}")
print(f"Data: {response.data}")

# Kategorileri listele
response = client.get('/api/categories-crud/', SERVER_NAME='localhost')
print(f"Categories: {response.data}")
```

---

## Test Kullanıcıları

Test script ile otomatik oluşturulan kullanıcılar:

### Product Manager (Yetkili)
- **Username:** product_manager_test
- **Password:** test123
- **Role:** product_manager
- **İzinler:** Kategori oluşturma, güncelleme, silme

### Customer (Yetkisiz)
- **Username:** customer_test
- **Password:** test123
- **Role:** customer
- **İzinler:** Sadece kategori listesini görme

---

## Beklenen Davranışlar

### ✅ Başarılı Senaryolar

1. **Public GET** - Herkes kategori listesini görebilir (auth gerekmez)
2. **Public GET Detail** - Herkes kategori detayını görebilir
3. **Product Manager POST** - Product Manager kategori oluşturabilir
4. **Product Manager PUT/PATCH** - Product Manager kategori güncelleyebilir
5. **Product Manager DELETE** - Product Manager boş kategoriyi silebilir

### ❌ Hata Senaryoları

1. **POST without Auth** → 401 Unauthorized
2. **Customer POST** → 403 Forbidden ("Permission denied. Only Product Managers can perform this action.")
3. **DELETE category with products** → 400 Bad Request ("Cannot delete category. It has X product(s).")

---

## Örnek Responses

### Başarılı Kategori Oluşturma (201)
```json
{
  "id": 8,
  "name": "Test Category",
  "description": "Test description",
  "product_count": 0,
  "created_at": "2025-12-26T10:15:33.720331Z"
}
```

### Role Hatası (403)
```json
{
  "error": "Permission denied. Only Product Managers can perform this action."
}
```

### Ürünlü Kategori Silme Hatası (400)
```json
{
  "error": "Cannot delete category. It has 3 product(s).",
  "detail": "Please delete or reassign all products before deleting this category."
}
```

---

## Sunucuyu Çalıştırma

Test yapmadan önce Django development server'ı başlatın:

```bash
python manage.py runserver
```

Server çalıştıktan sonra yukarıdaki test yöntemlerinden birini kullanabilirsiniz.
