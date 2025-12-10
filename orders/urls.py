from django.urls import path
from .views import (
    CheckoutView,
    OrderHistoryView,
    InvoiceView,
    OrderListCreateView,
    OrderDetailView,
    UpdateOrderStatusView,
)

urlpatterns = [
    # Checkout: Cart → Order
    path("checkout/", CheckoutView.as_view(), name="checkout"),

    # Order History
    path("history/", OrderHistoryView.as_view(), name="order-history"),

    # Invoice
    path("invoice/<int:pk>/", InvoiceView.as_view(), name="invoice"),

    # REST: List + Create Orders
    path("", OrderListCreateView.as_view(), name="order-list-create"),

    # REST: Retrieve Order Detail
    path("<int:pk>/", OrderDetailView.as_view(), name="order-detail"),

    # REST: Update Order Status
    path("<int:pk>/status/", UpdateOrderStatusView.as_view(), name="order-status"),
]
