#!/usr/bin/env python
"""
Cart API Test Script

Bu script'i çalıştırmadan önce:
1. Sunucuyu başlatın: python manage.py runserver
2. Bir terminal daha açıp bu script'i çalıştırın: python test_cart_api.py
"""

import requests
import json

BASE_URL = "http://localhost:8000/api"

# Renkli output için
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    YELLOW = '\033[93m'
    END = '\033[0m'

def print_response(title, response):
    print(f"\n{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.YELLOW}{title}{Colors.END}")
    print(f"Status Code: {response.status_code}")
    try:
        print(f"Response:\n{json.dumps(response.json(), indent=2)}")
    except:
        print(f"Response: {response.text}")
    print(f"{Colors.BLUE}{'='*60}{Colors.END}")

def test_cart_api():
    print(f"{Colors.GREEN}🧪 Cart API Test Başlıyor...{Colors.END}\n")

    # 1. Kullanıcı bilgileri (kendinize göre güncelleyin)
    print("📝 Lütfen test için bilgilerinizi girin:")
    email = input("Email: ").strip() or "test@example.com"
    password = input("Password: ").strip() or "testpass123"

    # 2. Login - JWT Token Al
    print(f"\n{Colors.YELLOW}1️⃣  Login işlemi yapılıyor...{Colors.END}")
    login_data = {
        "email": email,
        "password": password
    }

    response = requests.post(f"{BASE_URL}/users/login/", json=login_data)
    print_response("LOGIN", response)

    if response.status_code != 200:
        print(f"{Colors.RED}❌ Login başarısız! Önce bir kullanıcı oluşturun.{Colors.END}")
        print(f"\nYeni kullanıcı oluşturmak için:")
        print(f"python manage.py createsuperuser")
        return

    token = response.json().get('access')
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }

    # 3. Ürünleri listele
    print(f"\n{Colors.YELLOW}2️⃣  Ürünler listeleniyor...{Colors.END}")
    response = requests.get(f"{BASE_URL}/products/")
    print_response("PRODUCTS LIST", response)

    products = response.json().get('results', [])
    if not products:
        print(f"{Colors.RED}❌ Ürün bulunamadı! Önce ürün ekleyin.{Colors.END}")
        return

    product_id = products[0]['id']
    print(f"{Colors.GREEN}✅ Test için ürün seçildi: {products[0]['name']} (ID: {product_id}){Colors.END}")

    # 4. Sepeti getir (boş)
    print(f"\n{Colors.YELLOW}3️⃣  Boş sepet getiriliyor...{Colors.END}")
    response = requests.get(f"{BASE_URL}/cart/", headers=headers)
    print_response("GET CART (Empty)", response)

    # 5. Sepete ürün ekle
    print(f"\n{Colors.YELLOW}4️⃣  Sepete ürün ekleniyor...{Colors.END}")
    cart_data = {
        "product_id": product_id,
        "quantity": 2
    }
    response = requests.post(f"{BASE_URL}/cart/", json=cart_data, headers=headers)
    print_response("ADD TO CART", response)

    if response.status_code == 201:
        cart_items = response.json().get('items', [])
        if cart_items:
            item_id = cart_items[0]['id']

            # 6. Aynı ürünü tekrar ekle (miktar artmalı)
            print(f"\n{Colors.YELLOW}5️⃣  Aynı ürün tekrar ekleniyor (miktar artacak)...{Colors.END}")
            response = requests.post(f"{BASE_URL}/cart/", json=cart_data, headers=headers)
            print_response("ADD SAME PRODUCT AGAIN", response)

            # 7. Sepeti getir (dolu)
            print(f"\n{Colors.YELLOW}6️⃣  Dolu sepet getiriliyor...{Colors.END}")
            response = requests.get(f"{BASE_URL}/cart/", headers=headers)
            print_response("GET CART (With Items)", response)

            # 8. Ürün miktarını güncelle
            print(f"\n{Colors.YELLOW}7️⃣  Ürün miktarı güncelleniyor...{Colors.END}")
            update_data = {"quantity": 1}
            response = requests.put(f"{BASE_URL}/cart/item/{item_id}/", json=update_data, headers=headers)
            print_response("UPDATE ITEM QUANTITY", response)

            # 9. Başka bir ürün varsa ekle
            if len(products) > 1:
                print(f"\n{Colors.YELLOW}8️⃣  İkinci ürün ekleniyor...{Colors.END}")
                second_product = {
                    "product_id": products[1]['id'],
                    "quantity": 1
                }
                response = requests.post(f"{BASE_URL}/cart/", json=second_product, headers=headers)
                print_response("ADD SECOND PRODUCT", response)

            # 10. Sepetten ürün sil
            print(f"\n{Colors.YELLOW}9️⃣  Sepetten bir ürün siliniyor...{Colors.END}")
            response = requests.delete(f"{BASE_URL}/cart/item/{item_id}/", headers=headers)
            print_response("DELETE ITEM", response)

            # 11. Sepeti tamamen temizle
            print(f"\n{Colors.YELLOW}🔟 Sepet tamamen temizleniyor...{Colors.END}")
            response = requests.get(f"{BASE_URL}/cart/", headers=headers)
            remaining_items = response.json().get('items', [])

            if remaining_items:
                response = requests.delete(f"{BASE_URL}/cart/clear/", headers=headers)
                print_response("CLEAR CART", response)

    print(f"\n{Colors.GREEN}✅ Tüm testler tamamlandı!{Colors.END}\n")

if __name__ == "__main__":
    try:
        test_cart_api()
    except requests.exceptions.ConnectionError:
        print(f"{Colors.RED}❌ Sunucuya bağlanılamadı!{Colors.END}")
        print(f"Lütfen önce sunucuyu başlatın: python manage.py runserver")
    except Exception as e:
        print(f"{Colors.RED}❌ Hata: {e}{Colors.END}")
