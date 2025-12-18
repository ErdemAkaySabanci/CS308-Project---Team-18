import React, { useEffect, useState } from "react";
import { apiService } from "../services/apiService";

function CategoryBar({ onSelect, selectedCategory }) {
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);

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

  // Sync activeCategory with selectedCategory from parent
  useEffect(() => {
    setActiveCategory(selectedCategory);
  }, [selectedCategory]);

  const handleSelect = (category) => {
    if (activeCategory?.id === category.id) {
      setActiveCategory(null);
      onSelect(null);
    } else {
      setActiveCategory(category);
      onSelect(category);
    }
  };

  const categoryIcons = {
    'Basketbol': '🏀',
    'Basketball': '🏀',
    'Futbol': '⚽',
    'Football': '⚽',
    'Soccer': '⚽',
    'Tenis': '🎾',
    'Tennis': '🎾',
    'Yüzme': '🏊',
    'Swimming': '🏊',
    'Koşu': '🏃',
    'Running': '🏃',
    'Fitness': '💪',
    'Voleybol': '🏐',
    'Volleyball': '🏐',
  };

  const categoryTranslations = {
    'Basketbol': 'Basketball',
    'Futbol': 'Football',
    'Tenis': 'Tennis',
    'Yüzme': 'Swimming',
    'Koşu': 'Running',
    'Voleybol': 'Volleyball',
  };

  const getIcon = (name) => categoryIcons[name] || '🏅';
  const getEnglishName = (name) => categoryTranslations[name] || name;

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        {/* All Products Button */}
        <button
          onClick={() => {
            setActiveCategory(null);
            onSelect(null);
          }}
          style={{
            ...styles.chip,
            ...(activeCategory === null ? styles.chipActive : {})
          }}
          className="category-chip"
        >
          <span style={styles.chipIcon}>🏷️</span>
          <span>All</span>
        </button>

        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => handleSelect(c)}
            style={{
              ...styles.chip,
              ...(activeCategory?.id === c.id ? styles.chipActive : {})
            }}
            className="category-chip"
          >
            <span style={styles.chipIcon}>{getIcon(c.name)}</span>
            <span>{getEnglishName(c.name)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    marginBottom: "24px",
  },
  wrapper: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    padding: "16px 20px",
    backgroundColor: "#FFFFFF",
    borderRadius: "16px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  },
  chip: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px 20px",
    borderRadius: "50px",
    border: "2px solid #E2E8F0",
    backgroundColor: "#FFFFFF",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    color: "#475569",
    transition: "all 0.2s ease",
    fontFamily: "'Inter', sans-serif",
  },
  chipActive: {
    backgroundColor: "#F97316",
    borderColor: "#F97316",
    color: "#FFFFFF",
    boxShadow: "0 4px 12px rgba(249, 115, 22, 0.3)",
  },
  chipIcon: {
    fontSize: "18px",
  },
};

// Hover effects
const styleSheet = document.createElement("style");
styleSheet.innerText = `
  .category-chip:hover {
    border-color: #F97316 !important;
    background-color: #FFF7ED !important;
    color: #F97316 !important;
    transform: translateY(-2px);
  }
  .category-chip:active {
    transform: translateY(0);
  }
`;
document.head.appendChild(styleSheet);

export default CategoryBar;
