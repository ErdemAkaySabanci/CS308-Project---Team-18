import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiService } from "../services/apiService";

function OrderHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openOrderId, setOpenOrderId] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  
  // Review Modal State
  const [reviewModal, setReviewModal] = useState({
    isOpen: false,
    productId: null,
    productName: '',
    rating: 0,
    comment: '',
    submitting: false
  });
  
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

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 4000);
  };

  const openReviewModal = (productId, productName) => {
    setReviewModal({
      isOpen: true,
      productId,
      productName,
      rating: 0,
      comment: '',
      submitting: false
    });
  };

  const closeReviewModal = () => {
    setReviewModal({
      isOpen: false,
      productId: null,
      productName: '',
      rating: 0,
      comment: '',
      submitting: false
    });
  };

  const handleSubmitReview = async () => {
    if (reviewModal.rating === 0) {
      showToast('Please select a rating', 'error');
      return;
    }

    try {
      setReviewModal(prev => ({ ...prev, submitting: true }));
      
      await apiService.post('/reviews/create/', {
        product: reviewModal.productId,
        rating: reviewModal.rating,
        comment: reviewModal.comment
      });

      showToast('Review submitted! Rating is visible now. Comment awaits approval.', 'success');
      
      // Add to reviewed products
      setReviewedProducts(prev => new Set([...prev, reviewModal.productId]));
      
      closeReviewModal();
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Could not submit review.';
      showToast(errorMsg, 'error');
    } finally {
      setReviewModal(prev => ({ ...prev, submitting: false }));
    }
  };

  const renderStars = (rating, interactive = false, size = 24) => {
    return (
      <div style={{ display: 'flex', gap: '4px' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            onClick={interactive ? () => setReviewModal(prev => ({ ...prev, rating: star })) : undefined}
            style={{
              fontSize: `${size}px`,
              cursor: interactive ? 'pointer' : 'default',
              color: star <= rating ? '#F59E0B' : '#E2E8F0',
              transition: 'all 0.1s ease',
            }}
            onMouseEnter={interactive ? (e) => e.target.style.transform = 'scale(1.2)' : undefined}
            onMouseLeave={interactive ? (e) => e.target.style.transform = 'scale(1)' : undefined}
          >
            ★
          </span>
        ))}
      </div>
    );
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

      {/* Review Modal */}
      {reviewModal.isOpen && (
        <div style={styles.modalOverlay} onClick={closeReviewModal}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button style={styles.modalClose} onClick={closeReviewModal}>✕</button>
            
            <h2 style={styles.modalTitle}>⭐ Write a Review</h2>
            <p style={styles.modalProductName}>{reviewModal.productName}</p>
            
            <div style={styles.modalRatingSection}>
              <label style={styles.modalLabel}>Your Rating</label>
              {renderStars(reviewModal.rating, true, 36)}
              {reviewModal.rating > 0 && (
                <span style={styles.ratingText}>{reviewModal.rating} out of 5</span>
              )}
            </div>

            <div style={styles.modalCommentSection}>
              <label style={styles.modalLabel}>Your Comment (optional)</label>
              <textarea
                value={reviewModal.comment}
                onChange={(e) => setReviewModal(prev => ({ ...prev, comment: e.target.value }))}
                placeholder="Share your experience with this product..."
                style={styles.modalTextarea}
                rows={4}
              />
            </div>

            <div style={styles.modalNotes}>
              <p>📌 <strong>Rating</strong> will be visible immediately</p>
              <p>📝 <strong>Comment</strong> will be visible after approval</p>
            </div>

            <div style={styles.modalButtons}>
              <button style={styles.cancelButton} onClick={closeReviewModal}>
                Cancel
              </button>
              <button
                style={{
                  ...styles.submitButton,
                  opacity: (reviewModal.submitting || reviewModal.rating === 0) ? 0.6 : 1,
                  cursor: (reviewModal.submitting || reviewModal.rating === 0) ? 'not-allowed' : 'pointer'
                }}
                onClick={handleSubmitReview}
                disabled={reviewModal.submitting || reviewModal.rating === 0}
              >
                {reviewModal.submitting ? '⏳ Submitting...' : '📤 Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}

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
                  <button
                    onClick={() => setOpenOrderId((prev) => (prev === order.id ? null : order.id))}
                    style={styles.viewButton}
                  >
                    {openOrderId === order.id ? '▲ Hide Items' : '▼ View Items'}
                  </button>
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
                          
                          {/* Review Button or Badge */}
                          {canReview && (
                            isReviewed ? (
                              <span style={styles.reviewedBadge}>
                                ✓ Reviewed
                              </span>
                            ) : (
                              <button
                                style={styles.reviewButton}
                                onClick={() => openReviewModal(productId, item.product_name || item.name)}
                              >
                                ⭐ Write Review
                              </button>
                            )
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
  
  // Toast
  toast: {
    position: 'fixed',
    top: '100px',
    right: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 24px',
    borderRadius: '12px',
    color: '#FFFFFF',
    boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
    zIndex: 10000,
    animation: 'slideIn 0.3s ease',
  },
  toastIcon: {
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
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
  
  // Review Button & Badge
  reviewButton: {
    padding: '8px 16px',
    backgroundColor: '#FEF3C7',
    color: '#D97706',
    border: '2px solid #FDE68A',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '13px',
    transition: 'all 0.2s ease',
  },
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

  // Modal
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10001,
    padding: '20px',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: '24px',
    padding: '32px',
    maxWidth: '500px',
    width: '100%',
    position: 'relative',
    boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
    animation: 'modalSlideIn 0.3s ease',
  },
  modalClose: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#F1F5F9',
    color: '#64748B',
    fontSize: '18px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: '8px',
    marginTop: '0',
  },
  modalProductName: {
    color: '#64748B',
    fontSize: '16px',
    marginBottom: '24px',
  },
  modalRatingSection: {
    marginBottom: '24px',
  },
  modalLabel: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#475569',
    marginBottom: '12px',
  },
  ratingText: {
    marginTop: '8px',
    color: '#64748B',
    fontSize: '14px',
  },
  modalCommentSection: {
    marginBottom: '20px',
  },
  modalTextarea: {
    width: '100%',
    padding: '14px',
    fontSize: '15px',
    borderRadius: '12px',
    border: '2px solid #E2E8F0',
    resize: 'vertical',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s ease',
  },
  modalNotes: {
    backgroundColor: '#F8FAFC',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '24px',
    fontSize: '13px',
    color: '#64748B',
  },
  modalButtons: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    padding: '12px 24px',
    backgroundColor: '#F1F5F9',
    color: '#64748B',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '15px',
  },
  submitButton: {
    padding: '12px 24px',
    backgroundColor: '#22C55E',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '15px',
  },
};

// Animation
const styleSheet = document.createElement("style");
styleSheet.innerText = `
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes slideIn { from { transform: translateX(100px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  @keyframes modalSlideIn { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
`;
document.head.appendChild(styleSheet);

export default OrderHistoryPage;
