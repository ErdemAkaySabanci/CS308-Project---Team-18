# users/views.py

from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from .models import CustomUser
import re
from cart.utils import merge_cart

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from .serializers import UserSerializer, WishListSerializer, SavedCardSerializer
from .models import CustomUser, WishList, SavedCard
from products.models import Product
from django.shortcuts import get_object_or_404

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    Login endpoint that returns JWT tokens
    """
    email = request.data.get('email')
    password = request.data.get('password')

    # Validation - Empty field check
    if not email or not password:
        return Response(
            {'error': 'Email and password are required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Strip whitespace
    email = email.strip()

    # Try to find user by email
    try:
        user = CustomUser.objects.get(email=email)

        # Check password
        if user.check_password(password):
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            
            # Merge guest cart if exists
            merge_cart(user, request)

            return Response({
                'message': 'Login successful',
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'role': user.role,
                    'is_superuser': user.is_superuser,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                }
            }, status=status.HTTP_200_OK)
        else:
            # Wrong password - 401 Unauthorized
            return Response(
                {'error': 'Invalid email or password'},
                status=status.HTTP_401_UNAUTHORIZED
            )
    except CustomUser.DoesNotExist:
        # User not found - 401 Unauthorized (don't reveal if email exists)
        return Response(
            {'error': 'Invalid email or password'},
            status=status.HTTP_401_UNAUTHORIZED
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    """
    Registration endpoint with validations
    """
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')
    first_name = request.data.get('first_name', '')
    last_name = request.data.get('last_name', '')

    # ============================================
    # 1. EMPTY FIELD VALIDATION
    # ============================================
    if not username or not email or not password:
        return Response(
            {'error': 'Username, email and password are required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Strip whitespace
    username = username.strip()
    email = email.strip()
    first_name = first_name.strip() if first_name else ''
    last_name = last_name.strip() if last_name else ''

    # Check if fields are empty after stripping
    if not username or not email or not password:
        return Response(
            {'error': 'Username, email and password cannot be empty or whitespace only'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # ============================================
    # 2. EMAIL FORMAT VALIDATION
    # ============================================
    email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_regex, email):
        return Response(
            {'error': 'Invalid email format'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # ============================================
    # 3. EMAIL UNIQUENESS CHECK
    # ============================================
    if CustomUser.objects.filter(email=email).exists():
        return Response(
            {'error': 'User with this email already exists'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # ============================================
    # 4. USERNAME UNIQUENESS CHECK
    # ============================================
    if CustomUser.objects.filter(username=username).exists():
        return Response(
            {'error': 'Username already taken'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # ============================================
    # 5. PASSWORD LENGTH VALIDATION (MINIMUM 8)
    # ============================================
    if len(password) < 8:
        return Response(
            {'error': 'Password must be at least 8 characters long'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # ============================================
    # 6. PASSWORD STRENGTH VALIDATION
    # ============================================
    # At least one number
    if not any(char.isdigit() for char in password):
        return Response(
            {'error': 'Password must contain at least one number'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # At least one uppercase letter
    if not any(char.isupper() for char in password):
        return Response(
            {'error': 'Password must contain at least one uppercase letter'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # At least one lowercase letter
    if not any(char.islower() for char in password):
        return Response(
            {'error': 'Password must contain at least one lowercase letter'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # At least one special character
    special_chars = "!@#$%^&*()_+-=[]{}|;:,.<>?"
    if not any(char in special_chars for char in password):
        return Response(
            {'error': 'Password must contain at least one special character (!@#$%^&*...)'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # ============================================
    # 7. CREATE USER
    # ============================================
    try:
        user = CustomUser.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            role='customer'
        )

        # Merge guest cart if exists
        merge_cart(user, request)

        return Response({
            'message': 'Registration successful',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
            }
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response(
            {'error': f'Registration failed: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        """Update current user profile"""
        user = request.user
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UpdateAddressView(APIView):
    """
    PUT: Update user's home address
    GET: Get user's home address
    """
    permission_classes = [IsAuthenticated]

    def put(self, request):
        home_address = request.data.get('home_address')
        
        if not home_address or not home_address.strip():
            return Response(
                {'error': 'Home address is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = request.user
        user.home_address = home_address.strip()
        user.save()
        
        return Response({
            'message': 'Address updated successfully',
            'home_address': user.home_address
        }, status=status.HTTP_200_OK)
    
    def get(self, request):
        """Get current user's address"""
        return Response({
            'home_address': request.user.home_address or ''
        }, status=status.HTTP_200_OK)


