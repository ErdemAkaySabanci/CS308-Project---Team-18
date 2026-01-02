import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/users/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Sync guest cart to backend (merge with user's cart)
        const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
        if (guestCart.length > 0) {
          for (const item of guestCart) {
            try {
              await fetch('http://127.0.0.1:8000/api/cart/', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${data.access}`
                },
                body: JSON.stringify({ product_id: item.id, quantity: item.quantity })
              });
            } catch (syncErr) {
              console.error('Error syncing cart item:', syncErr);
            }
          }
          localStorage.removeItem('guestCart');
        }

        // Force reload and redirect to dashboard to ensure role check runs
        window.location.href = '/dashboard';
      } else {
        setError(data.error || 'Invalid email or password');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.pageWrapper}>
      {/* Left Side - Branding */}
      <div style={styles.leftPanel}>
        <div style={styles.brandContent}>
          <div style={styles.logoContainer}>
            <span style={styles.logoIcon}>🏆</span>
            <h1 style={styles.logoText}>Sport Store</h1>
          </div>
          <h2 style={styles.tagline}>Welcome Back!</h2>
          <p style={styles.description}>
            Access your account to track orders, manage your wishlist, and enjoy exclusive deals on premium sports gear.
          </p>
          <div style={styles.features}>
            <div style={styles.featureItem}>
              <span style={styles.featureIcon}>🚚</span>
              <span>Free shipping on orders over 500 TL</span>
            </div>
            <div style={styles.featureItem}>
              <span style={styles.featureIcon}>🔄</span>
              <span>30-day easy returns</span>
            </div>
            <div style={styles.featureItem}>
              <span style={styles.featureIcon}>🛡️</span>
              <span>Secure payment guaranteed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div style={styles.rightPanel}>
        <div style={styles.formContainer}>
          <div style={styles.formHeader}>
            <h2 style={styles.formTitle}>Sign In</h2>
            <p style={styles.formSubtitle}>Enter your credentials to continue</p>
          </div>

          {error && (
            <div style={styles.errorBox}>
              <span style={styles.errorIcon}>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Email Address</label>
              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}>📧</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={styles.input}
                  required
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Password</label>
              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}>🔒</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  style={styles.input}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              style={{
                ...styles.submitButton,
                opacity: loading ? 0.7 : 1,
              }}
              disabled={loading}
            >
              {loading ? (
                <span style={styles.loadingText}>
                  <span style={styles.spinner}></span>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div style={styles.divider}>
            <span style={styles.dividerLine}></span>
            <span style={styles.dividerText}>or</span>
            <span style={styles.dividerLine}></span>
          </div>

          <p style={styles.footerText}>
            Don't have an account?{' '}
            <Link to="/register" style={styles.link}>
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  pageWrapper: {
    minHeight: '100vh',
    display: 'flex',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  leftPanel: {
    flex: 1,
    background: 'linear-gradient(135deg, #1E3A8A 0%, #2D5FFF 50%, #FF7A00 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px',
    position: 'relative',
    overflow: 'hidden',
  },
  brandContent: {
    color: '#FFFFFF',
    maxWidth: '480px',
    position: 'relative',
    zIndex: 2,
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '40px',
  },
  logoIcon: {
    fontSize: '48px',
  },
  logoText: {
    fontSize: '32px',
    fontWeight: '800',
    margin: 0,
    letterSpacing: '-0.5px',
  },
  tagline: {
    fontSize: '42px',
    fontWeight: '700',
    margin: '0 0 20px 0',
    lineHeight: 1.2,
  },
  description: {
    fontSize: '18px',
    opacity: 0.9,
    lineHeight: 1.6,
    marginBottom: '40px',
  },
  features: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '16px',
    opacity: 0.95,
  },
  featureIcon: {
    fontSize: '20px',
  },
  rightPanel: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px',
    backgroundColor: '#F8FAFC',
  },
  formContainer: {
    width: '100%',
    maxWidth: '420px',
    backgroundColor: '#FFFFFF',
    borderRadius: '24px',
    padding: '48px',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
  },
  formHeader: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  formTitle: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1E293B',
    margin: '0 0 8px 0',
  },
  formSubtitle: {
    fontSize: '15px',
    color: '#64748B',
    margin: 0,
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#FEF2F2',
    color: '#DC2626',
    padding: '14px 16px',
    borderRadius: '12px',
    marginBottom: '24px',
    fontSize: '14px',
    fontWeight: '500',
  },
  errorIcon: {
    fontSize: '18px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '16px',
    fontSize: '18px',
    opacity: 0.5,
  },
  input: {
    width: '100%',
    padding: '16px 16px 16px 48px',
    fontSize: '15px',
    border: '2px solid #E2E8F0',
    borderRadius: '12px',
    outline: 'none',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box',
    backgroundColor: '#F8FAFC',
  },
  submitButton: {
    width: '100%',
    padding: '16px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#FFFFFF',
    backgroundColor: '#2D5FFF',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 14px rgba(45, 95, 255, 0.4)',
    marginTop: '8px',
  },
  loadingText: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
  },
  spinner: {
    width: '18px',
    height: '18px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#FFFFFF',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    margin: '28px 0',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    fontSize: '13px',
    color: '#94A3B8',
    fontWeight: '500',
  },
  footerText: {
    textAlign: 'center',
    fontSize: '15px',
    color: '#64748B',
    margin: 0,
  },
  link: {
    color: '#2D5FFF',
    fontWeight: '600',
    textDecoration: 'none',
  },
};

export default Login;
