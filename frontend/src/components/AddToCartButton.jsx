import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cartService } from '../services/cartService';
import { authService } from '../services/authService';

const AddToCartButton = ({ productId, quantity = 1, onAddSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handleAddToCart = async (e) => {
        e.stopPropagation(); // Prevent bubbling if inside a clickable card
        e.preventDefault();

        // Check authentication
        if (!authService.isAuthenticated()) {
            // Redirect to login with return url
            navigate('/login', { state: { from: window.location.pathname } });
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const response = await cartService.addToCart(productId, quantity);

            if (response && !response.error) {
                setSuccess(true);
                if (onAddSuccess) onAddSuccess(response);

                // Reset success message after 2 seconds
                setTimeout(() => {
                    setSuccess(false);
                }, 2000);
            } else {
                setError(response.error || 'Failed to add to cart');
            }
        } catch (err) {
            console.error('Add to cart error:', err);
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <button
                onClick={handleAddToCart}
                disabled={loading}
                style={{
                    ...styles.button,
                    backgroundColor: success ? '#10B981' : '#FF7A00', // Green for success, Orange (Secondary) for action
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                }}
            >
                {loading ? 'Adding...' : success ? 'Added!' : 'Add to Cart'}
            </button>
            {error && <div style={styles.error}>{error}</div>}
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
    },
    button: {
        width: '100%',
        padding: '12px 24px',
        color: '#FFFFFF',
        border: 'none',
        borderRadius: '8px',
        fontSize: '16px',
        fontWeight: '600',
        fontFamily: "'Inter', sans-serif",
        transition: 'background-color 0.2s, transform 0.1s',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    },
    error: {
        marginTop: '8px',
        color: '#DC2626',
        fontSize: '12px',
        textAlign: 'center',
    },
};

export default AddToCartButton;
