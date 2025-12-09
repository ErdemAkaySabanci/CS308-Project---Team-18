from rest_framework import status, generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db import transaction
from django.core.mail import EmailMessage
from django.conf import settings
from django.core.files.base import ContentFile

from .models import Order, OrderItem
from .serializers import OrderSerializer, OrderCreateSerializer
from cart.models import Cart

import uuid
import io

# PDF Kütüphanesi
# DİKKAT: Terminalde 'pip install reportlab' komutunu çalıştırmayı unutma!
from reportlab.pdfgen import canvas

# --- YARDIMCI FONKSİYONLAR ---

def mock_payment_process(card_details, amount):
    """Sahte banka ödeme onayı simülasyonu"""
    if not card_details:
        # Mock olduğu için kart detayı boş gelse bile hata vermesin diye
        # test amaçlı True döndürebilirsin veya False yapabilirsin.
        # Şimdilik kart detayı yoksa ödeme başarısız diyoruz:
        return False, "No card details provided"
    
    # Basit doğrulama: Kart numarası varsa onayla
    if len(str(card_details.get('number', ''))) > 5:
        return True, str(uuid.uuid4())
    
    return False, "Invalid card details"

def generate_and_email_invoice(order):
    """PDF fatura oluşturur ve e-posta ile gönderir"""
    try:
        # 1. PDF Oluştur (Bellekte)
        buffer = io.BytesIO()
        p = canvas.Canvas(buffer)
        
        # PDF İçeriğini Çiz
        p.setFont("Helvetica-Bold", 16)
        p.drawString(100, 800, f"INVOICE")
        p.setFont("Helvetica", 12)
        p.drawString(100, 780, f"Order ID: #{order.id}")
        p.drawString(100, 760, f"Date: {order.created_at.strftime('%Y-%m-%d')}")
        p.drawString(100, 740, f"Customer: {order.user.username}")
        p.drawString(100, 720, f"Total Amount: ${order.total_price}")
        p.drawString(100, 700, "-" * 50)
        
        y = 680
        for item in order.items.all():
            text = f"{item.product.name} (x{item.quantity}) - ${item.price}"
            p.drawString(100, y, text)
            y -= 20
            
        p.showPage()
        p.save()
        
        # 2. Dosyayı Kaydet
        buffer.seek(0)
        file_name = f"invoice_{order.id}.pdf"
        order.invoice_file.save(file_name, ContentFile(buffer.read()), save=True)
        
        # 3. E-posta Gönder
        if order.user.email:
            email = EmailMessage(
                subject=f'Your Invoice - Order #{order.id}',
                body=f'Hello {order.user.username},\n\nThank you for your purchase. Your invoice is attached.',
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'admin@example.com'),
                to=[order.user.email],
            )
            buffer.seek(0)
            email.attach(file_name, buffer.read(), 'application/pdf')
            email.send(fail_silently=True)
            
    except Exception as e:
        print(f"Fatura oluşturma hatası: {str(e)}")

# --- API VIEWS ---

class OrderCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = OrderCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        delivery_address = serializer.validated_data['delivery_address']
        card_details = request.data.get('card_details', {}) # Frontend'den gelmeli
        user = request.user

        # Sepet Kontrolü
        try:
            cart = Cart.objects.get(user=user)
            cart_items = cart.items.all()
            if not cart_items.exists():
                return Response({"error": "Cart is empty"}, status=status.HTTP_400_BAD_REQUEST)
        except Cart.DoesNotExist:
            return Response({"error": "Cart is empty"}, status=status.HTTP_400_BAD_REQUEST)

        total_price = 0
        
        # Stok ve Fiyat Hesaplama
        for item in cart_items:
            if item.quantity > item.product.quantity_in_stock:
                return Response(
                    {"error": f"Not enough stock for {item.product.name}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            total_price += item.quantity * item.product.price

        # 1. Ödeme İşlemi (Mock)
        is_paid, transaction_result = mock_payment_process(card_details, total_price)
        
        # Test ederken kart bilgisi girmek zor gelirse burayı geçici olarak kapatabilirsin:
        # if not is_paid:
        #     return Response({"error": "Payment failed"}, status=402)

        # 2. Sipariş Oluşturma (Transaction)
        with transaction.atomic():
            order = Order.objects.create(
                user=user,
                total_price=total_price,
                delivery_address=delivery_address,
                invoice_number=str(uuid.uuid4()),
                payment_confirmed=is_paid,
                transaction_id=transaction_result if is_paid else None
            )

            for item in cart_items:
                OrderItem.objects.create(
                    order=order,
                    product=item.product,
                    quantity=item.quantity,
                    price=item.product.price
                )
                # Stok düş
                item.product.quantity_in_stock -= item.quantity
                item.product.save()

            # Sepeti boşalt
            cart_items.delete()
            
            # 3. Fatura PDF ve E-posta
            if is_paid:
                generate_and_email_invoice(order)

        return Response({
            "order": OrderSerializer(order).data,
            "message": "Sipariş başarılı, fatura e-posta adresinize gönderildi."
        }, status=status.HTTP_201_CREATED)


class OrderListView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).order_by('-created_at')


class OrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)