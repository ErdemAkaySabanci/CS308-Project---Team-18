import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function ProductListPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("http://127.0.0.1:8000/api/products/");
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        const results = Array.isArray(data) ? data : data.results;
        setProducts(results || []);
      } catch (err) {
        console.error("Error fetching products", err);
        setError("An error occurred while loading products.");
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div style={styles.pageWrapper}>
        <div style={styles.centerBox}>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.pageWrapper}>
        <div style={{ ...styles.centerBox, ...styles.errorBox }}>{error}</div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div style={styles.pageWrapper}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Products</h1>
            <p style={styles.subtitle}>There are no products in the system yet.</p>
          </div>
          <Link to="/register" style={styles.primaryButton}>
            Go to Register
          </Link>
        </div>

        <div style={styles.emptyState}>
          <p style={styles.emptyText}>
            Once products are added, you will be able to see them here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.pageWrapper}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Products</h1>
          <p style={styles.subtitle}>
            Browse the products available in our store.
          </p>
        </div>

        <Link to="/register" style={styles.primaryButton}>
          Go to Register
        </Link>
      </div>

      {/* Product Grid */}
      <div style={styles.grid}>
        {products.map((p) => (
          <div key={p.id} style={styles.card}>
            <div style={styles.cardContent}>
              <h3 style={styles.cardTitle}>{p.name}</h3>

              <p style={styles.price}>
                Price: <span style={styles.priceValue}>{p.price} TL</span>
              </p>

              {p.description && (
                <p style={styles.description}>
                  {p.description.length > 90
                    ? p.description.slice(0, 90) + "..."
                    : p.description}
                </p>
              )}
            </div>

            <div style={styles.cardFooter}>
              <Link to={`/products/${p.id}`} style={styles.secondaryButton}>
                View Details
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  pageWrapper: {
    minHeight: "100vh",
    padding: "24px 16px 40px",
    fontFamily:
      "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: "#1A1A1A",
  
    /* Yeni gradient arka plan */
    background: "linear-gradient(135deg, #2D5FFF 0%, #FF7A00 100%)",
  
    /* Gradient yumuşak görünmesi için */
    backgroundAttachment: "fixed",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: "16px",
    marginBottom: "24px",
  },
  title: {
    margin: 0,
    fontSize: "28px",
    fontWeight: 700,
    color: "#1A1A1A",
  },
  subtitle: {
    marginTop: "8px",
    marginBottom: 0,
    fontSize: "14px",
    color: "#4B5563",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: "18px",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: "14px",
    padding: "16px 18px",
    boxShadow: "0 6px 16px rgba(15, 23, 42, 0.08)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  cardContent: {
    marginBottom: "12px",
  },
  cardTitle: {
    margin: 0,
    fontSize: "18px",
    fontWeight: 600,
    color: "#1A1A1A",
  },
  description: {
    marginTop: "8px",
    marginBottom: 0,
    fontSize: "14px",
    color: "#4B5563",
    lineHeight: 1.4,
  },
  price: {
    marginTop: "10px",
    marginBottom: 0,
    fontSize: "14px",
    fontWeight: 600,
    color: "#1A1A1A",
  },
  priceValue: {
    fontSize: "18px",
    fontWeight: 700,
    color: "#FF7A00", // Secondary – orange
    marginLeft: "4px",
  },
  cardFooter: {
    display: "flex",
    justifyContent: "flex-end",
  },
  primaryButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px 16px",
    borderRadius: "999px",
    border: "none",
    backgroundColor: "#2D5FFF", // Primary blue
    color: "#FFFFFF",
    fontSize: "14px",
    fontWeight: 600,
    textDecoration: "none",
    cursor: "pointer",
  },
  secondaryButton: {
    padding: "6px 14px",
    borderRadius: "999px",
    border: "1px solid #FF7A00", // Secondary orange border
    backgroundColor: "#FFFFFF",
    color: "#FF7A00",
    fontSize: "13px",
    fontWeight: 600,
    textDecoration: "none",
    cursor: "pointer",
  },
  centerBox: {
    maxWidth: "400px",
    margin: "120px auto 0",
    padding: "16px 20px",
    borderRadius: "12px",
    backgroundColor: "#FFFFFF",
    boxShadow: "0 6px 16px rgba(15, 23, 42, 0.08)",
    textAlign: "center",
    fontSize: "15px",
    color: "#1A1A1A",
    fontFamily:
      "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  errorBox: {
    border: "1px solid #FCA5A5",
    backgroundColor: "#FEF2F2",
    color: "#B91C1C",
  },
  emptyState: {
    marginTop: "32px",
    padding: "24px",
    borderRadius: "12px",
    backgroundColor: "#FFFFFF",
    boxShadow: "0 4px 12px rgba(15, 23, 42, 0.05)",
  },
  emptyText: {
    margin: 0,
    fontSize: "14px",
    color: "#4B5563",
  },
};

export default ProductListPage;
