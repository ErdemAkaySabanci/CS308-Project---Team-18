from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status, generics, permissions
from rest_framework.generics import ListAPIView
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.utils.crypto import get_random_string

from cart.models import Cart
from .models import Order, OrderItem
from .serializers import OrderSerializer
from products.models import Product


# ---------------------------------------------------------
# 1) CHECKOUT → CART → ORDER
# ---------------------------------------------------------
class CheckoutView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        user = request.user

        if not user.home_address:
            return Response(
                {"error": "Please add your home address before checkout."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            cart = Cart.objects.get(user=user)
        except Cart.DoesNotExist:
            return Response({"error": "Cart is empty."}, status=400)

        if cart.items.count() == 0:
            return Response({"error": "Cart is empty."}, status=400)

        # Extract payment data from request
        payment_data = request.data.get('payment', {})
        card_number = payment_data.get('card_number', '')
        card_last_4 = card_number[-4:] if len(card_number) >= 4 else ''

        # Order oluştur
        order = Order.objects.create(
            user=user,
            status="processing",
            total_price=cart.total_price,
            delivery_address=user.home_address,
            invoice_number=get_random_string(12),
            payment_confirmed=True,
            payment_method="Credit Card",
            card_last_4=card_last_4
        )

        # OrderItem + stok düşme
        for item in cart.items.all():
            OrderItem.objects.create(
                order=order,
                product=item.product,
                quantity=item.quantity,
                price=item.product.discounted_price
            )

            # Stok azaltma
            item.product.quantity_in_stock -= item.quantity
            # is_in_stock property olduğu için otomatik hesaplanır, set etmeye gerek yok
            item.product.save()

        # Sepeti temizle
        cart.items.all().delete()

        return Response(
            {
                "message": "Order successfully created.",
                "order_id": order.id,
                "invoice_number": order.invoice_number,
            },
            status=201
        )


# ---------------------------------------------------------
# 2) ORDER HISTORY (SIPARIS GECMISI)
# ---------------------------------------------------------
class OrderHistoryView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = OrderSerializer

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).order_by('-created_at')


# ---------------------------------------------------------
# 3) INVOICE
# ---------------------------------------------------------
class InvoiceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        order = get_object_or_404(Order, id=pk, user=request.user)
        serializer = OrderSerializer(order)
        return Response(serializer.data)


# ---------------------------------------------------------
# 4) REST API: LIST + CREATE
# ---------------------------------------------------------
class OrderListCreateView(generics.ListCreateAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        user = request.user
        cart = Cart.objects.filter(user=user).first()

        if not cart or cart.items.count() == 0:
            return Response({"error": "Cart is empty"}, status=400)

        delivery_address = request.data.get("delivery_address", "")

        order = Order.objects.create(
            user=user,
            total_price=cart.total_price,
            delivery_address=delivery_address
        )

        for item in cart.items.all():
            OrderItem.objects.create(
                order=order,
                product=item.product,
                quantity=item.quantity,
                price=item.product.price
            )
            item.product.quantity_in_stock -= item.quantity
            item.product.save()

        cart.items.all().delete()
        return Response(OrderSerializer(order).data, status=201)


# ---------------------------------------------------------
# 5) ORDER DETAIL
# ---------------------------------------------------------
class OrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)


# ---------------------------------------------------------
# 6) ORDER STATUS UPDATE (PATCH)
# ---------------------------------------------------------
class UpdateOrderStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        order = get_object_or_404(Order, pk=pk)
        new_status = request.data.get("status")

        if new_status not in dict(Order.ORDER_STATUS):
            return Response({"error": "Invalid status"}, status=400)

        order.status = new_status
        order.save()

        return Response(
            {"message": "Order status updated."},
            status=200
        )
