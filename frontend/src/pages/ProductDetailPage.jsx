import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { apiService } from "../services/apiService";
import { useCart } from "../context/CartContext";

function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const { refreshCart } = useCart();

  useEffect(() => {
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
    loadProduct();
  }, [id]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
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
          ...(toast.type === 'success' ? styles.toastSuccess : styles.toastError)
        }}>
          <span style={styles.toastIcon}>
            {toast.type === 'success' ? '✓' : '✕'}
          </span>
          <span style={styles.toastMessage}>{toast.message}</span>
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
            {product.quantity_in_stock !== undefined && (
              <span style={styles.stockCount}>
                {product.quantity_in_stock} units available
              </span>
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
            <span style={styles.cartIcon}>🛒</span>
            Add to Cart
          </button>

          {/* Features */}
          <div style={styles.features}>
            <div style={styles.featureItem}>
              <span style={styles.featureIcon}>🚚</span>
              <span>Free Delivery</span>
            </div>
            <div style={styles.featureItem}>
              <span style={styles.featureIcon}>↩️</span>
              <span>30-Day Returns</span>
            </div>
            <div style={styles.featureItem}>
              <span style={styles.featureIcon}>✓</span>
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
    </div>
  );
}

const styles = {
  pageWrapper: {
    minHeight: "100vh",
    backgroundColor: "#F8FAFC",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    padding: "24px",
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
    boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
    zIndex: 9999,
    animation: "slideIn 0.3s ease",
  },
  toastSuccess: {
    backgroundColor: "#10B981",
    color: "#FFFFFF",
  },
  toastError: {
    backgroundColor: "#EF4444",
    color: "#FFFFFF",
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
  toastMessage: {
    fontSize: "15px",
    fontWeight: "600",
  },

  // Breadcrumb
  breadcrumb: {
    maxWidth: "1200px",
    margin: "0 auto 24px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  breadcrumbLink: {
    color: "#3B82F6",
    textDecoration: "none",
    fontWeight: "500",
    fontSize: "14px",
  },
  breadcrumbSeparator: {
    color: "#94A3B8",
  },
  breadcrumbCurrent: {
    color: "#64748B",
    fontSize: "14px",
  },

  // Product Container
  productContainer: {
    maxWidth: "1200px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "48px",
    backgroundColor: "#FFFFFF",
    borderRadius: "24px",
    padding: "40px",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
  },

  // Image Section
  imageSection: {},
  imageWrapper: {
    position: "relative",
    borderRadius: "20px",
    overflow: "hidden",
    backgroundColor: "#F1F5F9",
  },
  productImage: {
    width: "100%",
    height: "500px",
    objectFit: "cover",
  },
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

  // Info Section
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
    letterSpacing: "0.5px",
  },
  productTitle: {
    fontSize: "32px",
    fontWeight: "800",
    color: "#1E293B",
    margin: "0 0 16px 0",
    lineHeight: "1.2",
  },
  description: {
    fontSize: "16px",
    color: "#64748B",
    lineHeight: "1.7",
    marginBottom: "24px",
  },

  // Price
  priceContainer: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "24px",
  },
  currentPrice: {
    fontSize: "36px",
    fontWeight: "800",
    color: "#F97316",
  },
  originalPrice: {
    fontSize: "20px",
    color: "#94A3B8",
    textDecoration: "line-through",
  },

  // Stock
  stockContainer: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "32px",
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
  inStock: {
    backgroundColor: "#ECFDF5",
    color: "#059669",
  },
  outOfStock: {
    backgroundColor: "#FEF2F2",
    color: "#DC2626",
  },
  stockDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    backgroundColor: "currentColor",
  },
  stockCount: {
    color: "#64748B",
    fontSize: "14px",
  },

  // Add to Cart Button
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
    transition: "all 0.2s ease",
    boxShadow: "0 4px 14px rgba(249, 115, 22, 0.4)",
    marginBottom: "32px",
  },
  buttonDisabled: {
    backgroundColor: "#E2E8F0",
    color: "#94A3B8",
    cursor: "not-allowed",
    boxShadow: "none",
  },
  cartIcon: {
    fontSize: "20px",
  },

  // Features
  features: {
    display: "flex",
    gap: "24px",
    paddingTop: "24px",
    borderTop: "1px solid #F1F5F9",
  },
  featureItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#64748B",
    fontSize: "14px",
  },
  featureIcon: {
    fontSize: "18px",
  },

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

  // Loading
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
  loadingText: {
    marginTop: "16px",
    color: "#64748B",
  },

  // Error
  errorContainer: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    gap: "16px",
  },
  errorIcon: {
    fontSize: "64px",
  },
  backButton: {
    color: "#3B82F6",
    textDecoration: "none",
    fontWeight: "600",
  },
};

// Animations
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
  button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(249, 115, 22, 0.5) !important;
  }
  @media (max-width: 768px) {
    .product-container {
      grid-template-columns: 1fr !important;
    }
  }
`;
document.head.appendChild(styleSheet);

export default ProductDetailPage;
