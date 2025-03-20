
const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  customerId: { type: String, required: true },
  courierId: { type: String, required: true },
  status: { type: String, enum: ['Pendente', 'Em Rota', 'Entregue'], default: 'Pendente' },
  deliveryQueue: { type: Array, default: [] }, // Lista de até 5 entregas na rota
  estimatedArrival: { type: Number, default: 0 } // Estimativa de minutos até a chegada
});

const Order = mongoose.model('Order', OrderSchema);
module.exports = { Order };
