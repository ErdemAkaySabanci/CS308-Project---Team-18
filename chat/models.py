from django.db import models
from django.conf import settings


class ChatConversation(models.Model):
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='customer_chats',
        null=True,
        blank=True
    )
    session_key = models.CharField(max_length=40, null=True, blank=True)  # Guest users için
    support_agent = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_chats'
    )
    is_active = models.BooleanField(default=True)
    is_claimed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    closed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        if self.customer:
            return f"Chat with {self.customer.username}"
        return f"Guest chat {self.session_key}"


class ChatMessage(models.Model):
    conversation = models.ForeignKey(ChatConversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    is_customer = models.BooleanField(default=True)  # True: customer, False: support agent
    message = models.TextField()
    attachment = models.FileField(upload_to='chat_attachments/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Message in {self.conversation} at {self.created_at}"