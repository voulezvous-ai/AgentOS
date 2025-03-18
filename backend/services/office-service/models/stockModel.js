import mongoose from 'mongoose';

const StockSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  totalRFIDCount: { type: Number, default: 0 },
  totalSalesCount: { type: Number, default: 0 },
  status: { type: String, enum: ['ok', 'divergente'], default: 'ok' }
});

export default mongoose.model('Stock', StockSchema);