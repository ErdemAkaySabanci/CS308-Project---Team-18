// ProductDetailPage.jsx
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
        setError("An error occurred while loading the product.");
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div style={styles.pageWrapper}>
        <div style={styles.centerBox}>Loading...</div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div style={styles.pageWrapper}>
        <div style={{ ...styles.centerBox, ...styles.errorBox }}>
          {error || "Product not found."}
        </div>
        <div style={{ marginTop: 16, textAlign: "center" }}>
          <Link to="/" style={styles.linkBack}>
            ← Back to Products
          </Link>
        </div>
      </div>
    );
  }

  // Dummy / fallback image (eğer backend image göndermiyorsa)
  const imageUrl =
    product.image ||
    product.image_url ||
    "https://via.placeholder.com/800x500?text=Product+Image";

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.topBar}>
        <Link to="/" style={styles.linkBack}>
          ← Back to Products
        </Link>
      </div>

      <div style={styles.detailCard}>
        {/* Büyük ürün görseli */}
        <div style={styles.imageWrapper}>
          <img src={imageUrl} alt={product.name} style={styles.image} />
        </div>

        {/* Ürün bilgisi */}
        <div style={styles.infoWrapper}>
          <h1 style={styles.productName}>{product.name}</h1>

          {product.short_description || product.description ? (
            <p style={styles.description}>
              {(product.short_description || product.description).length > 140
                ? (product.short_description || product.description).slice(0, 140) + "..."
                : product.short_description || product.description}
            </p>
          ) : (
            <p style={styles.description}>
              This product currently does not have a description.
            </p>
          )}

          <p style={styles.priceLabel}>
            Price:
            <span style={styles.priceValue}>
              {" "}
              {product.price} TL
            </span>
          </p>

          <button style={styles.primaryButton}>Add to Cart</button>
        </div>
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
  topBar: {
    maxWidth: "960px",
    margin: "0 auto 16px",
  },
  linkBack: {
    fontSize: "14px",
    textDecoration: "none",
    color: "#1A1A1A",
    fontWeight: 500,
  },
  detailCard: {
    maxWidth: "960px",
    margin: "0 auto",
    backgroundColor: "#FFFFFF",
    borderRadius: "18px",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.12)",
    padding: "20px",
    display: "flex",
    flexDirection: "column", // mobilde tek kolon
    gap: "20px",
  },
  imageWrapper: {
    width: "100%",
    borderRadius: "16px",
    overflow: "hidden",
    backgroundColor: "#E5E7EB",
  },
  image: {
    width: "100%",
    height: "280px",
    objectFit: "cover",
    display: "block",
  },
  infoWrapper: {
    width: "100%",
  },
  productName: {
    margin: 0,
    fontSize: "24px",
    fontWeight: 700,
    color: "#1A1A1A",
  },
  description: {
    marginTop: "10px",
    marginBottom: "16px",
    fontSize: "14px",
    lineHeight: 1.5,
    color: "#4B5563",
  },
  priceLabel: {
    margin: 0,
    fontSize: "16px",
    fontWeight: 600,
    color: "#1A1A1A",
  },
  priceValue: {
    color: "#FF7A00", // secondary (turuncu)
    fontSize: "20px",
    fontWeight: 700,
    marginLeft: "6px",
  },
  primaryButton: {
    marginTop: "18px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px 22px",
    borderRadius: "999px",
    border: "none",
    backgroundColor: "#2D5FFF", // primary (mavi)
    color: "#FFFFFF",
    fontSize: "15px",
    fontWeight: 600,
    cursor: "pointer",
  },
  centerBox: {
    maxWidth: "420px",
    margin: "120px auto 0",
    padding: "18px 22px",
    borderRadius: "12px",
    backgroundColor: "#FFFFFF",
    boxShadow: "0 6px 16px rgba(15, 23, 42, 0.08)",
    textAlign: "center",
    fontSize: "15px",
  },
  errorBox: {
    border: "1px solid #FCA5A5",
    backgroundColor: "#FEF2F2",
    color: "#B91C1C",
  },
};

export default ProductDetailPage;
