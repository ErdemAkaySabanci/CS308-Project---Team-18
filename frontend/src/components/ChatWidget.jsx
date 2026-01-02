import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import './ChatWidget.css';
import { apiService } from '../services/apiService';
import { authService } from '../services/authService';

const ChatWidget = () => {
    const location = useLocation();

    // Hide chat on admin dashboard
    // We check isOpen inside return, but better to return null early
    const shouldHide = location.pathname.startsWith('/admin-dashboard') || location.pathname.startsWith('/support-dashboard');

    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [conversationId, setConversationId] = useState(null);
    const [loading, setLoading] = useState(false);
    const ws = useRef(null);
    const messagesEndRef = useRef(null);

    // Create or get existing conversation
    useEffect(() => {
        if (isOpen && !conversationId) {
            initializeConversation();
        }
    }, [isOpen]);

    // WebSocket connection
    useEffect(() => {
        if (conversationId) {
            // Connect WebSocket
            ws.current = new WebSocket(`ws://127.0.0.1:8000/ws/chat/${conversationId}/`);

            ws.current.onopen = () => console.log('Customer connected to chat');

            ws.current.onmessage = (event) => {
                const data = JSON.parse(event.data);
                setMessages(prev => [...prev, data]);
            };

            ws.current.onclose = () => console.log('Customer disconnected from chat');

            // Fetch existing messages
            fetchMessages();
        }

        return () => {
            if (ws.current) ws.current.close();
        };
    }, [conversationId]);

    // Auto scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const initializeConversation = async () => {
        setLoading(true);
        try {
            const sessionKey = getOrCreateSessionKey();
            const data = await apiService.createConversation(sessionKey);
            if (data) {
                setConversationId(data.id);
            }
        } catch (error) {
            console.error('Failed to create conversation', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async () => {
        try {
            const data = await apiService.getChatMessages(conversationId);
            if (data) {
                setMessages(data);
            }
        } catch (error) {
            console.error('Failed to fetch messages', error);
        }
    };

    const getOrCreateSessionKey = () => {
        const user = authService.getCurrentUser();

        // If logged in, use user-specific session key
        if (user) {
            return `user_${user.id}_${user.email}`;
        }

        // For guests, use random session key
        let sessionKey = localStorage.getItem('chat_session_key');
        if (!sessionKey) {
            sessionKey = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('chat_session_key', sessionKey);
        }
        return sessionKey;
    };

    const handleSendMessage = async () => {
        if (!inputText.trim() || !conversationId) return;

        const messageText = inputText;
        setInputText('');

        try {
            const newMessage = await apiService.sendChatMessage(conversationId, messageText);
            if (newMessage) {
                setMessages(prev => [...prev, newMessage]);
            }
        } catch (error) {
            console.error('Failed to send message', error);
            // Optimistic UI - add message anyway
            setMessages(prev => [...prev, {
                message: messageText,
                is_customer: true,
                created_at: new Date().toISOString()
            }]);
        }
    };

    const formatTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    };

    if (shouldHide) return null;

    return (
        <>
            {/* Floating Button */}
            {!isOpen && (
                <button
                    className="chat-widget-button"
                    onClick={() => setIsOpen(true)}
                    title="Canlı Destek"
                >
                    💬
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="chat-widget-window">
                    <div className="chat-widget-header">
                        <div className="header-info">
                            <span className="header-icon">💬</span>
                            <div>
                                <h4>Canlı Destek</h4>
                                <p className="header-status">🟢 Online</p>
                            </div>
                        </div>
                        <button
                            className="close-btn"
                            onClick={() => setIsOpen(false)}
                        >
                            ✕
                        </button>
                    </div>

                    <div className="chat-widget-messages">
                        {loading ? (
                            <div className="loading-message">Bağlanıyor...</div>
                        ) : messages.length === 0 ? (
                            <div className="welcome-message">
                                <span className="welcome-icon">👋</span>
                                <p>Merhaba! Size nasıl yardımcı olabiliriz?</p>
                            </div>
                        ) : (
                            messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`chat-message ${msg.is_customer ? 'customer' : 'agent'}`}
                                >
                                    <div className="message-bubble">
                                        {msg.message}
                                        <div className="message-time">{formatTime(msg.created_at)}</div>
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="chat-widget-input">
                        <input
                            type="text"
                            placeholder="Mesajınızı yazın..."
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            disabled={loading || !conversationId}
                        />
                        <button
                            className="send-btn"
                            onClick={handleSendMessage}
                            disabled={!inputText.trim() || loading || !conversationId}
                        >
                            ➤
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default ChatWidget;
