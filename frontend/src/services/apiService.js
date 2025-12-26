// frontend/src/services/apiService.js
import { authService } from "./authService";

const API_BASE_URL = "http://localhost:8000/api";

const getHeaders = () => {
  const token = authService.getToken();
  return token
    ? {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    }
    : {
      "Content-Type": "application/json",
    };
};

async function handleResponse(response, retryCallback) {
  if (response.status === 401) {
    const newToken = await authService.refreshToken();
    if (newToken) return retryCallback();

    return null;
  }
  return response.json();
}

export const apiService = {
  // -------------------------------
  // Generic GET
  // -------------------------------
  get: async (endpoint) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "GET",
      credentials: 'include',
      headers: getHeaders(),
    });
    return handleResponse(response, () => apiService.get(endpoint));
  },

  // -------------------------------
  // Generic POST
  // -------------------------------
  post: async (endpoint, data) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      credentials: 'include',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response, () => apiService.post(endpoint, data));
  },

  // -------------------------------
  // Generic PUT
  // -------------------------------
  put: async (endpoint, data) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "PUT",
      credentials: 'include',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response, () => apiService.put(endpoint, data));
  },

  // -------------------------------
  // Generic DELETE (Restored for compatibility)
  // -------------------------------
  delete: async (endpoint) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "DELETE",
      credentials: 'include',
      headers: getHeaders(),
    });
    return handleResponse(response, () => apiService.delete(endpoint));
  },

  // -------------------------------
  // Products
  // -------------------------------
  getProducts: () => apiService.get("/products/"),
  getProductDetail: (id) => apiService.get(`/products/${id}/`),
  getCategories: () => apiService.get("/categories/"),

  // -------------------------------
  // Cart API
  // -------------------------------
  getCart: () => apiService.get("/cart/"),

  addToCart: (productId, quantity = 1) =>
    apiService.post("/cart/", { product_id: productId, quantity }),

  updateCartItem: (itemId, quantity) =>
    apiService.put(`/cart/item/${itemId}/`, { quantity }),

  deleteCartItem: async (itemId) => {
    // This could also just use apiService.delete, but keeping origin/main impl
    const response = await fetch(`${API_BASE_URL}/cart/item/${itemId}/`, {
      method: "DELETE",
      credentials: 'include',
      headers: getHeaders(),
    });
    return handleResponse(response, () => apiService.deleteCartItem(itemId));
  },

  clearCart: async () => {
    const response = await fetch(`${API_BASE_URL}/cart/clear/`, {
      method: "DELETE",
      credentials: 'include',
      headers: getHeaders(),
    });
    return handleResponse(response, () => apiService.clearCart());
  },

  // -------------------------------
  // Orders
  // -------------------------------
  checkout: () => apiService.post("/orders/checkout/", {}),
  getOrderHistory: () => apiService.get("/orders/history/"),
  getInvoiceDetail: (id) => apiService.get(`/orders/invoice/${id}/`),

  // -------------------------------
  // User Address
  // -------------------------------
  getAddress: () => apiService.get(`/users/address/`),

  updateAddress: (address) => apiService.put(`/users/address/`, { home_address: address }),

  // -------------------------------
  // Wishlist
  // -------------------------------
  getWishlist: () => apiService.get("/users/wishlist/"),
  addToWishlist: (productId) => apiService.post("/users/wishlist/", { product_id: productId }),
  removeFromWishlist: (productId) => apiService.delete(`/users/wishlist/${productId}/`),
};
