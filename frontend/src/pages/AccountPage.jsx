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

const CARD_GRADIENTS = [
  'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
  'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
  'linear-gradient(135deg, #2C3E50 0%, #4CA1AF 100%)',
  'linear-gradient(135deg, #373B44 0%, #4286f4 100%)',
  'linear-gradient(135deg, #834d9b 0%, #d04ed6 100%)',
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
  const [editingCard, setEditingCard] = useState(null);
  const [cardLoading, setCardLoading] = useState(false);
  const [newCard, setNewCard] = useState({
    card_number: '',
    cardholder_name: '',
    expiry_date: '',
    card_type: 'Visa'
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
      const cards = Array.isArray(response) ? response : (response?.data || response?.results || []);
      setSavedCards(cards);
    } catch (error) {
      console.error('Error fetching cards:', error);
      setSavedCards([]);
    } finally {
      setCardLoading(false);
    }
  };

  const resetCardForm = () => {
    setNewCard({
      card_number: '',
      cardholder_name: '',
      expiry_date: '',
      card_type: 'Visa'
    });
    setShowAddCard(false);
    setEditingCard(null);
  };

  const handleAddCard = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    try {
      await apiService.saveCard({
        card_last_4: newCard.card_number.replace(/\s/g, '').slice(-4),
        cardholder_name: newCard.cardholder_name,
        expiry_date: newCard.expiry_date,
        card_type: getCardType(newCard.card_number)
      });
      setMessage({ type: 'success', text: 'Card saved successfully!' });
      resetCardForm();
      fetchSavedCards();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save card. Please try again.' });
    }
  };

  const handleEditCard = (card) => {
    setEditingCard(card);
    setNewCard({
      card_number: `•••• •••• •••• ${card.card_last_4}`,
      cardholder_name: card.cardholder_name || '',
      expiry_date: card.expiry_date || '',
      card_type: card.card_type || 'Visa'
    });
    setShowAddCard(true);
  };

  const handleUpdateCard = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    try {
      const token = authService.getToken();
      const response = await fetch(`http://127.0.0.1:8000/api/users/cards/${editingCard.id}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cardholder_name: newCard.cardholder_name,
          expiry_date: newCard.expiry_date
        })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Card updated successfully!' });
        resetCardForm();
        fetchSavedCards();
      } else {
        throw new Error('Failed to update');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update card.' });
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

  const formatExpiryDate = (value) => {
    const v = value.replace(/\D/g, '');
    if (v.length >= 2) {
      return v.slice(0, 2) + '/' + v.slice(2, 4);
    }
    return v;
  };

  const getCardType = (number) => {
    const cleaned = (number || '').replace(/\s/g, '');
    if (cleaned.startsWith('4')) return 'Visa';
    if (/^5[1-5]/.test(cleaned) || /^2[2-7]/.test(cleaned)) return 'Mastercard';
    if (/^3[47]/.test(cleaned)) return 'Amex';
    if (/^6/.test(cleaned)) return 'Discover';
    return 'Visa';
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
              {!showAddCard && (
                <button style={styles.addCardBtn} onClick={() => { resetCardForm(); setShowAddCard(true); }}>
                  + Add New Card
                </button>
              )}
            </div>

            {showAddCard && (
              <div style={styles.addCardSection}>
                <div style={styles.addCardHeader}>
                  <h3 style={styles.addCardTitle}>
                    {editingCard ? '✏️ Edit Card' : '💳 Add New Card'}
                  </h3>
                  <button style={styles.closeCardForm} onClick={resetCardForm}>✕</button>
                </div>
                
                {/* Card Preview */}
                <div style={styles.cardPreview}>
                  <div style={styles.cardPreviewInner}>
                    <div style={styles.cardChip}>
                      <div style={styles.chipLines}></div>
                    </div>
                    <div style={styles.cardPreviewNumber}>
                      {newCard.card_number || '•••• •••• •••• ••••'}
                    </div>
                    <div style={styles.cardPreviewBottom}>
                      <div>
                        <div style={styles.cardPreviewLabel}>CARD HOLDER</div>
                        <div style={styles.cardPreviewValue}>
                          {newCard.cardholder_name || 'YOUR NAME'}
                        </div>
                      </div>
                      <div>
                        <div style={styles.cardPreviewLabel}>EXPIRES</div>
                        <div style={styles.cardPreviewValue}>
                          {newCard.expiry_date || 'MM/YY'}
                        </div>
                      </div>
                      <div style={styles.cardBrandPreview}>
                        {getCardType(newCard.card_number)}
                      </div>
                    </div>
                  </div>
                </div>

                <form onSubmit={editingCard ? handleUpdateCard : handleAddCard} style={styles.cardForm}>
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
                      disabled={!!editingCard}
                    />
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Cardholder Name</label>
                    <input
                      type="text"
                      value={newCard.cardholder_name}
                      onChange={(e) => setNewCard({ ...newCard, cardholder_name: e.target.value.toUpperCase() })}
                      style={styles.input}
                      placeholder="JOHN DOE"
                      required
                    />
                  </div>

                  <div style={styles.formRowTwo}>
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Expiry Date</label>
                      <input
                        type="text"
                        value={newCard.expiry_date}
                        onChange={(e) => setNewCard({ ...newCard, expiry_date: formatExpiryDate(e.target.value) })}
                        style={styles.input}
                        placeholder="MM/YY"
                        maxLength="5"
                        required
                      />
                    </div>
                    {!editingCard && (
                      <div style={styles.inputGroup}>
                        <label style={styles.label}>CVV</label>
                        <input
                          type="password"
                          style={styles.input}
                          placeholder="•••"
                          maxLength="4"
                          required
                        />
                      </div>
                    )}
                  </div>

                  <div style={styles.cardFormActions}>
                    <button type="button" style={styles.cancelButton} onClick={resetCardForm}>
                      Cancel
                    </button>
                    <button type="submit" style={styles.saveCardBtn}>
                      {editingCard ? 'Update Card' : 'Save Card'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {cardLoading ? (
              <div style={styles.ordersPlaceholder}>
                <div style={styles.spinner}></div>
                <p>Loading cards...</p>
              </div>
            ) : savedCards.length === 0 && !showAddCard ? (
              <div style={styles.emptyCards}>
                <div style={styles.emptyCardIcon}>💳</div>
                <h3 style={styles.emptyCardTitle}>No payment methods</h3>
                <p style={styles.emptyCardText}>Add a card to make checkout faster and easier</p>
                <button style={styles.addFirstCard} onClick={() => setShowAddCard(true)}>
                  + Add Your First Card
                </button>
              </div>
            ) : (
              <div style={styles.cardsGrid}>
                {savedCards.map((card, index) => {
                  const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length];
                  return (
                    <div key={card.id} style={styles.creditCard}>
                      <div style={{ ...styles.creditCardInner, background: gradient }}>
                        {card.is_default && (
                          <div style={styles.defaultRibbon}>DEFAULT</div>
                        )}
                        <div style={styles.cardTopRow}>
                          <div style={styles.cardChipSmall}>
                            <div style={styles.chipLinesSmall}></div>
                          </div>
                          <div style={styles.cardBrandBadge}>{card.card_type || 'VISA'}</div>
                        </div>
                        <div style={styles.cardNumberDisplay}>
                          •••• •••• •••• {card.card_last_4 || '••••'}
                        </div>
                        <div style={styles.cardBottomRow}>
                          <div>
                            <div style={styles.cardLabel}>CARD HOLDER</div>
                            <div style={styles.cardHolderName}>{card.cardholder_name || 'CARDHOLDER'}</div>
                          </div>
                          <div>
                            <div style={styles.cardLabel}>EXPIRES</div>
                            <div style={styles.cardExpiry}>{card.expiry_date || '••/••'}</div>
                          </div>
                        </div>
                      </div>
                      <div style={styles.cardActionsBar}>
                        {!card.is_default && (
                          <button
                            style={styles.actionBtn}
                            onClick={() => handleSetDefault(card.id)}
                          >
                            ⭐ Set Default
                          </button>
                        )}
                        <button
                          style={styles.actionBtn}
                          onClick={() => handleEditCard(card)}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          style={styles.actionBtnDanger}
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
  mainContent: { flex: 1, padding: '32px 48px', maxWidth: '900px' },
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
  formRowTwo: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: { padding: '14px 16px', fontSize: '15px', border: '2px solid #E2E8F0', borderRadius: '12px', outline: 'none', transition: 'all 0.2s ease', backgroundColor: '#F8FAFC' },
  inputHint: { fontSize: '12px', color: '#94A3B8' },
  buttonGroup: { display: 'flex', gap: '16px', marginTop: '8px' },
  cancelButton: { flex: 1, padding: '14px', border: '2px solid #E2E8F0', borderRadius: '12px', backgroundColor: 'transparent', color: '#64748B', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
  saveButton: { flex: 1, padding: '14px', border: 'none', borderRadius: '12px', backgroundColor: '#FF7A00', color: '#FFFFFF', fontSize: '15px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 14px rgba(255, 122, 0, 0.4)' },
  ordersPlaceholder: { textAlign: 'center', padding: '48px 24px', color: '#64748B' },
  placeholderIcon: { fontSize: '48px', display: 'block', marginBottom: '16px' },
  placeholderSubtext: { fontSize: '14px', color: '#94A3B8', marginTop: '8px' },

  // Payment Methods Styles
  addCardBtn: { padding: '12px 24px', border: 'none', borderRadius: '12px', background: 'linear-gradient(135deg, #FF7A00 0%, #FF9A40 100%)', color: '#FFFFFF', fontSize: '14px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 14px rgba(255, 122, 0, 0.3)', transition: 'all 0.2s ease' },
  
  addCardSection: { backgroundColor: '#F8FAFC', borderRadius: '16px', padding: '24px', marginBottom: '24px' },
  addCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  addCardTitle: { fontSize: '18px', fontWeight: '700', color: '#1E293B', margin: 0 },
  closeCardForm: { width: '36px', height: '36px', border: 'none', borderRadius: '10px', backgroundColor: '#E2E8F0', color: '#64748B', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },

  // Card Preview
  cardPreview: { marginBottom: '24px', display: 'flex', justifyContent: 'center' },
  cardPreviewInner: { width: '340px', height: '200px', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', borderRadius: '16px', padding: '24px', color: '#FFFFFF', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' },
  cardChip: { width: '50px', height: '38px', background: 'linear-gradient(135deg, #ffd700 0%, #ffb700 100%)', borderRadius: '8px', marginBottom: '24px', position: 'relative', overflow: 'hidden' },
  chipLines: { position: 'absolute', top: '50%', left: '0', right: '0', height: '60%', transform: 'translateY(-50%)', background: 'repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(0,0,0,0.1) 8px, rgba(0,0,0,0.1) 10px)' },
  cardPreviewNumber: { fontSize: '22px', fontWeight: '500', letterSpacing: '3px', marginBottom: '24px', fontFamily: "'Courier New', monospace" },
  cardPreviewBottom: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' },
  cardPreviewLabel: { fontSize: '10px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px', letterSpacing: '1px' },
  cardPreviewValue: { fontSize: '14px', fontWeight: '600', letterSpacing: '1px' },
  cardBrandPreview: { fontSize: '20px', fontWeight: '700', letterSpacing: '2px' },

  cardForm: { display: 'flex', flexDirection: 'column', gap: '20px' },
  cardFormActions: { display: 'flex', gap: '16px', marginTop: '8px' },
  saveCardBtn: { flex: 2, padding: '16px', border: 'none', borderRadius: '12px', background: 'linear-gradient(135deg, #FF7A00 0%, #FF9A40 100%)', color: '#FFFFFF', fontSize: '15px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 14px rgba(255, 122, 0, 0.4)' },

  // Empty State
  emptyCards: { textAlign: 'center', padding: '60px 24px' },
  emptyCardIcon: { fontSize: '64px', marginBottom: '16px' },
  emptyCardTitle: { fontSize: '20px', fontWeight: '700', color: '#1E293B', margin: '0 0 8px 0' },
  emptyCardText: { fontSize: '15px', color: '#64748B', margin: '0 0 24px 0' },
  addFirstCard: { padding: '14px 32px', border: 'none', borderRadius: '12px', background: 'linear-gradient(135deg, #FF7A00 0%, #FF9A40 100%)', color: '#FFFFFF', fontSize: '15px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 14px rgba(255, 122, 0, 0.3)' },

  // Cards Grid
  cardsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' },
  
  creditCard: { borderRadius: '20px', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.15)' },
  creditCardInner: { padding: '24px', color: '#FFFFFF', position: 'relative', minHeight: '180px', overflow: 'hidden' },
  defaultRibbon: { position: 'absolute', top: '16px', right: '-30px', backgroundColor: '#10B981', color: '#FFFFFF', padding: '6px 40px', fontSize: '10px', fontWeight: '700', transform: 'rotate(45deg)', letterSpacing: '1px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' },
  cardTopRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' },
  cardBrandBadge: { fontSize: '16px', fontWeight: '700', letterSpacing: '2px', textShadow: '0 2px 4px rgba(0,0,0,0.3)' },
  cardChipSmall: { width: '45px', height: '34px', background: 'linear-gradient(135deg, #ffd700 0%, #ffb700 100%)', borderRadius: '6px', position: 'relative', overflow: 'hidden' },
  chipLinesSmall: { position: 'absolute', top: '50%', left: '0', right: '0', height: '60%', transform: 'translateY(-50%)', background: 'repeating-linear-gradient(90deg, transparent, transparent 6px, rgba(0,0,0,0.1) 6px, rgba(0,0,0,0.1) 8px)' },
  cardNumberDisplay: { fontSize: '22px', fontWeight: '500', letterSpacing: '3px', marginBottom: '20px', fontFamily: "'Courier New', monospace", textShadow: '0 2px 4px rgba(0,0,0,0.3)' },
  cardBottomRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' },
  cardLabel: { fontSize: '9px', color: 'rgba(255,255,255,0.7)', marginBottom: '4px', letterSpacing: '1px', textTransform: 'uppercase' },
  cardHolderName: { fontSize: '14px', fontWeight: '600', letterSpacing: '1px', textShadow: '0 1px 2px rgba(0,0,0,0.3)' },
  cardExpiry: { fontSize: '14px', fontWeight: '600', textShadow: '0 1px 2px rgba(0,0,0,0.3)' },

  cardActionsBar: { display: 'flex', gap: '8px', padding: '12px 16px', backgroundColor: '#FFFFFF', borderTop: '1px solid #E2E8F0' },
  actionBtn: { flex: 1, padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: '8px', backgroundColor: '#FFFFFF', color: '#64748B', fontSize: '12px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' },
  actionBtnDanger: { flex: 1, padding: '10px 12px', border: 'none', borderRadius: '8px', backgroundColor: '#FEE2E2', color: '#DC2626', fontSize: '12px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' },
};

const styleSheet = document.createElement("style");
styleSheet.innerText = `
  @keyframes spin { to { transform: rotate(360deg); } }
  input:focus, select:focus { border-color: #FF7A00 !important; background-color: #FFFFFF !important; }
  input:disabled { opacity: 0.6; cursor: not-allowed; }
`;
document.head.appendChild(styleSheet);

export default AccountPage;
