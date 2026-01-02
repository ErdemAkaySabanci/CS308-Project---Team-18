from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status, generics, permissions
from rest_framework.generics import ListAPIView
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.utils.crypto import get_random_string
from django.conf import settings

from cart.models import Cart
from .models import Order, OrderItem
from .serializers import OrderSerializer
from products.models import Product


# ---------------------------------------------------------
# 1) CHECKOUT → CART → ORDER
# ---------------------------------------------------------
class CheckoutView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        user = request.user

        if not user.home_address:
            return Response(
                {"error": "Please add your home address before checkout."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            cart = Cart.objects.get(user=user)
        except Cart.DoesNotExist:
            return Response({"error": "Cart is empty."}, status=400)

        if cart.items.count() == 0:
            return Response({"error": "Cart is empty."}, status=400)

        # RACE CONDITION KORUMASINA ÖNCE STOK KONTROLÜ
        # Cart item'ları select_related ile çek
        cart_items = cart.items.select_related('product').all()

        # Tüm ürünleri kilitle ve stok kontrolü yap
        for item in cart_items:
            # select_for_update ile ürünü kilitle (pessimistic locking)
            try:
                product = Product.objects.select_for_update().get(id=item.product.id)
            except Product.DoesNotExist:
                return Response(
                    {"error": f"Ürün bulunamadı: {item.product.name}"},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Stok kontrolü - race condition'dan koruma
            if product.quantity_in_stock < item.quantity:
                return Response(
                    {
                        "error": "Yetersiz stok",
                        "product": product.name,
                        "available": product.quantity_in_stock,
                        "requested": item.quantity
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Extract payment data from request
        payment_data = request.data.get('payment', {})
        card_number = payment_data.get('card_number', '')
        card_last_4 = card_number[-4:] if len(card_number) >= 4 else ''

        # Order oluştur (stok kontrolü başarılı olduktan sonra)
        order = Order.objects.create(
            user=user,
            status="processing",
            total_price=cart.total_price,
            delivery_address=user.home_address,
            invoice_number=get_random_string(12),
            payment_confirmed=True,
            payment_method="Credit Card",
            card_last_4=card_last_4
        )

        # OrderItem oluştur + stok düşme (select_for_update ile güvenli)
        for item in cart_items:
            # Ürünü tekrar kilitle (transaction içinde)
            product = Product.objects.select_for_update().get(id=item.product.id)

            # OrderItem oluştur
            OrderItem.objects.create(
                order=order,
                product=product,
                quantity=item.quantity,
                price=product.discounted_price
            )

            # Stok azaltma ve popularity artırma
            product.quantity_in_stock -= item.quantity
            product.popularity += item.quantity
            product.version += 1  # Optimistic locking için version artır
            product.save()

        # Sepeti temizle
        cart.items.all().delete()

        # Generate PDF invoice (optional - skip if reportlab not installed)
        try:
            from .invoice_generator import generate_invoice_pdf
            from django.core.mail import EmailMessage

            pdf_path = generate_invoice_pdf(order)
            
            # Save relative path (from media root) to order
            relative_path = f'invoices/invoice_{order.invoice_number}.pdf'
            order.invoice_file = relative_path
            order.save()
            
            # Send email with PDF attachment
            email = EmailMessage(
                subject=f'Invoice for Order #{order.invoice_number}',
                body=f'Dear {user.get_full_name() or user.username},\n\nThank you for your order! Please find your invoice attached.\n\nOrder Details:\n- Invoice Number: {order.invoice_number}\n- Total: {order.total_price} TL\n- Payment: Card ending in {order.card_last_4}\n\nBest regards,\nSport Store Team',
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[user.email],
            )
            email.attach_file(pdf_path)
            email.send()
            
        except Exception as e:
            # Log error but don't fail the order
            print(f"Error generating/sending invoice: {e}")

        return Response(
            {
                "message": "Order successfully created.",
                "order_id": order.id,
                "invoice_number": order.invoice_number,
                "invoice_url": f"/api/orders/{order.id}/invoice/download/"
            },
            status=201
        )


# ---------------------------------------------------------
# 2) ORDER HISTORY (SIPARIS GECMISI)
# ---------------------------------------------------------
class OrderHistoryView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = OrderSerializer

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).order_by('-created_at')


# ---------------------------------------------------------
# 3) INVOICE
# ---------------------------------------------------------
class InvoiceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        order = get_object_or_404(Order, id=pk, user=request.user)
        serializer = OrderSerializer(order)
        return Response(serializer.data)


# ---------------------------------------------------------
# 4) REST API: LIST + CREATE
# ---------------------------------------------------------
class OrderListCreateView(generics.ListCreateAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        user = request.user
        cart = Cart.objects.filter(user=user).first()

        if not cart or cart.items.count() == 0:
            return Response({"error": "Cart is empty"}, status=400)

        # RACE CONDITION KORUMASINA ÖNCE STOK KONTROLÜ
        cart_items = cart.items.select_related('product').all()

        # Tüm ürünleri kilitle ve stok kontrolü yap
        for item in cart_items:
            try:
                product = Product.objects.select_for_update().get(id=item.product.id)
            except Product.DoesNotExist:
                return Response(
                    {"error": f"Ürün bulunamadı: {item.product.name}"},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Stok kontrolü - race condition'dan koruma
            if product.quantity_in_stock < item.quantity:
                return Response(
                    {
                        "error": "Yetersiz stok",
                        "product": product.name,
                        "available": product.quantity_in_stock,
                        "requested": item.quantity
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        delivery_address = request.data.get("delivery_address", "")

        order = Order.objects.create(
            user=user,
            total_price=cart.total_price,
            delivery_address=delivery_address
        )

        # OrderItem oluştur + stok düşme (select_for_update ile güvenli)
        for item in cart_items:
            product = Product.objects.select_for_update().get(id=item.product.id)

            OrderItem.objects.create(
                order=order,
                product=product,
                quantity=item.quantity,
                price=product.price
            )
            product.quantity_in_stock -= item.quantity
            product.version += 1  # Optimistic locking için version artır
            product.save()

        cart.items.all().delete()
        return Response(OrderSerializer(order).data, status=201)


# ---------------------------------------------------------
# 5) ORDER DETAIL
# ---------------------------------------------------------
class OrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)


# ---------------------------------------------------------
# 6) ORDER STATUS UPDATE (PATCH)
# ---------------------------------------------------------
def send_status_update_email(order, new_status):
    """Send email notification when order status changes"""
    from django.core.mail import EmailMessage

    status_messages = {
        'processing': {
            'subject': f'Order #{order.invoice_number} - Processing',
            'body': f'Your order is being processed and will be shipped soon.'
        },
        'in_transit': {
            'subject': f'Order #{order.invoice_number} - In Transit',
            'body': f'Your order is on its way! You should receive it soon.'
        },
        'delivered': {
            'subject': f'Order #{order.invoice_number} - Delivered',
            'body': f'Your order has been delivered! We hope you enjoy your purchase.'
        },
        'cancelled': {
            'subject': f'Order #{order.invoice_number} - Cancelled',
            'body': f'Your order has been cancelled as requested.'
        }
    }

    msg_data = status_messages.get(new_status)
    if not msg_data:
        return

    try:
        email = EmailMessage(
            subject=msg_data['subject'],
            body=f"Dear {order.user.get_full_name() or order.user.username},\n\n{msg_data['body']}\n\nOrder Details:\n- Invoice Number: {order.invoice_number}\n- Total: {order.total_price} TL\n- Delivery Address: {order.delivery_address}\n\nBest regards,\nSport Store Team",
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[order.user.email],
        )
        email.send()
    except Exception as e:
        print(f"Error sending status update email: {e}")


class UpdateOrderStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        # Permission check - only sales_manager and product_manager can update order status
        if not hasattr(request.user, 'role') or request.user.role not in ['sales_manager', 'product_manager']:
            return Response(
                {"error": "Permission denied. Only Sales or Product Managers can update order status."},
                status=status.HTTP_403_FORBIDDEN
            )

        order = get_object_or_404(Order, pk=pk)
        new_status = request.data.get("status")

        # Validate status
        if new_status not in dict(Order.ORDER_STATUS):
            return Response({"error": "Invalid status"}, status=400)

        # Check if transition is valid
        valid_transitions = order.get_valid_next_statuses()
        if new_status != order.status and new_status not in valid_transitions:
            return Response({
                "error": f"Invalid status transition. From '{order.status}' you can only transition to: {', '.join(valid_transitions)}",
                "current_status": order.status,
                "valid_next_statuses": valid_transitions
            }, status=400)

        # Update status and log
        old_status = order.status
        order.status = new_status
        order.add_status_log(new_status, updated_by=request.user)
        order.save()

        # Send email notification
        send_status_update_email(order, new_status)

        return Response({
            "message": "Order status updated successfully.",
            "old_status": old_status,
            "new_status": new_status,
            "status_log": order.status_log
        }, status=200)


# ---------------------------------------------------------
# 5) INVOICE DOWNLOAD
# ---------------------------------------------------------
class InvoiceDownloadView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, order_id):
        from django.http import FileResponse, Http404
        import os
        
        # Sales Manager can access all invoices, regular users only their own
        if hasattr(request.user, 'role') and request.user.role == 'sales_manager':
            order = get_object_or_404(Order, id=order_id)
        else:
            order = get_object_or_404(Order, id=order_id, user=request.user)
        
        # Check if invoice exists
        if not order.invoice_file:
            return Response(
                {"error": "Invoice not found for this order."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get file path - handle both old and new path formats
        invoice_name = str(order.invoice_file).replace('\\media\\', '').replace('/media/', '').lstrip('/\\')
        file_path = os.path.join(settings.MEDIA_ROOT, invoice_name)
        
        if not os.path.exists(file_path):
            return Response(
                {"error": "Invoice file not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Return PDF file
        try:
            return FileResponse(
                open(file_path, 'rb'),
                content_type='application/pdf',
                as_attachment=True,
                filename=f'invoice_{order.invoice_number}.pdf'
            )
        except Exception as e:
            return Response(
                {"error": f"Error downloading invoice: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ---------------------------------------------------------
# 7) REVENUE & PROFIT REPORT (SALES MANAGER)
# ---------------------------------------------------------
class RevenueReportView(APIView):
    """
    Sales Manager için revenue/profit raporu
    Tarih aralığına göre delivered siparişlerin gelir/maliyet/kar hesaplaması
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Role kontrolü - sadece sales_manager erişebilir
        if not hasattr(request.user, 'role') or request.user.role != 'sales_manager':
            return Response(
                {"error": "Permission denied. Only Sales Managers can access this report."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Tarih parametrelerini al
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if not start_date or not end_date:
            return Response(
                {"error": "Both start_date and end_date are required (format: YYYY-MM-DD)"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Tarih aralığındaki delivered siparişleri getir
            orders = Order.objects.filter(
                created_at__gte=start_date,
                created_at__lte=end_date,
                status='delivered'
            ).prefetch_related('items__product')
            
            total_revenue = 0
            total_cost = 0
            order_count = orders.count()
            
            # Her sipariş için hesaplama
            for order in orders:
                total_revenue += float(order.total_price)
                
                # Her ürün için maliyet hesapla
                for item in order.items.all():
                    # Cost field'i varsa kullan, yoksa fiyatın %50'si
                    if item.product.cost:
                        product_cost = float(item.product.cost)
                    else:
                        product_cost = float(item.price) * 0.5
                    total_cost += product_cost * item.quantity
            
            # Kar/Zarar hesapla
            profit = total_revenue - total_cost
            profit_margin = (profit / total_revenue * 100) if total_revenue > 0 else 0
            
            return Response({
                "start_date": start_date,
                "end_date": end_date,
                "order_count": order_count,
                "total_revenue": round(total_revenue, 2),
                "total_cost": round(total_cost, 2),
                "profit": round(profit, 2),
                "profit_margin_percentage": round(profit_margin, 2),
                "status": "profit" if profit >= 0 else "loss"
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {"error": f"Error generating report: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ---------------------------------------------------------
# 8) INVOICE LIST (SALES MANAGER)
# ---------------------------------------------------------
class InvoiceListView(APIView):
    """
    Sales Manager için invoice listesi
    Tarih aralığına göre filtreleme
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Role kontrolü - sadece sales_manager erişebilir
        if not hasattr(request.user, 'role') or request.user.role != 'sales_manager':
            return Response(
                {"error": "Permission denied. Only Sales Managers can access invoices."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Tarih parametrelerini al
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        try:
            # Base queryset - sadece invoice_file olan siparişler
            orders = Order.objects.filter(
                invoice_file__isnull=False
            ).select_related('user').prefetch_related('items__product')
            
            # Tarih filtresi (opsiyonel)
            if start_date:
                orders = orders.filter(created_at__gte=start_date)
            if end_date:
                orders = orders.filter(created_at__lte=end_date)
            
            # Sıralama: En yeni önce
            orders = orders.order_by('-created_at')
            
            # Invoice listesi oluştur
            invoices = []
            for order in orders:
                invoices.append({
                    "id": order.id,
                    "invoice_number": order.invoice_number,
                    "order_id": order.id,
                    "customer_name": order.user.get_full_name() or order.user.username,
                    "customer_email": order.user.email,
                    "total_price": float(order.total_price),
                    "created_at": order.created_at.isoformat(),
                    "status": order.status,
                    "invoice_url": f"/api/orders/{order.id}/invoice/download/",
                    "delivery_address": order.delivery_address,
                    "payment_method": order.payment_method or "N/A",
                    "card_last_4": order.card_last_4 or "N/A"
                })
            
            return Response({
                "invoices": invoices,
                "total_count": len(invoices),
                "start_date": start_date,
                "end_date": end_date
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {"error": f"Error fetching invoices: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

