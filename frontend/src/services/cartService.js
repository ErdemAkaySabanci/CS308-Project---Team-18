import { apiService } from './apiService';

export const cartService = {
    // Get user's cart
    getCart: async () => {
        return await apiService.get('/cart/');
    },

    // Add item to cart
    addToCart: async (productId, quantity = 1) => {
    return await apiService.post('/cart/', {
        product_id: productId,
        quantity: quantity,
    });
},


    // Update item quantity
    updateItem: async (itemId, quantity) => {
        return await apiService.put(`/cart/item/${itemId}/`, {
            quantity: quantity
        });
    },

    // Remove item from cart
    removeItem: async (itemId) => {
        return await apiService.delete(`/cart/item/${itemId}/`);
    },

    // Clear cart
    clearCart: async () => {
        return await apiService.delete('/cart/clear/');
    }
};
