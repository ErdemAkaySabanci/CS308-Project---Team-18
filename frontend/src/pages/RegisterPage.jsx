import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/users/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        navigate('/login', { state: { message: 'Registration successful! Please login.' } });
      } else {
        setError(data.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.leftPanel}>
        <div style={styles.formContainer}>
          <div style={styles.formHeader}>
            <h2 style={styles.formTitle}>Create Account</h2>
            <p style={styles.formSubtitle}>Join us and start shopping today</p>
          </div>

          {error && (
            <div style={styles.errorBox}>
              <span style={styles.errorIcon}>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Full Name</label>
              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}>👤</span>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  style={styles.input}
                  required
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Email Address</label>
              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}>📧</span>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
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
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a strong password"
                  style={styles.input}
                  required
                  minLength="8"
                />
              </div>
              <span style={styles.inputHint}>Must be at least 8 characters</span>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Confirm Password</label>
              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}>🔐</span>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
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
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div style={styles.divider}>
            <span style={styles.dividerLine}></span>
            <span style={styles.dividerText}>or</span>
            <span style={styles.dividerLine}></span>
          </div>

          <p style={styles.footerText}>
            Already have an account?{' '}
            <Link to="/login" style={styles.link}>Sign In</Link>
          </p>
        </div>
      </div>

      <div style={styles.rightPanel}>
        <div style={styles.brandContent}>
          <div style={styles.logoContainer}>
            <span style={styles.logoIcon}>🏆</span>
            <h1 style={styles.logoText}>Sport Store</h1>
          </div>
          <h2 style={styles.tagline}>Start Your Journey</h2>
          <p style={styles.description}>
            Create an account to unlock exclusive deals, track your orders, and get personalized recommendations.
          </p>
          <div style={styles.features}>
            <div style={styles.featureItem}>
              <span style={styles.featureIcon}>🎁</span>
              <span>10% off your first order</span>
            </div>
            <div style={styles.featureItem}>
              <span style={styles.featureIcon}>⭐</span>
              <span>Earn rewards on every purchase</span>
            </div>
            <div style={styles.featureItem}>
              <span style={styles.featureIcon}>📦</span>
              <span>Exclusive member-only products</span>
            </div>
          </div>
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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    backgroundColor: '#F8FAFC',
  },
  formContainer: {
    width: '100%',
    maxWidth: '440px',
    backgroundColor: '#FFFFFF',
    borderRadius: '24px',
    padding: '40px 48px',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
  },
  formHeader: {
    textAlign: 'center',
    marginBottom: '28px',
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
    marginBottom: '20px',
    fontSize: '14px',
  },
  errorIcon: {
    fontSize: '18px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
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
    padding: '14px 14px 14px 48px',
    fontSize: '15px',
    border: '2px solid #E2E8F0',
    borderRadius: '12px',
    outline: 'none',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box',
    backgroundColor: '#F8FAFC',
  },
  inputHint: {
    fontSize: '12px',
    color: '#94A3B8',
    marginTop: '4px',
  },
  submitButton: {
    width: '100%',
    padding: '16px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#FFFFFF',
    backgroundColor: '#FF7A00',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 14px rgba(255, 122, 0, 0.4)',
    marginTop: '8px',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    margin: '24px 0',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    fontSize: '13px',
    color: '#94A3B8',
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
  rightPanel: {
    flex: 1,
    background: 'linear-gradient(135deg, #FF7A00 0%, #FF9A40 50%, #2D5FFF 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px',
  },
  brandContent: {
    color: '#FFFFFF',
    maxWidth: '480px',
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
};

export default RegisterPage;
