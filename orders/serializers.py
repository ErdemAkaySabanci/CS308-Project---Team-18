from rest_framework import serializers
from .models import Order, OrderItem, Refund


class OrderItemSerializer(serializers.ModelSerializer):
    product = serializers.IntegerField(source="product.id", read_only=True)
    product_name = serializers.CharField(source="product.name", read_only=True)
    image = serializers.ImageField(source="product.image", read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'quantity', 'price', 'subtotal', 'image']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            'id',
            'status',
            'total_price',
            'delivery_address',
            'invoice_number',
            'payment_confirmed',
            'created_at',
            'items',
        ]


class RefundSerializer(serializers.ModelSerializer):
    order_id = serializers.IntegerField(source='order.id', read_only=True)
    product_name = serializers.CharField(source='order_item.product.name', read_only=True)
    user_name = serializers.CharField(source='order.user.username', read_only=True)

    class Meta:
        model = Refund
        fields = ['id', 'order_id', 'product_name', 'user_name', 'reason', 'refund_amount', 'status', 'created_at']
