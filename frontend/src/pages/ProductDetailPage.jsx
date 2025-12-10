import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { apiService } from "../services/apiService";
import { useCart } from "../context/CartContext";

function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { refreshCart } = useCart(); // backend cart reload için

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

  // Add to Cart backend çağrısı
  async function handleAddToCart() {
    try {
      await apiService.addToCart(product.id, 1);
      await refreshCart(); // frontend cart güncelle
      alert("Product added to cart!");
    } catch (err) {
      alert("Could not add to cart.");
      console.error(err);
    }
  }

  if (loading) return <div style={styles.center}>Loading...</div>;
  if (error || !product)
    return (
      <div style={styles.center}>
        <p>{error || "Product not found."}</p>
        <Link to="/" style={styles.backLink}>← Back to Products</Link>
      </div>
    );

  const imageUrl =
    product.image ||
    product.image_url ||
    "https://via.placeholder.com/800x500?text=Product+Image";

  return (
    <div style={styles.pageWrapper}>
      <Link to="/" style={styles.backLink}>← Back to Products</Link>

      <div style={styles.card}>
        {/* Image */}
        <div style={styles.imageWrapper}>
          <img src={imageUrl} alt={product.name} style={styles.image} />
        </div>

        {/* Info */}
        <div style={styles.info}>
          <h1>{product.name}</h1>

          <p style={styles.description}>
            {product.description?.slice(0, 200) || "No description available."}
          </p>

          <p style={styles.label}>
            Price:
            <span style={styles.price}> {product.discounted_price} TL</span>
            {product.discount_rate > 0 && (
              <span style={styles.oldPrice}> {product.price} TL</span>
            )}
          </p>

          <p style={styles.stock}>
            {product.is_in_stock ? "🟢 In Stock" : "🔴 Out of Stock"}
          </p>

          {product.quantity_in_stock !== undefined && (
  <p style={styles.stockCount}>
    Remaining Stock: <strong>{product.quantity_in_stock}</strong>
  </p>
)}


          <p style={styles.category}>
            Category: <strong>{product.category?.name}</strong>
          </p>

          <button
            onClick={handleAddToCart}
            style={styles.addButton}
            disabled={!product.is_in_stock}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  pageWrapper: {
    padding: "24px",
    minHeight: "100vh",
    background: "linear-gradient(135deg, #2D5FFF 0%, #FF7A00 100%)",
    fontFamily: "Inter, sans-serif",
  },
  backLink: {
    color: "#fff",
    textDecoration: "none",
    fontSize: "14px",
  },
  card: {
    marginTop: 20,
    background: "#fff",
    borderRadius: 16,
    padding: 20,
    boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
    display: "flex",
    flexDirection: "column",
    gap: 20,
    maxWidth: 900,
    marginLeft: "auto",
    marginRight: "auto",
  },
  imageWrapper: {
    width: "100%",
    height: 350,
    overflow: "hidden",
    borderRadius: 16,
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  info: { padding: 4 },
  description: { marginTop: 10, color: "#444" },
  label: { fontWeight: 600 },
  price: { color: "#FF7A00", fontWeight: 700, marginLeft: 5 },
  oldPrice: {
    marginLeft: 10,
    textDecoration: "line-through",
    color: "#777",
    fontSize: 14,
  },
  stock: { marginTop: 8 },
  category: { marginTop: 8, color: "#555" },
  addButton: {
    marginTop: 16,
    background: "#2D5FFF",
    color: "#fff",
    padding: "10px 20px",
    borderRadius: 8,
    border: "none",
    fontWeight: 600,
    cursor: "pointer",
  },

  stockCount: {
  marginTop: 4,
  fontSize: 15,
  color: "#222",
},
  center: {
    textAlign: "center",
    marginTop: "20vh",
    color: "#fff",
  },
};

export default ProductDetailPage;
