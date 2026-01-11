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
    const [selectedFile, setSelectedFile] = useState(null);
    const [conversationId, setConversationId] = useState(null);
    const [loading, setLoading] = useState(false);
    const ws = useRef(null);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

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
    // Listen for logout event - close chat when user logs out
    useEffect(() => {
        const handleLogout = () => {
            setIsOpen(false);
            setMessages([]);
            setConversationId(null);
            if (ws.current) ws.current.close();
        };

        window.addEventListener('user-logout', handleLogout);
        return () => window.removeEventListener('user-logout', handleLogout);
    }, []);
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

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files[0]) {
            if (e.target.files[0].size > 5 * 1024 * 1024) {
                alert('File size must be less than 5MB');
                return;
            }
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleSendMessage = async () => {
        if ((!inputText.trim() && !selectedFile) || !conversationId) return;

        const messageText = inputText;
        const fileToSend = selectedFile;

        // Clear input immediately
        setInputText('');
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';

        try {
            const newMessage = await apiService.sendChatMessage(conversationId, messageText, fileToSend);
            if (newMessage) {
                setMessages(prev => [...prev, newMessage]);
            }
        } catch (error) {
            console.error('Failed to send message', error);
            // Optimistic UI - add message anyway (only text for now as file optimistic is hard)
            setMessages(prev => [...prev, {
                message: messageText,
                is_customer: true,
                created_at: new Date().toISOString(),
                // Mock attachment for optimistic UI if needed, but let's wait for server response for files
                attachment: fileToSend ? URL.createObjectURL(fileToSend) : null
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
                                        {(msg.attachment_url || msg.attachment) && (
                                            <div className="message-attachment">
                                                <a href={msg.attachment_url || msg.attachment} target="_blank" rel="noopener noreferrer">
                                                    📎 {(msg.attachment_url || msg.attachment).split('/').pop().substring(0, 20)}...
                                                </a>
                                            </div>
                                        )}
                                        {msg.message}
                                        <div className="message-time">{formatTime(msg.created_at)}</div>
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="chat-widget-input-container">
                        {selectedFile && (
                            <div className="file-preview">
                                <span>📎 {selectedFile.name}</span>
                                <button onClick={() => {
                                    setSelectedFile(null);
                                    if (fileInputRef.current) fileInputRef.current.value = '';
                                }}>✕</button>
                            </div>
                        )}
                        <div className="chat-widget-input">
                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                onChange={handleFileSelect}
                                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                            />
                            <button
                                className="attach-btn"
                                onClick={() => fileInputRef.current.click()}
                                title="Attach File"
                            >
                                📎
                            </button>
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
                                disabled={(!inputText.trim() && !selectedFile) || loading || !conversationId}
                            >
                                ➤
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ChatWidget;
