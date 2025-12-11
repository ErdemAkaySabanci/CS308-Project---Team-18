from rest_framework import serializers
from .models import Review, WishList
from products.models import Product


class ReviewSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    
    class Meta:
        model = Review
        fields = ['id', 'product', 'product_name', 'user', 'username', 'rating', 
                  'comment', 'is_approved', 'created_at', 'updated_at']
        read_only_fields = ['user', 'is_approved', 'created_at', 'updated_at']


class ReviewCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ['product', 'rating', 'comment']
    
    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5 stars.")
        return value


class ReviewPublicSerializer(serializers.ModelSerializer):
    """Public view - shows rating always, comment only if approved"""
    username = serializers.CharField(source='user.username', read_only=True)
    comment = serializers.SerializerMethodField()
    
    class Meta:
        model = Review
        fields = ['id', 'username', 'rating', 'comment', 'created_at']
    
    def get_comment(self, obj):
        # Comment only shown if approved
        if obj.is_approved:
            return obj.comment
        return None


class WishListSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_price = serializers.DecimalField(source='product.price', max_digits=10, decimal_places=2, read_only=True)
    product_image = serializers.ImageField(source='product.image', read_only=True)
    
    class Meta:
        model = WishList
        fields = ['id', 'product', 'product_name', 'product_price', 'product_image', 'added_at']
        read_only_fields = ['added_at']
