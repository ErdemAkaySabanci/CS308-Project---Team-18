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
        setError("Ürünler yüklenirken bir hata oluştu.");
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  if (loading) {
    return <div style={{ padding: "40px" }}>Yükleniyor...</div>;
  }

  if (error) {
    return <div style={{ padding: "40px", color: "red" }}>{error}</div>;
  }

  if (products.length === 0) {
    return (
      <div style={{ padding: "40px" }}>
        <h1>Products</h1>
        <p>Şu anda sistemde hiç ürün yok.</p>
        <div style={{ marginTop: "24px" }}>
          <Link to="/register">Register sayfasına git</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "40px" }}>
      <h1>Products</h1>

      {products.map((p) => (
        <div
          key={p.id}
          style={{
            marginTop: "16px",
            padding: "12px",
            borderRadius: "10px",
            backgroundColor: "#f3f4f6",
          }}
        >
          <h3>{p.name}</h3>
          <p>{p.price} TL</p>
          <Link to={`/products/${p.id}`}>Detaya Git</Link>
        </div>
      ))}

      <div style={{ marginTop: "24px" }}>
        <Link to="/register">Register sayfasına git</Link>
      </div>
    </div>
  );
}

export default ProductListPage;
