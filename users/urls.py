# users/urls.py
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views
from . import admin_views

urlpatterns = [
    path('login/', views.login_view, name='login'),
    path('register/', views.register_view, name='register'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # NEW
    path('me/', views.CurrentUserView.as_view(), name='current-user'),
    path('address/', views.UpdateAddressView.as_view(), name='update-address'),
    path('customer/<int:pk>/', views.CustomerDetailView.as_view(), name='customer-detail'),
    # Wishlist
    path('wishlist/', views.WishListView.as_view(), name='wishlist'),
    path('wishlist/<int:product_id>/', views.WishListItemView.as_view(), name='wishlist-item'),
    # Admin
    path('admin/statistics/', admin_views.AdminStatisticsView.as_view(), name='admin-statistics'),
    path('admin/users/', admin_views.AdminUserListView.as_view(), name='admin-users'),
    path('admin/users/<int:pk>/', admin_views.AdminUserUpdateView.as_view(), name='admin-user-update'),
    path('admin/analytics/', admin_views.AdminAnalyticsView.as_view(), name='admin-analytics'),
    # Admin Product & Order
    path('admin/products/', admin_views.AdminProductListView.as_view(), name='admin-products'),
    path('admin/products/<int:pk>/', admin_views.AdminProductUpdateView.as_view(), name='admin-product-update'),
    path('admin/orders/', admin_views.AdminOrderListView.as_view(), name='admin-orders'),
    path('admin/orders/<int:pk>/', admin_views.AdminOrderUpdateView.as_view(), name='admin-order-update'),
    # Saved Cards
    path('cards/', views.SavedCardListCreateView.as_view(), name='saved-cards'),
    path('cards/<int:pk>/', views.SavedCardDetailView.as_view(), name='saved-card-detail'),
    path('cards/<int:pk>/set-default/', views.SetDefaultCardView.as_view(), name='set-default-card'),
]
