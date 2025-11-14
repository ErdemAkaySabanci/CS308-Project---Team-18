import React from "react";
import { Link } from "react-router-dom";

function ProductListPage() {
  const products = [
    { id: 1, name: "Laptop X", price: 25000 },
    { id: 2, name: "Gaming Mouse", price: 1200 },
  ];

  return (
    <div style={{ padding: "40px" }}>
      <h1>Product List Page Çalışıyor 🚀</h1>

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
          <Link to={`/products/${p.id}`}>Go to detail</Link>
        </div>
      ))}

      <div style={{ marginTop: "24px" }}>
        <Link to="/register">Register sayfasına git</Link>
      </div>
    </div>
  );
}

export default ProductListPage;
