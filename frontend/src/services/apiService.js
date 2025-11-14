// frontend/src/services/apiService.js

import { authService } from './authService';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

export const apiService = {
  // Make authenticated GET request
  get: async (endpoint) => {
    const token = authService.getToken();

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 401) {
      // Token expired, try to refresh
      const newToken = await authService.refreshToken();
      if (newToken) {
        // Retry with new token
        return apiService.get(endpoint);
      } else {
        // Refresh failed, redirect to login
        window.location.href = '/login';
        return null;
      }
    }

    return response.json();
  },

  // Make authenticated POST request
  post: async (endpoint, data) => {
    const token = authService.getToken();

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (response.status === 401) {
      const newToken = await authService.refreshToken();
      if (newToken) {
        return apiService.post(endpoint, data);
      } else {
        window.location.href = '/login';
        return null;
      }
    }

    return response.json();
  }
};