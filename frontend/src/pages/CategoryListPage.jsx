import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CategoryListPage = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch('http://127.0.0.1:8000/api/categories/');
                if (!response.ok) {
                    throw new Error('Failed to fetch categories');
                }
                const data = await response.json();
                setCategories(data);
                setLoading(false);
            } catch (err) {
                setError('Error loading categories. Please try again later.');
                setLoading(false);
            }
        };

        fetchCategories();
    }, []);

    const handleCategoryClick = (categoryId) => {
        // Currently no action as requested
        console.log(`Category clicked: ${categoryId}`);
    };

    if (loading) {
        return (
            <div style={styles.loadingContainer}>
                <div style={styles.loadingText}>Loading categories...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={styles.errorContainer}>
                <div style={styles.errorText}>{error}</div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.title}>Categories</h1>
                <p style={styles.subtitle}>Browse our product collections</p>
            </div>

            <div style={styles.grid}>
                {categories.map((category) => (
                    <div
                        key={category.id}
                        style={styles.card}
                        onClick={() => handleCategoryClick(category.id)}
                    >
                        <div style={styles.cardContent}>
                            <h2 style={styles.categoryName}>{category.name}</h2>
                            {category.description && (
                                <p style={styles.categoryDescription}>{category.description}</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const styles = {
    container: {
        minHeight: '100vh',
        padding: '40px 20px',
        backgroundColor: '#F5F7FA', // Background color from requirements
        fontFamily: "'Inter', sans-serif",
    },
    header: {
        maxWidth: '1200px',
        margin: '0 auto 40px',
        textAlign: 'center',
    },
    title: {
        fontSize: '32px',
        fontWeight: '700',
        color: '#1A1A1A', // Text color from requirements
        marginBottom: '12px',
    },
    subtitle: {
        fontSize: '16px',
        color: '#667085',
        margin: 0,
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '24px',
        maxWidth: '1200px',
        margin: '0 auto',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        border: '1px solid #E4E7EC',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        minHeight: '160px',
    },
    cardContent: {
        textAlign: 'center',
    },
    categoryName: {
        fontSize: '20px',
        fontWeight: '600',
        color: '#2D5FFF', // Primary color for category names
        margin: '0 0 8px 0',
    },
    categoryDescription: {
        fontSize: '14px',
        color: '#667085',
        lineHeight: '1.5',
        margin: 0,
        display: '-webkit-box',
        WebkitLineClamp: '2',
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
    },
    loadingContainer: {
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F7FA',
    },
    loadingText: {
        fontSize: '18px',
        color: '#2D5FFF',
        fontWeight: '500',
    },
    errorContainer: {
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F7FA',
    },
    errorText: {
        fontSize: '16px',
        color: '#B91C1C',
        backgroundColor: '#FEF2F2',
        padding: '16px 24px',
        borderRadius: '8px',
    },
};

export default CategoryListPage;
