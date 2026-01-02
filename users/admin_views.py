# users/admin_views.py
# Admin-specific API views for managing users, statistics, and analytics

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, BasePermission
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import timedelta
from .models import CustomUser
from .serializers import UserSerializer
from orders.models import Order
from products.models import Product, Category
from chat.models import ChatConversation
from orders.models import RefundRequest


class IsAdmin(BasePermission):
    """Only allow admin users"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_superuser


class AdminStatisticsView(APIView):
    """Get system-wide statistics"""
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        # Total users
        total_users = CustomUser.objects.count()
        active_users = CustomUser.objects.filter(is_active=True).count()
        
        # Total orders
        total_orders = Order.objects.count()
        
        # Total revenue
        total_revenue = Order.objects.filter(
            status__in=['delivered', 'shipped']
        ).aggregate(total=Sum('total_price'))['total'] or 0
        
        # Active support chats
        active_chats = ChatConversation.objects.filter(is_active=True).count()
        
        # Pending refund requests
        pending_refunds = RefundRequest.objects.filter(status='pending').count()
        
        # New users this month
        today = timezone.now()
        month_start = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        new_users_this_month = CustomUser.objects.filter(date_joined__gte=month_start).count()
        
        return Response({
            'total_users': total_users,
            'active_users': active_users,
            'total_orders': total_orders,
            'total_revenue': float(total_revenue),
            'active_chats': active_chats,
            'pending_refunds': pending_refunds,
            'new_users_this_month': new_users_this_month
        })


class AdminUserListView(APIView):
    """Get all users with search and filter"""
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        users = CustomUser.objects.all().order_by('-date_joined')
        
        # Search by name or email
        search = request.query_params.get('search', '')
        if search:
            users = users.filter(
                Q(username__icontains=search) | 
                Q(email__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            )
        
        # Filter by role
        role = request.query_params.get('role', '')
        if role:
            users = users.filter(role=role)
        
        # Filter by status
        is_active = request.query_params.get('is_active', '')
        if is_active:
            users = users.filter(is_active=is_active.lower() == 'true')
        
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)


class AdminUserUpdateView(APIView):
    """Update user role and status"""
    permission_classes = [IsAuthenticated, IsAdmin]

    def put(self, request, pk):
        try:
            user = CustomUser.objects.get(pk=pk)
        except CustomUser.DoesNotExist:
            return Response(
                {"error": "User not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Update role
        role = request.data.get('role')
        if role: # Allow setting any role string or Validate against choices
            user.role = role
        
        # Update active status
        if 'is_active' in request.data:
            user.is_active = request.data['is_active']
        
        user.save()
        
        serializer = UserSerializer(user)
        return Response(serializer.data)


class AdminAnalyticsView(APIView):
    """Get analytics data for charts"""
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        today = timezone.now()
        
        # Sales by month (last 6 months)
        sales_by_month = []
        for i in range(5, -1, -1):
            month_start = (today - timedelta(days=30*i)).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            if i == 0:
                month_end = today
            else:
                month_end = (today - timedelta(days=30*(i-1))).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            
            revenue = Order.objects.filter(
                created_at__gte=month_start,
                created_at__lt=month_end,
                status__in=['delivered', 'shipped']
            ).aggregate(total=Sum('total_price'))['total'] or 0
            
            sales_by_month.append({
                'month': month_start.strftime('%B %Y'),
                'revenue': float(revenue)
            })
        
        # Top 5 products
        top_products = Product.objects.annotate(
            order_count=Count('orderitem')
        ).order_by('-order_count')[:5]
        
        top_products_data = [{
            'name': p.name,
            'orders': p.order_count
        } for p in top_products]
        
        # User registrations by month (last 6 months)
        user_registrations = []
        for i in range(5, -1, -1):
            month_start = (today - timedelta(days=30*i)).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            if i == 0:
                month_end = today
            else:
                month_end = (today - timedelta(days=30*(i-1))).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            
            count = CustomUser.objects.filter(
                date_joined__gte=month_start,
                date_joined__lt=month_end
            ).count()
            
            user_registrations.append({
                'month': month_start.strftime('%B %Y'),
                'count': count
            })
        
        return Response({
            'sales_by_month': sales_by_month,
            'top_products': top_products_data,
            'user_registrations': user_registrations
        })


# --- NEW PRODUCT & ORDER VIEWS ---

class AdminProductListView(APIView):
    """List and Create Products"""
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        products = Product.objects.all().order_by('-id')
        search = request.query_params.get('search', '')
        if search:
            products = products.filter(name__icontains=search)
            
        # Manually serialize basic info to list
        data = []
        for p in products:
            try:
                data.append({
                    'id': p.id,
                    'name': p.name,
                    'price': float(p.price) if p.price else 0.0,
                    'stock': p.quantity_in_stock,
                    'category': p.category.name if p.category else 'Uncategorized',
                    'image': p.image.url if p.image else None
                })
            except Exception as e:
                print(f"Error serializing product {p.id}: {e}")
                continue
        return Response(data)

    def delete(self, request, pk):
        """Delete a product"""
        product = get_object_or_404(Product, pk=pk)
        product.delete()
        return Response({'message': 'Product deleted'})


class AdminProductUpdateView(APIView):
    """Update or Delete Product"""
    permission_classes = [IsAuthenticated, IsAdmin]
    
    def delete(self, request, pk): # Using this View for Delete for now
        try:
            product = Product.objects.get(pk=pk)
            product.delete()
            return Response({'message': 'Product deleted successfully'})
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=404)


class AdminOrderListView(APIView):
    """List Orders"""
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        orders = Order.objects.all().order_by('-created_at')
        search = request.query_params.get('search', '')
        if search:
            orders = orders.filter(id__icontains=search) # Order ID search
        
        status_filter = request.query_params.get('status', '')
        if status_filter:
            orders = orders.filter(status=status_filter)

        # Custom serialization for admin table
        data = []
        for o in orders:
            data.append({
                'id': o.id,
                'customer': f"{o.user.first_name} {o.user.last_name} ({o.user.email})",
                'total_price': float(o.total_price),
                'status': o.status,
                'created_at': o.created_at,
                'item_count': o.items.count()
            })
        return Response(data)


class AdminOrderUpdateView(APIView):
    """Update Order Status"""
    permission_classes = [IsAuthenticated, IsAdmin]

    def put(self, request, pk):
        try:
            order = Order.objects.get(pk=pk)
            new_status = request.data.get('status')
            if new_status:
                order.status = new_status
                order.save()
            return Response({'message': 'Order status updated'})
        except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=404)
