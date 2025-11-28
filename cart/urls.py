from django.urls import path
from .views import CartView, CartItemView, ClearCartView

app_name = 'cart'

urlpatterns = [
    path('', CartView.as_view(), name='cart'),
    path('item/<int:item_id>/', CartItemView.as_view(), name='cart-item'),
    path('clear/', ClearCartView.as_view(), name='cart-clear'),
]
