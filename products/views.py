from rest_framework import generics, filters
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from .models import Product, Category
from .serializers import (
    ProductListSerializer,
    ProductDetailSerializer,
    CategorySerializer
)


class ProductPagination(PageNumberPagination):
    page_size = 12
    page_size_query_param = 'page_size'
    max_page_size = 100


class ProductListView(generics.ListAPIView):
    """
    Ürün listesi API

    Query Parameters:
    - search: Ürün adı veya açıklamasında ara
    - category: Kategori ID'sine göre filtrele
    - min_price: Minimum fiyat
    - max_price: Maximum fiyat
    - ordering: Sıralama (price, -price, name, -created_at)
    - in_stock: Sadece stokta olanlar (true/false)
    """
    serializer_class = ProductListSerializer
    pagination_class = ProductPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]

    # Arama
    search_fields = ['name', 'description', 'product_id']

    # Sıralama
    ordering_fields = ['price', 'name', 'created_at', 'quantity_in_stock', 'popularity']
    ordering = ['-created_at']  # Varsayılan: En yeni önce

    def get_queryset(self):
        queryset = Product.objects.filter(is_active=True).select_related('category')

        # Kategori filtresi
        category_id = self.request.query_params.get('category')
        if category_id:
            queryset = queryset.filter(category_id=category_id)

        # Fiyat aralığı filtresi
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')

        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        if max_price:
            queryset = queryset.filter(price__lte=max_price)

        # Stokta olanlar filtresi
        in_stock = self.request.query_params.get('in_stock')
        if in_stock and in_stock.lower() == 'true':
            queryset = queryset.filter(quantity_in_stock__gt=0)

        return queryset


class ProductDetailView(generics.RetrieveAPIView):
    """Tek bir ürünün detayı"""
    queryset = Product.objects.filter(is_active=True).select_related('category')
    serializer_class = ProductDetailSerializer
    lookup_field = 'pk'


class CategoryListView(generics.ListAPIView):
    """Kategori listesi"""
    queryset = Category.objects.all()
    serializer_class = CategorySerializer