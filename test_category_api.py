"""
Category CRUD API Test Script

Bu script'i çalıştırmak için:
python test_category_api.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'online_store.settings')
django.setup()

from users.models import CustomUser
from products.models import Category, Product
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken


def get_token(user):
    """JWT token oluştur"""
    refresh = RefreshToken.for_user(user)
    return str(refresh.access_token)


def create_test_users():
    """Test kullanıcıları oluştur"""
    print("\n=== Test Kullanıcıları Oluşturuluyor ===")

    # Product Manager
    pm, created = CustomUser.objects.get_or_create(
        username='product_manager_test',
        defaults={
            'email': 'pm@test.com',
            'role': 'product_manager',
            'first_name': 'Product',
            'last_name': 'Manager'
        }
    )
    if created:
        pm.set_password('test123')
        pm.save()
        print("✓ Product Manager oluşturuldu")
    else:
        print("✓ Product Manager zaten mevcut")

    # Customer (yetkisiz kullanıcı)
    customer, created = CustomUser.objects.get_or_create(
        username='customer_test',
        defaults={
            'email': 'customer@test.com',
            'role': 'customer',
            'first_name': 'Test',
            'last_name': 'Customer'
        }
    )
    if created:
        customer.set_password('test123')
        customer.save()
        print("✓ Customer oluşturuldu")
    else:
        print("✓ Customer zaten mevcut")

    return pm, customer


def test_category_crud():
    """Category CRUD işlemlerini test et"""

    # Test kullanıcıları oluştur
    pm, customer = create_test_users()

    # API client
    client = APIClient()

    print("\n" + "="*50)
    print("CATEGORY CRUD API TEST")
    print("="*50)

    # TEST 1: Public GET - Kategori listesi (authentication olmadan)
    print("\n[TEST 1] GET /categories-crud/ (Public - No Auth)")
    response = client.get('/api/categories-crud/', SERVER_NAME='localhost')
    print(f"Status Code: {response.status_code}")
    try:
        print(f"Response: {response.json() if hasattr(response, 'json') else response.data}")
    except:
        print(f"Response: {response.content}")
    assert response.status_code == 200, f"Public GET başarısız! Status: {response.status_code}"
    print("✓ BAŞARILI - Public kategori listesi alındı")

    # TEST 2: POST - Kategori oluşturma (authentication olmadan - FAIL bekleniyor)
    print("\n[TEST 2] POST /categories-crud/ (No Auth - Should FAIL)")
    data = {'name': 'Test Category', 'description': 'Test description'}
    response = client.post('/api/categories-crud/', data, format='json', SERVER_NAME='localhost')
    print(f"Status Code: {response.status_code}")
    try:
        print(f"Response: {response.data}")
    except:
        print(f"Response: {response.content}")
    assert response.status_code == 401, f"Auth olmadan POST engellenemedi! Status: {response.status_code}"
    print("✓ BAŞARILI - Authentication olmadan POST engellendi (401)")

    # TEST 3: POST - Customer ile kategori oluşturma (FAIL bekleniyor)
    print("\n[TEST 3] POST /categories-crud/ (Customer Role - Should FAIL)")
    customer_token = get_token(customer)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {customer_token}')
    response = client.post('/api/categories-crud/', data, format='json', SERVER_NAME='localhost')
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.data}")
    assert response.status_code == 403, f"Customer ile POST engellenemedi! Status: {response.status_code}"
    print("✓ BAŞARILI - Customer rolü ile POST engellendi (403)")

    # TEST 4: POST - Product Manager ile kategori oluşturma (SUCCESS)
    print("\n[TEST 4] POST /categories-crud/ (Product Manager - Should SUCCESS)")
    pm_token = get_token(pm)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {pm_token}')
    data = {'name': 'Test Category API', 'description': 'Created via API test'}
    response = client.post('/api/categories-crud/', data, format='json', SERVER_NAME='localhost')
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.data}")
    assert response.status_code == 201, f"Product Manager ile POST başarısız! Status: {response.status_code}"
    category_id = response.data['id']
    print(f"✓ BAŞARILI - Kategori oluşturuldu (ID: {category_id})")

    # TEST 5: GET - Tek kategori detayı (Public)
    print(f"\n[TEST 5] GET /categories-crud/{category_id}/ (Public)")
    client.credentials()  # Token'ı kaldır
    response = client.get(f'/api/categories-crud/{category_id}/', SERVER_NAME='localhost')
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.data}")
    assert response.status_code == 200, f"Public GET detail başarısız! Status: {response.status_code}"
    print("✓ BAŞARILI - Kategori detayı alındı")

    # TEST 6: PUT - Kategori güncelleme (Product Manager)
    print(f"\n[TEST 6] PUT /categories-crud/{category_id}/ (Product Manager)")
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {pm_token}')
    update_data = {'name': 'Updated Category', 'description': 'Updated description'}
    response = client.put(f'/api/categories-crud/{category_id}/', update_data, format='json', SERVER_NAME='localhost')
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.data}")
    assert response.status_code == 200, f"PUT başarısız! Status: {response.status_code}"
    print("✓ BAŞARILI - Kategori güncellendi")

    # TEST 7: DELETE - Kategori silme (ürün olmadan - SUCCESS)
    print(f"\n[TEST 7] DELETE /categories-crud/{category_id}/ (No Products)")
    response = client.delete(f'/api/categories-crud/{category_id}/', SERVER_NAME='localhost')
    print(f"Status Code: {response.status_code}")
    assert response.status_code == 204, f"DELETE başarısız! Status: {response.status_code}"
    print("✓ BAŞARILI - Kategori silindi")

    # TEST 8: DELETE - Ürünü olan kategori silmeye çalış (FAIL bekleniyor)
    print(f"\n[TEST 8] DELETE category with products (Should FAIL)")

    # Mevcut kategoriyi kullan veya yeni oluştur
    import uuid
    unique_name = f'Category with Products {uuid.uuid4().hex[:8]}'
    category = Category.objects.create(name=unique_name, description='Test')
    Product.objects.create(
        product_id=f'TEST-{uuid.uuid4().hex[:8]}',
        name='Test Product',
        model='Test Model',
        serial_number=f'SN-{uuid.uuid4().hex[:8]}',
        description='Test',
        quantity_in_stock=10,
        price=100,
        warranty_status='Active',
        distributor='Test Dist',
        category=category
    )

    response = client.delete(f'/api/categories-crud/{category.id}/', SERVER_NAME='localhost')
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.data}")
    assert response.status_code == 400, f"Ürünlü kategori silme engellenemedi! Status: {response.status_code}"
    print("✓ BAŞARILI - Ürünlü kategori silme engellendi")

    print("\n" + "="*50)
    print("TÜM TESTLER BAŞARILI! ✓")
    print("="*50)


if __name__ == '__main__':
    try:
        test_category_crud()
    except AssertionError as e:
        print(f"\n❌ TEST HATASI: {e}")
    except Exception as e:
        print(f"\n❌ HATA: {e}")
        import traceback
        traceback.print_exc()
