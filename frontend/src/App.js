import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import ProductListPage from "./pages/ProductListPage";
import RegisterPage from "./pages/RegisterPage";
import ProductDetailPage from "./pages/ProductDetailPage"; // ← YENİ

function App() {
  return (
    <Router>
      <Routes>
        {/* Ana sayfa: ürün listesi */}
        <Route path="/" element={<ProductListPage />} />

        {/* Register sayfası */}
        <Route path="/register" element={<RegisterPage />} />

        {/* Ürün detay sayfası */}
        <Route path="/products/:id" element={<ProductDetailPage />} />
      </Routes>
    </Router>
  );
}

export default App;
