// frontend/src/components/Dashboard.js
import React, { useEffect } from "react";
import { authService } from "../services/authService";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const user = authService.getCurrentUser();
  const navigate = useNavigate();

  // Auto-redirect based on role
  useEffect(() => {
    if (user?.is_superuser) {
      navigate('/admin-dashboard');
    } else if (user?.role === 'support_agent') {
      navigate('/support-dashboard');
    } else if (user?.role === 'product_manager') {
      navigate('/product-manager-dashboard');
    } else if (user?.role === 'sales_manager') {
      navigate('/sales-dashboard');
    } else {
      // Regular customer default
      navigate('/');
    }
  }, [user, navigate]);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)",
      color: "white",
      fontSize: "24px",
      fontWeight: "bold"
    }}>
      Loading Dashboard...
    </div>
  );
}

export default Dashboard;