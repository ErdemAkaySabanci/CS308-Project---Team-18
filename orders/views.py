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

        # Extract payment data from request
        payment_data = request.data.get('payment', {})
        card_number = payment_data.get('card_number', '')
        card_last_4 = card_number[-4:] if len(card_number) >= 4 else ''

        # Order oluştur
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

        # OrderItem + stok düşme
        for item in cart.items.all():
            OrderItem.objects.create(
                order=order,
                product=item.product,
                quantity=item.quantity,
                price=item.product.discounted_price
            )

        #Stok azaltma ve popularity artırma
            item.product.quantity_in_stock -= item.quantity
            item.product.popularity += item.quantity  # Satış sayısına göre popularity artır
            # is_in_stock property olduğu için otomatik hesaplanır, set etmeye gerek yok
            item.product.save()

        # Sepeti temizle
        cart.items.all().delete()

        # Generate PDF invoice
        from .invoice_generator import generate_invoice_pdf
        from django.core.mail import EmailMessage
        
        try:
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

    def create(self, request, *args, **kwargs):
        user = request.user
        cart = Cart.objects.filter(user=user).first()

        if not cart or cart.items.count() == 0:
            return Response({"error": "Cart is empty"}, status=400)

        delivery_address = request.data.get("delivery_address", "")

        order = Order.objects.create(
            user=user,
            total_price=cart.total_price,
            delivery_address=delivery_address
        )

        for item in cart.items.all():
            OrderItem.objects.create(
                order=order,
                product=item.product,
                quantity=item.quantity,
                price=item.product.price
            )
            item.product.quantity_in_stock -= item.quantity
            item.product.save()

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
class UpdateOrderStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        order = get_object_or_404(Order, pk=pk)
        new_status = request.data.get("status")

        if new_status not in dict(Order.ORDER_STATUS):
            return Response({"error": "Invalid status"}, status=400)

        order.status = new_status
        order.save()

        return Response(
            {"message": "Order status updated."},
            status=200
        )


# ---------------------------------------------------------
# 5) INVOICE DOWNLOAD
# ---------------------------------------------------------
class InvoiceDownloadView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, order_id):
        from django.http import FileResponse, Http404
        import os
        
        # Get order and verify ownership
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
