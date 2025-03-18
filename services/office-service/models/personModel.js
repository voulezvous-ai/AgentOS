import mongoose from 'mongoose';

const PersonSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  rfid: { type: String, unique: true, sparse: true },
  role: { type: String, enum: ['chefe', 'estafeta'], required: true },
  accountNumber: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Person', PersonSchema);