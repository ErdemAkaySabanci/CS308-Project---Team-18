import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiService } from "../services/apiService";
import { cartService } from "../services/cartService";

function CheckoutPage() {
  const [cart, setCart] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addressInput, setAddressInput] = useState("");
  const [savingAddress, setSavingAddress] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const navigate = useNavigate();

  useEffect(() => {
    loadPage();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  const loadPage = async () => {
    try {
      setLoading(true);
      const userInfo = await apiService.get("/users/me/");
      setUser(userInfo);
      setAddressInput(userInfo.home_address || "");
      const cartData = await cartService.getCart();
      setCart(cartData);
    } catch (err) {
      console.error(err);
      setError("Failed to load checkout page.");
    } finally {
      setLoading(false);
    }
  };

  const saveAddress = async () => {
    if (!addressInput.trim()) {
      showToast("Please enter your delivery address.", "error");
      return;
    }

    try {
      setSavingAddress(true);
      await apiService.updateAddress(addressInput);
      setUser({ ...user, home_address: addressInput });
      showToast("Address saved successfully! ✓", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to save address. Please try again.", "error");
    } finally {
      setSavingAddress(false);
    }
  };

  const placeOrder = async () => {
    if (!user.home_address || user.home_address.trim() === "") {
      showToast("Please add and save your address first.", "error");
      return;
    }

    try {
      await apiService.post("/orders/checkout/", {});
      showToast("Order created successfully! 🎉", "success");
      setTimeout(() => navigate("/orders"), 1500);
    } catch (err) {
      console.error(err);
      showToast("Checkout failed. Please try again.", "error");
    }
  };

  if (loading) {
    return (
      <div style={styles.center}>
        <div style={styles.spinner}></div>
        <p>Loading checkout...</p>
      </div>
    );
  }
  
  if (error) return <div style={styles.center}>{error}</div>;

  if (!cart || cart.items.length === 0) {
    return (
      <div style={styles.center}>
        <span style={{ fontSize: '64px', marginBottom: '20px' }}>🛒</span>
        <h2>Your cart is empty.</h2>
        <Link to="/" style={styles.shopLink}>Start Shopping</Link>
      </div>
    );
  }

  return (
    <div style={styles.pageWrapper}>
      {/* Toast Notification */}
      {toast.show && (
        <div style={{
          ...styles.toast,
          backgroundColor: toast.type === 'success' ? '#10B981' : '#EF4444'
        }}>
          <span style={styles.toastIcon}>
            {toast.type === 'success' ? '✓' : '✕'}
          </span>
          <span>{toast.message}</span>
        </div>
      )}

      <div style={styles.page}>
        <h1 style={styles.title}>🛒 Checkout</h1>

        {/* ADDRESS CARD */}
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>📍 Delivery Address</h2>

          <div style={styles.addressBox}>
            <textarea
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              placeholder="Enter your full delivery address..."
              style={styles.textarea}
              rows={3}
            />
            <button
              onClick={saveAddress}
              style={{
                ...styles.saveButton,
                opacity: savingAddress ? 0.7 : 1
              }}
              disabled={savingAddress}
            >
              {savingAddress ? "Saving..." : "💾 Save Address"}
            </button>

            {user.home_address && (
              <p style={styles.savedText}>✅ Address saved</p>
            )}
          </div>
        </div>

        {/* ORDER SUMMARY CARD */}
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>📦 Order Summary</h2>

          {cart.items.map((item) => (
            <div key={item.id} style={styles.summaryRow}>
              <span>{item.product_name || item.name} (x{item.quantity})</span>
              <span style={styles.itemPrice}>{item.subtotal} TL</span>
            </div>
          ))}

          <hr style={styles.divider} />

          <div style={styles.totalRow}>
            <span>Total</span>
            <span style={styles.totalPrice}>{cart.total_price} TL</span>
          </div>

          <button
            style={{
              ...styles.checkoutButton,
              opacity: user.home_address ? 1 : 0.5,
              cursor: user.home_address ? "pointer" : "not-allowed"
            }}
            onClick={placeOrder}
            disabled={!user.home_address}
          >
            🛒 Confirm Order
          </button>

          {!user.home_address && (
            <p style={styles.warningText}>⚠️ Please save your address first</p>
          )}
        </div>

        <Link to="/cart" style={styles.backLink}>
          ← Back to Cart
        </Link>
      </div>
    </div>
  );
}

const styles = {
  pageWrapper: {
    minHeight: '100vh',
    backgroundColor: '#F8FAFC',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  page: {
    maxWidth: "800px",
    margin: "0 auto",
    padding: "40px 24px",
  },
  title: {
    fontSize: "32px",
    fontWeight: 700,
    marginBottom: "28px",
    color: '#1E293B',
  },
  card: {
    background: "#FFFFFF",
    padding: "28px",
    borderRadius: "16px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
    marginBottom: "24px",
  },
  sectionTitle: {
    fontSize: "20px",
    fontWeight: "700",
    marginBottom: "20px",
    color: '#1E293B',
  },
  addressBox: {
    background: "#F8FAFC",
    padding: "20px",
    borderRadius: "12px",
    border: "1px solid #E2E8F0",
  },
  textarea: {
    width: "100%",
    padding: "14px",
    fontSize: "15px",
    borderRadius: "10px",
    border: "1px solid #E2E8F0",
    marginBottom: "14px",
    resize: "vertical",
    fontFamily: "inherit",
    boxSizing: "border-box",
    transition: "border-color 0.2s ease",
  },
  saveButton: {
    padding: "12px 24px",
    background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontSize: "15px",
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
    transition: "all 0.2s ease",
  },
  savedText: {
    color: "#059669",
    marginTop: "12px",
    fontSize: "14px",
    fontWeight: 500,
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "12px 0",
    fontSize: "16px",
    color: '#475569',
    borderBottom: '1px solid #F1F5F9',
  },
  itemPrice: {
    fontWeight: 600,
    color: '#1E293B',
  },
  divider: {
    margin: "20px 0",
    border: "none",
    borderTop: "2px solid #F1F5F9",
  },
  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "12px 0",
    fontSize: "20px",
    fontWeight: 700,
    color: '#1E293B',
  },
  totalPrice: {
    color: '#F97316',
    fontSize: '24px',
  },
  checkoutButton: {
    marginTop: "24px",
    width: "100%",
    padding: "18px",
    background: "linear-gradient(135deg, #3B82F6 0%, #1E3A8A 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    fontSize: "17px",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 4px 14px rgba(59, 130, 246, 0.4)",
    transition: "all 0.2s ease",
  },
  warningText: {
    color: "#EF4444",
    textAlign: "center",
    marginTop: "14px",
    fontSize: "14px",
    fontWeight: 500,
  },
  center: {
    textAlign: "center",
    marginTop: "15vh",
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
  },
  spinner: {
    width: '48px',
    height: '48px',
    border: '4px solid #E2E8F0',
    borderTopColor: '#F97316',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  shopLink: {
    display: 'inline-block',
    padding: "14px 28px",
    background: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)",
    color: "#FFFFFF",
    borderRadius: "12px",
    textDecoration: "none",
    fontWeight: 700,
    fontSize: '16px',
  },
  backLink: {
    display: 'block',
    textAlign: 'center',
    color: '#3B82F6',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: '15px',
    marginTop: '8px',
  },

  // Toast
  toast: {
    position: "fixed",
    top: "100px",
    right: "24px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "16px 24px",
    borderRadius: "12px",
    color: "#FFFFFF",
    fontWeight: 600,
    boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
    zIndex: 9999,
    animation: "slideIn 0.3s ease",
  },
  toastIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    backgroundColor: "rgba(255,255,255,0.2)",
    fontWeight: "bold",
  },
};

// Add animations
const styleSheet = document.createElement("style");
styleSheet.innerText = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;
document.head.appendChild(styleSheet);

export default CheckoutPage;
