from functools import wraps
from django.core.exceptions import PermissionDenied
from django.contrib.auth.decorators import user_passes_test

def role_required(allowed_roles):
    """
    Decorator for views that checks whether a user has a particular role,
    redirecting to the login page if necessary. If the user is logged in,
    returns 403 Forbidden if the user does not have access.
    
    Usage:
    @role_required(['product_manager', 'sales_manager'])
    def my_view(request):
        ...
    """
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(request, *args, **kwargs):
            if not request.user.is_authenticated:
                # If not authenticated, let standard Django auth handle it 
                # (usually redirects to login or returns 401 depending on config)
                # But for strict API usage, raising PermissionDenied is often better 
                # if we want 403, or let DRF handle authentication.
                # Here we assume mixed usage, so we'll check authentication.
                from django.contrib.auth.views import redirect_to_login
                return redirect_to_login(request.get_full_path())

            if request.user.role not in allowed_roles:
                raise PermissionDenied

            return view_func(request, *args, **kwargs)
        return _wrapped_view
    return decorator
