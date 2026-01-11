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

  postFormData: async (endpoint, formData) => {
    const headers = getHeaders();
    delete headers['Content-Type']; // Allow browser to set multipart/form-data boundary

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      credentials: 'include',
      headers: headers,
      body: formData,
    });
    return handleResponse(response, () => apiService.postFormData(endpoint, formData));
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
  requestRefund: (orderId, reason) => apiService.post(`/orders/${orderId}/refund/`, { reason }),

  // -------------------------------
  // User Address & Info
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
  // Chat / Support Agent
  // -------------------------------
  getChatConversations: () => apiService.get('/chat/conversations/'),
  createConversation: (sessionKey) => apiService.post('/chat/conversations/create/', { session_key: sessionKey }),
  getConversation: (id) => apiService.get(`/chat/conversations/${id}/`),
  claimConversation: (id) => apiService.post(`/chat/conversations/${id}/claim/`),
  resolveConversation: (id) => apiService.post(`/chat/conversations/${id}/resolve/`),
  getChatMessages: (conversationId) => apiService.get(`/chat/conversations/${conversationId}/messages/`),
  sendChatMessage: (conversationId, message, attachment = null) => {
    const formData = new FormData();
    if (message) formData.append('message', message);
    if (attachment) formData.append('attachment', attachment);
    return apiService.postFormData(`/chat/conversations/${conversationId}/messages/send/`, formData);
  },
  getCustomerInfo: (userId) => apiService.get(`/chat/customer/${userId}/`),

  // -------------------------------
  // ADMIN
  // -------------------------------
  getAdminStatistics: () => apiService.get('/users/admin/statistics/'),
  getAdminUsers: (params) => apiService.get('/users/admin/users/', { params }),
  updateUserRole: (userId, data) => apiService.put(`/users/admin/users/${userId}/`, data),
  getAdminAnalytics: () => apiService.get('/users/admin/analytics/'),

  getAdminProducts: (params) => apiService.get('/users/admin/products/', { params }),
  deleteAdminProduct: (id) => apiService.delete(`/users/admin/products/${id}/`),
  getAdminOrders: (params) => apiService.get('/users/admin/orders/', { params }),
  updateAdminOrderStatus: (id, status) => apiService.put(`/users/admin/orders/${id}/`, { status }),
};
