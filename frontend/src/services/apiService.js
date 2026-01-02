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
  // Generic PATCH
  // -------------------------------
  patch: async (endpoint, data) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "PATCH",
      credentials: 'include',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response, () => apiService.patch(endpoint, data));
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
  requestRefund: (orderId, reason) => apiService.post(`/orders/${orderId}/refund/`, { reason }),

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

  // -------------------------------
  // Product Manager API
  // -------------------------------
  // Products
  getAllProducts: () => apiService.get("/products-crud/"),
  createProduct: (data) => apiService.post("/products-crud/", data),
  updateProduct: (id, data) => apiService.put(`/products-crud/${id}/`, data),
  deleteProduct: (id) => apiService.delete(`/products-crud/${id}/`),

  // Categories
  createCategory: (data) => apiService.post("/categories-crud/", data),
  updateCategory: (id, data) => apiService.put(`/categories-crud/${id}/`, data),
  deleteCategory: (id) => apiService.delete(`/categories-crud/${id}/`),

  // Deliveries
  getDeliveries: () => apiService.get("/orders/deliveries/"),
  updateOrderStatus: (id, status) => apiService.patch(`/orders/${id}/status/`, { status }),

  // Comments / Reviews
  getPendingReviews: () => apiService.get("/reviews/pending/"),
  approveReview: (id, action) => apiService.post(`/reviews/${id}/approve/`, { action }), // action: 'approve' or 'reject'

  // Refunds
  getPendingRefunds: () => apiService.get("/orders/refunds/pending/"),
  processRefund: (id, action) => apiService.post(`/orders/refunds/${id}/approval/`, { action }), // action: 'approve' or 'reject'
};
