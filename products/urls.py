from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryListView,
    ApplyDiscountView,
    CategoryViewSet,
    ProductViewSet,
    ProductListView,
    ProductDetailView
)

app_name = 'products'

# Router for ViewSets
router = DefaultRouter()
router.register(r'categories-crud', CategoryViewSet, basename='category-crud')
router.register(r'products-crud', ProductViewSet, basename='product-crud')

urlpatterns = [
    path('products/', ProductListView.as_view(), name='product-list'),
    path('products/<int:pk>/', ProductDetailView.as_view(), name='product-detail'),
    path('categories/', CategoryListView.as_view(), name='category-list'),
    path('apply-discount/', ApplyDiscountView.as_view(), name='apply-discount'),
    # CategoryViewSet and ProductViewSet endpoints (CRUD)
    path('', include(router.urls)),
]

