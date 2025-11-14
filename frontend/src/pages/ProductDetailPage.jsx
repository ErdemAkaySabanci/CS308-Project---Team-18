import React from "react";
import { useParams } from "react-router-dom";

function ProductDetailPage() {
  const { id } = useParams();

  return (
    <div style={{ padding: "40px", fontSize: "24px" }}>
      Product Detail Page – ID: {id}
    </div>
  );
}

export default ProductDetailPage;
