import React, { useState, useEffect } from "react";
import { apiService } from "../services/apiService";
import { authService } from "../services/authService";
import { useNavigate } from "react-router-dom";

const ProductManagerDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("products");
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState({ type: "", text: "" });

    // Data states
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [deliveries, setDeliveries] = useState([]);

    // Modal/Form states
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState("create"); // create or edit
    const [currentItem, setCurrentItem] = useState(null);

    // Initial check and load
    useEffect(() => {
        const user = authService.getUser();
        if (!user || user.role !== "product_manager") {
            // navigate("/dashboard"); 
            // In a real app we might redirect, but for dev we might be lax or strict.
            // Following plan: strict.
            if (user?.role !== "sales_manager") { // Shared access for some parts? No, strict PM.
                // Actually orders/deliveries shared w/ sales. 
                // But dashboard is PM specific.
            }
        }
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === "products") {
                const data = await apiService.getAllProducts();
                setProducts(data || []);
            } else if (activeTab === "categories") {
                const data = await apiService.getCategories();
                setCategories(data || []);
            } else if (activeTab === "comments") {
                const data = await apiService.getPendingReviews();
                setReviews(data || []);
            } else if (activeTab === "deliveries") {
                const data = await apiService.getDeliveries();
                setDeliveries(data?.results || data || []);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            setMsg({ type: "error", text: "Failed to load data." });
        } finally {
            setLoading(false);
        }
    };

    // ----------------------
    // Handlers: Products
    // ----------------------
    const handleSaveProduct = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        // Fix checkbox
        data.is_active = formData.get("is_active") === "on";

        try {
            if (modalMode === "create") {
                await apiService.createProduct(data);
                setMsg({ type: "success", text: "Product created." });
            } else {
                await apiService.updateProduct(currentItem.id, data);
                setMsg({ type: "success", text: "Product updated." });
            }
            setShowModal(false);
            fetchData();
        } catch (error) {
            setMsg({ type: "error", text: "Operation failed." });
        }
    };

    const handleDeleteProduct = async (id) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            await apiService.deleteProduct(id);
            setMsg({ type: "success", text: "Product deleted." });
            fetchData();
        } catch (error) {
            setMsg({ type: "error", text: "Delete failed." });
        }
    };

    // ----------------------
    // Handlers: Categories
    // ----------------------
    const handleSaveCategory = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        try {
            if (modalMode === "create") {
                await apiService.createCategory(data);
                setMsg({ type: "success", text: "Category created." });
            } else {
                await apiService.updateCategory(currentItem.id, data);
                setMsg({ type: "success", text: "Category updated." });
            }
            setShowModal(false);
            fetchData();
        } catch (error) {
            setMsg({ type: "error", text: "Operation failed." });
        }
    };

    const handleDeleteCategory = async (id) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            await apiService.deleteCategory(id);
            setMsg({ type: "success", text: "Category deleted." });
            fetchData();
        } catch (error) {
            setMsg({ type: "error", text: "Delete failed. Category might have products." });
        }
    };

    // ----------------------
    // Handlers: Comments
    // ----------------------
    const handleReviewAction = async (id, action) => {
        try {
            await apiService.approveReview(id, action);
            setMsg({ type: "success", text: `Review ${action}d.` });
            fetchData();
        } catch (error) {
            setMsg({ type: "error", text: "Action failed." });
        }
    };

    // ----------------------
    // Handlers: Deliveries
    // ----------------------
    const handleDeliveryStatus = async (id, status) => {
        try {
            await apiService.updateOrderStatus(id, status);
            setMsg({ type: "success", text: "Order status updated." });
            fetchData();
        } catch (error) {
            setMsg({ type: "error", text: "Update failed." });
        }
    };

    // ----------------------
    // Render Helpers
    // ----------------------
    const openModal = (mode, item = null) => {
        setModalMode(mode);
        setCurrentItem(item);
        setShowModal(true);
    };

    return (
        <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
            <h1 style={{ marginBottom: "2rem", color: "#333" }}>Product Manager Dashboard</h1>

            {msg.text && (
                <div style={{
                    padding: "1rem",
                    marginBottom: "1rem",
                    borderRadius: "4px",
                    backgroundColor: msg.type === "error" ? "#fee2e2" : "#dcfce7",
                    color: msg.type === "error" ? "#991b1b" : "#166534"
                }}>
                    {msg.text}
                </div>
            )}

            {/* Tabs */}
            <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", borderBottom: "1px solid #ddd" }}>
                {["products", "categories", "comments", "deliveries"].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: "0.5rem 1rem",
                            border: "none",
                            background: "none",
                            cursor: "pointer",
                            fontSize: "1.1rem",
                            borderBottom: activeTab === tab ? "3px solid #6a11cb" : "3px solid transparent",
                            color: activeTab === tab ? "#6a11cb" : "#666",
                            fontWeight: activeTab === tab ? "bold" : "normal"
                        }}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {loading ? <p>Loading...</p> : (
                <div style={{ background: "white", padding: "1rem", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>

                    {/* PRODUCTS TAB */}
                    {activeTab === "products" && (
                        <div>
                            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
                                <button
                                    onClick={() => openModal("create")}
                                    style={{
                                        padding: "0.5rem 1rem",
                                        background: "#2563eb",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "4px",
                                        cursor: "pointer"
                                    }}
                                >
                                    + Add Product
                                </button>
                            </div>
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead>
                                    <tr style={{ textAlign: "left", borderBottom: "2px solid #eee" }}>
                                        <th style={{ padding: "1rem" }}>Name</th>
                                        <th style={{ padding: "1rem" }}>Price</th>
                                        <th style={{ padding: "1rem" }}>Stock</th>
                                        <th style={{ padding: "1rem" }}>Active</th>
                                        <th style={{ padding: "1rem" }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map(p => (
                                        <tr key={p.id} style={{ borderBottom: "1px solid #eee" }}>
                                            <td style={{ padding: "1rem" }}>{p.name} <small style={{ color: "#888" }}>({p.product_id})</small></td>
                                            <td style={{ padding: "1rem" }}>{p.price} TL</td>
                                            <td style={{ padding: "1rem" }}>{p.quantity_in_stock}</td>
                                            <td style={{ padding: "1rem" }}>
                                                <span style={{
                                                    padding: "0.2rem 0.6rem",
                                                    borderRadius: "999px",
                                                    fontSize: "0.8rem",
                                                    background: p.is_active ? "#dcfce7" : "#fee2e2",
                                                    color: p.is_active ? "#166534" : "#991b1b"
                                                }}>
                                                    {p.is_active ? "Active" : "Inactive"}
                                                </span>
                                            </td>
                                            <td style={{ padding: "1rem" }}>
                                                <button onClick={() => openModal("edit", p)} style={{ marginRight: "0.5rem", cursor: "pointer" }}>Edit</button>
                                                <button onClick={() => handleDeleteProduct(p.id)} style={{ color: "red", cursor: "pointer" }}>Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* CATEGORIES TAB */}
                    {activeTab === "categories" && (
                        <div>
                            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
                                <button
                                    onClick={() => openModal("create")}
                                    style={{
                                        padding: "0.5rem 1rem",
                                        background: "#2563eb",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "4px",
                                        cursor: "pointer"
                                    }}
                                >
                                    + Add Category
                                </button>
                            </div>
                            <ul style={{ listStyle: "none", padding: 0 }}>
                                {categories.map(c => (
                                    <li key={c.id} style={{ padding: "1rem", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <span><strong>{c.name}</strong> - {c.description}</span>
                                        <div>
                                            <button onClick={() => openModal("edit", c)} style={{ marginRight: "0.5rem", cursor: "pointer" }}>Edit</button>
                                            <button onClick={() => handleDeleteCategory(c.id)} style={{ color: "red", cursor: "pointer" }}>Delete</button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* COMMENTS TAB */}
                    {activeTab === "comments" && (
                        <div>
                            {reviews.length === 0 ? <p>No pending reviews.</p> : (
                                <ul style={{ listStyle: "none", padding: 0 }}>
                                    {reviews.map(r => (
                                        <li key={r.id} style={{ padding: "1rem", borderBottom: "1px solid #eee" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                                                <strong>Product ID: {r.product}</strong>
                                                <span>Rating: {r.rating} / 5</span>
                                            </div>
                                            <p style={{ background: "#f9f9f9", padding: "1rem", borderRadius: "4px" }}>"{r.comment}"</p>
                                            <div style={{ marginTop: "1rem" }}>
                                                <button onClick={() => handleReviewAction(r.id, "approve")} style={{ marginRight: "1rem", background: "#dcfce7", color: "#166534", border: "none", padding: "0.5rem 1rem", borderRadius: "4px", cursor: "pointer" }}>Approve</button>
                                                <button onClick={() => handleReviewAction(r.id, "reject")} style={{ background: "#fee2e2", color: "#991b1b", border: "none", padding: "0.5rem 1rem", borderRadius: "4px", cursor: "pointer" }}>Reject</button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}

                    {/* DELIVERIES TAB */}
                    {activeTab === "deliveries" && (
                        <div>
                            {deliveries.length === 0 ? <p>No active deliveries.</p> : (
                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <thead>
                                        <tr style={{ textAlign: "left", borderBottom: "2px solid #eee" }}>
                                            <th style={{ padding: "1rem" }}>Order ID</th>
                                            <th style={{ padding: "1rem" }}>Customer</th>
                                            <th style={{ padding: "1rem" }}>Address</th>
                                            <th style={{ padding: "1rem" }}>Status</th>
                                            <th style={{ padding: "1rem" }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {deliveries.map(d => (
                                            <tr key={d.id} style={{ borderBottom: "1px solid #eee" }}>
                                                <td style={{ padding: "1rem" }}>#{d.id}</td>
                                                <td style={{ padding: "1rem" }}>{d.user} (ID)</td>
                                                <td style={{ padding: "1rem" }}>{d.delivery_address}</td>
                                                <td style={{ padding: "1rem" }}>
                                                    <span style={{
                                                        padding: "0.2rem 0.6rem",
                                                        borderRadius: "999px",
                                                        fontSize: "0.8rem",
                                                        background: d.status === "processing" ? "#fef3c7" : "#dbeafe",
                                                        color: d.status === "processing" ? "#92400e" : "#1e40af"
                                                    }}>
                                                        {d.status}
                                                    </span>
                                                </td>
                                                <td style={{ padding: "1rem" }}>
                                                    {d.status === "processing" && (
                                                        <button
                                                            onClick={() => handleDeliveryStatus(d.id, "in_transit")}
                                                            style={{ background: "#2563eb", color: "white", border: "none", padding: "0.5rem", borderRadius: "4px", cursor: "pointer" }}
                                                        >
                                                            Mark In-Transit
                                                        </button>
                                                    )}
                                                    {d.status === "in_transit" && (
                                                        <button
                                                            onClick={() => handleDeliveryStatus(d.id, "delivered")}
                                                            style={{ background: "#166534", color: "white", border: "none", padding: "0.5rem", borderRadius: "4px", cursor: "pointer" }}
                                                        >
                                                            Mark Delivered
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}

                </div>
            )}

            {/* MODAL */}
            {showModal && (
                <div style={{
                    position: "fixed",
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: "rgba(0,0,0,0.5)",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    zIndex: 1000
                }}>
                    <div style={{ background: "white", padding: "2rem", borderRadius: "8px", width: "500px", maxWidth: "90%", maxHeight: "90vh", overflowY: "auto" }}>
                        <h2>{modalMode === "create" ? "Create" : "Edit"} {activeTab === "products" ? "Product" : "Category"}</h2>

                        {activeTab === "products" ? (
                            <form onSubmit={handleSaveProduct} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                <input name="name" placeholder="Name" defaultValue={currentItem?.name} required style={{ padding: "0.5rem" }} />
                                <input name="product_id" placeholder="Product ID" defaultValue={currentItem?.product_id} required style={{ padding: "0.5rem" }} />
                                <input name="model" placeholder="Model" defaultValue={currentItem?.model} required style={{ padding: "0.5rem" }} />
                                <input name="serial_number" placeholder="Serial Number" defaultValue={currentItem?.serial_number} required style={{ padding: "0.5rem" }} />
                                <textarea name="description" placeholder="Description" defaultValue={currentItem?.description} required style={{ padding: "0.5rem" }} />
                                <input type="number" name="price" placeholder="Price" step="0.01" defaultValue={currentItem?.price} required style={{ padding: "0.5rem" }} />
                                <input type="number" name="quantity_in_stock" placeholder="Stock" defaultValue={currentItem?.quantity_in_stock} required style={{ padding: "0.5rem" }} />
                                <input type="text" name="distributor" placeholder="Distributor" defaultValue={currentItem?.distributor || "Default"} required style={{ padding: "0.5rem" }} />
                                <input type="text" name="warranty_status" placeholder="Warranty" defaultValue={currentItem?.warranty_status || "2 years"} required style={{ padding: "0.5rem" }} />

                                {/* Category selection requires categories loaded - might need to fetch if not active tab */}
                                {/* Simplified: User input ID or select if we loaded categories */}
                                <label>Category ID: <input type="number" name="category" defaultValue={currentItem?.category || 1} required /></label>

                                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <input type="checkbox" name="is_active" defaultChecked={currentItem?.is_active ?? true} />
                                    Active
                                </label>

                                <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                                    <button type="submit" style={{ flex: 1, padding: "0.5rem", background: "#2563eb", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>Save</button>
                                    <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: "0.5rem", background: "#ccc", border: "none", borderRadius: "4px", cursor: "pointer" }}>Cancel</button>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleSaveCategory} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                <input name="name" placeholder="Name" defaultValue={currentItem?.name} required style={{ padding: "0.5rem" }} />
                                <textarea name="description" placeholder="Description" defaultValue={currentItem?.description} style={{ padding: "0.5rem" }} />

                                <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                                    <button type="submit" style={{ flex: 1, padding: "0.5rem", background: "#2563eb", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>Save</button>
                                    <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: "0.5rem", background: "#ccc", border: "none", borderRadius: "4px", cursor: "pointer" }}>Cancel</button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductManagerDashboard;
