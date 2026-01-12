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
      const data = await apiService.get(`/products-crud/${id}/`);
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
    // Check if user is logged in
    const token = localStorage.getItem('access_token');

    if (!token) {
      // Guest user - save to localStorage
      const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
      const existingItem = guestCart.find(item => item.id === product.id);
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        guestCart.push({ id: product.id, quantity: 1 });
      }
      localStorage.setItem('guestCart', JSON.stringify(guestCart));
      showToast('Product added to cart! 🛒 (Login to checkout)', 'success');
      return;
    }

    // Logged in user - use API (original flow)
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
        message: 'You have already reviewed this product.',
        existingReview: {
          rating: userRating,
          comment: userComment,
          is_approved: false
        }
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

  // ============================================
  // REDESIGNED: renderStars with better interactions
  // ============================================
  const renderStars = (rating, interactive = false, size = 20) => {
    return (
      <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            onClick={interactive ? () => setUserRating(star) : undefined}
            style={{
              fontSize: `${size}px`,
              cursor: interactive ? 'pointer' : 'default',
              color: star <= rating ? '#F59E0B' : '#E2E8F0',
              transition: 'all 0.15s ease',
              filter: star <= rating ? 'drop-shadow(0 1px 2px rgba(245, 158, 11, 0.3))' : 'none',
            }}
            onMouseEnter={interactive ? (e) => {
              e.target.style.transform = 'scale(1.15)';
              e.target.style.color = '#F59E0B';
            } : undefined}
            onMouseLeave={interactive ? (e) => {
              e.target.style.transform = 'scale(1)';
              e.target.style.color = star <= userRating ? '#F59E0B' : '#E2E8F0';
            } : undefined}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  // ============================================
  // REDESIGNED: renderReviewSection with professional UI
  // ============================================
  const renderReviewSection = () => {
    if (!isLoggedIn) {
      return (
        <div style={styles.eligibilityCard}>
          <div style={styles.eligibilityIconWrapper}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <div style={styles.eligibilityContent}>
            <h4 style={styles.eligibilityTitle}>Sign in to Review</h4>
            <p style={styles.eligibilityMessage}>
              Share your experience with other customers
            </p>
          </div>
          <Link to="/login" style={styles.loginButton}>
            Sign In
          </Link>
        </div>
      );
    }

    if (reviewEligibility.loading) {
      return (
        <div style={styles.eligibilityCard}>
          <div style={styles.loadingSpinner}></div>
          <p style={styles.eligibilityMessage}>Checking eligibility...</p>
        </div>
      );
    }

    // User CAN review
    if (reviewEligibility.canReview) {
      return (
        <div style={styles.writeReviewCard}>
          <div style={styles.writeReviewHeader}>
            <h3 style={styles.writeReviewTitle}>Write a Review</h3>
            <span style={styles.writeReviewSubtitle}>Share your thoughts about this product</span>
          </div>

          <div style={styles.ratingInputSection}>
            <div style={styles.ratingInputWrapper}>
              <span style={styles.ratingLabel}>Your Rating</span>
              <div style={styles.starsWrapper}>
                {renderStars(userRating, true, 32)}
                {userRating > 0 && (
                  <span style={styles.ratingBadge}>{userRating}.0</span>
                )}
              </div>
            </div>
          </div>

          <div style={styles.commentSection}>
            <label style={styles.commentLabel}>Your Review (Optional)</label>
            <textarea
              value={userComment}
              onChange={(e) => setUserComment(e.target.value)}
              placeholder="What did you like or dislike about this product?"
              style={styles.commentInput}
              rows={4}
            />
            <div style={styles.commentHint}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <span>Comments require approval before appearing publicly</span>
            </div>
          </div>

          <button
            onClick={handleSubmitReview}
            disabled={submittingReview || userRating === 0}
            style={{
              ...styles.submitReviewButton,
              ...(submittingReview || userRating === 0 ? styles.submitButtonDisabled : {})
            }}
          >
            {submittingReview ? (
              <>
                <span style={styles.buttonSpinner}></span>
                Submitting...
              </>
            ) : (
              'Submit Review'
            )}
          </button>
        </div>
      );
    }

    // User CANNOT review - show reason with refined cards
    const getEligibilityDisplay = () => {
      switch (reviewEligibility.reason) {
        case 'already_reviewed':
          return {
            icon: (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            ),
            bgGradient: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
            borderColor: '#A7F3D0',
            titleColor: '#065F46',
            title: 'Review Submitted'
          };
        case 'not_delivered':
          return {
            icon: (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13" />
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
            ),
            bgGradient: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
            borderColor: '#FDE68A',
            titleColor: '#92400E',
            title: 'Awaiting Delivery'
          };
        case 'not_purchased':
          return {
            icon: (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
            ),
            bgGradient: 'linear-gradient(135deg, #FEF2F2 0%, #FECACA 100%)',
            borderColor: '#FECACA',
            titleColor: '#991B1B',
            title: 'Purchase Required'
          };
        default:
          return {
            icon: (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            ),
            bgGradient: 'linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)',
            borderColor: '#E5E7EB',
            titleColor: '#4B5563',
            title: 'Cannot Review'
          };
      }
    };

    const display = getEligibilityDisplay();

    return (
      <div style={{
        ...styles.eligibilityCard,
        background: display.bgGradient,
        borderColor: display.borderColor,
        flexWrap: "wrap",
      }}>
        <div style={styles.eligibilityIconWrapper}>
          {display.icon}
        </div>
        <div style={styles.eligibilityContent}>
          <h4 style={{ ...styles.eligibilityTitle, color: display.titleColor }}>
            {display.title}
          </h4>
          <p style={styles.eligibilityMessage}>
            {reviewEligibility.message}
          </p>
        </div>

        {/* Show existing review if available - inline */}
        {reviewEligibility.existingReview && (
          <div style={styles.existingReviewPreview}>
            <span style={styles.existingReviewLabel}>Your rating:</span>
            <div style={styles.existingRatingRow}>
              {renderStars(reviewEligibility.existingReview.rating, false, 16)}
              <span style={styles.existingRatingText}>
                {reviewEligibility.existingReview.rating}.0
              </span>
            </div>
            {reviewEligibility.existingReview.comment && (
              <p style={styles.existingComment} title={reviewEligibility.existingReview.comment}>
                "{reviewEligibility.existingReview.comment}"
              </p>
            )}
            {!reviewEligibility.existingReview.is_approved && reviewEligibility.existingReview.comment && (
              <span style={styles.pendingBadge}>
                <span style={styles.pendingDot}></span>
                Pending
              </span>
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

          {/* Product ID */}
          <div style={styles.productIdContainer}>
            <span style={styles.productIdLabel}>Product ID:</span>
            <span style={styles.productIdValue}>#{product.product_id || product.id}</span>
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

      {/* ============================================ */}
      {/* REDESIGNED: Reviews Section */}
      {/* ============================================ */}
      <div style={styles.reviewsSection}>
        {/* Reviews Header */}
        <div style={styles.reviewsSectionHeader}>
          <div style={styles.reviewsTitleGroup}>
            <h2 style={styles.reviewsTitle}>Customer Reviews</h2>
            {totalReviews > 0 && (
              <span style={styles.reviewCount}>{totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}</span>
            )}
          </div>

          {/* Rating Overview - Only show if there are reviews */}
          {averageRating && totalReviews > 0 && (
            <div style={styles.ratingOverview}>
              <div style={styles.ratingScoreBox}>
                <span style={styles.ratingScoreNumber}>{averageRating.toFixed(1)}</span>
                <span style={styles.ratingScoreMax}>/5</span>
              </div>
              <div style={styles.ratingStarsColumn}>
                {renderStars(Math.round(averageRating), false, 18)}
                <span style={styles.ratingBasedOn}>Based on {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={styles.sectionDivider}></div>

        {/* Review Form / Eligibility Message */}
        {renderReviewSection()}

        {/* Reviews List */}
        <div style={styles.reviewsList}>
          <div style={styles.reviewsListHeader}>
            <h3 style={styles.reviewsListTitle}>All Reviews</h3>
            {reviews.length > 0 && (
              <span style={styles.sortLabel}>Most Recent</span>
            )}
          </div>

          {reviews.length === 0 ? (
            <div style={styles.noReviews}>
              <div style={styles.noReviewsIcon}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  <line x1="9" y1="9" x2="15" y2="9" />
                  <line x1="9" y1="13" x2="13" y2="13" />
                </svg>
              </div>
              <p style={styles.noReviewsTitle}>No Reviews Yet</p>
              <p style={styles.noReviewsSubtitle}>Be the first to share your experience</p>
            </div>
          ) : (
            <div style={styles.reviewsGrid}>
              {reviews.map((review, index) => (
                <div key={review.id} style={styles.reviewCard}>
                  <div style={styles.reviewCardHeader}>
                    <div style={styles.reviewerInfo}>
                      <div style={styles.reviewerAvatar}>
                        {review.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div style={styles.reviewerDetails}>
                        <span style={styles.reviewerName}>{review.username}</span>
                        <span style={styles.reviewDate}>
                          {new Date(review.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                    <div style={styles.reviewRatingBadge}>
                      {renderStars(review.rating, false, 14)}
                    </div>
                  </div>

                  {review.comment ? (
                    <p style={styles.reviewComment}>{review.comment}</p>
                  ) : (
                    <p style={styles.noCommentText}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                      Rating only
                    </p>
                  )}

                  {/* Verified Purchase Badge */}
                  <div style={styles.verifiedBadge}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Verified Purchase</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  // ============================================
  // PAGE LAYOUT STYLES (unchanged)
  // ============================================
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
  stockContainer: { display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" },
  productIdContainer: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "24px",
    padding: "8px 0"
  },
  productIdLabel: {
    fontSize: "14px",
    color: "#64748B",
    fontWeight: "500"
  },
  productIdValue: {
    fontSize: "14px",
    color: "#1E293B",
    fontWeight: "600",
    fontFamily: "monospace"
  },
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
  specificationsSection: { marginTop: "32px", paddingTop: "32px", borderTop: "2px solid #F1F5F9" },
  specificationsTitle: { fontSize: "20px", fontWeight: "700", color: "#1E293B", marginBottom: "20px" },
  specsList: { display: "flex", flexDirection: "column", gap: "16px" },
  specItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    backgroundColor: "#F8FAFC",
    borderRadius: "10px",
    border: "1px solid #E2E8F0",
  },
  specLabel: { fontSize: "15px", fontWeight: "600", color: "#475569" },
  specValue: { fontSize: "15px", color: "#1E293B", fontWeight: "500" },

  // ============================================
  // REDESIGNED: Reviews Section Styles
  // ============================================
  reviewsSection: {
    maxWidth: "1200px",
    margin: "32px auto 0",
    backgroundColor: "#FFFFFF",
    borderRadius: "16px",
    padding: "0",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)",
    border: "1px solid #F1F5F9",
    overflow: "hidden",
  },
  reviewsSectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 32px",
    flexWrap: "wrap",
    gap: "16px",
  },
  reviewsTitleGroup: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  reviewsTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#0F172A",
    margin: 0,
    letterSpacing: "-0.01em",
  },
  reviewCount: {
    backgroundColor: "#F1F5F9",
    color: "#64748B",
    padding: "3px 10px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "600",
  },
  ratingOverview: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  ratingScoreBox: {
    display: "flex",
    alignItems: "baseline",
    backgroundColor: "#FFF7ED",
    padding: "6px 12px",
    borderRadius: "8px",
    border: "1px solid #FFEDD5",
  },
  ratingScoreNumber: {
    fontSize: "20px",
    fontWeight: "800",
    color: "#EA580C",
    letterSpacing: "-0.02em",
  },
  ratingScoreMax: {
    fontSize: "12px",
    fontWeight: "500",
    color: "#9A3412",
    marginLeft: "1px",
  },
  ratingStarsColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  ratingBasedOn: {
    fontSize: "11px",
    color: "#64748B",
  },
  sectionDivider: {
    height: "1px",
    backgroundColor: "#F1F5F9",
    margin: "0 32px",
  },

  // Write Review Card - Compact
  writeReviewCard: {
    margin: "20px 32px",
    backgroundColor: "#FAFBFC",
    borderRadius: "12px",
    padding: "20px",
    border: "1px solid #E8ECF1",
  },
  writeReviewHeader: {
    marginBottom: "16px",
  },
  writeReviewTitle: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#0F172A",
    margin: "0 0 2px 0",
  },
  writeReviewSubtitle: {
    fontSize: "13px",
    color: "#64748B",
  },
  ratingInputSection: {
    marginBottom: "16px",
  },
  ratingInputWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  ratingLabel: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  starsWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  ratingBadge: {
    backgroundColor: "#FFF7ED",
    color: "#EA580C",
    padding: "2px 8px",
    borderRadius: "4px",
    fontSize: "13px",
    fontWeight: "700",
  },
  commentSection: {
    marginBottom: "16px",
  },
  commentLabel: {
    display: "block",
    fontSize: "12px",
    fontWeight: "600",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: "8px",
  },
  commentInput: {
    width: "100%",
    padding: "12px",
    fontSize: "14px",
    borderRadius: "8px",
    border: "1px solid #E2E8F0",
    backgroundColor: "#FFFFFF",
    resize: "vertical",
    fontFamily: "inherit",
    boxSizing: "border-box",
    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
    outline: "none",
    minHeight: "80px",
  },
  commentHint: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    marginTop: "8px",
    fontSize: "11px",
    color: "#94A3B8",
  },
  submitReviewButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    padding: "10px 24px",
    backgroundColor: "#0F172A",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: "0 2px 4px rgba(15, 23, 42, 0.1)",
  },
  submitButtonDisabled: {
    backgroundColor: "#E2E8F0",
    color: "#94A3B8",
    cursor: "not-allowed",
    boxShadow: "none",
  },
  buttonSpinner: {
    width: "16px",
    height: "16px",
    border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "#FFFFFF",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },

  // Eligibility Card - Compact
  eligibilityCard: {
    margin: "24px 32px",
    backgroundColor: "#FAFBFC",
    borderRadius: "12px",
    padding: "16px 20px",
    border: "1px solid #E8ECF1",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    textAlign: "left",
  },
  eligibilityIconWrapper: {
    width: "44px",
    height: "44px",
    minWidth: "44px",
    borderRadius: "50%",
    backgroundColor: "#FFFFFF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
  },
  eligibilityContent: {
    flex: 1,
    minWidth: 0,
  },
  eligibilityTitle: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#0F172A",
    margin: "0 0 2px 0",
  },
  eligibilityMessage: {
    fontSize: "12px",
    color: "#64748B",
    margin: 0,
    lineHeight: "1.4",
  },
  loginButton: {
    display: "inline-block",
    marginLeft: "auto",
    padding: "8px 20px",
    backgroundColor: "#0F172A",
    color: "#FFFFFF",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "600",
    textDecoration: "none",
    transition: "background-color 0.2s ease",
    whiteSpace: "nowrap",
  },

  // Existing Review Preview - Compact inline
  existingReviewPreview: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginLeft: "auto",
    paddingLeft: "16px",
    borderLeft: "1px solid rgba(0,0,0,0.08)",
  },
  existingReviewHeader: {
    display: "none",
  },
  existingReviewLabel: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginRight: "8px",
  },
  existingRatingRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  existingRatingText: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#0F172A",
  },
  existingComment: {
    fontSize: "13px",
    color: "#475569",
    fontStyle: "italic",
    margin: 0,
    maxWidth: "200px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  pendingBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    backgroundColor: "#FEF3C7",
    color: "#92400E",
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "600",
  },
  pendingDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    backgroundColor: "#F59E0B",
  },
  loadingSpinner: {
    width: "32px",
    height: "32px",
    border: "3px solid #E2E8F0",
    borderTopColor: "#3B82F6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "0 auto 16px",
  },

  // Reviews List - Compact
  reviewsList: {
    padding: "20px 32px 28px",
  },
  reviewsListHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  reviewsListTitle: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#0F172A",
    margin: 0,
  },
  sortLabel: {
    fontSize: "12px",
    color: "#94A3B8",
    fontWeight: "500",
  },
  noReviews: {
    textAlign: "center",
    padding: "32px 24px",
  },
  noReviewsIcon: {
    marginBottom: "12px",
  },
  noReviewsTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#475569",
    margin: "0 0 4px 0",
  },
  noReviewsSubtitle: {
    fontSize: "13px",
    color: "#94A3B8",
    margin: 0,
  },
  reviewsGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  reviewCard: {
    backgroundColor: "#FAFBFC",
    borderRadius: "10px",
    padding: "16px",
    border: "1px solid #F1F5F9",
    transition: "border-color 0.2s ease",
  },
  reviewCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
    gap: "12px",
  },
  reviewerInfo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  reviewerAvatar: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",
    color: "#FFFFFF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    fontSize: "13px",
    boxShadow: "0 2px 4px rgba(59, 130, 246, 0.25)",
  },
  reviewerDetails: {
    display: "flex",
    flexDirection: "column",
    gap: "1px",
  },
  reviewerName: {
    fontWeight: "600",
    color: "#0F172A",
    fontSize: "13px",
  },
  reviewDate: {
    fontSize: "11px",
    color: "#94A3B8",
  },
  reviewRatingBadge: {
    backgroundColor: "#FFF7ED",
    padding: "4px 8px",
    borderRadius: "6px",
    border: "1px solid #FFEDD5",
  },
  reviewComment: {
    color: "#475569",
    lineHeight: "1.5",
    margin: "0 0 10px 0",
    fontSize: "13px",
  },
  noCommentText: {
    color: "#94A3B8",
    fontSize: "12px",
    margin: "0 0 10px 0",
    display: "flex",
    alignItems: "center",
  },
  verifiedBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    backgroundColor: "#ECFDF5",
    color: "#059669",
    padding: "3px 8px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: "600",
  },

  // Loading & Error (unchanged)
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
