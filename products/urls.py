from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProductListView,
    ProductDetailView,
    CategoryListView,
    ApplyDiscountView,
    CategoryViewSet
)

app_name = 'products'

# Router for ViewSets
router = DefaultRouter()
router.register(r'categories-crud', CategoryViewSet, basename='category-crud')

urlpatterns = [
    path('products/', ProductListView.as_view(), name='product-list'),
    path('products/<int:pk>/', ProductDetailView.as_view(), name='product-detail'),
    path('categories/', CategoryListView.as_view(), name='category-list'),
    path('apply-discount/', ApplyDiscountView.as_view(), name='apply-discount'),
    # CategoryViewSet endpoints (CRUD)
    path('', include(router.urls)),
]
