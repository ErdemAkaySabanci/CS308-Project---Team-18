import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchProduct() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`http://127.0.0.1:8000/api/products/${id}/`);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        setProduct(data);
      } catch (err) {
        console.error("Error fetching product", err);
        setError("An error occurred while loading the product or it was not found.");
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div style={detailStyles.pageWrapper}>
        <div style={detailStyles.centerBox}>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={detailStyles.pageWrapper}>
        <div style={{ ...detailStyles.centerBox, ...detailStyles.errorBox }}>
          {error}
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={detailStyles.pageWrapper}>
        <div style={detailStyles.centerBox}>Product not found.</div>
      </div>
    );
  }

  return (
    <div style={detailStyles.pageWrapper}>
      <div style={detailStyles.header}>
        <Link to="/products" style={detailStyles.backLink}>
          ← Back to Products
        </Link>
      </div>

      <div style={detailStyles.card}>
        <h1 style={detailStyles.title}>{product.name}</h1>

        {product.description && (
          <p style={detailStyles.description}>{product.description}</p>
        )}

        <p style={detailStyles.price}>
          {product.price}
          <span style={detailStyles.priceCurrency}> TL</span>
        </p>

        {/* Placeholder actions for later (e.g., Add to Cart) */}
        <div style={detailStyles.actions}>
          <button type="button" style={detailStyles.primaryButton}>
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}

const detailStyles = {
  pageWrapper: {
    padding: "32px 24px",
    maxWidth: "800px",
    margin: "0 auto",
    fontFamily:
      "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    backgroundColor: "#F9FAFB",
    minHeight: "100vh",
  },
  header: {
    marginBottom: "16px",
  },
  backLink: {
    fontSize: "14px",
    color: "#2563EB",
    textDecoration: "none",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: "16px",
    padding: "24px 24px 20px",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.12)",
  },
  title: {
    margin: 0,
    fontSize: "26px",
    fontWeight: 700,
    color: "#111827",
  },
  description: {
    marginTop: "12px",
    fontSize: "15px",
    lineHeight: 1.5,
    color: "#4B5563",
  },
  price: {
    marginTop: "18px",
    fontSize: "22px",
    fontWeight: 700,
    color: "#111827",
  },
  priceCurrency: {
    fontSize: "14px",
    fontWeight: 500,
    color: "#6B7280",
    marginLeft: "4px",
  },
  actions: {
    marginTop: "20px",
    display: "flex",
    gap: "12px",
  },
  primaryButton: {
    padding: "10px 18px",
    borderRadius: "999px",
    border: "none",
    backgroundColor: "#10B981",
    color: "#FFFFFF",
    fontSize: "14px",
    fontWeight: 600,
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
    color: "#111827",
  },
  errorBox: {
    border: "1px solid #FCA5A5",
    backgroundColor: "#FEF2F2",
    color: "#B91C1C",
  },
};

export default ProductDetailPage;
