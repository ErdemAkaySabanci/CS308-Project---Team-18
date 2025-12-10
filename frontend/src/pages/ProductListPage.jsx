import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { apiService } from "../services/apiService";
import CategoryBar from "../components/CategoryBar";

function ProductListPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search, Sorting, Selected Category
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);

  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const urlCategoryId = params.get("category");

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        setError(null);

        let data;

        // Eğer URL üzerinden kategori geldiyse, backend'den filtreli çek
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

  if (loading) return <div style={styles.center}>Loading...</div>;
  if (error) return <div style={styles.center}>{error}</div>;

  // --------------------------
  // 🔍 Search Filter
  // --------------------------
  const searchFiltered = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --------------------------
  // 🟦 Category Filter
  // Backend, ürünlerde şu alanı gönderiyor:
  //  "category_name": "Basketbol"
  // --------------------------
  const categoryFiltered = searchFiltered.filter((p) => {
    if (!selectedCategory) return true; // kategori seçilmemişse tüm ürünler
    return p.category_name === selectedCategory.name;
  });

  // --------------------------
  // ↕️ Sorting
  // --------------------------
  const sortedProducts = [...categoryFiltered].sort((a, b) => {
    if (sortOption === "price_low") return a.price - b.price;
    if (sortOption === "price_high") return b.price - a.price;
    if (sortOption === "name_az") return a.name.localeCompare(b.name);
    if (sortOption === "name_za") return b.name.localeCompare(a.name);
    return 0;
  });

  return (
    <div style={styles.pageWrapper}>

      {/* 🔵 CATEGORY BAR (Dinamik API) */}
      <CategoryBar onSelect={(cat) => setSelectedCategory(cat)} />

      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Products</h1>
          <p style={styles.subtitle}>Browse all available products</p>
        </div>

        <Link to="/categories" style={styles.primaryButton}>
          Categories
        </Link>
      </div>

      <div style={styles.searchSortRow}>
  <input
    type="text"
    placeholder="Search products..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    style={styles.searchInput}
  />

  <select
    value={sortOption}
    onChange={(e) => setSortOption(e.target.value)}
    style={styles.sortSelect}
  >
    <option value="">Sort By</option>
    <option value="price_low">Price: Low → High</option>
    <option value="price_high">Price: High → Low</option>
    <option value="name_az">Name: A → Z</option>
    <option value="name_za">Name: Z → A</option>
  </select>

  {/* 🔴 CLEAR FILTERS BUTTON */}
  <button
    onClick={() => {
      setSelectedCategory(null);
      setSearchTerm("");
      setSortOption("");
    }}
    style={styles.clearButton}
  >
    Clear Filters
  </button>
</div>


      {/* PRODUCT LIST */}
      <div style={styles.grid}>
        {sortedProducts.map((p) => (
          <div key={p.id} style={styles.card}>
            <div style={styles.cardContent}>
              <h3 style={styles.cardTitle}>{p.name}</h3>

              <p style={styles.price}>
                Price: <span style={styles.priceValue}>{p.price} TL</span>
              </p>

              {p.description && (
                <p style={styles.description}>
                  {p.description.length > 60
                    ? p.description.slice(0, 60) + "..."
                    : p.description}
                </p>
              )}

              {p.image && (
                <img
                  src={p.image}
                  alt={p.name}
                  style={styles.productImage}
                />
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

/* ---------- STYLES ---------- */

const styles = {
  pageWrapper: {
    minHeight: "100vh",
    padding: "24px 16px 40px",
    fontFamily: "Inter, sans-serif",
    background: "linear-gradient(135deg, #2D5FFF 0%, #FF7A00 100%)",
    backgroundAttachment: "fixed",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: "20px",
  },
  title: { margin: 0, fontSize: "28px", fontWeight: 700 },
  subtitle: { marginTop: 8, color: "#4B5563" },
  searchSortRow: {
    display: "flex",
    gap: "12px",
    marginBottom: "20px",
  },
  searchInput: {
    flex: 1,
    padding: "10px",
    fontSize: "16px",
    borderRadius: 8,
    border: "1px solid #ccc",
  },
  sortSelect: {
    padding: "10px",
    borderRadius: 8,
    border: "1px solid #aaa",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
    gap: "20px",
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    boxShadow: "0 6px 16px rgba(0,0,0,0.1)",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 600,
  },
  priceValue: {
    fontWeight: 700,
    color: "#FF7A00",
  },
  productImage: {
    width: "100%",
    marginTop: 12,
    borderRadius: 10,
  },
  secondaryButton: {
    padding: "8px 16px",
    borderRadius: 20,
    border: "1px solid #FF7A00",
    color: "#FF7A00",
    textDecoration: "none",
    fontWeight: 500,
  },
  primaryButton: {
    padding: "8px 16px",
    borderRadius: 30,
    backgroundColor: "#2D5FFF",
    color: "#FFF",
    textDecoration: "none",
    fontWeight: 600,
  },
  center: {
    marginTop: "20vh",
    textAlign: "center",
    fontSize: 20,
  },

  clearButton: {
  padding: "10px 14px",
  backgroundColor: "#ff4d4d",
  color: "white",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: 600,
  transition: "0.2s",
},


};

export default ProductListPage;
