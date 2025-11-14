import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

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
        setError("Ürün yüklenirken bir hata oluştu veya ürün bulunamadı.");
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [id]);

  if (loading) {
    return <div style={{ padding: "40px" }}>Yükleniyor...</div>;
  }

  if (error) {
    return <div style={{ padding: "40px", color: "red" }}>{error}</div>;
  }

  if (!product) {
    return <div style={{ padding: "40px" }}>Ürün bulunamadı.</div>;
  }

  return (
    <div style={{ padding: "40px" }}>
      <h1>{product.name}</h1>
      {product.description && <p>{product.description}</p>}
      <h3>{product.price} TL</h3>
    </div>
  );
}

export default ProductDetailPage;
