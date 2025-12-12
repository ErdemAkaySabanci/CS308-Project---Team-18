from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import Cart, CartItem
from .serializers import CartSerializer, AddToCartSerializer, CartItemSerializer
from products.models import Product


from rest_framework.permissions import IsAuthenticated, AllowAny

class CartView(APIView):
    """
    GET: Retrieve user's cart with all items
    POST: Add a product to the cart
    """
    permission_classes = [AllowAny]

    def get(self, request):
        """Get user's cart with all items"""
        if request.user.is_authenticated:
            cart, created = Cart.objects.get_or_create(user=request.user)
        else:
            # key for guest
            if not request.session.session_key:
                request.session.create()
            
            cart, created = Cart.objects.get_or_create(session_key=request.session.session_key, user__isnull=True)
        serializer = CartSerializer(cart, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        """Add product to cart"""
        serializer = AddToCartSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        product_id = serializer.validated_data['product_id']
        quantity = serializer.validated_data['quantity']

        # Get or create cart for user
        if request.user.is_authenticated:
            cart, created = Cart.objects.get_or_create(user=request.user)
        else:
            if not request.session.session_key:
                request.session.create()
            cart, created = Cart.objects.get_or_create(session_key=request.session.session_key, user__isnull=True)

        # Get the product
        product = get_object_or_404(Product, pk=product_id)

        # Check if product already in cart
        cart_item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            defaults={'quantity': quantity}
        )

        if not created:
            # If item already exists, update quantity
            cart_item.quantity += quantity

            # Check if requested quantity exceeds stock
            if cart_item.quantity > product.quantity_in_stock:
                return Response(
                    {'error': f'Only {product.quantity_in_stock} items available in stock.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            cart_item.save()

        # Return updated cart
        cart_serializer = CartSerializer(cart, context={'request': request})
        return Response(cart_serializer.data, status=status.HTTP_201_CREATED)


class CartItemView(APIView):
    """
    PUT: Update cart item quantity
    DELETE: Remove item from cart
    """
    permission_classes = [AllowAny]

    def put(self, request, item_id):
        """Update cart item quantity"""
        if request.user.is_authenticated:
            cart = get_object_or_404(Cart, user=request.user)
        else:
            if not request.session.session_key:
                 return Response({'error': 'No session found'}, status=status.HTTP_400_BAD_REQUEST)
            cart = get_object_or_404(Cart, session_key=request.session.session_key, user__isnull=True)
        cart_item = get_object_or_404(CartItem, id=item_id, cart=cart)

        quantity = request.data.get('quantity')
        if not quantity or quantity <= 0:
            return Response(
                {'error': 'Quantity must be greater than 0.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check stock availability
        if quantity > cart_item.product.quantity_in_stock:
            return Response(
                {'error': f'Only {cart_item.product.quantity_in_stock} items available in stock.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        cart_item.quantity = quantity
        cart_item.save()

        cart_serializer = CartSerializer(cart, context={'request': request})
        return Response(cart_serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, item_id):
        """Remove item from cart"""
        if request.user.is_authenticated:
            cart = get_object_or_404(Cart, user=request.user)
        else:
             if not request.session.session_key:
                 return Response({'error': 'No session found'}, status=status.HTTP_400_BAD_REQUEST)
             cart = get_object_or_404(Cart, session_key=request.session.session_key, user__isnull=True)
        cart_item = get_object_or_404(CartItem, id=item_id, cart=cart)
        cart_item.delete()

        cart_serializer = CartSerializer(cart, context={'request': request})
        return Response(cart_serializer.data, status=status.HTTP_200_OK)


class ClearCartView(APIView):
    """Delete all items from cart"""
    permission_classes = [AllowAny]

    def delete(self, request):
        """Clear all items from user's cart"""
        if request.user.is_authenticated:
            cart = get_object_or_404(Cart, user=request.user)
        else:
             if not request.session.session_key:
                 return Response({'error': 'No session found'}, status=status.HTTP_400_BAD_REQUEST)
             cart = get_object_or_404(Cart, session_key=request.session.session_key, user__isnull=True)
        cart.items.all().delete()

        cart_serializer = CartSerializer(cart, context={'request': request})
        return Response(cart_serializer.data, status=status.HTTP_200_OK)
