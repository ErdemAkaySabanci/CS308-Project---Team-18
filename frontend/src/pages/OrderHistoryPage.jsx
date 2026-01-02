import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiService } from "../services/apiService";

function OrderHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openOrderId, setOpenOrderId] = useState(null);
  const [refundOrderId, setRefundOrderId] = useState(null);
  const [refundReason, setRefundReason] = useState("");

  // Track which products have been reviewed
  const [reviewedProducts, setReviewedProducts] = useState(new Set());

  useEffect(() => {
    loadOrders();
    loadMyReviews();
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

  const loadMyReviews = async () => {
    try {
      const reviews = await apiService.get('/reviews/my-reviews/');
      const reviewedIds = new Set(reviews.map(r => r.product));
      setReviewedProducts(reviewedIds);
    } catch (err) {
      console.error('Could not load reviews:', err);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
      return;
    }

    try {
      await apiService.post(`/orders/${orderId}/cancel/`);
      alert('✅ Order cancelled successfully!');
      loadOrders(); // Refresh orders
    } catch (err) {
      console.error('Cancel error:', err);
      alert('❌ Failed to cancel order: ' + (err.message || 'Unknown error'));
    }
  };

  const handleRefundRequest = async () => {
    if (!refundReason.trim()) {
      alert("Please provide a reason for the refund.");
      return;
    }

    try {
      await apiService.requestRefund(refundOrderId, refundReason);
      alert('✅ Refund requested successfully!');
      setRefundOrderId(null);
      setRefundReason("");
      loadOrders(); // Refresh orders to show updated status
    } catch (err) {
      console.error('Refund error:', err);
      alert('❌ Failed to request refund: ' + (err.message || 'Unknown error'));
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

        {orders.map((order) => {
          const statusInfo = getStatusInfo(order.status);

          return (
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
                    backgroundColor: statusInfo.bg,
                    color: statusInfo.text,
                    borderColor: statusInfo.border
                  }}>
                    <span style={styles.statusIcon}>{statusInfo.icon}</span>
                    {statusInfo.label}
                  </div>
                </div>

                <div style={styles.orderRight}>
                  <h3 style={styles.orderTotal}>{order.total_price} TL</h3>
                  <div style={styles.actionButtons}>
                    <button
                      onClick={() => setOpenOrderId((prev) => (prev === order.id ? null : order.id))}
                      style={styles.viewButton}
                    >
                      {openOrderId === order.id ? '▲ Hide Items' : '▼ View Items'}
                    </button>

                    {/* Cancel Order Button - only for processing orders */}
                    {order.status === 'processing' && (
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        style={styles.cancelButton}
                      >
                        ❌ Cancel Order
                      </button>
                    )}

                    {/* Request Refund Button - only for delivered orders */}
                    {order.status === 'delivered' && (
                      <button
                        onClick={() => setRefundOrderId(order.id)}
                        style={styles.refundButton}
                      >
                        🔄 Request Refund
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Items */}
              {openOrderId === order.id && (
                <div style={styles.itemsContainer}>
                  <h4 style={styles.itemsTitle}>Order Items</h4>

                  {order.items && order.items.map((item) => {
                    const productId = item.product_id || item.product;
                    const isReviewed = reviewedProducts.has(productId);
                    const canReview = order.status === 'delivered';

                    return (
                      <div key={item.id} style={styles.itemRow}>
                        <div style={styles.itemInfo}>
                          <Link
                            to={`/products/${productId}`}
                            style={styles.itemName}
                          >
                            {item.product_name || item.name || "Product"}
                          </Link>
                          <span style={styles.itemQty}>x{item.quantity}</span>
                        </div>

                        <div style={styles.itemActions}>
                          <strong style={styles.itemPrice}>{item.subtotal || item.price} TL</strong>

                          {/* Reviewed Badge - only shown if delivered and reviewed */}
                          {canReview && isReviewed && (
                            <span style={styles.reviewedBadge}>
                              ✓ Reviewed
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {order.invoice_number && (
                    <div style={styles.invoiceRow}>
                      <span>🧾 Invoice #: {order.invoice_number}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Refund Modal */}
      {refundOrderId && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalTitle}>Request Refund</h3>
            <p style={styles.modalSubtitle}>Order #{refundOrderId}</p>

            <textarea
              style={styles.textarea}
              placeholder="Please describe why you are requesting a refund..."
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              rows={4}
            />

            <div style={styles.modalActions}>
              <button
                onClick={() => {
                  setRefundOrderId(null);
                  setRefundReason("");
                }}
                style={styles.cancelButton}
              >
                Cancel
              </button>
              <button
                onClick={handleRefundRequest}
                style={styles.submitButton}
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const getStatusInfo = (status) => {
  const statusMap = {
    'processing': {
      icon: '⏳',
      label: 'Processing',
      bg: '#FEF3C7',
      text: '#D97706',
      border: '#FDE68A'
    },
    'in_transit': {
      icon: '🚚',
      label: 'In Transit',
      bg: '#DBEAFE',
      text: '#2563EB',
      border: '#BFDBFE'
    },
    'delivered': {
      icon: '✅',
      label: 'Delivered',
      bg: '#D1FAE5',
      text: '#059669',
      border: '#A7F3D0'
    },
    'cancelled': {
      icon: '❌',
      label: 'Cancelled',
      bg: '#FEE2E2',
      text: '#DC2626',
      border: '#FECACA'
    },
    'refund_requested': {
      icon: '🔄',
      label: 'Refund Requested',
      bg: '#FFF7ED',
      text: '#EA580C',
      border: '#FED7AA'
    },
    'refunded': {
      icon: '💰',
      label: 'Refunded',
      bg: '#F3F4F6',
      text: '#6B7280',
      border: '#E5E7EB'
    },
  };
  return statusMap[status] || { icon: '📦', label: status, bg: '#F3F4F6', text: '#6B7280', border: '#E5E7EB' };
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
    border: '1px solid #F1F5F9',
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
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '600',
    border: '2px solid',
  },
  statusIcon: {
    fontSize: '14px',
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
    transition: 'background-color 0.2s ease',
  },
  actionButtons: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  cancelButton: {
    padding: '10px 20px',
    backgroundColor: '#DC2626',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    transition: 'all 0.2s ease',
  },
  refundButton: {
    display: 'inline-block',
    padding: '10px 20px',
    backgroundColor: '#F59E0B',
    color: '#FFFFFF',
    borderRadius: '10px',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '14px',
    textAlign: 'center',
    transition: 'all 0.2s ease',
  },

  // Items
  itemsContainer: {
    marginTop: '24px',
    paddingTop: '24px',
    borderTop: '2px solid #F1F5F9',
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
    padding: '16px',
    marginBottom: '8px',
    backgroundColor: '#F8FAFC',
    borderRadius: '12px',
    border: '1px solid #E2E8F0',
  },
  itemInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  itemName: {
    fontWeight: '600',
    color: '#1E293B',
    textDecoration: 'none',
    transition: 'color 0.2s ease',
  },
  itemQty: {
    color: '#64748B',
    fontSize: '14px',
    backgroundColor: '#E2E8F0',
    padding: '4px 10px',
    borderRadius: '6px',
  },
  itemActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  itemPrice: {
    color: '#F97316',
    fontWeight: '700',
    fontSize: '16px',
  },

  // Reviewed Badge
  reviewedBadge: {
    padding: '8px 16px',
    backgroundColor: '#D1FAE5',
    color: '#059669',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '13px',
    border: '2px solid #A7F3D0',
  },

  invoiceRow: {
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #F1F5F9',
    color: '#64748B',
    fontSize: '14px',
  },

  // Modal Styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    padding: '32px',
    borderRadius: '16px',
    width: '90%',
    maxWidth: '500px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: '8px',
  },
  modalSubtitle: {
    color: '#64748B',
    marginBottom: '24px',
  },
  textarea: {
    width: '100%',
    padding: '12px',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    marginBottom: '24px',
    fontFamily: 'inherit',
    fontSize: '14px',
    resize: 'vertical',
    outline: 'none',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
  },
  submitButton: {
    padding: '10px 20px',
    backgroundColor: '#F59E0B', // Matching refund button color
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    transition: 'background-color 0.2s ease',
  },
};

// Animation
const styleSheet = document.createElement("style");
styleSheet.innerText = `
  @keyframes spin { to { transform: rotate(360deg); } }
`;
document.head.appendChild(styleSheet);

export default OrderHistoryPage;
