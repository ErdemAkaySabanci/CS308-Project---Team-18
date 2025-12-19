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
    page_size = 100
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
    ordering_fields = ['price', 'name', 'created_at', 'quantity_in_stock', 'popularity', 'average_rating']
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


# ---------------------------------------------------------
# DISCOUNT API (SALES MANAGER)
# ---------------------------------------------------------
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework import status


class ApplyDiscountView(APIView):
    """
    Sales Manager için discount uygulama API
    Ürünlere discount uygular ve wishlist'te olan kullanıcılara bildirim gönderir
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        # Role kontrolü
        if not hasattr(request.user, 'role') or request.user.role != 'sales_manager':
            return Response(
                {"error": "Permission denied. Only Sales Managers can apply discounts."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Request data
        product_ids = request.data.get('product_ids', [])
        discount_percentage = request.data.get('discount_percentage')
        
        if not product_ids or discount_percentage is None:
            return Response(
                {"error": "product_ids and discount_percentage are required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            discount_percentage = float(discount_percentage)
            if discount_percentage < 0 or discount_percentage > 100:
                return Response(
                    {"error": "Discount percentage must be between 0 and 100"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except (ValueError, TypeError):
            return Response(
                {"error": "Invalid discount percentage"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Ürünleri bul ve discount uygula
        products = Product.objects.filter(id__in=product_ids, is_active=True)
        
        if not products.exists():
            return Response(
                {"error": "No valid products found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        updated_count = 0
        # notified_users = set()  # Will be enabled when Wishlist is implemented
        
        for product in products:
            # Discount uygula
            product.discount_rate = discount_percentage
            product.save()
            updated_count += 1
            
            # TODO: Wishlist notification - will be enabled when Wishlist model is added
            # from users.models import Wishlist
            # wishlists = Wishlist.objects.filter(product=product).select_related('user')
            # for wishlist in wishlists:
            #     notified_users.add(wishlist.user.id)
        
        return Response({
            "message": f"Discount applied successfully to {updated_count} product(s)",
            "updated_products": updated_count,
            # "notified_users": len(notified_users),  # Will be enabled when Wishlist is implemented
            "discount_percentage": discount_percentage
        }, status=status.HTTP_200_OK)
