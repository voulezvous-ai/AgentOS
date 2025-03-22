import WebSocketService from './webSocketService';

// Instância dedicada para o VOX, substituindo o antigo voxWebSocket.js
export const voxWebSocketService = new WebSocketService({
	endpoint: '/api/vox/ws',
	autoConnect: true,
	onMessage: (message) => {
		// ...existing code...
		console.log('Mensagem recebida no VOX:', message);
		// ...existing code...
	},
	onConnect: () => {
		// ...existing code...
		console.log('Conectado ao VOX WebSocket');
		// ...existing code...
	},
	onDisconnect: () => {
		// ...existing code...
		console.log('Desconectado do VOX WebSocket');
		// ...existing code...
	}
});
