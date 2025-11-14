from django.urls import path
from .views import ProductListView, ProductDetailView, CategoryListView

app_name = 'products'

urlpatterns = [
    path('products/', ProductListView.as_view(), name='product-list'),
    path('products/<int:id>/', ProductDetailView.as_view(), name='product-detail'),
    path('categories/', CategoryListView.as_view(), name='category-list'),
]