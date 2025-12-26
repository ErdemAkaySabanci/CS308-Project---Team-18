from rest_framework import serializers
from .models import Review
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



