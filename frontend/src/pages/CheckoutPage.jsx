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
  const navigate = useNavigate();

  useEffect(() => {
    loadPage();
  }, []);

  const loadPage = async () => {
    try {
      setLoading(true);

      // 1) User Info
      const userInfo = await apiService.get("/users/me/");
      setUser(userInfo);
      setAddressInput(userInfo.home_address || "");

      // 2) Cart Info
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
      alert("Please enter your delivery address.");
      return;
    }

    try {
      setSavingAddress(true);
      await apiService.updateAddress(addressInput);
      // Update local user state with new address
      setUser({ ...user, home_address: addressInput });
      alert("Address saved successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to save address. Please try again.");
    } finally {
      setSavingAddress(false);
    }
  };

  const placeOrder = async () => {
    if (!user.home_address || user.home_address.trim() === "") {
      alert("Please add and save your home address before checkout.");
      return;
    }

    try {
      await apiService.post("/orders/checkout/", {});
      alert("Order created successfully! 🎉");
      navigate("/orders");
    } catch (err) {
      console.error(err);
      alert("Checkout failed. Please try again.");
    }
  };

  if (loading) return <div style={styles.center}>Loading checkout...</div>;
  if (error) return <div style={styles.center}>{error}</div>;

  if (!cart || cart.items.length === 0) {
    return (
      <div style={styles.center}>
        <h2>Your cart is empty.</h2>
        <Link to="/" style={styles.link}>Go back to products</Link>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Checkout</h1>

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
            style={styles.saveButton}
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
            <span>{item.name} (x{item.quantity})</span>
            <span>{item.subtotal} TL</span>
          </div>
        ))}

        <hr style={styles.divider} />

        <div style={{ ...styles.summaryRow, fontWeight: "700", fontSize: "18px" }}>
          <span>Total</span>
          <span>{cart.total_price} TL</span>
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
    </div>
  );
}

const styles = {
  page: {
    maxWidth: "800px",
    margin: "0 auto",
    padding: "32px 20px",
    fontFamily: "Inter, sans-serif",
  },
  title: {
    fontSize: "32px",
    fontWeight: 700,
    marginBottom: "20px",
  },
  card: {
    background: "#fff",
    padding: "24px",
    borderRadius: "14px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
    marginBottom: "24px",
  },
  sectionTitle: {
    fontSize: "22px",
    fontWeight: "600",
    marginBottom: "16px",
  },
  addressBox: {
    background: "#F9FAFB",
    padding: "16px",
    borderRadius: "10px",
    border: "1px solid #E5E7EB",
  },
  textarea: {
    width: "100%",
    padding: "12px",
    fontSize: "15px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    marginBottom: "12px",
    resize: "vertical",
    fontFamily: "inherit",
    boxSizing: "border-box",
  },
  saveButton: {
    padding: "10px 20px",
    background: "#10b981",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
  },
  savedText: {
    color: "#059669",
    marginTop: "10px",
    fontSize: "14px",
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "8px 0",
    fontSize: "16px",
  },
  divider: {
    margin: "16px 0",
    borderColor: "#E5E7EB",
  },
  checkoutButton: {
    marginTop: "18px",
    width: "100%",
    padding: "16px",
    background: "#2D5FFF",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontSize: "17px",
    fontWeight: 600,
    cursor: "pointer",
  },
  warningText: {
    color: "#dc2626",
    textAlign: "center",
    marginTop: "10px",
    fontSize: "14px",
  },
  center: {
    textAlign: "center",
    marginTop: "20vh",
  },
  link: {
    color: "#2D5FFF",
    textDecoration: "none",
    fontWeight: 600,
  },
};

export default CheckoutPage;
