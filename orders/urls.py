from django.urls import path
from .views import (
    CheckoutView,
    OrderHistoryView,
    InvoiceView,
    OrderListCreateView,
    OrderDetailView,
    UpdateOrderStatusView,
    InvoiceDownloadView,
    RevenueReportView,
    InvoiceListView,
    DeliveryListView,
    RefundListView,
    RefundApprovalView,
)

urlpatterns = [
    # Checkout: Cart → Order
    path("checkout/", CheckoutView.as_view(), name="checkout"),

    # Order History
    path("history/", OrderHistoryView.as_view(), name="order-history"),

    # Invoice
    path("invoice/<int:pk>/", InvoiceView.as_view(), name="invoice"),
    
    # Invoice Download
    path("<int:order_id>/invoice/download/", InvoiceDownloadView.as_view(), name="invoice-download"),

    # REST: List + Create Orders
    path("", OrderListCreateView.as_view(), name="order-list-create"),

    # REST: Retrieve Order Detail
    path("<int:pk>/", OrderDetailView.as_view(), name="order-detail"),

    # REST: Update Order Status
    path("<int:pk>/status/", UpdateOrderStatusView.as_view(), name="order-status"),
    
    # Revenue & Profit Report (Sales Manager)
    path("revenue-report/", RevenueReportView.as_view(), name="revenue-report"),
    
    # Invoice List (Sales Manager)
    path("invoices/", InvoiceListView.as_view(), name="invoice-list"),
    
    # Delivery List (Product Manager)
    path("deliveries/", DeliveryListView.as_view(), name="delivery-list"),
    
    # Refund List & Approval (Sales Manager)
    path("refunds/pending/", RefundListView.as_view(), name="refund-list"),
    path("refunds/<int:pk>/approval/", RefundApprovalView.as_view(), name="refund-approval"),
]
