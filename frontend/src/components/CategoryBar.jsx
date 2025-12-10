import React, { useEffect, useState } from "react";
import { apiService } from "../services/apiService";

function CategoryBar({ onSelect }) {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    async function loadCategories() {
      try {
        const data = await apiService.get("/categories/");
        const list = Array.isArray(data) ? data : data.results;
        setCategories(list);
      } catch (err) {
        console.error("Category load error:", err);
      }
    }
    loadCategories();
  }, []);

  return (
    <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
      {categories.map((c) => (
        <button
          key={c.id}
          onClick={() => onSelect(c)}
          style={{
            padding: "6px 14px",
            borderRadius: 20,
            border: "1px solid #ccc",
            background: "white",
            cursor: "pointer"
          }}
        >
          {c.name}
        </button>
      ))}
    </div>
  );
}


const styles = {
  wrapper: {
    display: "flex",
    gap: 8,
    padding: "8px 16px",
  },
  chip: {
    borderRadius: 999,
    border: "1px solid #ddd",
    padding: "6px 14px",
    backgroundColor: "#fff",
    cursor: "pointer",
    fontSize: 14,
  },
  chipActive: {
    backgroundColor: "#2563EB",
    color: "#fff",
    borderColor: "#2563EB",
  },
};

export default CategoryBar;
