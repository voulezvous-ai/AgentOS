// ...existing code before consolidation...

// Função de conexão consolidada (exemplo combinando lógicas de ambos os arquivos)
function connect(url, options = {}) {
	// ...existing code from webSocketService.js...
	// ... Código unificado do voxWebSocket.js (ex.: tratamento específico ou callbacks) ...
	console.log("Conectando ao WebSocket em", url);
	// ...existing code...
}

// Função para enviar mensagem
function sendMessage(message) {
	// ...existing code...
}

// Função para fechar conexão
function disconnect() {
	// ...existing code...
}

// Exportação das funções consolidadas
export { connect, sendMessage, disconnect };

// ...existing code after consolidation...
