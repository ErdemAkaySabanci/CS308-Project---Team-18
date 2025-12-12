from .models import Cart, CartItem
from django.db import transaction

def merge_cart(user, request):
    """
    Merge guest cart into user cart if it exists.
    """
    session_key = request.session.session_key
    if not session_key:
        return

    try:
        guest_cart = Cart.objects.get(session_key=session_key, user__isnull=True)
    except Cart.DoesNotExist:
        return

    # Get or create user cart
    user_cart, created = Cart.objects.get_or_create(user=user)

    with transaction.atomic():
        # Move items from guest cart to user cart
        for guest_item in guest_cart.items.all():
            # Check if item already exists in user cart
            user_item, created = CartItem.objects.get_or_create(
                cart=user_cart,
                product=guest_item.product,
                defaults={'quantity': guest_item.quantity}
            )

            if not created:
                # Update quantity if exists
                user_item.quantity += guest_item.quantity
                user_item.save()
            
        # Delete guest cart after merging
        guest_cart.delete()
