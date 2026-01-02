// frontend/src/components/Dashboard.js

import React, { useEffect } from 'react';
import { authService } from '../services/authService';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const user = authService.getCurrentUser();
  const navigate = useNavigate();

  // Auto-redirect based on role
  useEffect(() => {
    if (user?.role === 'support_agent') {
      navigate('/support-dashboard');
    } else if (user?.role === 'product_manager') {
      navigate('/product-manager-dashboard');
    } else if (user?.role === 'sales_manager') {
      navigate('/sales-dashboard');
    } else {
      // Regular customer stays on dashboard or redirect to home
      navigate('/');
    }
  }, [user, navigate]);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h1 style={{ fontSize: "24px", marginBottom: "20px" }}>Dashboard</h1>

        <div style={{ marginBottom: "20px", fontSize: "14px" }}>
          <p style={{ marginBottom: "8px" }}>
            <strong>Name:</strong> {user?.first_name} {user?.last_name}
          </p>
          <p style={{ marginBottom: "8px" }}>
            <strong>Email:</strong> {user?.email}
          </p>
          <p style={{ marginBottom: "8px" }}>
            <strong>Username:</strong> {user?.username}
          </p>
          <p style={{ marginBottom: "8px" }}>
            <strong>Role:</strong> {user?.role}
          </p>
        </div>

        <button onClick={handleLogout} style={buttonStyle}>
          Logout
        </button>
      </div>
    </div>
  );
}

const containerStyle = {
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: "24px",
  background: "linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)",
};

const cardStyle = {
  width: "100%",
  maxWidth: "500px",
  backgroundColor: "rgba(255,255,255,0.98)",
  borderRadius: "14px",
  padding: "28px 24px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.20)",
};

const buttonStyle = {
  width: "100%",
  padding: "12px",
  backgroundColor: "#dc2626",
  color: "white",
  border: "none",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: "14px",
  boxShadow: "0 6px 16px rgba(220,38,38,0.35)",
};

export default Dashboard;