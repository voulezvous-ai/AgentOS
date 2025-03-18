/**
 * Modelo para clientes WhatsApp
 */

const mongoose = require('mongoose');

const ClientSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['webjs', 'bailey'],
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['initializing', 'error', 'disconnected', 'authenticated', 'ready'],
    default: 'initializing',
  },
  autoConnectEnabled: {
    type: Boolean,
    default: true,
  },
  qrCode: {
    type: String,
    default: null,
  },
  qrCodeTimestamp: {
    type: Date,
    default: null,
  },
  lastActivity: {
    type: Date,
    default: Date.now,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  statusDetails: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
  versionKey: false,
});

// Índices
ClientSchema.index({ phoneNumber: 1 });
ClientSchema.index({ status: 1 });
ClientSchema.index({ createdAt: 1 });
ClientSchema.index({ type: 1 });

/**
 * Atualiza o status do cliente
 * @param {string} status - Novo status
 * @param {Object} details - Detalhes adicionais
 */
ClientSchema.methods.updateStatus = async function(status, details = {}) {
  this.status = status;
  this.statusDetails = details;
  this.lastActivity = new Date();
  return this.save();
};

/**
 * Atualiza o QR Code
 * @param {string} qrCode - Novo QR Code
 */
ClientSchema.methods.updateQR = async function(qrCode) {
  this.qrCode = qrCode;
  this.qrCodeTimestamp = new Date();
  return this.save();
};

/**
 * Verifica se o cliente está pronto
 * @returns {boolean}
 */
ClientSchema.methods.isReady = function() {
  return this.status === 'ready';
};

/**
 * Verifica se o QR Code está expirado
 * @param {number} timeoutMs - Tempo limite em milissegundos
 * @returns {boolean}
 */
ClientSchema.methods.isQRExpired = function(timeoutMs = 60000) {
  if (!this.qrCodeTimestamp) return true;
  const expired = Date.now() - this.qrCodeTimestamp.getTime() > timeoutMs;
  return expired;
};

const Client = mongoose.model('WhatsappClient', ClientSchema);

module.exports = Client;
