from django.urls import path
from . import views

urlpatterns = [
    # Conversations
    path('conversations/', views.ConversationListView.as_view(), name='conversation-list'),
    path('conversations/create/', views.ConversationCreateView.as_view(), name='conversation-create'),
    path('conversations/<int:pk>/', views.ConversationDetailView.as_view(), name='conversation-detail'),
    path('conversations/<int:pk>/claim/', views.ClaimConversationView.as_view(), name='conversation-claim'),
    path('conversations/<int:pk>/resolve/', views.ResolveConversationView.as_view(), name='conversation-resolve'),
    
    # Messages
    path('conversations/<int:pk>/messages/', views.MessageListView.as_view(), name='message-list'),
    path('conversations/<int:pk>/messages/send/', views.MessageCreateView.as_view(), name='message-send'),
    
    # Customer Info (for agents)
    path('customer/<int:user_id>/', views.CustomerInfoView.as_view(), name='customer-info'),
]
