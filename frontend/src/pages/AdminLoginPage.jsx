// frontend/src/pages/AdminLoginPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import './AdminLoginPage.css';

const AdminLoginPage = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await authService.login(email, password);

            if (result.success) {
                // Check if user is superuser/admin
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                if (user.is_superuser) {
                    navigate('/admin-dashboard');
                } else {
                    // Not an admin - logout and show error
                    authService.logout();
                    setError('Access denied. Administrator privileges required.');
                }
            } else {
                setError(result.error || 'Invalid credentials');
            }
        } catch (err) {
            setError('Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-login-container">
            {/* Background Pattern */}
            <div className="admin-login-bg">
                <div className="bg-grid"></div>
            </div>

            {/* Login Card */}
            <div className="admin-login-card">
                {/* Header */}
                <div className="admin-login-header">
                    <div className="admin-logo">
                        <div className="logo-icon">⚙️</div>
                        <div className="logo-text">
                            <span className="logo-title">Admin Panel</span>
                            <span className="logo-subtitle">Sport Store Management</span>
                        </div>
                    </div>
                </div>

                {/* Separator */}
                <div className="admin-separator">
                    <span>ADMINISTRATOR ACCESS</span>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="admin-login-form">
                    {error && (
                        <div className="admin-error">
                            <span className="error-icon">⚠️</span>
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="admin-input-group">
                        <label>Email Address</label>
                        <div className="input-wrapper">
                            <span className="input-icon">📧</span>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@company.com"
                                required
                                autoComplete="email"
                            />
                        </div>
                    </div>

                    <div className="admin-input-group">
                        <label>Password</label>
                        <div className="input-wrapper">
                            <span className="input-icon">🔐</span>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••••"
                                required
                                autoComplete="current-password"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="admin-login-btn"
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="loading-spinner"></span>
                        ) : (
                            <>
                                <span>Sign In to Dashboard</span>
                                <span className="btn-arrow">→</span>
                            </>
                        )}
                    </button>
                </form>

                {/* Footer */}
                <div className="admin-login-footer">
                    <p>🔒 Secure admin access only</p>
                    <p className="footer-note">Unauthorized access attempts are logged</p>
                </div>
            </div>

            {/* Version Badge */}
            <div className="version-badge">
                Sport Store Admin v2.0
            </div>
        </div>
    );
};

export default AdminLoginPage;
