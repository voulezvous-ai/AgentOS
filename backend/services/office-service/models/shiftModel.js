import mongoose from 'mongoose';

const ShiftSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  startTime: { type: String, required: true }, // Ex.: "00:00", "08:00", "16:00"
  endTime: { type: String, required: true },
  role: { type: String, enum: ['chefe', 'estafeta'], required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Person' },
  status: { type: String, enum: ['agendado', 'encerrado', 'pendente'], default: 'agendado' }
}, { timestamps: true });

export default mongoose.model('Shift', ShiftSchema);