
const { Order } = require('../models/Order');

/**
 * Atribui pedidos ao estafeta e define a rota automática ou manual.
 */
async function assignOrdersToCourier(req, res) {
  const { courierId, orders, autoRoute } = req.body;

  try {
    let selectedOrders = await Order.find({ orderId: { $in: orders } });

    if (autoRoute) {
      selectedOrders.sort((a, b) => {
        return a.customerId.localeCompare(b.customerId);
      });
    }

    selectedOrders.forEach((order, index) => {
      order.courierId = courierId;
      order.status = 'Em Rota';
      order.deliveryQueue = selectedOrders.map((o) => o.orderId);
      order.estimatedArrival = index * 10;
      order.save();
    });

    res.json({ message: 'Pedidos atribuídos ao estafeta.', deliveryQueue: selectedOrders.map((o) => o.orderId) });
  } catch (error) {
    console.error('Erro ao atribuir pedidos:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
}

module.exports = { assignOrdersToCourier };
