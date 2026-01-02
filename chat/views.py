from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import ChatConversation, ChatMessage
from .serializers import ChatConversationSerializer, ChatMessageSerializer


class IsSupportAgent(permissions.BasePermission):
    """Only allow support agents"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and getattr(request.user, 'role', '') == 'support_agent'


class ConversationListView(APIView):
    """List all active conversations for support agents"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Support agents see all active conversations
        if getattr(request.user, 'role', '') == 'support_agent':
            conversations = ChatConversation.objects.filter(is_active=True).order_by('-updated_at')
        else:
            # Customers see only their own
            conversations = ChatConversation.objects.filter(customer=request.user, is_active=True)
        
        serializer = ChatConversationSerializer(conversations, many=True)
        return Response(serializer.data)


class ConversationCreateView(APIView):
    """Create a new conversation (for customers/guests)"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        session_key = request.data.get('session_key')
        
        if request.user.is_authenticated:
            # Check if customer already has an active conversation
            existing = ChatConversation.objects.filter(customer=request.user, is_active=True).first()
            if existing:
                serializer = ChatConversationSerializer(existing)
                return Response(serializer.data, status=status.HTTP_200_OK)
            
            conversation = ChatConversation.objects.create(customer=request.user)
        else:
            # Guest user
            if not session_key:
                return Response({"error": "session_key required for guests"}, status=status.HTTP_400_BAD_REQUEST)
            
            existing = ChatConversation.objects.filter(session_key=session_key, is_active=True).first()
            if existing:
                serializer = ChatConversationSerializer(existing)
                return Response(serializer.data, status=status.HTTP_200_OK)
            
            conversation = ChatConversation.objects.create(session_key=session_key)
        
        serializer = ChatConversationSerializer(conversation)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ConversationDetailView(APIView):
    """Get conversation details"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        conversation = get_object_or_404(ChatConversation, pk=pk)
        serializer = ChatConversationSerializer(conversation)
        return Response(serializer.data)


class ClaimConversationView(APIView):
    """Support agent claims a conversation"""
    permission_classes = [permissions.IsAuthenticated, IsSupportAgent]

    def post(self, request, pk):
        conversation = get_object_or_404(ChatConversation, pk=pk)
        
        if conversation.is_claimed:
            return Response(
                {"error": "Bu konuşma zaten bir agent tarafından alınmış."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        conversation.support_agent = request.user
        conversation.is_claimed = True
        conversation.save()
        
        return Response({"message": "Konuşma başarıyla alındı.", "conversation_id": pk})


class ResolveConversationView(APIView):
    """Resolve/close a conversation"""
    permission_classes = [permissions.IsAuthenticated, IsSupportAgent]

    def post(self, request, pk):
        conversation = get_object_or_404(ChatConversation, pk=pk)
        
        conversation.is_active = False
        conversation.closed_at = timezone.now()
        conversation.save()
        
        return Response({"message": "Konuşma çözüldü ve kapatıldı."})


class MessageListView(APIView):
    """Get messages for a conversation"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        conversation = get_object_or_404(ChatConversation, pk=pk)
        messages = ChatMessage.objects.filter(conversation=conversation).order_by('created_at')
        serializer = ChatMessageSerializer(messages, many=True)
        return Response(serializer.data)


class MessageCreateView(APIView):
    """Send a message in a conversation"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        conversation = get_object_or_404(ChatConversation, pk=pk)
        
        message_text = request.data.get('message')
        attachment = request.FILES.get('attachment')
        
        if not message_text and not attachment:
            return Response({"error": "Message or attachment required"}, status=status.HTTP_400_BAD_REQUEST)
        
        is_customer = getattr(request.user, 'role', 'customer') == 'customer'
        
        message = ChatMessage.objects.create(
            conversation=conversation,
            sender=request.user,
            is_customer=is_customer,
            message=message_text or '',
            attachment=attachment
        )
        
        # Update conversation timestamp
        conversation.save()  # This triggers auto_now on updated_at
        
        serializer = ChatMessageSerializer(message)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class CustomerInfoView(APIView):
    """Get customer details for support agents"""
    permission_classes = [permissions.IsAuthenticated, IsSupportAgent]

    def get(self, request, user_id):
        from django.contrib.auth import get_user_model
        from orders.models import Order
        from cart.models import CartItem
        from products.models import Wishlist
        
        User = get_user_model()
        customer = get_object_or_404(User, pk=user_id)
        
        # Get orders
        orders = Order.objects.filter(user=customer).order_by('-created_at')[:5]
        orders_data = [{
            'id': o.id,
            'date': o.created_at.strftime('%Y-%m-%d'),
            'total': str(o.total_price),
            'status': o.status
        } for o in orders]
        
        # Get cart count
        cart_count = CartItem.objects.filter(user=customer).count()
        
        # Get wishlist count
        try:
            wishlist = Wishlist.objects.get(user=customer)
            wishlist_count = wishlist.products.count()
        except Wishlist.DoesNotExist:
            wishlist_count = 0
        
        return Response({
            'id': customer.id,
            'name': f"{customer.first_name} {customer.last_name}".strip() or customer.username,
            'email': customer.email,
            'orders': orders_data,
            'cart_count': cart_count,
            'wishlist_count': wishlist_count
        })
