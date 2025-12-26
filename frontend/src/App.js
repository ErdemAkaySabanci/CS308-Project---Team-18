// frontend/src/App.js
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";

// Auth
import Login from "./components/Login";
import Register from "./pages/RegisterPage";
import Dashboard from "./components/Dashboard";
import AccountPage from "./pages/AccountPage";
import { authService } from "./services/authService";

// Pages
import ProductListPage from "./pages/ProductListPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CartPage from "./pages/CartPage";
import WishlistPage from "./pages/WishlistPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderHistoryPage from "./pages/OrderHistoryPage";
import SalesDashboard from "./pages/SalesDashboard";
import ProductManagerDashboard from "./pages/ProductManagerDashboard";

// Components
import Navbar from "./components/Navbar";

// Route Guards
const ProtectedRoute = ({ children }) => {
  return authService.isAuthenticated() ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  return authService.isAuthenticated() ? <Navigate to="/dashboard" replace /> : children;
};

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg,#6a11cb 0%,#2575fc 100%)"
      }}>
        <div style={{ color: "white", fontSize: "20px" }}>Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <Navbar />

      <Routes>
        {/* AUTH */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

        {/* STORE */}
        <Route path="/" element={<ProductListPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><OrderHistoryPage /></ProtectedRoute>} />
        <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />

        {/* SALES MANAGER */}
        <Route path="/sales-dashboard" element={<ProtectedRoute><SalesDashboard /></ProtectedRoute>} />

        {/* PRODUCT MANAGER */}
        <Route path="/product-manager-dashboard" element={<ProtectedRoute><ProductManagerDashboard /></ProtectedRoute>} />

        {/* DEFAULT */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
