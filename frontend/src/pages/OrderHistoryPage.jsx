import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/authService';

const OrderHistoryPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const token = authService.getToken();
            const response = await fetch('http://127.0.0.1:8000/api/orders/list/', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setOrders(data);
            } else {
                setError('Failed to load orders.');
            }
        } catch (err) {
            console.error(err);
            setError('An error occurred while loading orders.');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'processing': return '#F59E0B'; // Amber
            case 'in_transit': return '#3B82F6'; // Blue
            case 'delivered': return '#10B981'; // Green
            case 'cancelled': return '#EF4444'; // Red
            default: return '#6B7280'; // Gray
        }
    };

    if (loading) return <div style={styles.center}>Loading orders...</div>;
    if (error) return <div style={styles.center}>{error}</div>;

    return (
        <div style={styles.container}>
            <h1 style={styles.title}>Order History</h1>

            {orders.length === 0 ? (
                <div style={styles.empty}>
                    <p>You haven't placed any orders yet.</p>
                    <Link to="/" style={styles.link}>Start Shopping</Link>
                </div>
            ) : (
                <div style={styles.list}>
                    {orders.map(order => (
                        <div key={order.id} style={styles.orderCard}>
                            <div style={styles.orderHeader}>
                                <div>
                                    <span style={styles.orderId}>Order #{order.id}</span>
                                    <span style={styles.date}>{new Date(order.created_at).toLocaleDateString()}</span>
                                </div>
                                <span style={{
                                    ...styles.statusBadge,
                                    backgroundColor: getStatusColor(order.status) + '20', // 20% opacity
                                    color: getStatusColor(order.status)
                                }}>
                                    {order.status_display}
                                </span>
                            </div>

                            <div style={styles.items}>
                                {order.items && order.items.map(item => (
                                    <div key={item.id} style={styles.item}>
                                        <span>{item.quantity}x {item.product_name}</span>
                                        <span>${item.price}</span>
                                    </div>
                                ))}
                            </div>

                            <div style={styles.footer}>
                                <span style={styles.totalLabel}>Total:</span>
                                <span style={styles.totalPrice}>${order.total_price}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const styles = {
    container: {
        maxWidth: '800px',
        margin: '40px auto',
        padding: '0 20px',
        fontFamily: "'Inter', sans-serif",
    },
    center: {
        textAlign: 'center',
        marginTop: '100px',
        fontSize: '18px',
        color: '#667085'
    },
    title: {
        fontSize: '32px',
        fontWeight: '700',
        marginBottom: '32px',
        color: '#1A1A1A',
    },
    orderCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #E4E7EC',
        padding: '24px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    },
    orderHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        paddingBottom: '16px',
        borderBottom: '1px solid #F2F4F7',
    },
    orderId: {
        fontSize: '18px',
        fontWeight: '600',
        color: '#1A1A1A',
        marginRight: '12px',
    },
    date: {
        color: '#667085',
        fontSize: '14px',
    },
    statusBadge: {
        padding: '6px 12px',
        borderRadius: '20px',
        fontSize: '14px',
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    items: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        marginBottom: '20px',
    },
    item: {
        display: 'flex',
        justifyContent: 'space-between',
        color: '#4B5563',
    },
    footer: {
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingTop: '16px',
        borderTop: '1px solid #F2F4F7',
    },
    totalLabel: {
        fontSize: '16px',
        color: '#667085',
        marginRight: '12px',
    },
    totalPrice: {
        fontSize: '20px',
        fontWeight: '700',
        color: '#1A1A1A',
    },
    empty: {
        textAlign: 'center',
        padding: '40px',
        backgroundColor: '#F9FAFB',
        borderRadius: '16px',
    },
    link: {
        color: '#2D5FFF',
        textDecoration: 'none',
        fontWeight: '600',
    }
};

export default OrderHistoryPage;
