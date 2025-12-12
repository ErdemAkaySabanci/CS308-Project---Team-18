// OrderDetailPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { apiService } from "../services/apiService";

const OrderDetailPage = () => {
  const { id } = useParams(); // /orders/:id
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchOrder() {
      try {
        setLoading(true);
        const data = await apiService.get(`/orders/${id}/`);
        if (!data) throw new Error("Order not found");
        setOrder(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load order details.");
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [id]);

  if (loading) return <div style={styles.center}>Loading order...</div>;
  if (error) return <div style={styles.center}>{error}</div>;

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <Link to="/orders" style={styles.backLink}>← Back to Orders</Link>

        <h1 style={styles.title}>Order #{order.id}</h1>

        {/* General order info */}
        <div style={styles.section}>
          <p><strong>Status:</strong> {order.status}</p>
          <p><strong>Total Price:</strong> {order.total_price} TL</p>
          <p><strong>Invoice:</strong> {order.invoice_number}</p>
          <p><strong>Address:</strong> {order.delivery_address}</p>
          <p><strong>Created:</strong> {new Date(order.created_at).toLocaleString()}</p>
        </div>

        <h2 style={styles.subTitle}>Items</h2>

        <div style={styles.itemsWrapper}>
          {order.items.map((item) => (
            <div key={item.id} style={styles.itemCard}>
              <div style={styles.itemLeft}>
                <strong>{item.product_name}</strong>
                <p>Quantity: {item.quantity}</p>
                <p>Unit Price: {item.price} TL</p>
              </div>
              <div style={styles.itemRight}>
                <strong>{(item.price * item.quantity).toFixed(2)} TL</strong>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: "100vh",
    padding: "40px 16px",
    background: "linear-gradient(135deg, #2D5FFF 0%, #FF7A00 100%)",
    fontFamily: "Inter, sans-serif",
  },
  card: {
    maxWidth: "720px",
    margin: "0 auto",
    background: "#fff",
    padding: "24px",
    borderRadius: "16px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
  },
  title: {
    margin: "16px 0 8px",
    fontSize: "28px",
    fontWeight: 700,
  },
  subTitle: {
    marginTop: 32,
    fontSize: "22px",
    fontWeight: 600,
  },
  section: {
    background: "#F8FAFC",
    padding: "16px",
    borderRadius: "12px",
    marginTop: "12px",
    lineHeight: 1.6,
  },
  itemsWrapper: {
    marginTop: 16,
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  itemCard: {
    display: "flex",
    justifyContent: "space-between",
    padding: "16px",
    background: "#F1F5F9",
    borderRadius: "12px",
  },
  itemLeft: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  itemRight: {
    fontSize: "18px",
    fontWeight: 700,
  },
  backLink: {
    textDecoration: "none",
    color: "#1E293B",
    fontSize: "14px",
  },
  center: {
    marginTop: "20vh",
    textAlign: "center",
    fontSize: "20px",
  },
};

export default OrderDetailPage;
