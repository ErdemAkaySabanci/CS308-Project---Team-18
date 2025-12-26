# users/urls.py
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('login/', views.login_view, name='login'),
    path('register/', views.register_view, name='register'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # NEW
    path('me/', views.CurrentUserView.as_view(), name='current-user'),
    path('address/', views.UpdateAddressView.as_view(), name='update-address'),

    # Wishlist
    path('wishlist/', views.WishListView.as_view(), name='wishlist'),
    path('wishlist/<int:product_id>/', views.WishListItemView.as_view(), name='wishlist-item'),
]

