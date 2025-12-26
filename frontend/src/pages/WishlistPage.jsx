import React, { useEffect, useState } from 'react';
import { apiService } from '../services/apiService';
import { useNavigate } from 'react-router-dom';

const BASE_URL = "http://localhost:8000";

const WishlistPage = () => {
    const [wishlistItems, setWishlistItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchWishlist();
    }, []);

    const fetchWishlist = async () => {
        try {
            const data = await apiService.getWishlist();
            setWishlistItems(data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setError('Failed to load wishlist.');
            setLoading(false);
        }
    };

    const handleRemove = async (productId) => {
        try {
            await apiService.removeFromWishlist(productId);
            setWishlistItems(prev => prev.filter(item => item.product !== productId));
        } catch (err) {
            console.error(err);
            alert('Failed to remove item.');
        }
    };

    const handleAddToCart = async (product_id, product_name) => {
        try {
            await apiService.addToCart(product_id, 1);
            alert(`${product_name} added to cart!`);
        } catch (err) {
            console.error(err);
            alert('Failed to add to cart.');
        }
    };

    if (loading) return <div style={styles.centerContainer}>Loading...</div>;

    return (
        <div style={styles.pageWrapper}>
            <div style={styles.container}>
                <h1 style={styles.title}>My Wishlist</h1>

                {error && <div style={styles.errorText}>{error}</div>}

                {wishlistItems.length === 0 ? (
                    <div style={styles.emptyState}>
                        <p style={styles.emptyText}>Your wishlist is empty.</p>
                        <button
                            onClick={() => navigate('/')}
                            style={styles.startShoppingBtn}
                        >
                            Start Shopping
                        </button>
                    </div>
                ) : (
                    <div style={styles.grid}>
                        {wishlistItems.map((item) => (
                            <div key={item.id} style={styles.card}>
                                <div style={styles.imageContainer}>
                                    <img
                                        src={item.product_image ? (item.product_image.startsWith('http') ? item.product_image : `${BASE_URL}${item.product_image}`) : 'https://via.placeholder.com/300'}
                                        alt={item.product_name}
                                        style={styles.productImage}
                                    />
                                    <button
                                        onClick={() => handleRemove(item.product)}
                                        style={styles.removeBtn}
                                        title="Remove from Wishlist"
                                    >
                                        🗑️
                                    </button>
                                </div>

                                <div style={styles.cardBody}>
                                    <h3 style={styles.productName}>
                                        {item.product_name}
                                    </h3>
                                    <p style={styles.price}>
                                        {item.product_price} TL
                                    </p>

                                    <button
                                        onClick={() => handleAddToCart(item.product, item.product_name)}
                                        style={styles.addToCartBtn}
                                    >
                                        🛒 Add to Cart
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const styles = {
    pageWrapper: {
        minHeight: "100vh",
        backgroundColor: "#F8FAFC",
        fontFamily: "'Inter', sans-serif",
        padding: "40px 20px",
    },
    container: {
        maxWidth: "1200px",
        margin: "0 auto",
    },
    centerContainer: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        fontSize: "20px",
        color: "#64748B",
    },
    title: {
        fontSize: "32px",
        fontWeight: "800",
        color: "#1E293B",
        marginBottom: "32px",
    },
    errorText: {
        color: "#EF4444",
        marginBottom: "16px",
    },
    emptyState: {
        textAlign: "center",
        padding: "60px",
        backgroundColor: "#FFFFFF",
        borderRadius: "20px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
    },
    emptyText: {
        fontSize: "18px",
        color: "#64748B",
        marginBottom: "24px",
    },
    startShoppingBtn: {
        padding: "12px 24px",
        backgroundColor: "#2563EB",
        color: "#FFFFFF",
        border: "none",
        borderRadius: "12px",
        fontSize: "16px",
        fontWeight: "600",
        cursor: "pointer",
    },
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
        gap: "24px",
    },
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: "16px",
        overflow: "hidden",
        boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
        transition: "transform 0.2s",
        border: "1px solid #F1F5F9",
    },
    imageContainer: {
        position: "relative",
        height: "200px",
        backgroundColor: "#F1F5F9",
    },
    productImage: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
    },
    removeBtn: {
        position: "absolute",
        top: "10px",
        right: "10px",
        backgroundColor: "#FFFFFF",
        border: "none",
        borderRadius: "50%",
        width: "36px",
        height: "36px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        fontSize: "18px",
    },
    cardBody: {
        padding: "16px",
    },
    productName: {
        fontSize: "16px",
        fontWeight: "600",
        color: "#1E293B",
        marginBottom: "8px",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },
    price: {
        fontSize: "18px",
        fontWeight: "700",
        color: "#F97316",
        marginBottom: "16px",
    },
    addToCartBtn: {
        width: "100%",
        padding: "10px",
        backgroundColor: "#1E293B",
        color: "#FFFFFF",
        border: "none",
        borderRadius: "8px",
        fontSize: "14px",
        fontWeight: "600",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
    },
};

export default WishlistPage;
