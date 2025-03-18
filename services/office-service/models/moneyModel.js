import mongoose from 'mongoose';

const MoneySchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  initialCash: { type: Number, required: true },
  cashSales: { type: Number, default: 0 },
  expenses: { type: Number, default: 0 },
  deposit: { type: Number, default: 0 } // Valor depositado para o cofre
});

// Caixa atual: initialCash + cashSales - expenses - deposit
MoneySchema.virtual('currentCash').get(function() {
  return this.initialCash + this.cashSales - this.expenses - this.deposit;
});

export default mongoose.model('Money', MoneySchema);