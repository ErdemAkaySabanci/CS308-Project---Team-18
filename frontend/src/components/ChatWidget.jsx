import React, { useState, useEffect, useRef } from 'react';
import './ChatWidget.css';

const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const ws = useRef(null);
    const messagesEndRef = useRef(null);

    // Auto-scroll to bottom of messages
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    // WebSocket connection
    useEffect(() => {
        if (isOpen && !ws.current) {
            // Connect specifically when the widget is opened
            // URL should be adjusted based on environment/config
            const wsUrl = `ws://127.0.0.1:8000/ws/customer-chat/`;
            ws.current = new WebSocket(wsUrl);

            ws.current.onopen = () => {
                console.log('Connected to Chat WebSocket');
            };

            ws.current.onmessage = (event) => {
                const data = JSON.parse(event.data);
                setMessages((prev) => [...prev, { ...data, type: 'received' }]);
            };

            ws.current.onclose = () => {
                console.log('Chat WebSocket disconnected');
                ws.current = null;
            };

            ws.current.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
        }

        // Cleanup on unmount or when closed (optional: keep open if desired)
        return () => {
            if (!isOpen && ws.current) {
                ws.current.close();
                ws.current = null;
            }
        };
    }, [isOpen]);

    const handleSendMessage = () => {
        if ((!inputText.trim() && !selectedFile) || !ws.current) return;

        const messageData = {
            message: inputText,
            file: selectedFile ? { name: selectedFile.name, size: selectedFile.size } : null,
            // In a real app, you might upload the file to an endpoint and send the URL, 
            // or send base64 data here. For simplicity, we're sending metadata or text.
        };

        // If file selection needs to be handled via HTTP upload mostly, 
        // we can implement a separate API call here. 
        // For now assuming the backend handles basic JSON messages.

        ws.current.send(JSON.stringify(messageData));

        setMessages((prev) => [
            ...prev,
            { message: inputText, type: 'sent', file: selectedFile ? selectedFile.name : null },
        ]);

        setInputText('');
        setSelectedFile(null);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    };

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    return (
        <div className="chat-widget-container">
            {/* Floating Button */}
            {!isOpen && (
                <button
                    className="chat-widget-button"
                    onClick={() => setIsOpen(true)}
                >
                    💬
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="chat-window">
                    {/* Header */}
                    <div className="chat-header">
                        <span>Customer Support</span>
                        <button className="close-button" onClick={() => setIsOpen(false)}>
                            ✖
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="chat-messages">
                        {messages.map((msg, index) => (
                            <div key={index} className={`message ${msg.type}`}>
                                {msg.message}
                                {msg.file && (
                                    <div className="file-attachment">
                                        📎 {msg.file}
                                    </div>
                                )}
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="chat-input-area">
                        <label htmlFor="file-upload" className="file-upload-label" title="Attach file">
                            📎
                            <input
                                id="file-upload"
                                type="file"
                                style={{ display: 'none' }}
                                onChange={handleFileSelect}
                            />
                        </label>
                        {selectedFile && <span style={{ fontSize: '10px' }}>{selectedFile.name.substring(0, 10)}...</span>}
                        <input
                            type="text"
                            className="chat-input"
                            placeholder="Type a message..."
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyPress={handleKeyPress}
                        />
                        <button className="send-button" onClick={handleSendMessage}>
                            ➤
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatWidget;
