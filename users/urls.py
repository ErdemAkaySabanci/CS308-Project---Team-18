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
    path('change-password/', views.ChangePasswordView.as_view(), name='change-password'),
    
    # Wishlist
    path('wishlist/', views.WishListView.as_view(), name='wishlist'),
    path('wishlist/<int:product_id>/', views.WishListItemView.as_view(), name='wishlist-item'),

    # Saved Cards
    path('cards/', views.SavedCardListCreateView.as_view(), name='saved-cards'),
    path('cards/<int:pk>/', views.SavedCardDetailView.as_view(), name='saved-card-detail'),
    path('cards/<int:pk>/set-default/', views.SetDefaultCardView.as_view(), name='set-default-card'),

    # Admin - Core
    path('admin/statistics/', admin_views.AdminStatisticsView.as_view(), name='admin-statistics'),
    path('admin/users/', admin_views.AdminUserListView.as_view(), name='admin-users'),
    path('admin/users/create/', admin_views.AdminUserCreateView.as_view(), name='admin-user-create'),
    path('admin/users/<int:pk>/', admin_views.AdminUserUpdateView.as_view(), name='admin-user-update'),
    path('admin/analytics/', admin_views.AdminAnalyticsView.as_view(), name='admin-analytics'),
    
    # Admin - Products & Orders
    path('admin/products/', admin_views.AdminProductListView.as_view(), name='admin-products'),
    path('admin/products/<int:pk>/', admin_views.AdminProductUpdateView.as_view(), name='admin-product-update'),
    path('admin/orders/', admin_views.AdminOrderListView.as_view(), name='admin-orders'),
    path('admin/orders/<int:pk>/', admin_views.AdminOrderUpdateView.as_view(), name='admin-order-update'),
    
    # Admin - Categories & Reviews
    path('admin/categories/', admin_views.AdminCategoryListView.as_view(), name='admin-categories'),
    path('admin/categories/<int:pk>/', admin_views.AdminCategoryUpdateView.as_view(), name='admin-category-update'),
    path('admin/reviews/', admin_views.AdminReviewListView.as_view(), name='admin-reviews'),
    path('admin/reviews/<int:pk>/', admin_views.AdminReviewUpdateView.as_view(), name='admin-review-update'),
    
    # Admin - Refunds, Carts, Wishlists, Chats
    path('admin/refunds/', admin_views.AdminRefundListView.as_view(), name='admin-refunds'),
    path('admin/refunds/<int:pk>/', admin_views.AdminRefundUpdateView.as_view(), name='admin-refund-update'),
    path('admin/carts/', admin_views.AdminCartListView.as_view(), name='admin-carts'),
    path('admin/wishlists/', admin_views.AdminWishlistListView.as_view(), name='admin-wishlists'),
    path('admin/chats/', admin_views.AdminChatListView.as_view(), name='admin-chats'),
]
