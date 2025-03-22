
const generateTrackingLink = (orderId, userType) => {
  const baseTrackingURL = process.env.TRACKING_URL || 'http://localhost:3000/track';
  return `${baseTrackingURL}/${orderId}?type=${userType}`;
};

/**
 * Obtém os detalhes do pedido e gera os links de rastreamento.
 */
async function getOrderDetailsHandler(req, res, next) {
  try {
    const { orderId } = req.params;
    const order = await getOrderById(orderId);

    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    const trackingLinks = {
      customer: generateTrackingLink(orderId, 'customer'),
      courier: generateTrackingLink(orderId, 'courier')
    };

    res.json({ ...order.toObject(), trackingLinks });
  } catch (error) {
    console.error('Erro ao obter detalhes do pedido:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
}

module.exports = { getOrderDetailsHandler };
