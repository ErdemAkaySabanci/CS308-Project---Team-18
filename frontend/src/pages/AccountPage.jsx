import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { apiService } from '../services/apiService';

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

  // Card management state
  const [savedCards, setSavedCards] = useState([]);
  const [showAddCard, setShowAddCard] = useState(false);
  const [cardLoading, setCardLoading] = useState(false);
  const [newCard, setNewCard] = useState({
    card_number: '',
    card_holder_name: '',
    expiry_month: '',
    expiry_year: '',
    cvv: ''
  });

  useEffect(() => {
    fetchUserData();
    const savedAvatar = localStorage.getItem('userAvatar');
    if (savedAvatar) {
      setAvatar(JSON.parse(savedAvatar));
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'payments') {
      fetchSavedCards();
    }
  }, [activeTab]);

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

  const fetchSavedCards = async () => {
    setCardLoading(true);
    try {
      const response = await apiService.getSavedCards();
      // Handle different response formats
      const cards = Array.isArray(response) ? response : (response?.data || response?.results || []);
      setSavedCards(cards);
    } catch (error) {
      console.error('Error fetching cards:', error);
      setSavedCards([]);
    } finally {
      setCardLoading(false);
    }
  };

  const handleAddCard = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    try {
      await apiService.saveCard({
        card_number: newCard.card_number.replace(/\s/g, ''),
        card_holder_name: newCard.card_holder_name,
        expiry_month: newCard.expiry_month,
        expiry_year: newCard.expiry_year,
      });
      setMessage({ type: 'success', text: 'Card saved successfully!' });
      setShowAddCard(false);
      setNewCard({ card_number: '', card_holder_name: '', expiry_month: '', expiry_year: '', cvv: '' });
      fetchSavedCards();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save card. Please try again.' });
    }
  };

  const handleDeleteCard = async (cardId) => {
    if (!window.confirm('Are you sure you want to delete this card?')) return;

    try {
      await apiService.deleteCard(cardId);
      setMessage({ type: 'success', text: 'Card deleted successfully!' });
      fetchSavedCards();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete card.' });
    }
  };

  const handleSetDefault = async (cardId) => {
    try {
      await apiService.setDefaultCard(cardId);
      setMessage({ type: 'success', text: 'Default card updated!' });
      fetchSavedCards();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to set default card.' });
    }
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : value;
  };

  const getCardBrand = (number) => {
    const cleaned = number.replace(/\s/g, '');
    if (cleaned.startsWith('4')) return { name: 'Visa', color: '#1A1F71' };
    if (/^5[1-5]/.test(cleaned)) return { name: 'Mastercard', color: '#EB001B' };
    if (/^3[47]/.test(cleaned)) return { name: 'Amex', color: '#006FCF' };
    return { name: 'Card', color: '#64748B' };
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
            style={{ ...styles.navItem, ...(activeTab === 'addresses' ? styles.navItemActive : {}) }}
            onClick={() => setActiveTab('addresses')}
          >
            <span style={styles.navIcon}>📍</span> Addresses
          </button>
          <button
            style={{ ...styles.navItem, ...(activeTab === 'payments' ? styles.navItemActive : {}) }}
            onClick={() => setActiveTab('payments')}
          >
            <span style={styles.navIcon}>💳</span> Payment Methods
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
                  <label style={styles.label}>Tax ID</label>
                  <input
                    type="text"
                    value={formData.tax_id}
                    onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                    style={styles.input}
                    placeholder="Enter Tax ID"
                  />
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
                  <span style={styles.infoLabel}>Tax ID</span>
                  <span style={styles.infoValue}>{user?.tax_id || 'Not set'}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Email</span>
                  <span style={styles.infoValue}>{user?.email || 'Not set'}</span>
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

        {activeTab === 'payments' && (
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>Payment Methods</h2>
              <button style={styles.editButton} onClick={() => setShowAddCard(true)}>+ Add Card</button>
            </div>

            {showAddCard && (
              <div style={styles.addCardForm}>
                <h3 style={styles.addCardTitle}>Add New Card</h3>
                <form onSubmit={handleAddCard} style={styles.form}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Card Number</label>
                    <input
                      type="text"
                      value={newCard.card_number}
                      onChange={(e) => setNewCard({ ...newCard, card_number: formatCardNumber(e.target.value) })}
                      style={styles.input}
                      placeholder="1234 5678 9012 3456"
                      maxLength="19"
                      required
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Cardholder Name</label>
                    <input
                      type="text"
                      value={newCard.card_holder_name}
                      onChange={(e) => setNewCard({ ...newCard, card_holder_name: e.target.value.toUpperCase() })}
                      style={styles.input}
                      placeholder="JOHN DOE"
                      required
                    />
                  </div>
                  <div style={styles.formRow}>
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Expiry Month</label>
                      <select
                        value={newCard.expiry_month}
                        onChange={(e) => setNewCard({ ...newCard, expiry_month: e.target.value })}
                        style={styles.input}
                        required
                      >
                        <option value="">MM</option>
                        {[...Array(12)].map((_, i) => (
                          <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                            {String(i + 1).padStart(2, '0')}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Expiry Year</label>
                      <select
                        value={newCard.expiry_year}
                        onChange={(e) => setNewCard({ ...newCard, expiry_year: e.target.value })}
                        style={styles.input}
                        required
                      >
                        <option value="">YYYY</option>
                        {[...Array(10)].map((_, i) => {
                          const year = new Date().getFullYear() + i;
                          return <option key={year} value={year}>{year}</option>;
                        })}
                      </select>
                    </div>
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>CVV</label>
                      <input
                        type="password"
                        value={newCard.cvv}
                        onChange={(e) => setNewCard({ ...newCard, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                        style={styles.input}
                        placeholder="***"
                        maxLength="4"
                        required
                      />
                    </div>
                  </div>
                  <div style={styles.buttonGroup}>
                    <button type="button" style={styles.cancelButton} onClick={() => setShowAddCard(false)}>Cancel</button>
                    <button type="submit" style={styles.saveButton}>Save Card</button>
                  </div>
                </form>
              </div>
            )}

            {cardLoading ? (
              <div style={styles.ordersPlaceholder}>
                <div style={styles.spinner}></div>
                <p>Loading cards...</p>
              </div>
            ) : savedCards.length === 0 ? (
              <div style={styles.ordersPlaceholder}>
                <span style={styles.placeholderIcon}>💳</span>
                <p>No saved cards yet</p>
                <p style={styles.placeholderSubtext}>Add a card for faster checkout</p>
              </div>
            ) : (
              <div style={styles.cardsList}>
                {savedCards.map((card) => {
                  const brand = getCardBrand(card.card_number || '');
                  return (
                    <div key={card.id} style={styles.savedCard}>
                      <div style={styles.cardVisual}>
                        <div style={{ ...styles.cardBrand, backgroundColor: brand.color }}>
                          {brand.name}
                        </div>
                        <div style={styles.cardNumber}>
                          •••• •••• •••• {card.last_four || card.card_number?.slice(-4)}
                        </div>
                        <div style={styles.cardDetails}>
                          <span>{card.card_holder_name}</span>
                          <span>{card.expiry_month}/{card.expiry_year}</span>
                        </div>
                        {card.is_default && (
                          <div style={styles.defaultBadge}>Default</div>
                        )}
                      </div>
                      <div style={styles.cardActions}>
                        {!card.is_default && (
                          <button
                            style={styles.setDefaultBtn}
                            onClick={() => handleSetDefault(card.id)}
                          >
                            Set as Default
                          </button>
                        )}
                        <button
                          style={styles.deleteCardBtn}
                          onClick={() => handleDeleteCard(card.id)}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
  formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' },
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
  // Card styles
  addCardForm: { backgroundColor: '#F8FAFC', borderRadius: '16px', padding: '24px', marginBottom: '24px' },
  addCardTitle: { fontSize: '18px', fontWeight: '600', color: '#1E293B', margin: '0 0 20px 0' },
  cardsList: { display: 'flex', flexDirection: 'column', gap: '16px' },
  savedCard: { border: '2px solid #E2E8F0', borderRadius: '16px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s ease' },
  cardVisual: { display: 'flex', flexDirection: 'column', gap: '8px' },
  cardBrand: { display: 'inline-block', padding: '4px 12px', borderRadius: '6px', color: '#FFFFFF', fontSize: '12px', fontWeight: '700', width: 'fit-content' },
  cardNumber: { fontSize: '18px', fontWeight: '600', color: '#1E293B', letterSpacing: '1px' },
  cardDetails: { display: 'flex', gap: '24px', fontSize: '14px', color: '#64748B' },
  defaultBadge: { display: 'inline-block', padding: '4px 10px', backgroundColor: '#D1FAE5', color: '#065F46', borderRadius: '6px', fontSize: '12px', fontWeight: '600', width: 'fit-content', marginTop: '4px' },
  cardActions: { display: 'flex', gap: '12px', alignItems: 'center' },
  setDefaultBtn: { padding: '10px 16px', border: '2px solid #E2E8F0', borderRadius: '10px', backgroundColor: 'transparent', color: '#64748B', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s ease' },
  deleteCardBtn: { padding: '10px 16px', border: 'none', borderRadius: '10px', backgroundColor: '#FEE2E2', color: '#DC2626', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s ease' },
};

const styleSheet = document.createElement("style");
styleSheet.innerText = `@keyframes spin { to { transform: rotate(360deg); } } input:focus { border-color: #FF7A00 !important; background-color: #FFFFFF !important; } select:focus { border-color: #FF7A00 !important; background-color: #FFFFFF !important; }`;
document.head.appendChild(styleSheet);

export default AccountPage;
