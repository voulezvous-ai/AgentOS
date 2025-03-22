
const mongoose = require('mongoose');

const LocationSchema = new mongoose.Schema({
  courierId: { type: String, required: true, unique: true },
  latitude: { type: Number, required: false },
  longitude: { type: Number, required: false },
  consentGiven: { type: Boolean, required: true, default: false }, // ✅ Salva o consentimento
  updatedAt: { type: Date, default: Date.now }
});

const Location = mongoose.model('Location', LocationSchema);
module.exports = { Location };
