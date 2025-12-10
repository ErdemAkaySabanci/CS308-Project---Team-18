import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiService } from "../services/apiService";
import { cartService } from "../services/cartService";


function CheckoutPage() {
  const [cart, setCart] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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

  const placeOrder = async () => {
    if (!user.home_address || user.home_address.trim() === "") {
      alert("Please add your home address before checkout.");
      return;
    }

    try {
      const result = await apiService.post("/orders/checkout/", {});

      alert("Order created successfully!");
      navigate("/orders"); // Order History Page
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
        <h2 style={styles.sectionTitle}>Delivery Address</h2>

        <div style={styles.addressBox}>
          {user.home_address ? (
            <p style={styles.text}>{user.home_address}</p>
          ) : (
            <p style={styles.warning}>No address added. Add it in your Profile.</p>
          )}
        </div>
      </div>

      {/* ORDER SUMMARY CARD */}
      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Order Summary</h2>

        {cart.items.map((item) => (
          <div key={item.id} style={styles.summaryRow}>
            <span>{item.name} (x{item.quantity})</span>
            <span>{item.subtotal} TL</span>
          </div>
        ))}

        <hr style={styles.divider} />

        <div style={{ ...styles.summaryRow, fontWeight: "700" }}>
          <span>Total</span>
          <span>{cart.total_price} TL</span>
        </div>

        <button style={styles.checkoutButton} onClick={placeOrder}>
          Confirm Order
        </button>
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
    marginBottom: "12px",
  },
  addressBox: {
    background: "#F9FAFB",
    padding: "12px 16px",
    borderRadius: "10px",
    border: "1px solid #E5E7EB",
  },
  text: {
    fontSize: "15px",
    color: "#374151",
  },
  warning: {
    color: "#b91c1c",
    fontSize: "15px",
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
    padding: "14px",
    background: "#2D5FFF",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontSize: "16px",
    fontWeight: 600,
    cursor: "pointer",
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
