from rest_framework import serializers
from .models import ChatConversation, ChatMessage
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'first_name', 'last_name')

class ChatMessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    attachment_url = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatMessage
        fields = ('id', 'conversation', 'sender', 'is_customer', 'message', 'attachment', 'attachment_url', 'created_at', 'is_read')
        read_only_fields = ('id', 'created_at', 'is_read')
    
    def get_attachment_url(self, obj):
        if obj.attachment:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.attachment.url)
            return obj.attachment.url
        return None

class ChatConversationSerializer(serializers.ModelSerializer):
    customer = UserSerializer(read_only=True)
    support_agent = UserSerializer(read_only=True)
    last_message = serializers.SerializerMethodField()
    class Meta:
        model = ChatConversation
        fields = ('id', 'customer', 'session_key', 'support_agent', 'is_active', 'is_claimed', 'created_at', 'updated_at', 'closed_at', 'last_message')
        read_only_fields = ('id', 'created_at', 'updated_at', 'closed_at')
    def get_last_message(self, obj):
        last = obj.messages.order_by('-created_at').first()
        return ChatMessageSerializer(last).data if last else None
