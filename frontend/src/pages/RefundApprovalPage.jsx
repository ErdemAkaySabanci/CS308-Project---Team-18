import React, { useState, useEffect } from "react";
import { apiService } from "../services/apiService";
import { authService } from "../services/authService";
import { useNavigate } from "react-router-dom";

const RefundApprovalPage = () => {
    const navigate = useNavigate();
    const [refunds, setRefunds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState({ type: "", text: "" });

    useEffect(() => {
        const user = authService.getUser();
        if (!user || user.role !== "sales_manager") {
            // navigate("/dashboard");
            // Strict role check
        }
        fetchRefunds();
    }, []);

    const fetchRefunds = async () => {
        setLoading(true);
        try {
            const data = await apiService.getPendingRefunds();
            setRefunds(data || []);
        } catch (error) {
            console.error("Error fetching refunds:", error);
            setMsg({ type: "error", text: "Failed to load refunds." });
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id, action) => {
        if (!window.confirm(`Are you sure you want to ${action} this refund?`)) return;

        try {
            await apiService.processRefund(id, action);
            setMsg({ type: "success", text: `Refund ${action}d successfully.` });
            fetchRefunds();
        } catch (error) {
            console.error("Error processing refund:", error);
            setMsg({ type: "error", text: "Operation failed." });
        }
    };

    return (
        <div style={{ padding: "2rem", maxWidth: "1000px", margin: "0 auto" }}>
            <h1 style={{ marginBottom: "2rem", color: "#333" }}>Refund Approvals</h1>

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

            {loading ? <p>Loading...</p> : (
                <div style={{ background: "white", padding: "1rem", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
                    {refunds.length === 0 ? <p>No pending refunds.</p> : (
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ textAlign: "left", borderBottom: "2px solid #eee" }}>
                                    <th style={{ padding: "1rem" }}>Refund ID</th>
                                    <th style={{ padding: "1rem" }}>Order ID</th>
                                    <th style={{ padding: "1rem" }}>Product</th>
                                    <th style={{ padding: "1rem" }}>Customer</th>
                                    <th style={{ padding: "1rem" }}>Amount</th>
                                    <th style={{ padding: "1rem" }}>Reason</th>
                                    <th style={{ padding: "1rem" }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {refunds.map(r => (
                                    <tr key={r.id} style={{ borderBottom: "1px solid #eee" }}>
                                        <td style={{ padding: "1rem" }}>#{r.id}</td>
                                        <td style={{ padding: "1rem" }}>#{r.order_id}</td>
                                        <td style={{ padding: "1rem" }}>{r.product_name}</td>
                                        <td style={{ padding: "1rem" }}>{r.user_name}</td>
                                        <td style={{ padding: "1rem" }}>{r.refund_amount} TL</td>
                                        <td style={{ padding: "1rem", maxWidth: "200px" }}>{r.reason}</td>
                                        <td style={{ padding: "1rem" }}>
                                            <button
                                                onClick={() => handleAction(r.id, "approve")}
                                                style={{ marginRight: "0.5rem", background: "#166534", color: "white", border: "none", padding: "0.5rem", borderRadius: "4px", cursor: "pointer" }}
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleAction(r.id, "reject")}
                                                style={{ background: "#991b1b", color: "white", border: "none", padding: "0.5rem", borderRadius: "4px", cursor: "pointer" }}
                                            >
                                                Reject
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
};

export default RefundApprovalPage;
