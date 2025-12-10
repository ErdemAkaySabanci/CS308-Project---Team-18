import { apiService } from './apiService';

export const cartService = {
    // Get user's cart
    getCart: async () => {
        return await apiService.get('/cart/');
    },

    // Add item to cart
    addToCart: async (productId, quantity = 1) => {
    return await apiService.post('/cart/add/', {
        product_id: productId,
        quantity: quantity,
    });
},


    // Update item quantity
    updateItem: async (itemId, quantity) => {
        // apiService doesn't have PUT yet, let's use fetch directly or add PUT to apiService
        // For now, I'll implement a custom put here reusing auth logic if possible, 
        // but since apiService is simple, I'll just use it if I can or extend it.
        // Wait, apiService only has get and post. I should probably extend apiService first or just implement it here.
        // Let's stick to the pattern in apiService but implement locally for now to avoid modifying apiService unless necessary.

        // Actually, it's better to update apiService to support PUT and DELETE.
        // But to minimize changes to existing files I haven't been asked to touch, I will implement a helper here.
        // However, for consistency, I'll just assume I can use a similar pattern.

        // Let's just use the authService.getToken() directly here.

        const { authService } = require('./authService'); // Dynamic import to avoid circular dependency if any
        const token = authService.getToken();
        const API_BASE_URL = 'http://127.0.0.1:8000/api';

        const response = await fetch(`${API_BASE_URL}/cart/item/${itemId}/`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ quantity }),
        });

        if (response.status === 401) {
            // Handle refresh logic similar to apiService if needed, 
            // but for now let's assume valid token or simple fail
            const newToken = await authService.refreshToken();
            if (newToken) {
                return cartService.updateItem(itemId, quantity);
            }
        }
        return response.json();
    },

    // Remove item from cart
    removeItem: async (itemId) => {
        const { authService } = require('./authService');
        const token = authService.getToken();
        const API_BASE_URL = 'http://127.0.0.1:8000/api';

        const response = await fetch(`${API_BASE_URL}/cart/item/${itemId}/`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (response.status === 401) {
            const newToken = await authService.refreshToken();
            if (newToken) {
                return cartService.removeItem(itemId);
            }
        }
        return response.json();
    },

    // Clear cart
    clearCart: async () => {
        const { authService } = require('./authService');
        const token = authService.getToken();
        const API_BASE_URL = 'http://127.0.0.1:8000/api';

        const response = await fetch(`${API_BASE_URL}/cart/clear/`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (response.status === 401) {
            const newToken = await authService.refreshToken();
            if (newToken) {
                return cartService.clearCart();
            }
        }
        return response.json();
    }
};
