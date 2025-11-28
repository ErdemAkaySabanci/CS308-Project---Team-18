#!/usr/bin/env python
"""
Product Search & Ordering Test Script

Test filters for the product list API:
- Search by name and description
- Order by price (ascending/descending)
"""

import requests
import json

BASE_URL = "http://localhost:8000/api"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    YELLOW = '\033[93m'
    END = '\033[0m'

def print_products(title, products):
    print(f"\n{Colors.BLUE}{'='*80}{Colors.END}")
    print(f"{Colors.YELLOW}{title}{Colors.END}")
    print(f"{Colors.BLUE}{'-'*80}{Colors.END}")

    if not products:
        print(f"{Colors.RED}No products found{Colors.END}")
    else:
        for product in products:
            print(f"ID: {product['id']:<3} | "
                  f"Name: {product['name']:<30} | "
                  f"Price: {float(product['price']):>10,.2f} TL | "
                  f"Stock: {product['quantity_in_stock']:>3}")

    print(f"{Colors.BLUE}{'='*80}{Colors.END}")

def test_filters():
    print(f"{Colors.GREEN}🔍 Product Search & Ordering Tests{Colors.END}\n")

    # 1. Get all products (default)
    print(f"{Colors.YELLOW}1️⃣  Fetching all products (default ordering)...{Colors.END}")
    response = requests.get(f"{BASE_URL}/products/")
    if response.status_code == 200:
        data = response.json()
        print_products("ALL PRODUCTS (Default: Newest First)", data.get('results', []))
        print(f"Total count: {data.get('count', 0)}")
    else:
        print(f"{Colors.RED}❌ Failed to fetch products{Colors.END}")
        return

    # 2. Search by name
    print(f"\n{Colors.YELLOW}2️⃣  Searching for 'iPhone' in name/description...{Colors.END}")
    response = requests.get(f"{BASE_URL}/products/", params={'search': 'iPhone'})
    if response.status_code == 200:
        data = response.json()
        print_products("SEARCH RESULTS: 'iPhone'", data.get('results', []))
        print(f"Found: {data.get('count', 0)} products")

    # 3. Search by another term
    print(f"\n{Colors.YELLOW}3️⃣  Searching for 'SAMSUNG' in name/description...{Colors.END}")
    response = requests.get(f"{BASE_URL}/products/", params={'search': 'SAMSUNG'})
    if response.status_code == 200:
        data = response.json()
        print_products("SEARCH RESULTS: 'SAMSUNG'", data.get('results', []))
        print(f"Found: {data.get('count', 0)} products")

    # 4. Order by price (ascending)
    print(f"\n{Colors.YELLOW}4️⃣  Ordering by price (lowest to highest)...{Colors.END}")
    response = requests.get(f"{BASE_URL}/products/", params={'ordering': 'price'})
    if response.status_code == 200:
        data = response.json()
        print_products("ORDERED BY PRICE (ASC)", data.get('results', []))

    # 5. Order by price (descending)
    print(f"\n{Colors.YELLOW}5️⃣  Ordering by price (highest to lowest)...{Colors.END}")
    response = requests.get(f"{BASE_URL}/products/", params={'ordering': '-price'})
    if response.status_code == 200:
        data = response.json()
        print_products("ORDERED BY PRICE (DESC)", data.get('results', []))

    # 6. Combined: Search + Order
    print(f"\n{Colors.YELLOW}6️⃣  Combined: Search 'iPhone' + Order by price (low to high)...{Colors.END}")
    response = requests.get(f"{BASE_URL}/products/", params={
        'search': 'iPhone',
        'ordering': 'price'
    })
    if response.status_code == 200:
        data = response.json()
        print_products("SEARCH 'iPhone' + ORDER BY PRICE", data.get('results', []))

    # 7. Test description search (if products have descriptions)
    print(f"\n{Colors.YELLOW}7️⃣  Testing description search...{Colors.END}")
    print("Enter a keyword to search in product descriptions:")
    keyword = input("Keyword (or press Enter to skip): ").strip()

    if keyword:
        response = requests.get(f"{BASE_URL}/products/", params={'search': keyword})
        if response.status_code == 200:
            data = response.json()
            print_products(f"SEARCH RESULTS: '{keyword}'", data.get('results', []))
            print(f"Found: {data.get('count', 0)} products")

    # 8. Test all available ordering options
    print(f"\n{Colors.YELLOW}8️⃣  Testing all ordering options...{Colors.END}")
    ordering_options = ['price', '-price', 'name', '-name', 'created_at', '-created_at']

    for order in ordering_options:
        response = requests.get(f"{BASE_URL}/products/", params={'ordering': order})
        if response.status_code == 200:
            data = response.json()
            products = data.get('results', [])
            if products:
                first = products[0]
                last = products[-1] if len(products) > 1 else first
                print(f"  {order:15} → First: {first['name'][:30]:30} Last: {last['name'][:30]:30}")

    # 9. Test URL format for frontend
    print(f"\n{Colors.YELLOW}9️⃣  Example URLs for Frontend:{Colors.END}")
    print(f"{Colors.BLUE}{'-'*80}{Colors.END}")
    print(f"Search by name/description:")
    print(f"  {BASE_URL}/products/?search=iPhone")
    print(f"\nOrder by price (low to high):")
    print(f"  {BASE_URL}/products/?ordering=price")
    print(f"\nOrder by price (high to low):")
    print(f"  {BASE_URL}/products/?ordering=-price")
    print(f"\nCombined search + ordering:")
    print(f"  {BASE_URL}/products/?search=iPhone&ordering=price")
    print(f"\nWith pagination:")
    print(f"  {BASE_URL}/products/?search=iPhone&ordering=price&page=1&page_size=12")
    print(f"{Colors.BLUE}{'-'*80}{Colors.END}")

    print(f"\n{Colors.GREEN}✅ All filter tests completed!{Colors.END}\n")

if __name__ == "__main__":
    try:
        test_filters()
    except requests.exceptions.ConnectionError:
        print(f"{Colors.RED}❌ Cannot connect to server!{Colors.END}")
        print(f"Please start the server first: python manage.py runserver")
    except Exception as e:
        print(f"{Colors.RED}❌ Error: {e}{Colors.END}")
