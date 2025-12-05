from rest_framework import status, generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db import transaction
from .models import Order, OrderItem
from .serializers import OrderSerializer, OrderCreateSerializer
from cart.models import Cart
import uuid

class OrderCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = OrderCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        delivery_address = serializer.validated_data['delivery_address']
        user = request.user

        try:
            cart = Cart.objects.get(user=user)
            cart_items = cart.items.all()
            if not cart_items.exists():
                return Response({"error": "Cart is empty"}, status=status.HTTP_400_BAD_REQUEST)
        except Cart.DoesNotExist:
            return Response({"error": "Cart is empty"}, status=status.HTTP_400_BAD_REQUEST)

        total_price = 0
        
        # Start transaction to ensure atomicity
        with transaction.atomic():
            # First pass: Validate stock and calculate total
            for item in cart_items:
                if item.quantity > item.product.quantity_in_stock:
                    return Response(
                        {"error": f"Not enough stock for {item.product.name}. Available: {item.product.quantity_in_stock}"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                total_price += item.quantity * item.product.price

            # Create Order
            order = Order.objects.create(
                user=user,
                total_price=total_price,
                delivery_address=delivery_address,
                invoice_number=str(uuid.uuid4())
            )

            # Second pass: Create OrderItems and decrease stock
            for item in cart_items:
                OrderItem.objects.create(
                    order=order,
                    product=item.product,
                    quantity=item.quantity,
                    price=item.product.price
                )
                
                # Decrease stock
                item.product.quantity_in_stock -= item.quantity
                item.product.save()

            # Clear cart
            cart_items.delete()

        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


class OrderListView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).order_by('-created_at')


class OrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)
