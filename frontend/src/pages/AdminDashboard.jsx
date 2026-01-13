// frontend/src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import './AdminDashboard.css';

// Chart libraries (using simple CSS bars for now as in v1)
// In a real app, use chart.js or recharts

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview'); // overview, users, products, orders

    const [stats, setStats] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [users, setUsers] = useState([]);
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [categories, setCategories] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [refunds, setRefunds] = useState([]);
    const [carts, setCarts] = useState([]);
    const [wishlists, setWishlists] = useState([]);
    const [chats, setChats] = useState([]);

    // Loading & Error
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [approvedFilter, setApprovedFilter] = useState('');

    // Category Form
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryDesc, setNewCategoryDesc] = useState('');

    // User Create Form
    const [showUserForm, setShowUserForm] = useState(false);
    const [newUserData, setNewUserData] = useState({ username: '', email: '', password: '', role: 'customer' });

    useEffect(() => {
        loadData();
    }, [activeTab, roleFilter, statusFilter]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'overview') {
                const [statsData, analyticsData] = await Promise.all([
                    apiService.getAdminStatistics(),
                    apiService.getAdminAnalytics()
                ]);
                setStats(statsData);
                setAnalytics(analyticsData);
            }
            else if (activeTab === 'users') {
                const data = await apiService.getAdminUsers({
                    search: searchTerm,
                    role: roleFilter,
                    is_active: statusFilter
                });
                setUsers(data);
            }
            else if (activeTab === 'products') {
                const data = await apiService.getAdminProducts({ search: searchTerm });
                setProducts(data);
            }
            else if (activeTab === 'orders') {
                const data = await apiService.getAdminOrders({ search: searchTerm, status: statusFilter });
                setOrders(data);
            }
            else if (activeTab === 'categories') {
                const data = await apiService.getAdminCategories();
                setCategories(data);
            }
            else if (activeTab === 'reviews') {
                const data = await apiService.getAdminReviews({ approved: approvedFilter });
                setReviews(data);
            }
            else if (activeTab === 'refunds') {
                const data = await apiService.getAdminRefunds({ status: statusFilter });
                setRefunds(data);
            }
            else if (activeTab === 'carts') {
                const data = await apiService.getAdminCarts();
                setCarts(data);
            }
            else if (activeTab === 'wishlists') {
                const data = await apiService.getAdminWishlists();
                setWishlists(data);
            }
            else if (activeTab === 'chats') {
                const data = await apiService.getAdminChats();
                setChats(data);
            }
        } catch (err) {
            console.error("Dashboard Load Error:", err);
            // If 403, redirect?
            setError('Failed to load data. Use admin account.');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        loadData();
    };

    // --- ACTIONS ---

    const handleRoleChange = async (userId, newRole) => {
        try {
            await apiService.updateUserRole(userId, { role: newRole });
            loadData(); // Refresh
            alert('User role updated!');
        } catch (err) {
            alert('Failed to update role');
        }
    };

    const handleUserStatusChange = async (userId, newStatus) => {
        try {
            await apiService.updateUserRole(userId, { is_active: newStatus });
            loadData();
        } catch (err) {
            alert('Failed to update status');
        }
    };

    const handleDeleteProduct = async (productId) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;
        try {
            await apiService.deleteAdminProduct(productId);
            setProducts(products.filter(p => p.id !== productId));
        } catch (err) {
            alert('Failed to delete product');
        }
    };

    const handleOrderStatusChange = async (orderId, newStatus) => {
        try {
            await apiService.updateAdminOrderStatus(orderId, newStatus);
            loadData();
            alert('Order status updated!');
        } catch (err) {
            alert('Failed to update order status');
        }
    };

    // --- CATEGORY ACTIONS ---
    const handleCreateCategory = async (e) => {
        e.preventDefault();
        if (!newCategoryName.trim()) {
            alert('Category name is required');
            return;
        }
        try {
            await apiService.createAdminCategory({
                name: newCategoryName,
                description: newCategoryDesc
            });
            setNewCategoryName('');
            setNewCategoryDesc('');
            loadData();
            alert('Category created!');
        } catch (err) {
            alert('Failed to create category');
        }
    };

    const handleDeleteCategory = async (categoryId) => {
        if (!window.confirm('Are you sure you want to delete this category?')) return;
        try {
            await apiService.deleteAdminCategory(categoryId);
            setCategories(categories.filter(c => c.id !== categoryId));
        } catch (err) {
            alert(err.error || 'Failed to delete category. Make sure it has no products.');
        }
    };

    // --- REVIEW ACTIONS ---
    const handleApproveReview = async (reviewId, isApproved) => {
        try {
            await apiService.updateAdminReview(reviewId, { is_approved: isApproved });
            loadData();
        } catch (err) {
            alert('Failed to update review');
        }
    };

    const handleDeleteReview = async (reviewId) => {
        if (!window.confirm('Are you sure you want to delete this review?')) return;
        try {
            await apiService.deleteAdminReview(reviewId);
            setReviews(reviews.filter(r => r.id !== reviewId));
        } catch (err) {
            alert('Failed to delete review');
        }
    };

    // --- USER CREATE ---
    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            await apiService.createAdminUser(newUserData);
            setNewUserData({ username: '', email: '', password: '', role: 'customer' });
            setShowUserForm(false);
            loadData();
            alert('User created!');
        } catch (err) {
            alert(err.error || 'Failed to create user');
        }
    };

    // --- REFUND ACTIONS ---
    const handleRefundAction = async (refundId, action) => {
        try {
            await apiService.updateAdminRefund(refundId, { status: action });
            loadData();
            alert(`Refund ${action}!`);
        } catch (err) {
            alert('Failed to update refund');
        }
    };

    // --- RENDERS ---

    const renderOverview = () => (
        <>
            <div className="stats-grid">
                <div className="stat-card users">
                    <div className="stat-icon">👥</div>
                    <div className="stat-info">
                        <h3>{stats?.total_users || 0}</h3>
                        <p>Total Users</p>
                        <span className="stat-detail">{stats?.active_users} active</span>
                    </div>
                </div>
                <div className="stat-card orders">
                    <div className="stat-icon">📦</div>
                    <div className="stat-info">
                        <h3>{stats?.total_orders || 0}</h3>
                        <p>Total Orders</p>
                        <span className="stat-detail">All time</span>
                    </div>
                </div>
                <div className="stat-card revenue">
                    <div className="stat-icon">💰</div>
                    <div className="stat-info">
                        <h3>${stats?.total_revenue?.toFixed(2) || '0.00'}</h3>
                        <p>Total Revenue</p>
                        <span className="stat-detail">Delivered orders</span>
                    </div>
                </div>
                <div className="stat-card chats">
                    <div className="stat-icon">💬</div>
                    <div className="stat-info">
                        <h3>{stats?.active_chats || 0}</h3>
                        <p>Active Chats</p>
                        <span className="stat-detail">{stats?.pending_refunds || 0} refunds pending</span>
                    </div>
                </div>
            </div>

            <div className="analytics-section">
                <div className="chart-container">
                    <h3>Sales by Month</h3>
                    <div className="simple-bar-chart">
                        {analytics?.sales_by_month?.map((item, index) => (
                            <div key={index} className="bar-item">
                                <span className="bar-label">{item.month}</span>
                                <div className="bar-outer">
                                    <div
                                        className="bar-inner"
                                        style={{ width: `${Math.min((item.revenue / 10000) * 100, 100)}%` }}
                                    ></div>
                                </div>
                                <span className="bar-value">${item.revenue}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="chart-container">
                    <h3>Top Products</h3>
                    <div className="top-products-list">
                        {analytics?.top_products?.map((prod, index) => (
                            <div key={index} className="top-product-item">
                                <span className="rank">#{index + 1}</span>
                                <span className="name">{prod.name}</span>
                                <span className="count">{prod.orders} orders</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );

    const renderUsersTable = () => (
        <div className="data-section">
            <div className="table-controls">
                <form onSubmit={handleSearch} className="search-form">
                    <input
                        type="text"
                        placeholder="Search users by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); }}>
                        <option value="">All Roles</option>
                        <option value="customer">Customer</option>
                        <option value="product_manager">Product Manager</option>
                        <option value="sales_manager">Sales Manager</option>
                        <option value="support_agent">Support Agent</option>
                    </select>
                    <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); }}>
                        <option value="">All Status</option>
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                    </select>
                    <button type="submit" className="btn-search">Search</button>
                    <button type="button" className="btn-search" onClick={() => setShowUserForm(true)} style={{ marginLeft: '10px', background: '#22c55e' }}>+ Add User</button>
                </form>
            </div>

            {showUserForm && (
                <div className="modal-overlay" onClick={() => setShowUserForm(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>Create New User</h3>
                        <form onSubmit={handleCreateUser}>
                            <input type="text" placeholder="Username" value={newUserData.username} onChange={(e) => setNewUserData({ ...newUserData, username: e.target.value })} required />
                            <input type="email" placeholder="Email" value={newUserData.email} onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })} required />
                            <input type="password" placeholder="Password" value={newUserData.password} onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })} required />
                            <select value={newUserData.role} onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}>
                                <option value="customer">Customer</option>
                                <option value="product_manager">Product Manager</option>
                                <option value="sales_manager">Sales Manager</option>
                                <option value="support_agent">Support Agent</option>
                            </select>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                <button type="submit" className="btn-search">Create</button>
                                <button type="button" className="btn-ban" onClick={() => setShowUserForm(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="table-responsive">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Joined</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id}>
                                <td>{u.id}</td>
                                <td>{u.username}</td>
                                <td>
                                    {u.email}
                                    {u.is_superuser && <span className="badge-admin">Admin</span>}
                                </td>
                                <td>
                                    <select
                                        value={u.role}
                                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                        className="role-select"
                                        disabled={u.is_superuser} // Cannot demote other superusers easily here
                                    >
                                        <option value="customer">Customer</option>
                                        <option value="product_manager">Product Manager</option>
                                        <option value="sales_manager">Sales Manager</option>
                                        <option value="support_agent">Support Agent</option>
                                    </select>
                                </td>
                                <td>
                                    {u.is_superuser ? (
                                        <span className="status-badge status-delivered">Active</span>
                                    ) : (
                                        <button
                                            className={u.is_active ? 'btn-ban' : 'btn-activate'}
                                            onClick={() => handleUserStatusChange(u.id, !u.is_active)}
                                        >
                                            {u.is_active ? 'Ban' : 'Activate'}
                                        </button>
                                    )}
                                </td>
                                <td>{new Date(u.date_joined).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderProductsTable = () => (
        <div className="data-section">
            <div className="table-controls">
                <form onSubmit={handleSearch} className="search-form">
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button type="submit" className="btn-search">Search</button>
                </form>
            </div>

            <div className="table-responsive">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Image</th>
                            <th>Name</th>
                            <th>Category</th>
                            <th>Price</th>
                            <th>Stock</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map(p => (
                            <tr key={p.id}>
                                <td>
                                    {p.image ? (
                                        <img src={`http://127.0.0.1:8000${p.image}`} alt={p.name} className="table-img" />
                                    ) : 'No Img'}
                                </td>
                                <td>{p.name}</td>
                                <td>{p.category}</td>
                                <td>${p.price.toFixed(2)}</td>
                                <td>{p.stock}</td>
                                <td>
                                    <button className="btn-delete" onClick={() => handleDeleteProduct(p.id)}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderOrdersTable = () => (
        <div className="data-section">
            <div className="table-controls">
                <div className="search-form">
                    <input
                        type="text"
                        placeholder="Search order ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="">All Status</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                    <button onClick={loadData} className="btn-search">Filter</button>
                </div>
            </div>

            <div className="table-responsive">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Date</th>
                            <th>Items</th>
                            <th>Total</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map(o => (
                            <tr key={o.id}>
                                <td>#{o.id}</td>
                                <td>{o.customer}</td>
                                <td>{new Date(o.created_at).toLocaleDateString()}</td>
                                <td>{o.item_count} items</td>
                                <td>${o.total_price.toFixed(2)}</td>
                                <td>
                                    <select
                                        value={o.status}
                                        onChange={(e) => handleOrderStatusChange(o.id, e.target.value)}
                                        className={`status-badge status-${o.status}`}
                                    >
                                        <option value="processing">Processing</option>
                                        <option value="shipped">Shipped</option>
                                        <option value="delivered">Delivered</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderCategoriesTable = () => (
        <div className="data-section">
            <div className="table-controls">
                <form onSubmit={handleCreateCategory} className="search-form">
                    <input
                        type="text"
                        placeholder="Category name..."
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        required
                    />
                    <input
                        type="text"
                        placeholder="Description (optional)"
                        value={newCategoryDesc}
                        onChange={(e) => setNewCategoryDesc(e.target.value)}
                    />
                    <button type="submit" className="btn-search">+ Add Category</button>
                </form>
            </div>

            <div className="table-responsive">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Description</th>
                            <th>Products</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {categories.map(c => (
                            <tr key={c.id}>
                                <td>{c.id}</td>
                                <td><strong>{c.name}</strong></td>
                                <td>{c.description || '-'}</td>
                                <td>{c.product_count}</td>
                                <td>{new Date(c.created_at).toLocaleDateString()}</td>
                                <td>
                                    <button
                                        className="btn-delete"
                                        onClick={() => handleDeleteCategory(c.id)}
                                        disabled={c.product_count > 0}
                                        title={c.product_count > 0 ? 'Remove products first' : 'Delete category'}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderReviewsTable = () => (
        <div className="data-section">
            <div className="table-controls">
                <div className="search-form">
                    <select value={approvedFilter} onChange={(e) => { setApprovedFilter(e.target.value); loadData(); }}>
                        <option value="">All Reviews</option>
                        <option value="true">Approved</option>
                        <option value="false">Pending</option>
                    </select>
                </div>
            </div>

            <div className="table-responsive">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Product</th>
                            <th>User</th>
                            <th>Rating</th>
                            <th>Comment</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reviews.map(r => (
                            <tr key={r.id}>
                                <td>{r.id}</td>
                                <td>{r.product_name}</td>
                                <td>{r.username}</td>
                                <td>{'⭐'.repeat(r.rating)}</td>
                                <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {r.comment || '-'}
                                </td>
                                <td>
                                    <span className={`status-badge ${r.is_approved ? 'status-delivered' : 'status-processing'}`}>
                                        {r.is_approved ? 'Approved' : 'Pending'}
                                    </span>
                                </td>
                                <td>
                                    {!r.is_approved && (
                                        <button
                                            className="btn-activate"
                                            onClick={() => handleApproveReview(r.id, true)}
                                            style={{ marginRight: '5px' }}
                                        >
                                            Approve
                                        </button>
                                    )}
                                    {r.is_approved && (
                                        <button
                                            className="btn-ban"
                                            onClick={() => handleApproveReview(r.id, false)}
                                            style={{ marginRight: '5px' }}
                                        >
                                            Unapprove
                                        </button>
                                    )}
                                    <button className="btn-delete" onClick={() => handleDeleteReview(r.id)}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderRefundsTable = () => (
        <div className="data-section">
            <div className="table-controls">
                <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); loadData(); }}>
                    <option value="">All Refunds</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                </select>
            </div>
            <div className="table-responsive">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Order</th>
                            <th>Customer</th>
                            <th>Reason</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {refunds.map(r => (
                            <tr key={r.id}>
                                <td>{r.id}</td>
                                <td>#{r.invoice_number}</td>
                                <td>{r.customer}</td>
                                <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.reason}</td>
                                <td>{r.refund_amount} TL</td>
                                <td>
                                    <span className={`status-badge status-${r.status}`}>{r.status}</span>
                                </td>
                                <td>
                                    {r.status === 'pending' && (
                                        <>
                                            <button className="btn-activate" onClick={() => handleRefundAction(r.id, 'approved')} style={{ marginRight: '5px' }}>Approve</button>
                                            <button className="btn-ban" onClick={() => handleRefundAction(r.id, 'rejected')}>Reject</button>
                                        </>
                                    )}
                                    {r.status !== 'pending' && <span>Processed by {r.processed_by || 'N/A'}</span>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderCartsTable = () => (
        <div className="data-section">
            <div className="table-responsive">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>User</th>
                            <th>Email</th>
                            <th>Items</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {carts.map(c => (
                            <tr key={c.id}>
                                <td>{c.id}</td>
                                <td>{c.username}</td>
                                <td>{c.email}</td>
                                <td>{c.items_count}</td>
                                <td>{c.total.toFixed(2)} TL</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderWishlistsTable = () => (
        <div className="data-section">
            <div className="table-responsive">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>User</th>
                            <th>Product</th>
                            <th>Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        {wishlists.map(w => (
                            <tr key={w.id}>
                                <td>{w.id}</td>
                                <td>{w.username}</td>
                                <td>{w.product_name}</td>
                                <td>{w.product_price.toFixed(2)} TL</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderChatsTable = () => (
        <div className="data-section">
            <div className="table-responsive">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Customer</th>
                            <th>Agent</th>
                            <th>Status</th>
                            <th>Updated</th>
                        </tr>
                    </thead>
                    <tbody>
                        {chats.map(c => (
                            <tr key={c.id}>
                                <td>{c.id}</td>
                                <td>{c.customer_name}</td>
                                <td>{c.agent_name}</td>
                                <td>
                                    <span className={`status-badge ${c.is_active ? 'status-processing' : 'status-delivered'}`}>
                                        {c.is_active ? 'Active' : 'Closed'}
                                    </span>
                                </td>
                                <td>{new Date(c.updated_at).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    if (error) return <div className="error-screen">{error}</div>;

    return (
        <div className="admin-container">
            <div className="admin-header">
                <div className="header-left">
                    <span className="admin-badge">⚙️ Admin Panel</span>
                    <h1>
                        {activeTab === 'overview' && 'Dashboard Overview'}
                        {activeTab === 'users' && 'User Management'}
                        {activeTab === 'products' && 'Product Management'}
                        {activeTab === 'orders' && 'Order Management'}
                        {activeTab === 'categories' && 'Category Management'}
                        {activeTab === 'reviews' && 'Review Management'}
                        {activeTab === 'refunds' && 'Refund Management'}
                        {activeTab === 'carts' && 'Cart Management'}
                        {activeTab === 'wishlists' && 'Wishlist Management'}
                        {activeTab === 'chats' && 'Chat Management'}
                    </h1>
                </div>
                <div className="header-actions">
                    <button className="btn-store" onClick={() => navigate('/')}>← Store</button>
                    <button className="btn-refresh" onClick={loadData}>Refresh</button>
                </div>
            </div>

            <div className="admin-tabs">
                <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>📊 Overview</button>
                <button className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>👥 Users</button>
                <button className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>📦 Products</button>
                <button className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>🚚 Orders</button>
                <button className={`tab-btn ${activeTab === 'categories' ? 'active' : ''}`} onClick={() => setActiveTab('categories')}>🏷️ Categories</button>
                <button className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => setActiveTab('reviews')}>⭐ Reviews</button>
                <button className={`tab-btn ${activeTab === 'refunds' ? 'active' : ''}`} onClick={() => setActiveTab('refunds')}>💰 Refunds</button>
                <button className={`tab-btn ${activeTab === 'carts' ? 'active' : ''}`} onClick={() => setActiveTab('carts')}>🛒 Carts</button>
                <button className={`tab-btn ${activeTab === 'wishlists' ? 'active' : ''}`} onClick={() => setActiveTab('wishlists')}>❤️ Wishlists</button>
                <button className={`tab-btn ${activeTab === 'chats' ? 'active' : ''}`} onClick={() => setActiveTab('chats')}>💬 Chats</button>
            </div>

            <div className="admin-content">
                {loading ? (
                    <div className="loading-spinner"></div>
                ) : (
                    <>
                        {activeTab === 'overview' && renderOverview()}
                        {activeTab === 'users' && renderUsersTable()}
                        {activeTab === 'products' && renderProductsTable()}
                        {activeTab === 'orders' && renderOrdersTable()}
                        {activeTab === 'categories' && renderCategoriesTable()}
                        {activeTab === 'reviews' && renderReviewsTable()}
                        {activeTab === 'refunds' && renderRefundsTable()}
                        {activeTab === 'carts' && renderCartsTable()}
                        {activeTab === 'wishlists' && renderWishlistsTable()}
                        {activeTab === 'chats' && renderChatsTable()}
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;

