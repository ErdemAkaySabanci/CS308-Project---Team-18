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
    average_rating = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'product_id', 'name', 'description', 'price', 'discounted_price',
            'discount_rate', 'category_name', 'image', 'is_in_stock',
            'quantity_in_stock', 'is_active', 'popularity', 'average_rating'
        ]

    def get_average_rating(self, obj):
        """Ortalama rating'i hesapla"""
        return obj.average_rating


class ProductDetailSerializer(serializers.ModelSerializer):
    """Ürün detayı için tam serializer"""
    category = CategorySerializer(read_only=True)
    discounted_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    is_in_stock = serializers.BooleanField(read_only=True)
    average_rating = serializers.SerializerMethodField()
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

    def get_average_rating(self, obj):
        """Ortalama rating'i hesapla"""
        return obj.average_rating

    def get_review_count(self, obj):
        return obj.reviews.filter(is_approved=True).count()


class ProductWriteSerializer(serializers.ModelSerializer):
    """Ürün oluşturma ve güncelleme için serializer"""
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'model', 'serial_number', 'description',
            'quantity_in_stock', 'price', 'cost', 'warranty_status',
            'distributor', 'category', 'image', 'is_active'
        ]
        read_only_fields = ['id']
        extra_kwargs = {
            'serial_number': {'required': False, 'allow_blank': True},
            'warranty_status': {'required': False, 'allow_blank': True},
            'distributor': {'required': False, 'allow_blank': True},
            'model': {'required': False, 'allow_blank': True},
            'description': {'required': False, 'allow_blank': True},
            'image': {'required': False, 'allow_null': True},
            'cost': {'required': False, 'allow_null': True},
            'is_active': {'required': False, 'default': True},
        }
    
    def create(self, validated_data):
        # Eğer cost belirtilmezse, fiyatın %50'si olarak ayarla
        if 'cost' not in validated_data or validated_data.get('cost') is None:
            price = validated_data.get('price', 0)
            validated_data['cost'] = price * 0.5
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        # Eğer cost belirtilmezse ve price değişiyorsa, cost'u güncelle
        if 'cost' not in validated_data or validated_data.get('cost') is None:
            if 'price' in validated_data:
                validated_data['cost'] = validated_data['price'] * 0.5
        return super().update(instance, validated_data)