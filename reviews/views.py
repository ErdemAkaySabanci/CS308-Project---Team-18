from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, AllowAny
from django.shortcuts import get_object_or_404

from .models import Review
from .serializers import (
    ReviewSerializer, 
    ReviewCreateSerializer, 
    ReviewPublicSerializer
)
from products.models import Product
from orders.models import Order, OrderItem


class ProductReviewsView(APIView):
    """Get all reviews for a product (public view)"""
    permission_classes = [AllowAny]
    
    def get(self, request, product_id):
        product = get_object_or_404(Product, id=product_id)
        reviews = Review.objects.filter(product=product)
        
        # Calculate average rating (ratings are always visible)
        total_ratings = reviews.count()
        avg_rating = None
        if total_ratings > 0:
            avg_rating = sum(r.rating for r in reviews) / total_ratings
        
        serializer = ReviewPublicSerializer(reviews, many=True)
        
        return Response({
            'product_id': product_id,
            'product_name': product.name,
            'average_rating': round(avg_rating, 1) if avg_rating else None,
            'total_reviews': total_ratings,
            'reviews': serializer.data
        })


class CheckReviewEligibilityView(APIView):
    """
    Check if user can review a specific product.
    Returns eligibility status and reason.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, product_id):
        user = request.user
        product = get_object_or_404(Product, id=product_id)
        
        # Check 1: Has user already reviewed this product?
        existing_review = Review.objects.filter(user=user, product=product).first()
        if existing_review:
            return Response({
                'can_review': False,
                'reason': 'already_reviewed',
                'message': 'You have already reviewed this product.',
                'existing_review': ReviewSerializer(existing_review).data
            })
        
        # Check 2: Does user have a DELIVERED order with this product?
        delivered_orders = Order.objects.filter(user=user, status='delivered')
        has_delivered_product = OrderItem.objects.filter(
            order__in=delivered_orders,
            product=product
        ).exists()
        
        if not has_delivered_product:
            # Check if user has ordered but not yet delivered
            all_orders = Order.objects.filter(user=user)
            has_ordered = OrderItem.objects.filter(
                order__in=all_orders,
                product=product
            ).exists()
            
            if has_ordered:
                return Response({
                    'can_review': False,
                    'reason': 'not_delivered',
                    'message': 'Your order containing this product has not been delivered yet. You can review after delivery.'
                })
            else:
                return Response({
                    'can_review': False,
                    'reason': 'not_purchased',
                    'message': 'You need to purchase and receive this product before you can review it.'
                })
        
        # User can review!
        return Response({
            'can_review': True,
            'reason': 'eligible',
            'message': 'You can review this product.'
        })


class CreateReviewView(APIView):
    """Create a review - only for users who purchased and received the product"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        user = request.user
        product_id = request.data.get('product')
        
        # Check if product exists
        product = get_object_or_404(Product, id=product_id)
        
        # Check if user already reviewed this product
        if Review.objects.filter(user=user, product=product).exists():
            return Response(
                {'error': 'You have already reviewed this product.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user has a DELIVERED order containing this product
        delivered_orders = Order.objects.filter(
            user=user, 
            status='delivered'
        )
        
        has_purchased = OrderItem.objects.filter(
            order__in=delivered_orders,
            product=product
        ).exists()
        
        if not has_purchased:
            return Response(
                {'error': 'You can only review products that have been delivered to you.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Create review
        serializer = ReviewCreateSerializer(data=request.data)
        if serializer.is_valid():
            review = serializer.save(user=user, product=product)
            
            # Rating is immediately visible, comment needs approval
            return Response({
                'message': 'Review submitted successfully! Your rating is visible immediately. Your comment will be visible after approval by the product manager.',
                'review': ReviewSerializer(review).data
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MyReviewsView(APIView):
    """Get current user's reviews"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        reviews = Review.objects.filter(user=request.user)
        serializer = ReviewSerializer(reviews, many=True)
        return Response(serializer.data)


class UpdateReviewView(APIView):
    """Update own review"""
    permission_classes = [IsAuthenticated]
    
    def put(self, request, review_id):
        review = get_object_or_404(Review, id=review_id, user=request.user)
        
        rating = request.data.get('rating', review.rating)
        comment = request.data.get('comment', review.comment)
        
        if rating < 1 or rating > 5:
            return Response(
                {'error': 'Rating must be between 1 and 5.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        review.rating = rating
        review.comment = comment
        review.is_approved = False  # Reset approval when comment is updated
        review.save()
        
        return Response({
            'message': 'Review updated. Comment will need re-approval.',
            'review': ReviewSerializer(review).data
        })
    
    def delete(self, request, review_id):
        review = get_object_or_404(Review, id=review_id, user=request.user)
        review.delete()
        return Response({'message': 'Review deleted.'}, status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------
# USER: Products eligible for review (delivered but not reviewed)
# ---------------------------------------------------------
class MyReviewableProductsView(APIView):
    """Get list of products user can review (delivered but not yet reviewed)"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Get all delivered order items
        delivered_orders = Order.objects.filter(user=user, status='delivered')
        delivered_items = OrderItem.objects.filter(order__in=delivered_orders)
        
        # Get products user already reviewed
        reviewed_product_ids = Review.objects.filter(user=user).values_list('product_id', flat=True)
        
        # Filter to products not yet reviewed
        reviewable_products = []
        seen_product_ids = set()
        
        for item in delivered_items:
            if item.product_id not in reviewed_product_ids and item.product_id not in seen_product_ids:
                seen_product_ids.add(item.product_id)
                reviewable_products.append({
                    'product_id': item.product.id,
                    'product_name': item.product.name,
                    'product_image': item.product.image.url if item.product.image else None,
                    'order_id': item.order.id,
                    'delivered_at': item.order.updated_at
                })
        
        return Response({
            'count': len(reviewable_products),
            'products': reviewable_products
        })


# ---------------------------------------------------------
# PRODUCT MANAGER - Approve/Reject Comments
# ---------------------------------------------------------
class PendingReviewsView(APIView):
    """Get all pending reviews (for product manager)"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Check if user is product manager
        if request.user.role != 'product_manager' and not request.user.is_staff:
            return Response(
                {'error': 'Only product managers can access this.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        pending_reviews = Review.objects.filter(is_approved=False, comment__gt='')
        serializer = ReviewSerializer(pending_reviews, many=True)
        return Response(serializer.data)


class ApproveReviewView(APIView):
    """Approve or reject a review comment (for product manager)"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, review_id):
        # Check if user is product manager
        if request.user.role != 'product_manager' and not request.user.is_staff:
            return Response(
                {'error': 'Only product managers can approve reviews.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        review = get_object_or_404(Review, id=review_id)
        action = request.data.get('action')  # 'approve' or 'reject'
        
        if action == 'approve':
            review.is_approved = True
            review.save()
            return Response({'message': 'Review comment approved.'})
        elif action == 'reject':
            # Keep the rating but clear the comment
            review.comment = ''
            review.save()
            return Response({'message': 'Review comment rejected and removed.'})
        else:
            return Response(
                {'error': 'Invalid action. Use "approve" or "reject".'},
                status=status.HTTP_400_BAD_REQUEST
            )



