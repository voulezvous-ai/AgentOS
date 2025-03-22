// Move this file to /services/webSocketService.js

class WebSocketService {
    constructor() {
        this.connections = new Map();
    }

    connect(url, options) {
        // Consolidar lógica de conexão do voxWebSocket.js
        const ws = new WebSocket(url, options);
        ws.onopen = () => console.log('WebSocket connected');
        ws.onmessage = (message) => console.log('Message received:', message.data);
        ws.onclose = () => console.log('WebSocket closed');
        this.connections.set(url, ws);
        return ws;
    }

    sendMessage(url, message) {
        const ws = this.connections.get(url);
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(message);
        } else {
            console.error('WebSocket is not open');
        }
    }

    closeConnection(url) {
        const ws = this.connections.get(url);
        if (ws) {
            ws.close();
            this.connections.delete(url);
        }
    }
}

module.exports = new WebSocketService();
