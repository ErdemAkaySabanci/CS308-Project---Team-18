import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

const AVATAR_OPTIONS = [
  { type: 'emoji', value: '😀' },
  { type: 'emoji', value: '😎' },
  { type: 'emoji', value: '🏃' },
  { type: 'emoji', value: '⚽' },
  { type: 'emoji', value: '🏀' },
  { type: 'emoji', value: '🎾' },
  { type: 'emoji', value: '🏆' },
  { type: 'emoji', value: '💪' },
  { type: 'emoji', value: '🎯' },
  { type: 'emoji', value: '🔥' },
  { type: 'emoji', value: '⭐' },
  { type: 'emoji', value: '🦁' },
];

const COLOR_OPTIONS = [
  'linear-gradient(135deg, #FF7A00 0%, #FF9A40 100%)',
  'linear-gradient(135deg, #2D5FFF 0%, #5B8DEF 100%)',
  'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
  'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)',
  'linear-gradient(135deg, #EC4899 0%, #F472B6 100%)',
  'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
  'linear-gradient(135deg, #EF4444 0%, #F87171 100%)',
  'linear-gradient(135deg, #06B6D4 0%, #22D3EE 100%)',
];

const AccountPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [editing, setEditing] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [avatar, setAvatar] = useState({ emoji: '👤', color: COLOR_OPTIONS[0] });
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    tax_id: ''
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchUserData();
    const savedAvatar = localStorage.getItem('userAvatar');
    if (savedAvatar) {
      setAvatar(JSON.parse(savedAvatar));
    }
  }, []);

  const fetchUserData = async () => {
    try {
      const token = authService.getToken();
      const response = await fetch('http://127.0.0.1:8000/api/users/me/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data);
        setFormData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          email: data.email || '',
          phone: data.phone || '',
          tax_id: data.tax_id || ''
        });
      } else if (response.status === 401) {
        authService.logout();
        navigate('/login');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarSelect = (emoji, color) => {
    const newAvatar = { emoji, color: color || avatar.color };
    setAvatar(newAvatar);
    localStorage.setItem('userAvatar', JSON.stringify(newAvatar));
  };

  const handleColorSelect = (color) => {
    const newAvatar = { ...avatar, color };
    setAvatar(newAvatar);
    localStorage.setItem('userAvatar', JSON.stringify(newAvatar));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    try {
      const token = authService.getToken();
      const response = await fetch('http://127.0.0.1:8000/api/users/me/', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data);
        setEditing(false);
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.detail || 'Failed to update profile' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (passwordData.new_password !== passwordData.confirm_password) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (passwordData.new_password.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      return;
    }

    try {
      const token = authService.getToken();
      const response = await fetch('http://127.0.0.1:8000/api/users/change-password/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          current_password: passwordData.current_password,
          new_password: passwordData.new_password
        })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Password changed successfully!' });
        setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.detail || 'Failed to change password' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Loading your account...</p>
      </div>
    );
  }

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.sidebar}>
        <div style={styles.userInfo}>
          <div
            style={{ ...styles.avatar, background: avatar.color }}
            onClick={() => setShowAvatarPicker(!showAvatarPicker)}
          >
            {avatar.emoji}
            <div style={styles.avatarEditBadge}>✏️</div>
          </div>

          {showAvatarPicker && (
            <div style={styles.avatarPicker}>
              <div style={styles.avatarPickerHeader}>
                <h4 style={styles.avatarPickerTitle}>Choose Avatar</h4>
                <button
                  style={styles.closeButton}
                  onClick={() => setShowAvatarPicker(false)}
                >
                  ✕
                </button>
              </div>

              <p style={styles.avatarPickerLabel}>Select Icon</p>
              <div style={styles.emojiGrid}>
                {AVATAR_OPTIONS.map((opt, idx) => (
                  <button
                    key={idx}
                    style={{
                      ...styles.emojiButton,
                      ...(avatar.emoji === opt.value ? styles.emojiButtonActive : {})
                    }}
                    onClick={() => handleAvatarSelect(opt.value)}
                  >
                    {opt.value}
                  </button>
                ))}
              </div>

              <p style={styles.avatarPickerLabel}>Select Color</p>
              <div style={styles.colorGrid}>
                {COLOR_OPTIONS.map((color, idx) => (
                  <button
                    key={idx}
                    style={{
                      ...styles.colorButton,
                      background: color,
                      ...(avatar.color === color ? styles.colorButtonActive : {})
                    }}
                    onClick={() => handleColorSelect(color)}
                  />
                ))}
              </div>
            </div>
          )}

          <h3 style={styles.userName}>
            {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.email}
          </h3>
          <p style={styles.userEmail}>{user?.email}</p>
        </div>

        <nav style={styles.nav}>
          <button
            style={{ ...styles.navItem, ...(activeTab === 'profile' ? styles.navItemActive : {}) }}
            onClick={() => setActiveTab('profile')}
          >
            <span style={styles.navIcon}>👤</span> Profile
          </button>
          <button
            style={{ ...styles.navItem, ...(activeTab === 'security' ? styles.navItemActive : {}) }}
            onClick={() => setActiveTab('security')}
          >
            <span style={styles.navIcon}>🔒</span> Security
          </button>
          <button
            style={{ ...styles.navItem, ...(activeTab === 'orders' ? styles.navItemActive : {}) }}
            onClick={() => setActiveTab('orders')}
          >
            <span style={styles.navIcon}>📦</span> Orders
          </button>
          <button
            style={{ ...styles.navItem, ...(activeTab === 'addresses' ? styles.navItemActive : {}) }}
            onClick={() => setActiveTab('addresses')}
          >
            <span style={styles.navIcon}>📍</span> Addresses
          </button>
        </nav>

        <button style={styles.logoutButton} onClick={handleLogout}>
          <span style={styles.navIcon}>🚪</span> Logout
        </button>
      </div>

      <div style={styles.mainContent}>
        {message.text && (
          <div style={{
            ...styles.message,
            backgroundColor: message.type === 'success' ? '#D1FAE5' : '#FEE2E2',
            color: message.type === 'success' ? '#065F46' : '#DC2626'
          }}>
            {message.type === 'success' ? '✓' : '⚠️'} {message.text}
          </div>
        )}

        {activeTab === 'profile' && (
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>Profile Information</h2>
              {!editing && (
                <button style={styles.editButton} onClick={() => setEditing(true)}>✏️ Edit</button>
              )}
            </div>

            {editing ? (
              <form onSubmit={handleUpdateProfile} style={styles.form}>
                <div style={styles.formRow}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>First Name</label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      style={styles.input}
                      placeholder="Enter first name"
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Last Name</label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      style={styles.input}
                      placeholder="Enter last name"
                    />
                  </div>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={styles.input}
                    placeholder="Enter email"
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={styles.input}
                    placeholder="Enter phone number"
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Tax ID</label>
                  <input
                    type="text"
                    value={formData.tax_id}
                    onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                    style={styles.input}
                    placeholder="Enter Tax ID"
                  />
                </div>

                <div style={styles.buttonGroup}>
                  <button type="button" style={styles.cancelButton} onClick={() => setEditing(false)}>Cancel</button>
                  <button type="submit" style={styles.saveButton}>Save Changes</button>
                </div>
              </form>
            ) : (
              <div style={styles.profileInfo}>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>User ID</span>
                  <span style={styles.infoValue}>#{user?.id || 'N/A'}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Full Name</span>
                  <span style={styles.infoValue}>{user?.first_name ? `${user.first_name} ${user.last_name || ''}` : 'Not set'}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Email</span>
                  <span style={styles.infoValue}>{user?.email}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Home Address</span>
                  <span style={styles.infoValue}>{user?.home_address || 'Not set'}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Phone</span>
                  <span style={styles.infoValue}>{user?.phone || 'Not set'}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Tax ID</span>
                  <span style={styles.infoValue}>{user?.tax_id || 'Not set'}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Member Since</span>
                  <span style={styles.infoValue}>{user?.date_joined ? new Date(user.date_joined).toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'security' && (
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>Change Password</h2>
            </div>
            <form onSubmit={handleChangePassword} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Current Password</label>
                <input type="password" value={passwordData.current_password} onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })} style={styles.input} placeholder="Enter current password" required />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>New Password</label>
                <input type="password" value={passwordData.new_password} onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })} style={styles.input} placeholder="Enter new password" required minLength="8" />
                <span style={styles.inputHint}>Must be at least 8 characters</span>
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Confirm New Password</label>
                <input type="password" value={passwordData.confirm_password} onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })} style={styles.input} placeholder="Confirm new password" required />
              </div>
              <button type="submit" style={styles.saveButton}>Update Password</button>
            </form>
          </div>
        )}

        {activeTab === 'orders' && (
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>Order History</h2>
            </div>
            <div style={styles.ordersPlaceholder}>
              <span style={styles.placeholderIcon}>📦</span>
              <p>View and track all your orders</p>
              <Link to="/orders" style={styles.viewOrdersButton}>View All Orders</Link>
            </div>
          </div>
        )}

        {activeTab === 'addresses' && (
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>Saved Addresses</h2>
              <button style={styles.editButton}>+ Add New</button>
            </div>
            <div style={styles.ordersPlaceholder}>
              <span style={styles.placeholderIcon}>📍</span>
              <p>No saved addresses yet</p>
              <p style={styles.placeholderSubtext}>Add an address for faster checkout</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  pageWrapper: { minHeight: '100vh', display: 'flex', backgroundColor: '#F8FAFC', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" },
  loadingContainer: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC', gap: '16px', color: '#64748B' },
  spinner: { width: '40px', height: '40px', border: '3px solid #E2E8F0', borderTopColor: '#FF7A00', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  sidebar: { width: '280px', backgroundColor: '#FFFFFF', borderRight: '1px solid #E2E8F0', padding: '32px 24px', display: 'flex', flexDirection: 'column' },
  userInfo: { textAlign: 'center', marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid #E2E8F0', position: 'relative' },
  avatar: { width: '100px', height: '100px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', color: '#FFFFFF', margin: '0 auto 16px', fontWeight: '700', cursor: 'pointer', position: 'relative', transition: 'transform 0.2s ease', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' },
  avatarEditBadge: { position: 'absolute', bottom: '0', right: '0', width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', border: '2px solid #F8FAFC' },
  avatarPicker: { position: 'absolute', top: '120px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '20px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)', zIndex: 100, width: '280px' },
  avatarPickerHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  avatarPickerTitle: { margin: 0, fontSize: '16px', fontWeight: '700', color: '#1E293B' },
  closeButton: { background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748B', padding: '4px' },
  avatarPickerLabel: { fontSize: '12px', fontWeight: '600', color: '#64748B', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '0.5px' },
  emojiGrid: { display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px', marginBottom: '20px' },
  emojiButton: { width: '40px', height: '40px', border: '2px solid #E2E8F0', borderRadius: '10px', backgroundColor: '#F8FAFC', fontSize: '20px', cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  emojiButtonActive: { borderColor: '#FF7A00', backgroundColor: '#FFF7ED' },
  colorGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' },
  colorButton: { width: '100%', aspectRatio: '1', border: '3px solid transparent', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s ease' },
  colorButtonActive: { borderColor: '#1E293B', transform: 'scale(1.1)' },
  userName: { fontSize: '18px', fontWeight: '700', color: '#1E293B', margin: '0 0 4px 0' },
  userEmail: { fontSize: '14px', color: '#64748B', margin: 0 },
  nav: { display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 },
  navItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', border: 'none', borderRadius: '12px', backgroundColor: 'transparent', color: '#64748B', fontSize: '15px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s ease', textAlign: 'left' },
  navItemActive: { backgroundColor: '#FFF7ED', color: '#FF7A00', fontWeight: '600' },
  navIcon: { fontSize: '18px' },
  logoutButton: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', border: 'none', borderRadius: '12px', backgroundColor: '#FEF2F2', color: '#DC2626', fontSize: '15px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s ease', marginTop: '16px' },
  mainContent: { flex: 1, padding: '32px 48px', maxWidth: '800px' },
  message: { padding: '14px 20px', borderRadius: '12px', marginBottom: '24px', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '10px' },
  card: { backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '32px', boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', paddingBottom: '20px', borderBottom: '1px solid #E2E8F0' },
  cardTitle: { fontSize: '22px', fontWeight: '700', color: '#1E293B', margin: 0 },
  editButton: { padding: '10px 20px', border: '2px solid #E2E8F0', borderRadius: '10px', backgroundColor: 'transparent', color: '#64748B', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s ease' },
  profileInfo: { display: 'flex', flexDirection: 'column', gap: '20px' },
  infoRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #F1F5F9' },
  infoLabel: { fontSize: '15px', color: '#64748B', fontWeight: '500' },
  infoValue: { fontSize: '15px', color: '#1E293B', fontWeight: '600' },
  form: { display: 'flex', flexDirection: 'column', gap: '24px' },
  formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '14px', fontWeight: '600', color: '#374151' },
  input: { padding: '14px 16px', fontSize: '15px', border: '2px solid #E2E8F0', borderRadius: '12px', outline: 'none', transition: 'all 0.2s ease', backgroundColor: '#F8FAFC' },
  inputHint: { fontSize: '12px', color: '#94A3B8' },
  buttonGroup: { display: 'flex', gap: '16px', marginTop: '8px' },
  cancelButton: { flex: 1, padding: '14px', border: '2px solid #E2E8F0', borderRadius: '12px', backgroundColor: 'transparent', color: '#64748B', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
  saveButton: { flex: 1, padding: '14px', border: 'none', borderRadius: '12px', backgroundColor: '#FF7A00', color: '#FFFFFF', fontSize: '15px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 14px rgba(255, 122, 0, 0.4)' },
  ordersPlaceholder: { textAlign: 'center', padding: '48px 24px', color: '#64748B' },
  placeholderIcon: { fontSize: '48px', display: 'block', marginBottom: '16px' },
  placeholderSubtext: { fontSize: '14px', color: '#94A3B8', marginTop: '8px' },
  viewOrdersButton: { display: 'inline-block', marginTop: '20px', padding: '14px 32px', backgroundColor: '#FF7A00', color: '#FFFFFF', textDecoration: 'none', borderRadius: '12px', fontWeight: '600', fontSize: '15px', boxShadow: '0 4px 14px rgba(255, 122, 0, 0.4)' },
};

const styleSheet = document.createElement("style");
styleSheet.innerText = `@keyframes spin { to { transform: rotate(360deg); } } input:focus { border-color: #FF7A00 !important; background-color: #FFFFFF !important; }`;
document.head.appendChild(styleSheet);

export default AccountPage;
