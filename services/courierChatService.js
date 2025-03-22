import WebSocketService from './webSocketService';

export const courierChatService = new WebSocketService({
	endpoint: '/api/chat/couriers',
	autoConnect: true,
	onMessage: (message) => {
		// ...existing code...
		console.log('Mensagem recebida no chat de estafetas:', message);
		// ...existing code...
	},
	onConnect: () => {
		// ...existing code...
		console.log('Conectado ao WebSocket do chat de estafetas');
		// ...existing code...
	},
	onDisconnect: () => {
		// ...existing code...
		console.log('Desconectado do WebSocket do chat de estafetas');
		// ...existing code...
	}
});
