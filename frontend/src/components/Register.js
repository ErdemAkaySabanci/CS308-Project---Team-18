// frontend/src/components/Register.js

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/users/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: email.split('@')[0], // Use email prefix as username
          email: email,
          password: password,
          first_name: fullName.split(' ')[0] || '',
          last_name: fullName.split(' ').slice(1).join(' ') || '',
        }),
      });

      const data = await response.json();
      setLoading(false);

      if (response.ok) {
        alert('Registration successful! Please login.');
        navigate('/login');
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (error) {
      setLoading(false);
      setError('Network error. Please check your connection and try again.');
    }
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={{ textAlign: "center", marginBottom: "18px" }}>
          <h2 style={{ margin: 0, fontSize: "24px" }}>Register</h2>
          <p style={{ margin: "8px 0 0", color: "#6b7280", fontSize: "13px" }}>
            Please enter your details to sign up.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>
            Full Name
            <input
              type="text"
              placeholder="e.g., Emily Carter"
              style={inputStyle}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </label>

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
              placeholder="Minimum 8 characters"
              style={inputStyle}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength="8"
            />
            <span style={{ fontSize: "11px", color: "#6b7280", display: "block", marginTop: "-8px" }}>
              Must be at least 8 characters
            </span>
          </label>

          {error && (
            <div style={{
              color: '#dc2626',
              marginBottom: '15px',
              fontSize: '13px',
              backgroundColor: '#fee2e2',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid #fecaca'
            }}>
              {error}
            </div>
          )}

          <button type="submit" style={buttonStyle} disabled={loading}>
            {loading ? 'Signing up...' : 'Sign Up'}
          </button>

          <p style={{ marginTop: "12px", fontSize: "13px", color: "#6b7280", textAlign: "center" }}>
            Already have an account?{" "}
            <a href="/login" style={{ color: "#2563eb", textDecoration: "underline" }}>
              Log in
            </a>
          </p>
        </form>
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

export default Register;