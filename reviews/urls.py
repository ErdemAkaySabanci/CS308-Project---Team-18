from django.urls import path
from .views import (
    ProductReviewsView,
    CreateReviewView,
    MyReviewsView,
    UpdateReviewView,
    PendingReviewsView,
    ApproveReviewView,
    CheckReviewEligibilityView,
    MyReviewableProductsView,
    MyReviewableProductsView,
)

urlpatterns = [
    # Public - Get reviews for a product
    path('product/<int:product_id>/', ProductReviewsView.as_view(), name='product-reviews'),
    
    # User - Check if can review a product
    path('check-eligibility/<int:product_id>/', CheckReviewEligibilityView.as_view(), name='check-review-eligibility'),
    
    # User - Get products eligible for review
    path('my-reviewable-products/', MyReviewableProductsView.as_view(), name='my-reviewable-products'),
    
    # User - CRUD reviews
    path('create/', CreateReviewView.as_view(), name='create-review'),
    path('my-reviews/', MyReviewsView.as_view(), name='my-reviews'),
    path('<int:review_id>/', UpdateReviewView.as_view(), name='update-review'),
    
    # Product Manager - Approve/Reject
    path('pending/', PendingReviewsView.as_view(), name='pending-reviews'),
    path('<int:review_id>/approve/', ApproveReviewView.as_view(), name='approve-review'),
    

]
