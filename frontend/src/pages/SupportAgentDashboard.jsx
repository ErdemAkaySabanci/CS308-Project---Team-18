import React, { useState, useEffect, useRef } from 'react';
import './SupportAgentDashboard.css';
import { apiService } from '../services/apiService';

const SupportAgentDashboard = () => {
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [customerInfo, setCustomerInfo] = useState(null);
    const ws = useRef(null);
    const messagesEndRef = useRef(null);

    // Initial Load - Fetch conversations from API
    useEffect(() => {
        fetchConversations();
    }, []);

    // Fetch messages when active chat changes
    useEffect(() => {
        if (activeChat) {
            fetchMessages(activeChat.id);

            // WebSocket connection (optional - for real-time)
            if (ws.current) ws.current.close();
            ws.current = new WebSocket(`ws://127.0.0.1:8000/ws/chat/${activeChat.id}/`);

            ws.current.onopen = () => console.log('WebSocket Connected');
            ws.current.onmessage = (event) => {
                const data = JSON.parse(event.data);
                setMessages((prev) => [...prev, data]);
            };
            ws.current.onclose = () => console.log('WebSocket Disconnected');
        }
        return () => {
            if (ws.current) ws.current.close();
        };
    }, [activeChat]);

    // Fetch Customer Details when active chat changes
    useEffect(() => {
        if (activeChat && activeChat.customer?.id) {
            fetchCustomerInfo(activeChat.customer.id);
        } else {
            setCustomerInfo(null);
        }
    }, [activeChat]);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchConversations = async () => {
        setLoading(true);
        try {
            const data = await apiService.getChatConversations();
            if (data) {
                setConversations(data);
            }
        } catch (error) {
            console.error('Failed to fetch conversations', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (conversationId) => {
        try {
            const data = await apiService.getChatMessages(conversationId);
            if (data) {
                setMessages(data);
            }
        } catch (error) {
            console.error('Failed to fetch messages', error);
        }
    };

    const fetchCustomerInfo = async (userId) => {
        try {
            const data = await apiService.getCustomerInfo(userId);
            if (data) {
                setCustomerInfo(data);
            }
        } catch (error) {
            console.error('Failed to fetch customer info', error);
        }
    };

    const handleClaimChat = async () => {
        if (!activeChat) return;
        try {
            await apiService.claimConversation(activeChat.id);
            alert('✅ Sohbet başarıyla alındı!');
            fetchConversations();
        } catch (error) {
            console.error('Failed to claim chat', error);
            alert('❌ Sohbet alınamadı');
        }
    };

    const handleSendMessage = async () => {
        if (!inputText.trim() || !activeChat) return;

        try {
            const newMessage = await apiService.sendChatMessage(activeChat.id, inputText);
            if (newMessage) {
                setMessages(prev => [...prev, newMessage]);
            }
            setInputText('');
        } catch (error) {
            console.error('Failed to send message', error);
        }
    };

    const handleResolveChat = async () => {
        if (!activeChat) return;

        if (!window.confirm('Bu sohbeti çözümlenmiş olarak işaretlemek istediğinize emin misiniz?')) {
            return;
        }

        try {
            await apiService.resolveConversation(activeChat.id);
            alert('✅ Sohbet çözüldü ve kapatıldı!');
            setConversations(prev => prev.filter(c => c.id !== activeChat.id));
            setActiveChat(null);
            setMessages([]);
        } catch (error) {
            console.error('Failed to resolve chat', error);
            alert('❌ Sohbet kapatılamadı');
        }
    };

    const getCustomerName = (conv) => {
        if (conv.customer) {
            const name = `${conv.customer.first_name || ''} ${conv.customer.last_name || ''}`.trim();
            return name || conv.customer.username || `User #${conv.customer.id}`;
        }
        return `Guest (${conv.session_key || 'Unknown'})`;
    };

    const formatTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="sa-dashboard-container">
            {/* 1. Sidebar */}
            <div className="sa-sidebar">
                <div className="sa-sidebar-header">
                    <h2>💬 Sohbetler</h2>
                    <button className="refresh-btn" onClick={fetchConversations}>🔄</button>
                </div>
                <div className="sa-conversation-list">
                    {loading ? (
                        <div className="loading-state">Yükleniyor...</div>
                    ) : conversations.length === 0 ? (
                        <div className="empty-state">Aktif sohbet bulunmuyor</div>
                    ) : (
                        conversations.map(conv => (
                            <div
                                key={conv.id}
                                className={`conversation-item ${activeChat?.id === conv.id ? 'active' : ''} ${!conv.is_claimed ? 'unclaimed' : ''}`}
                                onClick={() => setActiveChat(conv)}
                            >
                                <div className="conversation-header">
                                    <span className="customer-name">{getCustomerName(conv)}</span>
                                    <span className="time">{formatTime(conv.updated_at)}</span>
                                </div>
                                <div className="last-msg">
                                    {conv.last_message?.message || 'Henüz mesaj yok'}
                                </div>
                                {!conv.is_claimed && (
                                    <span className="claim-badge">Sahipsiz</span>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* 2. Chat Area */}
            <div className="sa-chat-area">
                {activeChat ? (
                    <>
                        <div className="active-chat-header">
                            <h3>{getCustomerName(activeChat)}</h3>
                            <div className="header-actions">
                                {!activeChat.is_claimed && (
                                    <button className="claim-btn" onClick={handleClaimChat}>
                                        🤚 Sahiplen
                                    </button>
                                )}
                                <button className="resolve-btn" onClick={handleResolveChat}>
                                    ✅ Çözüldü
                                </button>
                            </div>
                        </div>
                        <div className="sa-messages">
                            {messages.length === 0 ? (
                                <div className="empty-messages">Henüz mesaj yok</div>
                            ) : (
                                messages.map((msg, idx) => (
                                    <div
                                        key={idx}
                                        className={`sa-message ${msg.is_customer ? 'received' : 'sent'}`}
                                    >
                                        {msg.message}
                                        <div className="msg-time">{formatTime(msg.created_at)}</div>
                                    </div>
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="sa-input-area">
                            <input
                                type="text"
                                placeholder="Mesajınızı yazın..."
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            />
                            <button className="sa-send-btn" onClick={handleSendMessage}>➤</button>
                        </div>
                    </>
                ) : (
                    <div className="chat-empty-state">
                        <span style={{ fontSize: '48px' }}>💬</span>
                        <p>Sohbet başlatmak için sol taraftan bir konuşma seçin</p>
                    </div>
                )}
            </div>

            {/* 3. Customer Info Panel */}
            <div className="sa-info-panel">
                <div className="info-section">
                    <h3>👤 Müşteri Bilgileri</h3>
                    {customerInfo ? (
                        <>
                            <div className="info-row">
                                <span className="label">Ad:</span>
                                <span className="value">{customerInfo.name}</span>
                            </div>
                            <div className="info-row">
                                <span className="label">E-posta:</span>
                                <span className="value">{customerInfo.email}</span>
                            </div>
                            <div className="info-row" style={{ marginTop: '10px' }}>
                                <span className="label">Sepet:</span>
                                <span className="value">{customerInfo.cart_count} ürün</span>
                            </div>
                            <div className="info-row">
                                <span className="label">Favoriler:</span>
                                <span className="value">{customerInfo.wishlist_count} ürün</span>
                            </div>
                        </>
                    ) : (
                        <div className="empty-info">
                            {activeChat ?
                                (activeChat.customer ? 'Müşteri bilgisi yükleniyor...' : 'Misafir kullanıcı') :
                                'Sohbet seçin'
                            }
                        </div>
                    )}
                </div>

                <div className="info-section">
                    <h3>📦 Son Siparişler</h3>
                    {customerInfo?.orders?.length > 0 ? (
                        customerInfo.orders.map(order => (
                            <div key={order.id} className="info-card">
                                <div className="info-row">
                                    <span className="label">Sipariş #{order.id}</span>
                                    <span className="value">{order.date}</span>
                                </div>
                                <div className="info-row">
                                    <span className="label">Toplam:</span>
                                    <span className="value">{order.total} TL</span>
                                </div>
                                <div className="info-row">
                                    <span className={`value status-badge ${order.status}`}>
                                        {order.status}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="empty-info">Sipariş bulunamadı</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SupportAgentDashboard;
