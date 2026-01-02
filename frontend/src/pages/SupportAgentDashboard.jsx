import React, { useState, useEffect, useRef } from 'react';
import './SupportAgentDashboard.css';
import { apiService } from '../services/apiService';

const SupportAgentDashboard = () => {
    const [conversations, setConversations] = useState([]);
    const [filter, setFilter] = useState('active'); // active, pending, closed
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [customerInfo, setCustomerInfo] = useState(null);
    const ws = useRef(null);
    const messagesEndRef = useRef(null);

    // Initial Load
    useEffect(() => {
        fetchConversations();
    }, [filter]);

    // WebSocket Connection for Active Chat
    useEffect(() => {
        if (activeChat) {
            // Disconnect previous
            if (ws.current) ws.current.close();

            // Connect to specific customer chat channel
            // Note: In real app, might need a distinct auth token or room ID in URL
            // ws://127.0.0.1:8000/ws/support/chat/<room_name>/
            ws.current = new WebSocket(`ws://127.0.0.1:8000/ws/support/chat/${activeChat.room_name}/`);

            ws.current.onopen = () => console.log('Support Agent Connected');

            ws.current.onmessage = (event) => {
                const data = JSON.parse(event.data);
                setMessages((prev) => [...prev, data]);
            };

            ws.current.onclose = () => console.log('Support Agent Disconnected');

            // Fetch previous messages (if API exists) or rely on WS history
            // For now, assume empty or WS sends history on connect
        }

        return () => {
            if (ws.current) ws.current.close();
        };
    }, [activeChat]);

    // Fetch Customer Details when active chat changes
    useEffect(() => {
        if (activeChat && activeChat.user_id) {
            fetchCustomerInfo(activeChat.user_id);
        } else {
            setCustomerInfo(null);
        }
    }, [activeChat]);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchConversations = async () => {
        try {
            // Mock data if backend not ready, or use API
            // const data = await apiService.getSupportConversations(filter);
            // setConversations(data);

            // MOCK DATA FOR DEMO
            const mockData = [
                { id: 1, user_id: 101, customer_name: 'John Doe', last_message: 'Where is my order?', time: '10:30 AM', room_name: 'room_101', status: 'active' },
                { id: 2, user_id: 102, customer_name: 'Jane Smith', last_message: 'Refund request please', time: '09:15 AM', room_name: 'room_102', status: 'active' },
                { id: 3, user_id: 103, customer_name: 'Ali Veli', last_message: 'Thank you!', time: 'Yesterday', room_name: 'room_103', status: 'closed' },
            ];
            setConversations(mockData.filter(c => c.status === filter));

        } catch (error) {
            console.error('Failed to fetch conversations', error);
        }
    };

    const fetchCustomerInfo = async (userId) => {
        try {
            // const data = await apiService.getCustomerDetails(userId);
            // setCustomerInfo(data);

            // MOCK DATA
            setCustomerInfo({
                name: activeChat.customer_name,
                email: 'customer@example.com',
                orders: [
                    { id: 5501, date: '2024-01-01', total: '150.00 TL', status: 'processing' },
                    { id: 5400, date: '2023-12-25', total: '1200.00 TL', status: 'delivered' },
                ],
                cart_count: 2,
                wishlist_count: 5
            });
        } catch (error) {
            console.error('Failed to fetch customer info', error);
        }
    };

    const handleSendMessage = () => {
        if (!inputText.trim() || !ws.current) return;

        const msgData = {
            message: inputText,
            sender: 'agent', // or user ID
            timestamp: new Date().toISOString() // mostly for local optimistic UI if needed
        };

        ws.current.send(JSON.stringify(msgData));

        // Optimistic update
        setMessages(prev => [...prev, { ...msgData, type: 'sent' }]);
        setInputText('');
    };

    const handleResolveChat = () => {
        alert('Chat resolved!');
        // API call to update status to 'closed'
        setConversations(prev => prev.filter(c => c.id !== activeChat.id));
        setActiveChat(null);
    };

    return (
        <div className="sa-dashboard-container">
            {/* 1. Sidebar */}
            <div className="sa-sidebar">
                <div className="sa-sidebar-header">
                    <h2>Conversations</h2>
                    <div className="sa-filter-buttons">
                        {['active', 'pending', 'closed'].map(f => (
                            <button
                                key={f}
                                className={`filter-btn ${filter === f ? 'active' : ''}`}
                                onClick={() => setFilter(f)}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="sa-conversation-list">
                    {conversations.map(conv => (
                        <div
                            key={conv.id}
                            className={`conversation-item ${activeChat?.id === conv.id ? 'active' : ''}`}
                            onClick={() => setActiveChat(conv)}
                        >
                            <div className="conversation-header">
                                <span className="customer-name">{conv.customer_name}</span>
                                <span className="time">{conv.time}</span>
                            </div>
                            <div className="last-msg">{conv.last_message}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 2. Chat Area */}
            <div className="sa-chat-area">
                {activeChat ? (
                    <>
                        <div className="active-chat-header">
                            <h3>{activeChat.customer_name}</h3>
                            <button className="resolve-btn" onClick={handleResolveChat}>Resolve</button>
                        </div>
                        <div className="sa-messages">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`sa-message ${msg.sender === 'agent' || msg.type === 'sent' ? 'sent' : 'received'}`}>
                                    {msg.message}
                                    <div className="msg-time">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="sa-input-area">
                            <input
                                type="text"
                                placeholder="Type your reply..."
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            />
                            <button className="sa-send-btn" onClick={handleSendMessage}>➤</button>
                        </div>
                    </>
                ) : (
                    <div className="chat-empty-state">Select a conversation to start chatting</div>
                )}
            </div>

            {/* 3. Customer Info Panel */}
            <div className="sa-info-panel">
                <div className="info-section">
                    <h3>Customer Details</h3>
                    {customerInfo ? (
                        <>
                            <div className="info-row"><span className="label">Name:</span> <span className="value">{customerInfo.name}</span></div>
                            <div className="info-row"><span className="label">Email:</span> <span className="value">{customerInfo.email}</span></div>
                            <div className="info-row" style={{ marginTop: '10px' }}><span className="label">In Cart:</span> <span className="value">{customerInfo.cart_count} items</span></div>
                            <div className="info-row"><span className="label">Wishlist:</span> <span className="value">{customerInfo.wishlist_count} items</span></div>
                        </>
                    ) : <div className="empty-info">Select a chat to view details</div>}
                </div>

                <div className="info-section">
                    <h3>Recent Orders</h3>
                    {customerInfo?.orders ? (
                        customerInfo.orders.map(order => (
                            <div key={order.id} className="info-card">
                                <div className="info-row"><span className="label">Order #{order.id}</span> <span className="value">{order.date}</span></div>
                                <div className="info-row"><span className="label">Total:</span> <span className="value">{order.total}</span></div>
                                <div className="info-row"><span className={`value status-badge ${order.status}`}>{order.status}</span></div>
                            </div>
                        ))
                    ) : <div className="empty-info">No orders found</div>}
                </div>
            </div>
        </div>
    );
};

export default SupportAgentDashboard;
