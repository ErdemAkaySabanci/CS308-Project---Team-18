from rest_framework import serializers
from .models import Order, OrderItem
from products.serializers import ProductListSerializer

class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_image = serializers.ImageField(source='product.image', read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'product_image', 'quantity', 'price', 'subtotal']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'user', 'status', 'status_display', 'total_price', 
            'delivery_address', 'created_at', 'invoice_number', 'items'
        ]
        read_only_fields = ['user', 'status', 'total_price', 'created_at', 'invoice_number']

class OrderCreateSerializer(serializers.Serializer):
    delivery_address = serializers.CharField(required=True)
