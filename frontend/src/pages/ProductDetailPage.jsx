import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { apiService } from "../services/apiService";
import { useCart } from "../context/CartContext";
import { authService } from "../services/authService";

function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(null);
  const [totalReviews, setTotalReviews] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Review eligibility state
  const [reviewEligibility, setReviewEligibility] = useState({
    canReview: false,
    reason: null,
    message: '',
    existingReview: null,
    loading: true
  });

  const { refreshCart } = useCart();
  const isLoggedIn = authService.isAuthenticated();

  useEffect(() => {
    loadProduct();
    loadReviews();
    if (isLoggedIn) {
      checkReviewEligibility();
    }
  }, [id, isLoggedIn]);

  async function loadProduct() {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.get(`/products/${id}/`);
      setProduct(data);
    } catch (err) {
      console.error(err);
      setError("Could not load product.");
    } finally {
      setLoading(false);
    }
  }

  async function loadReviews() {
    try {
      const data = await apiService.get(`/reviews/product/${id}/`);
      setReviews(data.reviews || []);
      setAverageRating(data.average_rating);
      setTotalReviews(data.total_reviews || 0);
    } catch (err) {
      console.error('Could not load reviews:', err);
    }
  }

  async function checkReviewEligibility() {
    try {
      const data = await apiService.get(`/reviews/check-eligibility/${id}/`);
      setReviewEligibility({
        canReview: data.can_review,
        reason: data.reason,
        message: data.message,
        existingReview: data.existing_review || null,
        loading: false
      });

      // If user already reviewed, populate the form with existing data
      if (data.existing_review) {
        setUserRating(data.existing_review.rating);
        setUserComment(data.existing_review.comment || '');
      }
    } catch (err) {
      console.error('Could not check review eligibility:', err);
      setReviewEligibility({
        canReview: false,
        reason: 'error',
        message: 'Could not verify review eligibility.',
        existingReview: null,
        loading: false
      });
    }
  }

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 4000);
  };

  async function handleAddToCart() {
    try {
      await apiService.addToCart(product.id, 1);
      await refreshCart();
      showToast('Product added to cart! 🛒', 'success');
    } catch (err) {
      showToast('Could not add to cart', 'error');
      console.error(err);
    }
  }

  async function handleSubmitReview() {
    if (userRating === 0) {
      showToast('Please select a rating', 'error');
      return;
    }

    try {
      setSubmittingReview(true);
      await apiService.post('/reviews/create/', {
        product: parseInt(id),
        rating: userRating,
        comment: userComment
      });
      showToast('Review submitted! Rating is visible now. Comment awaits approval.', 'success');

      // Update eligibility state
      setReviewEligibility(prev => ({
        ...prev,
        canReview: false,
        reason: 'already_reviewed',
        message: 'You have already reviewed this product.'
      }));

      // Reload reviews to show the new rating
      loadReviews();
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Could not submit review.';
      showToast(errorMsg, 'error');
      console.error(err);
    } finally {
      setSubmittingReview(false);
    }
  }

  const renderStars = (rating, interactive = false, size = 24) => {
    return (
      <div style={{ display: 'flex', gap: '4px' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            onClick={interactive ? () => setUserRating(star) : undefined}
            style={{
              fontSize: `${size}px`,
              cursor: interactive ? 'pointer' : 'default',
              color: star <= rating ? '#F59E0B' : '#E2E8F0',
              transition: 'transform 0.1s ease',
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

  // Render the appropriate review section based on eligibility
  const renderReviewSection = () => {
    if (!isLoggedIn) {
      return (
        <div style={styles.eligibilityCard}>
          <div style={styles.eligibilityIcon}>🔐</div>
          <p style={styles.eligibilityMessage}>
            Please <Link to="/login" style={styles.loginLink}>log in</Link> to write a review.
          </p>
        </div>
      );
    }

    if (reviewEligibility.loading) {
      return (
        <div style={styles.eligibilityCard}>
          <div style={styles.loadingSpinner}></div>
          <p style={styles.eligibilityMessage}>Checking review eligibility...</p>
        </div>
      );
    }

    // User CAN review
    if (reviewEligibility.canReview) {
      return (
        <div style={styles.writeReviewCard}>
          <h3 style={styles.writeReviewTitle}>✍️ Write a Review</h3>

          <div style={styles.ratingInput}>
            <label style={styles.ratingLabel}>Your Rating:</label>
            {renderStars(userRating, true, 32)}
            {userRating > 0 && (
              <span style={styles.ratingValue}>{userRating}/5</span>
            )}
          </div>

          <textarea
            value={userComment}
            onChange={(e) => setUserComment(e.target.value)}
            placeholder="Share your experience with this product... (optional)"
            style={styles.commentInput}
            rows={4}
          />

          <div style={styles.reviewNotes}>
            <p>📌 <strong>Rating</strong> will be visible immediately</p>
            <p>📝 <strong>Comment</strong> will be visible after product manager approval</p>
          </div>

          <button
            onClick={handleSubmitReview}
            disabled={submittingReview || userRating === 0}
            style={{
              ...styles.submitReviewButton,
              opacity: (submittingReview || userRating === 0) ? 0.6 : 1,
              cursor: (submittingReview || userRating === 0) ? 'not-allowed' : 'pointer'
            }}
          >
            {submittingReview ? '⏳ Submitting...' : '📤 Submit Review'}
          </button>
        </div>
      );
    }

    // User CANNOT review - show reason
    const getEligibilityDisplay = () => {
      switch (reviewEligibility.reason) {
        case 'already_reviewed':
          return {
            icon: '✅',
            bgColor: '#ECFDF5',
            borderColor: '#A7F3D0',
            textColor: '#065F46',
            title: 'You have reviewed this product'
          };
        case 'not_delivered':
          return {
            icon: '📦',
            bgColor: '#FEF3C7',
            borderColor: '#FDE68A',
            textColor: '#92400E',
            title: 'Waiting for delivery'
          };
        case 'not_purchased':
          return {
            icon: '🛒',
            bgColor: '#FEE2E2',
            borderColor: '#FECACA',
            textColor: '#991B1B',
            title: 'Purchase required'
          };
        default:
          return {
            icon: '❓',
            bgColor: '#F3F4F6',
            borderColor: '#E5E7EB',
            textColor: '#4B5563',
            title: 'Cannot review'
          };
      }
    };

    const display = getEligibilityDisplay();

    return (
      <div style={{
        ...styles.eligibilityCard,
        backgroundColor: display.bgColor,
        borderColor: display.borderColor
      }}>
        <div style={styles.eligibilityIcon}>{display.icon}</div>
        <h4 style={{ ...styles.eligibilityTitle, color: display.textColor }}>
          {display.title}
        </h4>
        <p style={{ ...styles.eligibilityMessage, color: display.textColor }}>
          {reviewEligibility.message}
        </p>

        {/* Show existing review if available */}
        {reviewEligibility.existingReview && (
          <div style={styles.existingReviewPreview}>
            <p style={styles.existingReviewLabel}>Your review:</p>
            <div style={styles.existingRating}>
              {renderStars(reviewEligibility.existingReview.rating, false, 20)}
            </div>
            {reviewEligibility.existingReview.comment && (
              <p style={styles.existingComment}>
                "{reviewEligibility.existingReview.comment}"
                {!reviewEligibility.existingReview.is_approved && (
                  <span style={styles.pendingBadge}>⏳ Pending approval</span>
                )}
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Loading product...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div style={styles.errorContainer}>
        <span style={styles.errorIcon}>😕</span>
        <p>{error || "Product not found."}</p>
        <Link to="/" style={styles.backButton}>← Back to Products</Link>
      </div>
    );
  }

  const imageUrl = product.image || product.image_url || null;

  return (
    <div style={styles.pageWrapper}>
      {/* Toast Notification */}
      {toast.show && (
        <div style={{
          ...styles.toast,
          backgroundColor: toast.type === 'success' ? '#10B981' : '#EF4444'
        }}>
          <span style={styles.toastIconStyle}>
            {toast.type === 'success' ? '✓' : '✕'}
          </span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Breadcrumb */}
      <div style={styles.breadcrumb}>
        <Link to="/" style={styles.breadcrumbLink}>Home</Link>
        <span style={styles.breadcrumbSeparator}>/</span>
        <span style={styles.breadcrumbCurrent}>{product.name}</span>
      </div>

      <div style={styles.productContainer}>
        {/* Image Section */}
        <div style={styles.imageSection}>
          <div style={styles.imageWrapper}>
            {imageUrl ? (
              <img src={imageUrl} alt={product.name} style={styles.productImage} />
            ) : (
              <div style={styles.placeholderImage}>
                <span>🏃</span>
              </div>
            )}
            {product.discount_rate > 0 && (
              <span style={styles.discountBadge}>-{product.discount_rate}% OFF</span>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div style={styles.infoSection}>
          <div style={styles.categoryBadge}>{product.category?.name || 'Sports'}</div>

          <h1 style={styles.productTitle}>{product.name}</h1>

          {/* Rating Summary */}
          {averageRating && (
            <div style={styles.ratingSummary}>
              {renderStars(Math.round(averageRating))}
              <span style={styles.ratingText}>
                {averageRating.toFixed(1)} ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
              </span>
            </div>
          )}

          <p style={styles.description}>
            {product.description || "No description available."}
          </p>

          {/* Price */}
          <div style={styles.priceContainer}>
            <span style={styles.currentPrice}>{product.discounted_price || product.price} TL</span>
            {product.discount_rate > 0 && (
              <span style={styles.originalPrice}>{product.price} TL</span>
            )}
          </div>

          {/* Stock Status */}
          <div style={styles.stockContainer}>
            <div style={{
              ...styles.stockBadge,
              ...(product.is_in_stock ? styles.inStock : styles.outOfStock)
            }}>
              <span style={styles.stockDot}></span>
              {product.is_in_stock ? 'In Stock' : 'Out of Stock'}
            </div>
            {product.quantity_in_stock !== undefined && product.quantity_in_stock > 0 && (
              product.quantity_in_stock <= 3 ? (
                <span style={styles.lowStockWarning}>
                  🔥 Only {product.quantity_in_stock} left - Order soon!
                </span>
              ) : (
                <span style={styles.stockCount}>
                  {product.quantity_in_stock} units available
                </span>
              )
            )}
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            style={{
              ...styles.addToCartButton,
              ...(product.is_in_stock ? {} : styles.buttonDisabled)
            }}
            disabled={!product.is_in_stock}
          >
            <span>🛒</span>
            Add to Cart
          </button>

          {/* Features */}
          <div style={styles.features}>
            <div style={styles.featureItem}>
              <span>🚚</span>
              <span>Free Delivery</span>
            </div>
            <div style={styles.featureItem}>
              <span>↩️</span>
              <span>30-Day Returns</span>
            </div>
            <div style={styles.featureItem}>
              <span>✓</span>
              <span>Secure Payment</span>
            </div>
          </div>

          {/* Specifications */}
          <div style={styles.specificationsSection}>
            <h3 style={styles.specificationsTitle}>📋 Product Specifications</h3>
            <div style={styles.specsList}>
              {product.model && (
                <div style={styles.specItem}>
                  <span style={styles.specLabel}>Model:</span>
                  <span style={styles.specValue}>{product.model}</span>
                </div>
              )}
              {product.serial_number && (
                <div style={styles.specItem}>
                  <span style={styles.specLabel}>Serial Number:</span>
                  <span style={styles.specValue}>{product.serial_number}</span>
                </div>
              )}
              {product.warranty_status && (
                <div style={styles.specItem}>
                  <span style={styles.specLabel}>Warranty:</span>
                  <span style={styles.specValue}>{product.warranty_status}</span>
                </div>
              )}
              {product.distributor && (
                <div style={styles.specItem}>
                  <span style={styles.specLabel}>Distributor:</span>
                  <span style={styles.specValue}>{product.distributor}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div style={styles.reviewsSection}>
        <h2 style={styles.reviewsTitle}>⭐ Customer Reviews</h2>

        {/* Review Form / Eligibility Message */}
        {renderReviewSection()}

        {/* Reviews List */}
        <div style={styles.reviewsList}>
          <h3 style={styles.reviewsListTitle}>
            {totalReviews > 0 ? `All Reviews (${totalReviews})` : 'Reviews'}
          </h3>

          {reviews.length === 0 ? (
            <div style={styles.noReviews}>
              <span style={{ fontSize: '48px' }}>📝</span>
              <p>No reviews yet. Be the first to review!</p>
            </div>
          ) : (
            reviews.map((review) => (
              <div key={review.id} style={styles.reviewCard}>
                <div style={styles.reviewHeader}>
                  <div style={styles.reviewerInfo}>
                    <span style={styles.reviewerAvatar}>
                      {review.username?.charAt(0).toUpperCase() || 'U'}
                    </span>
                    <span style={styles.reviewerName}>{review.username}</span>
                  </div>
                  <div style={styles.reviewMeta}>
                    {renderStars(review.rating, false, 18)}
                    <span style={styles.reviewDate}>
                      {new Date(review.created_at).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                </div>

                {review.comment ? (
                  <p style={styles.reviewComment}>{review.comment}</p>
                ) : (
                  <p style={styles.noCommentText}>Rating only (no comment)</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  pageWrapper: {
    minHeight: "100vh",
    backgroundColor: "#F8FAFC",
    fontFamily: "'Inter', -apple-system, sans-serif",
    padding: "24px",
  },
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
    boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
    zIndex: 9999,
    maxWidth: "400px",
    animation: "slideIn 0.3s ease",
  },
  toastIconStyle: {
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    backgroundColor: "rgba(255,255,255,0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
  },
  breadcrumb: {
    maxWidth: "1200px",
    margin: "0 auto 24px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  breadcrumbLink: { color: "#3B82F6", textDecoration: "none", fontWeight: "500", fontSize: "14px" },
  breadcrumbSeparator: { color: "#94A3B8" },
  breadcrumbCurrent: { color: "#64748B", fontSize: "14px" },
  productContainer: {
    maxWidth: "1200px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "48px",
    backgroundColor: "#FFFFFF",
    borderRadius: "24px",
    padding: "40px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
  },
  imageSection: {},
  imageWrapper: {
    position: "relative",
    borderRadius: "20px",
    overflow: "hidden",
    backgroundColor: "#F1F5F9",
  },
  productImage: { width: "100%", height: "500px", objectFit: "cover" },
  placeholderImage: {
    width: "100%",
    height: "500px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "120px",
    backgroundColor: "#FFF7ED",
  },
  discountBadge: {
    position: "absolute",
    top: "20px",
    left: "20px",
    backgroundColor: "#EF4444",
    color: "#FFFFFF",
    padding: "8px 16px",
    borderRadius: "30px",
    fontSize: "14px",
    fontWeight: "700",
  },
  infoSection: {},
  categoryBadge: {
    display: "inline-block",
    backgroundColor: "#FFF7ED",
    color: "#EA580C",
    padding: "6px 16px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "600",
    marginBottom: "16px",
    textTransform: "uppercase",
  },
  productTitle: { fontSize: "32px", fontWeight: "800", color: "#1E293B", margin: "0 0 12px 0" },
  ratingSummary: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" },
  ratingText: { color: "#64748B", fontSize: "14px" },
  description: { fontSize: "16px", color: "#64748B", lineHeight: "1.7", marginBottom: "24px" },
  priceContainer: { display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" },
  currentPrice: { fontSize: "36px", fontWeight: "800", color: "#F97316" },
  originalPrice: { fontSize: "20px", color: "#94A3B8", textDecoration: "line-through" },
  stockContainer: { display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px" },
  stockBadge: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 16px",
    borderRadius: "30px",
    fontSize: "14px",
    fontWeight: "600",
  },
  inStock: { backgroundColor: "#ECFDF5", color: "#059669" },
  outOfStock: { backgroundColor: "#FEF2F2", color: "#DC2626" },
  stockDot: { width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "currentColor" },
  stockCount: {
    color: "#64748B",
    fontSize: "14px",
  },
  lowStockWarning: {
    color: "#DC2626",
    fontSize: "14px",
    fontWeight: "600",
    backgroundColor: "#FEF2F2",
    padding: "6px 12px",
    borderRadius: "20px",
  },
  addToCartButton: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    padding: "18px 32px",
    backgroundColor: "#F97316",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "14px",
    fontSize: "18px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 4px 14px rgba(249, 115, 22, 0.4)",
    marginBottom: "32px",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
  },
  buttonDisabled: { backgroundColor: "#E2E8F0", color: "#94A3B8", cursor: "not-allowed", boxShadow: "none" },
  features: { display: "flex", gap: "24px", paddingTop: "24px", borderTop: "1px solid #F1F5F9" },
  featureItem: { display: "flex", alignItems: "center", gap: "8px", color: "#64748B", fontSize: "14px" },

  // Specifications
  specificationsSection: {
    marginTop: "32px",
    paddingTop: "32px",
    borderTop: "2px solid #F1F5F9",
  },
  specificationsTitle: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: "20px",
  },
  specsList: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  specItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    backgroundColor: "#F8FAFC",
    borderRadius: "10px",
    border: "1px solid #E2E8F0",
  },
  specLabel: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#475569",
  },
  specValue: {
    fontSize: "15px",
    color: "#1E293B",
    fontWeight: "500",
  },

  // Reviews Section
  reviewsSection: {
    maxWidth: "1200px",
    margin: "40px auto 0",
    backgroundColor: "#FFFFFF",
    borderRadius: "24px",
    padding: "40px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
  },
  reviewsTitle: { fontSize: "24px", fontWeight: "700", color: "#1E293B", marginBottom: "24px" },

  // Write Review Card
  writeReviewCard: {
    backgroundColor: "#F0FDF4",
    borderRadius: "16px",
    padding: "24px",
    marginBottom: "32px",
    border: "2px solid #BBF7D0",
  },
  writeReviewTitle: { fontSize: "18px", fontWeight: "600", color: "#166534", marginBottom: "20px", marginTop: "0" },
  ratingInput: { display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" },
  ratingLabel: { fontSize: "15px", fontWeight: "600", color: "#475569" },
  ratingValue: { fontSize: "14px", color: "#64748B", fontWeight: "500" },
  commentInput: {
    width: "100%",
    padding: "14px",
    fontSize: "15px",
    borderRadius: "12px",
    border: "1px solid #E2E8F0",
    resize: "vertical",
    fontFamily: "inherit",
    boxSizing: "border-box",
    marginBottom: "16px",
    transition: "border-color 0.2s ease",
  },
  reviewNotes: {
    backgroundColor: "#FFFFFF",
    borderRadius: "8px",
    padding: "12px 16px",
    marginBottom: "16px",
    fontSize: "13px",
    color: "#64748B",
  },
  submitReviewButton: {
    padding: "14px 28px",
    backgroundColor: "#22C55E",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "12px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
  },

  // Eligibility Card (for non-eligible states)
  eligibilityCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: "16px",
    padding: "32px",
    marginBottom: "32px",
    border: "2px solid #E2E8F0",
    textAlign: "center",
  },
  eligibilityIcon: {
    fontSize: "48px",
    marginBottom: "16px",
  },
  eligibilityTitle: {
    fontSize: "18px",
    fontWeight: "600",
    marginBottom: "8px",
    marginTop: "0",
  },
  eligibilityMessage: {
    fontSize: "14px",
    margin: "0",
    lineHeight: "1.6",
  },
  loginLink: { color: "#F97316", fontWeight: "600", textDecoration: "none" },

  // Existing review preview
  existingReviewPreview: {
    marginTop: "20px",
    paddingTop: "20px",
    borderTop: "1px solid #E5E7EB",
  },
  existingReviewLabel: {
    fontSize: "12px",
    color: "#6B7280",
    marginBottom: "8px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  existingRating: {
    marginBottom: "8px",
    display: "flex",
    justifyContent: "center",
  },
  existingComment: {
    fontSize: "14px",
    fontStyle: "italic",
    color: "#4B5563",
  },
  pendingBadge: {
    display: "inline-block",
    marginLeft: "8px",
    backgroundColor: "#FEF3C7",
    color: "#92400E",
    padding: "2px 8px",
    borderRadius: "4px",
    fontSize: "11px",
    fontWeight: "600",
  },

  // Loading spinner for eligibility check
  loadingSpinner: {
    width: "32px",
    height: "32px",
    border: "3px solid #E2E8F0",
    borderTopColor: "#3B82F6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "0 auto 16px",
  },

  // Reviews List
  reviewsList: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  reviewsListTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#475569",
    marginBottom: "16px",
    paddingBottom: "12px",
    borderBottom: "1px solid #E2E8F0",
  },
  noReviews: { textAlign: "center", padding: "48px 24px", color: "#64748B" },
  reviewCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: "16px",
    padding: "20px",
    border: "1px solid #E2E8F0",
  },
  reviewHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "12px",
    flexWrap: "wrap",
    gap: "12px",
  },
  reviewerInfo: { display: "flex", alignItems: "center", gap: "12px" },
  reviewerAvatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    backgroundColor: "#3B82F6",
    color: "#FFFFFF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    fontSize: "16px",
  },
  reviewerName: { fontWeight: "600", color: "#1E293B" },
  reviewMeta: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "4px",
  },
  reviewComment: { color: "#475569", lineHeight: "1.6", marginBottom: "0", marginTop: "0" },
  noCommentText: { color: "#94A3B8", fontStyle: "italic", fontSize: "14px", marginBottom: "0", marginTop: "0" },
  reviewDate: { fontSize: "13px", color: "#94A3B8" },

  // Loading & Error
  loadingContainer: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },
  spinner: {
    width: "48px",
    height: "48px",
    border: "4px solid #FED7AA",
    borderTopColor: "#F97316",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  loadingText: { marginTop: "16px", color: "#64748B" },
  errorContainer: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    gap: "16px",
  },
  errorIcon: { fontSize: "64px" },
  backButton: { color: "#3B82F6", textDecoration: "none", fontWeight: "600" },
};

// Add keyframes for animations
const styleSheet = document.createElement("style");
styleSheet.innerText = `
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes slideIn { from { transform: translateX(100px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
`;
document.head.appendChild(styleSheet);

export default ProductDetailPage;
