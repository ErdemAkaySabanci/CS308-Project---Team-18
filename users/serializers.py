# users/serializers.py
from rest_framework import serializers
from .models import CustomUser

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'role', 'first_name', 'last_name', 'is_active', 'date_joined', 'home_address', 'tax_id', 'phone']


class WishListSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_price = serializers.DecimalField(source='product.price', max_digits=10, decimal_places=2, read_only=True)
    product_image = serializers.ImageField(source='product.image', read_only=True)

    class Meta:
        # Import WishList inside or at top. Using local import to avoid circular dep if any (though models are safe)
        from .models import WishList
        model = WishList
        fields = ['id', 'product', 'product_name', 'product_price', 'product_image', 'added_at']
        read_only_fields = ['added_at']
