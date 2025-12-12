from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from django.conf import settings
import os
from datetime import datetime


def generate_invoice_pdf(order):
    """
    Generate a professional PDF invoice for the given order.
    Returns the file path of the generated PDF.
    """
    # Create invoices directory if it doesn't exist
    invoice_dir = os.path.join(settings.MEDIA_ROOT, 'invoices')
    os.makedirs(invoice_dir, exist_ok=True)
    
    # Generate filename
    filename = f'invoice_{order.invoice_number}.pdf'
    filepath = os.path.join(invoice_dir, filename)
    
    # Create PDF
    doc = SimpleDocTemplate(filepath, pagesize=letter, 
                           topMargin=0.5*inch, bottomMargin=0.5*inch,
                           leftMargin=0.75*inch, rightMargin=0.75*inch)
    elements = []
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=28,
        textColor=colors.HexColor('#1E3A5F'),
        spaceAfter=6,
        alignment=TA_LEFT,
        fontName='Helvetica-Bold'
    )
    
    subtitle_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Normal'],
        fontSize=11,
        textColor=colors.HexColor('#64748B'),
        spaceAfter=20,
    )
    
    section_header_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontSize=12,
        textColor=colors.HexColor('#1E3A5F'),
        spaceBefore=15,
        spaceAfter=8,
        fontName='Helvetica-Bold'
    )
    
    # ========== HEADER SECTION ==========
    header_data = [
        [Paragraph("🏪 SPORT STORE", title_style), 
         Paragraph(f"<b>INVOICE</b><br/><font size='10' color='#64748B'>#{order.invoice_number}</font>", 
                  ParagraphStyle('InvoiceNum', alignment=TA_RIGHT, fontSize=24, textColor=colors.HexColor('#3B82F6')))]
    ]
    header_table = Table(header_data, colWidths=[4*inch, 3*inch])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 15),
    ]))
    elements.append(header_table)
    
    # Divider line
    elements.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#3B82F6'), spaceAfter=20))
    
    # ========== ORDER DETAILS BOX ==========
    order_date = order.created_at.strftime('%B %d, %Y at %H:%M')
    
    details_data = [
        [Paragraph("<b>Order Date</b>", styles['Normal']), 
         Paragraph(order_date, styles['Normal']),
         Paragraph("<b>Order Status</b>", styles['Normal']),
         Paragraph(order.get_status_display(), styles['Normal'])],
        [Paragraph("<b>Payment Status</b>", styles['Normal']),
         Paragraph("✓ Confirmed" if order.payment_confirmed else "Pending", styles['Normal']),
         Paragraph("<b>Payment Method</b>", styles['Normal']),
         Paragraph(f"{order.payment_method} •••• {order.card_last_4}" if order.card_last_4 else "N/A", styles['Normal'])]
    ]
    
    details_table = Table(details_data, colWidths=[1.5*inch, 2*inch, 1.5*inch, 2*inch])
    details_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('RIGHTPADDING', (0, 0), (-1, -1), 12),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elements.append(details_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # ========== CUSTOMER & BILLING INFO ==========
    customer_name = order.user.get_full_name() or order.user.username
    
    billing_data = [
        [Paragraph("<b>BILL TO</b>", section_header_style), 
         Paragraph("<b>SHIP TO</b>", section_header_style)],
        [Paragraph(f"<b>{customer_name}</b><br/>{order.user.email}", styles['Normal']),
         Paragraph(f"<b>{customer_name}</b><br/>{order.delivery_address}", styles['Normal'])]
    ]
    
    billing_table = Table(billing_data, colWidths=[3.5*inch, 3.5*inch])
    billing_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(billing_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # ========== ORDER ITEMS TABLE ==========
    elements.append(Paragraph("<b>ORDER ITEMS</b>", section_header_style))
    
    items_header = [['Product', 'Qty', 'Unit Price', 'Subtotal']]
    items_data = []
    
    for item in order.items.all():
        items_data.append([
            item.product.name,
            str(item.quantity),
            f'{item.price:.2f} TL',
            f'{item.subtotal:.2f} TL'
        ])
    
    items_table = Table(items_header + items_data, colWidths=[3.5*inch, 0.8*inch, 1.35*inch, 1.35*inch])
    items_table.setStyle(TableStyle([
        # Header
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1E3A5F')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('TOPPADDING', (0, 0), (-1, 0), 12),
        
        # Data rows
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 10),
        ('TOPPADDING', (0, 1), (-1, -1), 10),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#FFFFFF')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor('#FFFFFF'), colors.HexColor('#F8FAFC')]),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        
        # Alignment
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
        ('ALIGN', (2, 0), (-1, -1), 'RIGHT'),
        ('ALIGN', (3, 0), (-1, -1), 'RIGHT'),
    ]))
    elements.append(items_table)
    
    # ========== TOTAL SECTION ==========
    elements.append(Spacer(1, 0.15*inch))
    
    total_data = [
        ['', '', 'Subtotal:', f'{order.total_price:.2f} TL'],
        ['', '', 'Shipping:', 'FREE'],
        ['', '', 'TOTAL:', f'{order.total_price:.2f} TL'],
    ]
    
    total_table = Table(total_data, colWidths=[3.5*inch, 0.8*inch, 1.35*inch, 1.35*inch])
    total_table.setStyle(TableStyle([
        ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('ALIGN', (2, 0), (-1, -1), 'RIGHT'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        # Total row styling
        ('BACKGROUND', (2, -1), (-1, -1), colors.HexColor('#10B981')),
        ('TEXTCOLOR', (2, -1), (-1, -1), colors.whitesmoke),
        ('FONTNAME', (2, -1), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (2, -1), (-1, -1), 12),
        ('TOPPADDING', (2, -1), (-1, -1), 10),
        ('BOTTOMPADDING', (2, -1), (-1, -1), 10),
    ]))
    elements.append(total_table)
    
    # ========== FOOTER ==========
    elements.append(Spacer(1, 0.5*inch))
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#E2E8F0'), spaceAfter=15))
    
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=9,
        textColor=colors.HexColor('#64748B'),
        alignment=TA_CENTER,
    )
    
    elements.append(Paragraph("Thank you for shopping with Sport Store!", footer_style))
    elements.append(Paragraph("If you have any questions, please contact us at support@sportstore.com", footer_style))
    elements.append(Spacer(1, 0.2*inch))
    elements.append(Paragraph(f"Generated on {datetime.now().strftime('%B %d, %Y at %H:%M')}", footer_style))
    
    # Build PDF
    doc.build(elements)
    
    return filepath

