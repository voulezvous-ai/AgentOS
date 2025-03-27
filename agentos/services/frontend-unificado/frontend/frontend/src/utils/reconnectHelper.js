«function getReconnectDelay(reconnectAttempts) {
  // Cálculo de backoff exponencial com jitter
  const jitter = Math.random() * 0.5 + 0.5; // 0.5 a 1.0
  const baseDelay = 1000 * Math.pow(2, reconnectAttempts);
  return Math.min(baseDelay * jitter, 30000); // Máximo 30 segundos
}

export default getReconnectDelay;
