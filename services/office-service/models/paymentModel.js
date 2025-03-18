import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Person', required: true },
  shiftId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shift' },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pendente', 'pago'], default: 'pendente' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Payment', PaymentSchema);