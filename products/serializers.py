from rest_framework import serializers
from .models import Product, Category


class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'product_count', 'created_at']

    def get_product_count(self, obj):
        return obj.products.count()


class ProductListSerializer(serializers.ModelSerializer):
    """Ürün listesi için hafif serializer"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    discounted_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    is_in_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'product_id', 'name', 'price', 'discounted_price',
            'discount_rate', 'category_name', 'image', 'is_in_stock',
            'quantity_in_stock', 'is_active', 'popularity'
        ]


class ProductDetailSerializer(serializers.ModelSerializer):
    """Ürün detayı için tam serializer"""
    category = CategorySerializer(read_only=True)
    discounted_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    is_in_stock = serializers.BooleanField(read_only=True)
    average_rating = serializers.DecimalField(max_digits=3, decimal_places=2, read_only=True)
    review_count = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'product_id', 'name', 'model', 'serial_number',
            'description', 'quantity_in_stock', 'price', 'cost',
            'discounted_price', 'discount_rate', 'warranty_status',
            'distributor', 'category', 'image', 'is_active',
            'is_in_stock', 'average_rating', 'review_count',
            'popularity', 'created_at', 'updated_at'
        ]

    def get_review_count(self, obj):
        return obj.reviews.filter(is_approved=True).count()