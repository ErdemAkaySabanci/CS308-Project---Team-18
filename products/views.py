from rest_framework import generics, filters, viewsets
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from .models import Product, Category
from .serializers import (
    ProductListSerializer,
    ProductDetailSerializer,
    CategorySerializer,
    ProductWriteSerializer
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


# ---------------------------------------------------------
# CATEGORY CRUD API (PRODUCT MANAGER)
# ---------------------------------------------------------
class CategoryViewSet(viewsets.ModelViewSet):
    """
    Category CRUD API (Product Manager only)

    GET /categories/ - List all categories (public)
    GET /categories/<id>/ - Retrieve a category (public)
    POST /categories/ - Create a category (Product Manager only)
    PUT /categories/<id>/ - Update a category (Product Manager only)
    DELETE /categories/<id>/ - Delete a category (Product Manager only)

    Note: Category can only be deleted if it has no products
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    authentication_classes = [JWTAuthentication]

    def get_permissions(self):
        """
        GET istekleri için herkes izinli
        POST, PUT, DELETE için authentication gerekli ve Product Manager rolü kontrolü yapılacak
        """
        if self.action in ['list', 'retrieve']:
            # List ve retrieve için authentication gerekmez
            permission_classes = []
        else:
            # Create, update, delete için authentication gerekli
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    def check_product_manager_role(self, request):
        """Product Manager role kontrolü"""
        if not hasattr(request.user, 'role') or request.user.role != 'product_manager':
            return Response(
                {"error": "Permission denied. Only Product Managers can perform this action."},
                status=status.HTTP_403_FORBIDDEN
            )
        return None

    def create(self, request, *args, **kwargs):
        """Create category - Product Manager only"""
        error_response = self.check_product_manager_role(request)
        if error_response:
            return error_response
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        """Update category - Product Manager only"""
        error_response = self.check_product_manager_role(request)
        if error_response:
            return error_response
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        """Partial update category - Product Manager only"""
        error_response = self.check_product_manager_role(request)
        if error_response:
            return error_response
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """
        Delete category - Product Manager only
        Cannot delete category if it has products
        """
        error_response = self.check_product_manager_role(request)
        if error_response:
            return error_response

        category = self.get_object()

        # Kategoriye ait ürün var mı kontrol et
        product_count = category.products.count()
        if product_count > 0:
            return Response(
                {
                    "error": f"Cannot delete category. It has {product_count} product(s).",
                    "detail": "Please delete or reassign all products before deleting this category."
                },
                status=status.HTTP_400_BAD_REQUEST
            )


        return super().destroy(request, *args, **kwargs)


# ---------------------------------------------------------
# PRODUCT CRUD API (PRODUCT MANAGER)
# ---------------------------------------------------------
class ProductViewSet(viewsets.ModelViewSet):
    """
    Product CRUD API (Product Manager only)
    
    GET /products-crud/ - List all products (includes inactive ones)
    POST /products-crud/ - Create a product
    PUT /products-crud/<id>/ - Update a product
    DELETE /products-crud/<id>/ - Delete a product
    """
    queryset = Product.objects.all()
    serializer_class = ProductDetailSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def check_product_manager_role(self, request):
        """Product Manager role kontrolü"""
        if not hasattr(request.user, 'role') or request.user.role != 'product_manager':
            return Response(
                {"error": "Permission denied. Only Product Managers can perform this action."},
                status=status.HTTP_403_FORBIDDEN
            )
        return None

    def list(self, request, *args, **kwargs):
        """List products - Product Manager view sees all, others might be restricted but we restrict whole view check"""
        error_response = self.check_product_manager_role(request)
        if error_response:
            return error_response
        return super().list(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        error_response = self.check_product_manager_role(request)
        if error_response:
            return error_response
        return super().retrieve(request, *args, **kwargs)
        
    def create(self, request, *args, **kwargs):
        error_response = self.check_product_manager_role(request)
        if error_response:
            return error_response
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        error_response = self.check_product_manager_role(request)
        if error_response:
            return error_response
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        error_response = self.check_product_manager_role(request)
        if error_response:
            return error_response
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        error_response = self.check_product_manager_role(request)
        if error_response:
            return error_response
        return super().destroy(request, *args, **kwargs)


# ---------------------------------------------------------
# PRODUCT CRUD API (PRODUCT MANAGER)
# ---------------------------------------------------------
class ProductViewSet(viewsets.ModelViewSet):
    """
    Product CRUD API (Product Manager only)

    GET /products-crud/ - List all products (public)
    GET /products-crud/<id>/ - Retrieve a product (public)
    POST /products-crud/ - Create a product (Product Manager only)
    PUT /products-crud/<id>/ - Update a product (Product Manager only)
    PATCH /products-crud/<id>/ - Partial update (Product Manager only)
    DELETE /products-crud/<id>/ - Delete a product (Product Manager only)
    """
    queryset = Product.objects.all().select_related('category')
    authentication_classes = [JWTAuthentication]

    def get_serializer_class(self):
        """GET için detail serializer, POST/PUT için write serializer"""
        if self.action in ['list']:
            return ProductListSerializer
        elif self.action in ['retrieve']:
            return ProductDetailSerializer
        return ProductWriteSerializer

    def get_permissions(self):
        """
        GET istekleri için herkes izinli
        POST, PUT, DELETE için authentication gerekli ve Product Manager rolü kontrolü yapılacak
        """
        if self.action in ['list', 'retrieve']:
            permission_classes = []
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    def check_product_manager_role(self, request):
        """Product Manager role kontrolü"""
        if not hasattr(request.user, 'role') or request.user.role != 'product_manager':
            return Response(
                {"error": "Permission denied. Only Product Managers can perform this action."},
                status=status.HTTP_403_FORBIDDEN
            )
        return None

    def create(self, request, *args, **kwargs):
        """Create product - Product Manager only"""
        error_response = self.check_product_manager_role(request)
        if error_response:
            return error_response
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        """Update product - Product Manager only"""
        error_response = self.check_product_manager_role(request)
        if error_response:
            return error_response
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        """Partial update product - Product Manager only"""
        error_response = self.check_product_manager_role(request)
        if error_response:
            return error_response
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """Delete product - Product Manager only"""
        error_response = self.check_product_manager_role(request)
        if error_response:
            return error_response
        return super().destroy(request, *args, **kwargs)

