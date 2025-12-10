import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiService } from "../services/apiService";

function OrderHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openOrderId, setOpenOrderId] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await apiService.getOrderHistory();
      console.log('Orders data:', data);
      setOrders(data.results ?? data ?? []);
    } catch (err) {
      console.error('Orders error:', err);
      setError("Failed to load your orders.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.centerContainer}>
        <div style={styles.spinner}></div>
        <p>Loading your orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.centerContainer}>
        <p style={{ color: "red" }}>{error}</p>
        <button onClick={loadOrders} style={styles.retryButton}>Retry</button>
      </div>
    );
  }

  // No orders - show empty state
  if (!orders || orders.length === 0) {
    return (
      <div style={styles.pageWrapper}>
        <div style={styles.container}>
          <h1 style={styles.title}>📦 My Orders</h1>
          
          <div style={styles.emptyState}>
            <span style={styles.emptyIcon}>🛒</span>
            <h2>No orders yet</h2>
            <p style={styles.emptyText}>You haven't placed any orders yet. Start shopping to see your orders here!</p>
            <Link to="/" style={styles.shopButton}>Start Shopping</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.container}>
        <h1 style={styles.title}>📦 My Orders</h1>
        <p style={styles.subtitle}>You have {orders.length} order(s)</p>

        {orders.map((order) => (
          <div key={order.id} style={styles.orderCard}>
            <div style={styles.orderHeader}>
              <div>
                <h3 style={styles.orderNumber}>Order #{order.id}</h3>
                <p style={styles.orderDate}>
                  {new Date(order.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
                <div style={{
                  ...styles.statusBadge,
                  backgroundColor: getStatusColor(order.status).bg,
                  color: getStatusColor(order.status).text
                }}>
                  {order.status}
                </div>
              </div>

              <div style={styles.orderRight}>
                <h3 style={styles.orderTotal}>{order.total_price} TL</h3>
                <button
                  onClick={() => setOpenOrderId((prev) => (prev === order.id ? null : order.id))}
                  style={styles.viewButton}
                >
                  {openOrderId === order.id ? 'Hide Items' : 'View Items'}
                </button>
              </div>
            </div>

            {/* Order Items */}
            {openOrderId === order.id && (
              <div style={styles.itemsContainer}>
                <h4 style={styles.itemsTitle}>Order Items</h4>

                {order.items && order.items.map((item) => (
                  <div key={item.id} style={styles.itemRow}>
                    <div style={styles.itemInfo}>
                      <span style={styles.itemName}>{item.product_name || item.name || "Product"}</span>
                      <span style={styles.itemQty}>x{item.quantity}</span>
                    </div>
                    <strong style={styles.itemPrice}>{item.subtotal || item.price} TL</strong>
                  </div>
                ))}

                <div style={styles.invoiceRow}>
                  <span>Invoice #: {order.invoice_number}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const getStatusColor = (status) => {
  const colors = {
    'processing': { bg: '#FEF3C7', text: '#D97706' },
    'in_transit': { bg: '#DBEAFE', text: '#2563EB' },
    'delivered': { bg: '#D1FAE5', text: '#059669' },
    'cancelled': { bg: '#FEE2E2', text: '#DC2626' },
  };
  return colors[status] || { bg: '#F3F4F6', text: '#6B7280' };
};

const styles = {
  pageWrapper: {
    minHeight: '100vh',
    backgroundColor: '#F8FAFC',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '40px 24px',
  },
  centerContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    gap: '16px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #E2E8F0',
    borderTopColor: '#F97316',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: '8px',
  },
  subtitle: {
    color: '#64748B',
    marginBottom: '32px',
  },
  
  // Empty State
  emptyState: {
    textAlign: 'center',
    padding: '80px 40px',
    backgroundColor: '#FFFFFF',
    borderRadius: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  },
  emptyIcon: {
    fontSize: '80px',
    display: 'block',
    marginBottom: '24px',
  },
  emptyText: {
    color: '#64748B',
    marginBottom: '24px',
    maxWidth: '400px',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  shopButton: {
    display: 'inline-block',
    padding: '14px 32px',
    backgroundColor: '#F97316',
    color: '#FFFFFF',
    borderRadius: '12px',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '16px',
  },
  retryButton: {
    padding: '12px 24px',
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
  },

  // Order Card
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  },
  orderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderNumber: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1E293B',
    margin: '0 0 4px 0',
  },
  orderDate: {
    color: '#64748B',
    fontSize: '14px',
    margin: '0 0 12px 0',
  },
  statusBadge: {
    display: 'inline-block',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  orderRight: {
    textAlign: 'right',
  },
  orderTotal: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#F97316',
    margin: '0 0 12px 0',
  },
  viewButton: {
    padding: '10px 20px',
    backgroundColor: '#1E3A8A',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
  },

  // Items
  itemsContainer: {
    marginTop: '24px',
    paddingTop: '24px',
    borderTop: '1px solid #F1F5F9',
  },
  itemsTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: '16px',
  },
  itemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid #F8FAFC',
  },
  itemInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  itemName: {
    fontWeight: '500',
    color: '#1E293B',
  },
  itemQty: {
    color: '#64748B',
    fontSize: '14px',
  },
  itemPrice: {
    color: '#F97316',
    fontWeight: '600',
  },
  invoiceRow: {
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #F1F5F9',
    color: '#64748B',
    fontSize: '14px',
  },
};

// Animation
const styleSheet = document.createElement("style");
styleSheet.innerText = `@keyframes spin { to { transform: rotate(360deg); } }`;
document.head.appendChild(styleSheet);

export default OrderHistoryPage;
