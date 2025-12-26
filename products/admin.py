from django.contrib import admin
from .models import Category, Product


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_at', 'updated_at']
    search_fields = ['name', 'description']


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['product_id', 'name', 'category', 'price', 'discount_rate', 'discounted_price', 'quantity_in_stock', 'is_active', 'popularity']
    list_filter = ['category', 'is_active', 'created_at', 'distributor']
    search_fields = ['name', 'product_id', 'description', 'serial_number']
    list_editable = ['is_active', 'price', 'quantity_in_stock', 'discount_rate']
    readonly_fields = ['popularity', 'created_at', 'updated_at']
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'model', 'serial_number', 'product_id', 'description', 'category', 'image')
        }),
        ('Pricing & Stock', {
            'fields': ('price', 'cost', 'discount_rate', 'quantity_in_stock', 'is_active')
        }),
        ('Additional Info', {
            'fields': ('warranty_status', 'distributor', 'popularity')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )