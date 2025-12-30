import React, { useState, useEffect } from 'react';
import './ProductManagerDashboard.css';

const ProductManagerDashboard = () => {
    // State management
    const [activeTab, setActiveTab] = useState('products'); // 'products', 'orders', 'comments'
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all'); // Category filter for products

    // Products state
    const [products, setProducts] = useState([]);
    const [productsLoading, setProductsLoading] = useState(false);
    const [showProductModal, setShowProductModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [productForm, setProductForm] = useState({
        name: '',
        description: '',
        price: '',
        cost: '',
        quantity_in_stock: '',
        category: '',
        model: '',
        serial_number: '',
        warranty_status: '',
        distributor_info: ''
    });
    const [productImage, setProductImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    // Categories state
    const [categories, setCategories] = useState([]);
    const [categoriesLoading, setCategoriesLoading] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });

    // Orders state
    const [orders, setOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [orderStartDate, setOrderStartDate] = useState('2024-01-01');
    const [orderEndDate, setOrderEndDate] = useState('2025-12-31');

    // Comments state
    const [pendingComments, setPendingComments] = useState([]);
    const [commentsLoading, setCommentsLoading] = useState(false);

    // Fetch data when tab changes
    useEffect(() => {
        if (activeTab === 'products') {
            fetchProducts();
            fetchCategories(); // Also load categories for filter
        }
        if (activeTab === 'orders') fetchOrders();
        if (activeTab === 'comments') fetchPendingComments();
    }, [activeTab]);

    // =============== PRODUCTS ===============
    const fetchProducts = async () => {
        setProductsLoading(true);
        try {
            const response = await fetch('http://localhost:8000/api/products/');
            const data = await response.json();
            const productList = Array.isArray(data) ? data : (data.results || []);
            setProducts(productList);
        } catch (err) {
            console.error('Error fetching products:', err);
        } finally {
            setProductsLoading(false);
        }
    };

    const handleProductSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('access_token');
        const url = editingProduct
            ? `http://localhost:8000/api/products-crud/${editingProduct.id}/`
            : 'http://localhost:8000/api/products-crud/';
        const method = editingProduct ? 'PUT' : 'POST';

        try {
            // FormData kullan (görsel yükleme için)
            const formData = new FormData();
            formData.append('name', productForm.name);
            formData.append('description', productForm.description || '');
            formData.append('price', parseFloat(productForm.price));
            formData.append('cost', parseFloat(productForm.cost) || parseFloat(productForm.price) * 0.5);
            formData.append('quantity_in_stock', parseInt(productForm.quantity_in_stock));
            formData.append('category', parseInt(productForm.category));
            formData.append('model', productForm.model || '');
            formData.append('serial_number', productForm.serial_number || '');
            formData.append('warranty_status', productForm.warranty_status || '');
            formData.append('distributor', productForm.distributor_info || '');

            // Görsel varsa ekle
            if (productImage) {
                formData.append('image', productImage);
            }

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`
                    // Content-Type header'ı FormData için otomatik ayarlanır
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save product');
            }

            alert(`✅ Product ${editingProduct ? 'updated' : 'added'} successfully!`);
            setShowProductModal(false);
            setEditingProduct(null);
            resetProductForm();
            fetchProducts();
        } catch (err) {
            alert('❌ Error: ' + err.message);
        }
    };

    const handleDeleteProduct = async (productId) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;

        const token = localStorage.getItem('access_token');
        try {
            const response = await fetch(`http://localhost:8000/api/products-crud/${productId}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to delete product');

            alert('✅ Product deleted successfully!');
            fetchProducts();
        } catch (err) {
            alert('❌ Error: ' + err.message);
        }
    };

    const handleEditProduct = (product) => {
        setEditingProduct(product);
        setProductForm({
            name: product.name || '',
            description: product.description || '',
            price: product.price || '',
            cost: product.cost || '',
            quantity_in_stock: product.quantity_in_stock || '',
            category: product.category || '',
            model: product.model || '',
            serial_number: product.serial_number || '',
            warranty_status: product.warranty_status || '',
            distributor_info: product.distributor_info || ''
        });
        setShowProductModal(true);
    };

    const handleUpdateStock = async (productId, newStock) => {
        const token = localStorage.getItem('access_token');
        try {
            const response = await fetch(`http://localhost:8000/api/products-crud/${productId}/`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ quantity_in_stock: parseInt(newStock) })
            });

            if (!response.ok) throw new Error('Failed to update stock');
            fetchProducts();
        } catch (err) {
            alert('❌ Error updating stock: ' + err.message);
        }
    };

    const resetProductForm = () => {
        setProductForm({
            name: '', description: '', price: '', cost: '', quantity_in_stock: '',
            category: '', model: '', serial_number: '', warranty_status: '', distributor_info: ''
        });
        setProductImage(null);
        setImagePreview(null);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProductImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    // =============== CATEGORIES ===============
    const fetchCategories = async () => {
        setCategoriesLoading(true);
        try {
            const response = await fetch('http://localhost:8000/api/categories/');
            const data = await response.json();
            // Handle paginated response {count, results: [...]}
            const categoryList = Array.isArray(data) ? data : (data.results || []);
            setCategories(categoryList);
        } catch (err) {
            console.error('Error fetching categories:', err);
        } finally {
            setCategoriesLoading(false);
        }
    };

    const handleCategorySubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('access_token');
        const url = editingCategory
            ? `http://localhost:8000/api/categories-crud/${editingCategory.id}/`
            : 'http://localhost:8000/api/categories-crud/';
        const method = editingCategory ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(categoryForm)
            });

            if (!response.ok) throw new Error('Failed to save category');

            alert(`✅ Category ${editingCategory ? 'updated' : 'added'} successfully!`);
            setShowCategoryModal(false);
            setEditingCategory(null);
            setCategoryForm({ name: '', description: '' });
            fetchCategories();
        } catch (err) {
            alert('❌ Error: ' + err.message);
        }
    };

    const handleDeleteCategory = async (categoryId) => {
        if (!window.confirm('Are you sure? Products in this category will be affected.')) return;

        const token = localStorage.getItem('access_token');
        try {
            const response = await fetch(`http://localhost:8000/api/categories-crud/${categoryId}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to delete category');

            alert('✅ Category deleted successfully!');
            fetchCategories();
        } catch (err) {
            alert('❌ Error: ' + err.message);
        }
    };

    // =============== ORDERS ===============
    const fetchOrders = async () => {
        setOrdersLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(
                `http://localhost:8000/api/orders/invoices/?start_date=${orderStartDate}&end_date=${orderEndDate}`,
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );
            const data = await response.json();
            setOrders(data.invoices || []);
        } catch (err) {
            console.error('Error fetching orders:', err);
        } finally {
            setOrdersLoading(false);
        }
    };

    const handleUpdateOrderStatus = async (orderId, newStatus) => {
        const token = localStorage.getItem('access_token');
        try {
            const response = await fetch(`http://localhost:8000/api/orders/${orderId}/status/`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (!response.ok) throw new Error('Failed to update status');

            alert('✅ Order status updated!');
            fetchOrders();
        } catch (err) {
            alert('❌ Error: ' + err.message);
        }
    };

    const handleDownloadInvoice = async (orderId, invoiceNumber) => {
        const token = localStorage.getItem('access_token');
        try {
            const response = await fetch(`http://localhost:8000/api/orders/${orderId}/invoice/download/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Download failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `invoice_${invoiceNumber}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            alert('📥 Invoice downloaded successfully!');
        } catch (err) {
            alert('❌ Failed to download invoice: ' + err.message);
        }
    };

    // =============== COMMENTS ===============
    const fetchPendingComments = async () => {
        setCommentsLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch('http://localhost:8000/api/reviews/pending/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setPendingComments(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching comments:', err);
        } finally {
            setCommentsLoading(false);
        }
    };

    const handleApproveComment = async (commentId) => {
        const token = localStorage.getItem('access_token');
        try {
            const response = await fetch(`http://localhost:8000/api/reviews/${commentId}/approve/`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to approve comment');

            alert('✅ Comment approved!');
            fetchPendingComments();
        } catch (err) {
            alert('❌ Error: ' + err.message);
        }
    };

    const handleRejectComment = async (commentId) => {
        if (!window.confirm('Are you sure you want to reject this comment?')) return;

        const token = localStorage.getItem('access_token');
        try {
            const response = await fetch(`http://localhost:8000/api/reviews/${commentId}/reject/`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to reject comment');

            alert('✅ Comment rejected!');
            fetchPendingComments();
        } catch (err) {
            alert('❌ Error: ' + err.message);
        }
    };

    return (
        <div className="pm-dashboard-container">
            {/* Header */}
            <div className="pm-header">
                <h1>📦 Product Manager Dashboard</h1>
                <p className="pm-subtitle">Manage products, categories, orders, and comments</p>
            </div>

            {/* Tab Navigation */}
            <div className="pm-tab-navigation">
                <button
                    className={`pm-tab-btn ${activeTab === 'products' ? 'active' : ''}`}
                    onClick={() => setActiveTab('products')}
                >
                    📦 Products & Categories
                </button>
                <button
                    className={`pm-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
                    onClick={() => setActiveTab('orders')}
                >
                    🚚 Orders & Deliveries
                </button>
                <button
                    className={`pm-tab-btn ${activeTab === 'comments' ? 'active' : ''}`}
                    onClick={() => setActiveTab('comments')}
                >
                    💬 Comments
                </button>
            </div>

            {/* =============== PRODUCTS TAB =============== */}
            {activeTab === 'products' && (
                <div className="pm-tab-content">
                    <div className="pm-card">
                        <div className="pm-card-header">
                            <h2>📦 Product & Category Management</h2>
                            <div className="pm-header-actions">
                                <button
                                    className="pm-add-btn"
                                    onClick={() => { resetProductForm(); setEditingProduct(null); setShowProductModal(true); fetchCategories(); }}
                                >
                                    ➕ Add Product
                                </button>
                                <button
                                    className="pm-add-btn pm-cat-btn"
                                    onClick={() => { setCategoryForm({ name: '', description: '' }); setEditingCategory(null); setShowCategoryModal(true); }}
                                >
                                    📁 Add Category
                                </button>
                            </div>
                        </div>

                        {/* Category Filter Bar */}
                        <div className="pm-filter-bar">
                            <div className="pm-filter-group">
                                <label>Filter by Category:</label>
                                <select
                                    value={selectedCategoryFilter}
                                    onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                                    className="pm-filter-select"
                                >
                                    <option value="all">📋 All Categories ({products.length})</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name} ({products.filter(p => p.category === cat.id || p.category_name === cat.name).length})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="pm-category-chips">
                                {categories.map(cat => (
                                    <div key={cat.id} className="pm-category-chip">
                                        <span>{cat.name}</span>
                                        <button
                                            className="pm-chip-edit"
                                            onClick={() => { setEditingCategory(cat); setCategoryForm({ name: cat.name, description: cat.description || '' }); setShowCategoryModal(true); }}
                                            title="Edit category"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            className="pm-chip-delete"
                                            onClick={() => handleDeleteCategory(cat.id)}
                                            title="Delete category"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {productsLoading ? (
                            <div className="pm-loading">Loading products...</div>
                        ) : (
                            <div className="pm-table-container">
                                <table className="pm-table">
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
                                        {products
                                            .filter(product => {
                                                if (selectedCategoryFilter === 'all') return true;
                                                return product.category === parseInt(selectedCategoryFilter) ||
                                                    product.category_name === categories.find(c => c.id === parseInt(selectedCategoryFilter))?.name;
                                            })
                                            .map(product => (
                                                <tr key={product.id}>
                                                    <td>
                                                        {product.image ? (
                                                            <img src={product.image} alt={product.name} className="pm-product-thumb" />
                                                        ) : (
                                                            <div className="pm-no-image">🏃</div>
                                                        )}
                                                    </td>
                                                    <td>{product.name}</td>
                                                    <td>{product.category_name || 'N/A'}</td>
                                                    <td>{product.price?.toLocaleString('tr-TR')} TL</td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            value={product.quantity_in_stock}
                                                            onChange={(e) => handleUpdateStock(product.id, e.target.value)}
                                                            className="pm-stock-input"
                                                            min="0"
                                                        />
                                                    </td>
                                                    <td>
                                                        <button
                                                            className="pm-edit-btn"
                                                            onClick={() => handleEditProduct(product)}
                                                        >
                                                            ✏️
                                                        </button>
                                                        <button
                                                            className="pm-delete-btn"
                                                            onClick={() => handleDeleteProduct(product.id)}
                                                        >
                                                            🗑️
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* =============== CATEGORIES TAB =============== */}
            {activeTab === 'categories' && (
                <div className="pm-tab-content">
                    <div className="pm-card">
                        <div className="pm-card-header">
                            <h2>📁 Category Management</h2>
                            <button
                                className="pm-add-btn"
                                onClick={() => { setCategoryForm({ name: '', description: '' }); setEditingCategory(null); setShowCategoryModal(true); }}
                            >
                                ➕ Add Category
                            </button>
                        </div>

                        {categoriesLoading ? (
                            <div className="pm-loading">Loading categories...</div>
                        ) : (
                            <div className="pm-category-grid">
                                {categories.map(category => (
                                    <div key={category.id} className="pm-category-card">
                                        <h3>{category.name}</h3>
                                        <p>{category.description || 'No description'}</p>
                                        <div className="pm-category-actions">
                                            <button
                                                className="pm-edit-btn"
                                                onClick={() => { setEditingCategory(category); setCategoryForm({ name: category.name, description: category.description || '' }); setShowCategoryModal(true); }}
                                            >
                                                ✏️ Edit
                                            </button>
                                            <button
                                                className="pm-delete-btn"
                                                onClick={() => handleDeleteCategory(category.id)}
                                            >
                                                🗑️ Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* =============== ORDERS TAB =============== */}
            {activeTab === 'orders' && (
                <div className="pm-tab-content">
                    <div className="pm-card">
                        <div className="pm-card-header">
                            <h2>🚚 Orders & Deliveries</h2>
                            <div className="pm-header-actions">
                                <div className="pm-date-filters">
                                    <input
                                        type="date"
                                        value={orderStartDate}
                                        onChange={(e) => setOrderStartDate(e.target.value)}
                                        className="pm-date-input"
                                    />
                                    <span>to</span>
                                    <input
                                        type="date"
                                        value={orderEndDate}
                                        onChange={(e) => setOrderEndDate(e.target.value)}
                                        className="pm-date-input"
                                    />
                                </div>
                                <button className="pm-refresh-btn" onClick={fetchOrders}>
                                    🔄 Load Orders
                                </button>
                            </div>
                        </div>

                        {ordersLoading ? (
                            <div className="pm-loading">Loading orders...</div>
                        ) : orders.length === 0 ? (
                            <div className="pm-empty-state">
                                <div className="pm-empty-icon">📦</div>
                                <h3>No Orders Found</h3>
                                <p>Select a date range and click "Load Orders"</p>
                            </div>
                        ) : (
                            <div className="pm-table-container">
                                <table className="pm-table pm-delivery-table">
                                    <thead>
                                        <tr>
                                            <th>Delivery ID</th>
                                            <th>Customer ID</th>
                                            <th>Products</th>
                                            <th>Total Qty</th>
                                            <th>Total Price</th>
                                            <th>Delivery Address</th>
                                            <th>Completed</th>
                                            <th>Update Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.map(order => (
                                            <tr key={order.order_id} className={order.is_completed ? 'completed-row' : ''}>
                                                <td>
                                                    <div className="pm-delivery-id">
                                                        <strong>#{order.order_id}</strong>
                                                        <button
                                                            className="pm-invoice-link"
                                                            onClick={() => handleDownloadInvoice(order.order_id, order.invoice_number)}
                                                            title="Click to download invoice PDF"
                                                        >
                                                            📄 {order.invoice_number}
                                                        </button>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="pm-customer-info">
                                                        <strong>#{order.user_id}</strong>
                                                        <small>{order.customer_name || order.user_email}</small>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="pm-products-cell">
                                                        {order.items && order.items.length > 0 ? (
                                                            order.items.map((item, idx) => (
                                                                <div key={idx} className="pm-product-item">
                                                                    <span className="pm-product-id">#{item.product_id}</span>
                                                                    <span className="pm-product-name">{item.product_name}</span>
                                                                    <span className="pm-product-qty">×{item.quantity}</span>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <span className="pm-no-items">No items</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="pm-qty-cell">
                                                    <strong>{order.total_quantity || order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0}</strong>
                                                </td>
                                                <td className="pm-price-cell">
                                                    <strong>{order.total_price?.toLocaleString('tr-TR')} TL</strong>
                                                </td>
                                                <td className="pm-address-cell">
                                                    {order.delivery_address || 'N/A'}
                                                </td>
                                                <td>
                                                    <span className={`pm-completed-badge ${order.is_completed || order.status === 'delivered' ? 'yes' : 'no'}`}>
                                                        {order.is_completed || order.status === 'delivered' ? '✅ Yes' : '⏳ No'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <select
                                                        value={order.status}
                                                        onChange={(e) => handleUpdateOrderStatus(order.order_id, e.target.value)}
                                                        className="pm-status-select"
                                                    >
                                                        <option value="processing">Processing</option>
                                                        <option value="in_transit">In Transit</option>
                                                        <option value="delivered">Delivered</option>
                                                    </select>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* =============== COMMENTS TAB =============== */}
            {activeTab === 'comments' && (
                <div className="pm-tab-content">
                    <div className="pm-card">
                        <div className="pm-card-header">
                            <h2>💬 Pending Comments</h2>
                            <span className="pm-badge">{pendingComments.length} pending</span>
                        </div>

                        {commentsLoading ? (
                            <div className="pm-loading">Loading comments...</div>
                        ) : pendingComments.length === 0 ? (
                            <div className="pm-empty-state">
                                <div className="pm-empty-icon">✅</div>
                                <h3>No Pending Comments</h3>
                                <p>All comments have been reviewed.</p>
                            </div>
                        ) : (
                            <div className="pm-comments-list">
                                {pendingComments.map(comment => (
                                    <div key={comment.id} className="pm-comment-card">
                                        <div className="pm-comment-header">
                                            <span className="pm-comment-product">{comment.product_name || 'Product'}</span>
                                            <span className="pm-comment-user">by {comment.user_name || 'User'}</span>
                                        </div>
                                        <p className="pm-comment-text">{comment.comment}</p>
                                        <div className="pm-comment-actions">
                                            <button
                                                className="pm-approve-btn"
                                                onClick={() => handleApproveComment(comment.id)}
                                            >
                                                ✅ Approve
                                            </button>
                                            <button
                                                className="pm-reject-btn"
                                                onClick={() => handleRejectComment(comment.id)}
                                            >
                                                ❌ Reject
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* =============== PRODUCT MODAL =============== */}
            {showProductModal && (
                <div className="pm-modal-overlay" onClick={() => setShowProductModal(false)}>
                    <div className="pm-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>{editingProduct ? '✏️ Edit Product' : '➕ Add Product'}</h3>
                        <form onSubmit={handleProductSubmit}>
                            <div className="pm-form-grid">
                                <div className="pm-form-group">
                                    <label>Name *</label>
                                    <input
                                        type="text"
                                        value={productForm.name}
                                        onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="pm-form-group">
                                    <label>Category *</label>
                                    <select
                                        value={productForm.category}
                                        onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                                        required
                                    >
                                        <option value="">Select category</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="pm-form-group">
                                    <label>Price *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={productForm.price}
                                        onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="pm-form-group">
                                    <label>Cost (default 50% of price)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={productForm.cost}
                                        onChange={(e) => setProductForm({ ...productForm, cost: e.target.value })}
                                        placeholder="Auto-calculated if empty"
                                    />
                                </div>
                                <div className="pm-form-group">
                                    <label>Stock *</label>
                                    <input
                                        type="number"
                                        value={productForm.quantity_in_stock}
                                        onChange={(e) => setProductForm({ ...productForm, quantity_in_stock: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="pm-form-group">
                                    <label>Model</label>
                                    <input
                                        type="text"
                                        value={productForm.model}
                                        onChange={(e) => setProductForm({ ...productForm, model: e.target.value })}
                                    />
                                </div>
                                <div className="pm-form-group full-width">
                                    <label>Description</label>
                                    <textarea
                                        value={productForm.description}
                                        onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                                        rows="3"
                                    />
                                </div>
                                <div className="pm-form-group full-width">
                                    <label>Product Image</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="pm-file-input"
                                    />
                                    {imagePreview && (
                                        <div className="pm-image-preview">
                                            <img src={imagePreview} alt="Preview" />
                                            <button
                                                type="button"
                                                className="pm-remove-image"
                                                onClick={() => { setProductImage(null); setImagePreview(null); }}
                                            >
                                                ✕ Remove
                                            </button>
                                        </div>
                                    )}
                                    {editingProduct && editingProduct.image && !imagePreview && (
                                        <div className="pm-image-preview">
                                            <p>Current image:</p>
                                            <img src={editingProduct.image} alt="Current" />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="pm-modal-actions">
                                <button type="button" className="pm-cancel-btn" onClick={() => setShowProductModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="pm-submit-btn">
                                    {editingProduct ? 'Update Product' : 'Add Product'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* =============== CATEGORY MODAL =============== */}
            {showCategoryModal && (
                <div className="pm-modal-overlay" onClick={() => setShowCategoryModal(false)}>
                    <div className="pm-modal pm-modal-small" onClick={(e) => e.stopPropagation()}>
                        <h3>{editingCategory ? '✏️ Edit Category' : '➕ Add Category'}</h3>
                        <form onSubmit={handleCategorySubmit}>
                            <div className="pm-form-group">
                                <label>Category Name *</label>
                                <input
                                    type="text"
                                    value={categoryForm.name}
                                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="pm-form-group">
                                <label>Description</label>
                                <textarea
                                    value={categoryForm.description}
                                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                                    rows="3"
                                />
                            </div>
                            <div className="pm-modal-actions">
                                <button type="button" className="pm-cancel-btn" onClick={() => setShowCategoryModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="pm-submit-btn">
                                    {editingCategory ? 'Update Category' : 'Add Category'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductManagerDashboard;