class WishListView(APIView):
    """Get user's wishlist"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        wishlist = WishList.objects.filter(user=request.user)
        serializer = WishListSerializer(wishlist, many=True)
        return Response(serializer.data)

    def post(self, request):
        product_id = request.data.get('product_id')
        product = get_object_or_404(Product, id=product_id)

        wishlist_item, created = WishList.objects.get_or_create(
            user=request.user,
            product=product
        )

        if created:
            return Response(
                {'message': 'Product added to wishlist.'},
                status=status.HTTP_201_CREATED
            )
        return Response({'message': 'Product already in wishlist.'})


class WishListItemView(APIView):
    """Remove item from wishlist"""
    permission_classes = [IsAuthenticated]

    def delete(self, request, product_id):
        product = get_object_or_404(Product, id=product_id)
        WishList.objects.filter(user=request.user, product=product).delete()
        return Response({'message': 'Product removed from wishlist.'})


class CustomerDetailView(APIView):
    """
    Get customer details for support agent including cart and wishlist
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        # Only staff roles (support agent, product manager, sales manager) or admin can access
        allowed_roles = ['support_agent', 'product_manager', 'sales_manager']
        user_role = getattr(request.user, 'role', '')
        if user_role not in allowed_roles and not request.user.is_staff:
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
            
        user = get_object_or_404(CustomUser, pk=pk)
        
        # Get orders
        from orders.models import Order
        orders = Order.objects.filter(user=user).order_by('-created_at')[:5]
        
        orders_data = []
        for order in orders:
            orders_data.append({
                'id': order.id,
                'date': order.created_at.strftime('%Y-%m-%d %H:%M'),
                'total': float(order.total_price),
                'status': order.status
            })
            
        # Get cart count
        cart_count = 0
        try:
            from cart.models import Cart
            cart = Cart.objects.filter(user=user).first()
            if cart:
                cart_count = cart.items.count()
        except:
            pass
            
        # Get wishlist items
        wishlist_items = []
        try:
            wishlist_entries = WishList.objects.filter(user=user).select_related('product')
            for entry in wishlist_entries:
                product = entry.product
                wishlist_items.append({
                    'id': product.id,
                    'name': product.name,
                    'price': float(product.discounted_price),
                    'image': request.build_absolute_uri(product.image.url) if product.image else None
                })
        except Exception as e:
            print(f"Wishlist fetch error: {e}")
            pass
            
        return Response({
            'id': user.id,
            'name': f"{user.first_name} {user.last_name}".strip() or user.username,
            'email': user.email,
            'orders': orders_data,
            'cart_count': cart_count,
            'wishlist_count': len(wishlist_items),
            'wishlist_items': wishlist_items
        })



        card.is_default = True
        card.save()
        return Response({'status': 'Card set as default'})


class SavedCardListCreateView(generics.ListCreateAPIView):
    """List and create saved cards"""
    serializer_class = SavedCardSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return SavedCard.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        is_first = not SavedCard.objects.filter(user=self.request.user).exists()
        serializer.save(user=self.request.user, is_default=is_first)


class SavedCardDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a saved card"""
    serializer_class = SavedCardSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return SavedCard.objects.filter(user=self.request.user)


class SetDefaultCardView(APIView):
    """Set a card as default"""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            card = SavedCard.objects.get(pk=pk, user=request.user)
            SavedCard.objects.filter(user=request.user).update(is_default=False)
            card.is_default = True
            card.save()
            return Response({'status': 'Card set as default'})
        except SavedCard.DoesNotExist:
            return Response({'error': 'Card not found'}, status=404)
