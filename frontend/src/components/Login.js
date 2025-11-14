// frontend/src/components/Login.js (COMPLETE UPDATED VERSION)

import React, { useState } from 'react';
import { authService } from '../services/authService';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await authService.login(email, password);
    setLoading(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || 'Login failed');
    }
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={{ textAlign: "center", marginBottom: "18px" }}>
          <h2 style={{ margin: 0, fontSize: "24px" }}>Login</h2>
          <p style={{ margin: "8px 0 0", color: "#6b7280", fontSize: "13px" }}>
            Welcome back! Please login to your account.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>
            Email
            <input
              type="email"
              placeholder="example@mail.com"
              style={inputStyle}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label style={labelStyle}>
            Password
            <input
              type="password"
              placeholder="********"
              style={inputStyle}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          {error && (
            <div style={{
              color: 'red',
              marginBottom: '15px',
              fontSize: '13px',
              backgroundColor: '#fee',
              padding: '10px',
              borderRadius: '8px'
            }}>
              {error}
            </div>
          )}

          <button type="submit" style={buttonStyle} disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <p style={{ marginTop: "12px", fontSize: "13px", color: "#6b7280", textAlign: "center" }}>
            Don't have an account?{" "}
            <a href="/register" style={{ color: "#2563eb", textDecoration: "underline" }}>
              Sign up
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};

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
  maxWidth: "360px",
  backgroundColor: "rgba(255,255,255,0.98)",
  borderRadius: "14px",
  padding: "28px 24px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.20)",
};

const labelStyle = {
  display: "block",
  fontSize: "13px",
  color: "#374151",
  marginBottom: "10px",
};

const inputStyle = {
  width: "100%",
  marginTop: "6px",
  marginBottom: "14px",
  padding: "10px 12px",
  border: "1px solid #d1d5db",
  borderRadius: "10px",
  outline: "none",
  fontSize: "14px",
  transition: "box-shadow .15s, border-color .15s",
};

const buttonStyle = {
  width: "100%",
  padding: "12px",
  backgroundColor: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: "14px",
  boxShadow: "0 6px 16px rgba(37,99,235,0.35)",
};

export default Login;