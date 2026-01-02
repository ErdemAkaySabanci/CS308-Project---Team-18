import { useState, useEffect, useRef, useCallback } from 'react';

export const useWebSocket = (url, options = {}) => {
    const {
        onOpen,
        onClose,
        onMessage,
        onError,
        reconnectAttempts = 5,
        reconnectInterval = 3000,
        autoConnect = true
    } = options;

    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState(null);
    const ws = useRef(null);
    const reconnectCount = useRef(0);
    const reconnectTimer = useRef(null);
    const shouldReconnect = useRef(autoConnect);

    const connect = useCallback(() => {
        if (!url) return;

        // Close existing connection if any
        if (ws.current) {
            ws.current.close();
            ws.current = null;
        }

        try {
            const socket = new WebSocket(url);
            ws.current = socket;

            socket.onopen = (event) => {
                console.log(`WebSocket Connected: ${url}`);
                setIsConnected(true);
                reconnectCount.current = 0;
                if (onOpen) onOpen(event);
            };

            socket.onclose = (event) => {
                console.log(`WebSocket Disconnected: ${url}`);
                setIsConnected(false);
                if (onClose) onClose(event);

                // Attempt reconnection
                if (shouldReconnect.current && reconnectCount.current < reconnectAttempts) {
                    reconnectTimer.current = setTimeout(() => {
                        console.log(`Reconnecting... Attempt ${reconnectCount.current + 1}`);
                        reconnectCount.current += 1;
                        connect();
                    }, reconnectInterval);
                }
            };

            socket.onerror = (event) => {
                console.error('WebSocket Error:', event);
                if (onError) onError(event);
            };

            socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                setLastMessage(data);
                if (onMessage) onMessage(data);
            };

        } catch (error) {
            console.error('WebSocket Connection Failed:', error);
            setIsConnected(false);
        }
    }, [url, onOpen, onClose, onMessage, onError, reconnectAttempts, reconnectInterval]);

    useEffect(() => {
        if (autoConnect) {
            connect();
        }

        return () => {
            shouldReconnect.current = false;
            if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
            if (ws.current) ws.current.close();
        };
    }, [connect, autoConnect]);

    const sendMessage = useCallback((data) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify(data));
            return true;
        }
        console.warn('WebSocket is not connected. Message not sent.');
        return false;
    }, []);

    const sendTyping = useCallback(() => {
        sendMessage({ type: 'typing' });
    }, [sendMessage]);

    return {
        isConnected,
        lastMessage,
        sendMessage,
        sendTyping,
        connect, // Expose manual connect if needed
        ws: ws.current
    };
};

export default useWebSocket;
