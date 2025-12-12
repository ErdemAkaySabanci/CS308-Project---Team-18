import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { apiService } from "../services/apiService";
import CategoryBar from "../components/CategoryBar";

function ProductListPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const urlCategoryId = params.get("category");

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        setError(null);
        let data;
        if (urlCategoryId) {
          data = await apiService.get(`/products/?category=${urlCategoryId}`);
        } else {
          data = await apiService.get("/products/");
        }
        const list = Array.isArray(data) ? data : data.results;
        setProducts(list || []);
      } catch (err) {
        console.error(err);
        setError("Could not load products.");
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, [urlCategoryId]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  const handleAddToCart = async (e, product) => {
    e.preventDefault();
    e.stopPropagation();

    if (!product.is_in_stock) {
      showToast('Product is out of stock', 'error');
      return;
    }

    try {
      await apiService.addToCart(product.id, 1);
      showToast(`${product.name} added to cart! 🛒`, 'success');
    } catch (err) {
      showToast('Could not add to cart. Please login first.', 'error');
      console.error(err);
    }
  };

  // Filters
  const searchFiltered = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categoryFiltered = searchFiltered.filter((p) => {
    if (!selectedCategory) return true;
    return p.category_name === selectedCategory.name;
  });

  const sortedProducts = [...categoryFiltered].sort((a, b) => {
    if (sortOption === "price_low") return a.price - b.price;
    if (sortOption === "price_high") return b.price - a.price;
    if (sortOption === "name_az") return a.name.localeCompare(b.name);
    if (sortOption === "name_za") return b.name.localeCompare(a.name);
    if (sortOption === "popularity") return (b.popularity || 0) - (a.popularity || 0);
    return 0;
  });

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Loading products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <span style={styles.errorIcon}>⚠️</span>
        <p>{error}</p>
      </div>
    );
  }

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

      {/* Hero Section */}
      <div style={styles.hero}>
        <div style={styles.heroContent}>
          <h1 style={styles.heroTitle}>Discover Premium Sports Gear</h1>
          <p style={styles.heroSubtitle}>
            Find the best equipment for your athletic journey
          </p>
        </div>
      </div>

      <div style={styles.mainContent}>
        {/* Category Bar */}
        <CategoryBar onSelect={(cat) => setSelectedCategory(cat)} />

        {/* Search & Filter Section */}
        <div style={styles.filterSection}>
          <div style={styles.searchWrapper}>
            <span style={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
          </div>

          <div style={styles.filterControls}>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              style={styles.sortSelect}
            >
              <option value="">Sort By</option>
              <option value="popularity">🔥 Most Popular</option>
              <option value="price_low">Price: Low → High</option>
              <option value="price_high">Price: High → Low</option>
              <option value="name_az">Name: A → Z</option>
              <option value="name_za">Name: Z → A</option>
            </select>

            {(selectedCategory || searchTerm || sortOption) && (
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setSearchTerm("");
                  setSortOption("");
                }}
                style={styles.clearButton}
              >
                ✕ Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Results Count */}
        <div style={styles.resultsInfo}>
          <p style={styles.resultsText}>
            Showing <strong>{sortedProducts.length}</strong> products
            {selectedCategory && <span> in <strong>{selectedCategory.name}</strong></span>}
          </p>
        </div>

        {/* Product Grid */}
        {sortedProducts.length === 0 ? (
          <div style={styles.emptyState}>
            <span style={styles.emptyIcon}>📦</span>
            <h3>No products found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        ) : (
          <div style={styles.grid}>
            {sortedProducts.map((p) => (
              <div key={p.id} style={styles.card} className="product-card">
                <Link to={`/products/${p.id}`} style={styles.cardLink}>
                  <div style={styles.imageContainer}>
                    {p.image ? (
                      <img src={p.image} alt={p.name} style={styles.productImage} />
                    ) : (
                      <div style={styles.placeholderImage}>
                        <span>🏃</span>
                      </div>
                    )}
                    {p.discount_rate > 0 && (
                      <span style={styles.discountBadge}>
                        -{p.discount_rate}%
                      </span>
                    )}
                    {!p.is_in_stock && (
                      <div style={styles.outOfStockOverlay}>
                        <span>Out of Stock</span>
                      </div>
                    )}
                  </div>

                  <div style={styles.cardBody}>
                    <span style={styles.categoryTag}>{p.category_name}</span>
                    <h3 style={styles.productName}>{p.name}</h3>

                    <div style={styles.priceSection}>
                      <span style={styles.currentPrice}>
                        {p.discounted_price || p.price} TL
                      </span>
                      {p.discount_rate > 0 && (
                        <span style={styles.originalPrice}>{p.price} TL</span>
                      )}
                    </div>

                    <div style={styles.stockIndicator}>
                      <span style={{
                        ...styles.stockDot,
                        backgroundColor: p.is_in_stock ? '#10B981' : '#EF4444'
                      }}></span>
                      <span style={styles.stockText}>
                        {p.is_in_stock ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </div>
                  </div>
                </Link>

                <div style={styles.cardFooter}>
                  <Link to={`/products/${p.id}`} style={styles.viewButton}>
                    View Details
                  </Link>
                  <button
                    onClick={(e) => handleAddToCart(e, p)}
                    style={{
                      ...styles.addToCartBtn,
                      ...(p.is_in_stock ? {} : styles.addToCartBtnDisabled)
                    }}
                    disabled={!p.is_in_stock}
                  >
                    🛒 Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  pageWrapper: {
    minHeight: "100vh",
    backgroundColor: "#F8FAFC",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
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

  // Hero - Blue to Orange gradient
  hero: {
    background: "linear-gradient(135deg, #1E3A8A 0%, #3B82F6 40%, #F97316 100%)",
    padding: "60px 24px",
    textAlign: "center",
  },
  heroContent: {
    maxWidth: "800px",
    margin: "0 auto",
  },
  heroTitle: {
    fontSize: "42px",
    fontWeight: "800",
    color: "#FFFFFF",
    margin: "0 0 16px 0",
    letterSpacing: "-0.5px",
  },
  heroSubtitle: {
    fontSize: "18px",
    color: "rgba(255,255,255,0.9)",
    margin: 0,
    fontWeight: "400",
  },

  // Main Content
  mainContent: {
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "32px 24px",
  },

  // Filter Section
  filterSection: {
    display: "flex",
    flexWrap: "wrap",
    gap: "16px",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "24px",
    padding: "20px",
    backgroundColor: "#FFFFFF",
    borderRadius: "16px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  },
  searchWrapper: {
    position: "relative",
    flex: "1",
    minWidth: "280px",
  },
  searchIcon: {
    position: "absolute",
    left: "16px",
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: "18px",
    opacity: "0.5",
  },
  searchInput: {
    width: "100%",
    padding: "14px 16px 14px 48px",
    fontSize: "15px",
    border: "2px solid #E2E8F0",
    borderRadius: "12px",
    outline: "none",
    transition: "all 0.2s ease",
    backgroundColor: "#F8FAFC",
  },
  filterControls: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
  },
  sortSelect: {
    padding: "14px 20px",
    fontSize: "15px",
    border: "2px solid #E2E8F0",
    borderRadius: "12px",
    backgroundColor: "#F8FAFC",
    cursor: "pointer",
    outline: "none",
    fontWeight: "500",
    color: "#475569",
  },
  clearButton: {
    padding: "14px 20px",
    backgroundColor: "#FEE2E2",
    color: "#DC2626",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
    transition: "all 0.2s ease",
  },

  // Results Info
  resultsInfo: {
    marginBottom: "24px",
  },
  resultsText: {
    color: "#64748B",
    fontSize: "15px",
    margin: 0,
  },

  // Grid
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "24px",
  },

  // Card
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: "20px",
    overflow: "hidden",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    cursor: "pointer",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    border: "1px solid #F1F5F9",
  },
  cardLink: {
    textDecoration: "none",
    color: "inherit",
    flex: "1",
    display: "flex",
    flexDirection: "column",
  },
  imageContainer: {
    position: "relative",
    height: "220px",
    backgroundColor: "#F1F5F9",
    overflow: "hidden",
  },
  productImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transition: "transform 0.3s ease",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "64px",
    backgroundColor: "#FFF7ED",
  },
  discountBadge: {
    position: "absolute",
    top: "12px",
    right: "12px",
    backgroundColor: "#F97316",
    color: "#FFFFFF",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "700",
  },
  outOfStockOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#FFFFFF",
    fontSize: "16px",
    fontWeight: "700",
  },

  // Card Body
  cardBody: {
    padding: "20px",
    flex: "1",
  },
  categoryTag: {
    display: "inline-block",
    backgroundColor: "#FFF7ED",
    color: "#EA580C",
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    marginBottom: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  productName: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#1E293B",
    margin: "0 0 12px 0",
    lineHeight: "1.4",
  },
  priceSection: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "12px",
  },
  currentPrice: {
    fontSize: "22px",
    fontWeight: "800",
    color: "#F97316",
  },
  originalPrice: {
    fontSize: "15px",
    color: "#94A3B8",
    textDecoration: "line-through",
  },
  stockIndicator: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  stockDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
  },
  stockText: {
    fontSize: "13px",
    color: "#64748B",
    fontWeight: "500",
  },

  // Card Footer
  cardFooter: {
    padding: "16px 20px",
    borderTop: "1px solid #F1F5F9",
    display: "flex",
    gap: "12px",
    alignItems: "center",
  },
  viewButton: {
    flex: "1",
    textAlign: "center",
    padding: "12px 16px",
    backgroundColor: "#1E3A8A",
    color: "#FFFFFF",
    textDecoration: "none",
    borderRadius: "10px",
    fontWeight: "600",
    fontSize: "14px",
    transition: "all 0.2s ease",
  },
  addToCartBtn: {
    padding: "12px 16px",
    backgroundColor: "#F97316",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "10px",
    fontWeight: "600",
    fontSize: "14px",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  addToCartBtnDisabled: {
    backgroundColor: "#E2E8F0",
    color: "#94A3B8",
    cursor: "not-allowed",
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
    fontSize: "16px",
  },

  // Error
  errorContainer: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },
  errorIcon: {
    fontSize: "48px",
    marginBottom: "16px",
  },

  // Empty State
  emptyState: {
    textAlign: "center",
    padding: "80px 20px",
    backgroundColor: "#FFFFFF",
    borderRadius: "20px",
  },
  emptyIcon: {
    fontSize: "64px",
    marginBottom: "16px",
    display: "block",
  },
};

// Add keyframes and hover effects
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
  .product-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 25px -5px rgba(249, 115, 22, 0.15), 0 10px 10px -5px rgba(0,0,0,0.04);
    border-color: #FDBA74;
  }
  .product-card:hover img {
    transform: scale(1.05);
  }
  input:focus {
    border-color: #F97316 !important;
    box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1);
  }
  select:focus {
    border-color: #F97316 !important;
  }
`;
document.head.appendChild(styleSheet);

export default ProductListPage;
