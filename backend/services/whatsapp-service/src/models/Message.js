/**
 * Modelo para mensagens de WhatsApp
 */

const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  clientId: {
    type: String,
    required: true,
    index: true,
  },
  messageId: {
    type: String,
    required: true,
    index: true,
  },
  chatId: {
    type: String,
    required: true,
    index: true,
  },
  fromMe: {
    type: Boolean,
    required: true,
    index: true,
  },
  sender: {
    type: String,
    required: true,
    index: true,
  },
  recipient: {
    type: String,
    index: true,
  },
  body: {
    type: String,
    default: '',
  },
  hasMedia: {
    type: Boolean,
    default: false,
  },
  mediaType: {
    type: String,
    enum: ['image', 'video', 'audio', 'document', null],
    default: null,
  },
  mediaUrl: {
    type: String,
    default: null,
  },
  readStatus: {
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
}, {
  timestamps: true,
  versionKey: false,
});

// Índices compostos para melhorar performance de consultas
MessageSchema.index({ clientId: 1, chatId: 1, timestamp: -1 });
MessageSchema.index({ clientId: 1, sender: 1, timestamp: -1 });
MessageSchema.index({ clientId: 1, fromMe: 1, timestamp: -1 });
MessageSchema.index({ 'readStatus.isRead': 1, timestamp: -1 });

/**
 * Marca a mensagem como lida
 * @returns {Promise<Object>} Mensagem atualizada
 */
MessageSchema.methods.markAsRead = async function() {
  if (!this.readStatus.isRead) {
    this.readStatus.isRead = true;
    this.readStatus.readAt = new Date();
    return this.save();
  }
  return this;
};

/**
 * Busca histórico de conversa
 * @param {string} clientId - ID do cliente
 * @param {string} chatId - ID do chat
 * @param {Object} options - Opções de paginação
 * @returns {Promise<Array>} Mensagens da conversa
 */
MessageSchema.statics.getConversationHistory = async function(clientId, chatId, options = {}) {
  const { page = 1, limit = 50, sortDirection = 'desc' } = options;
  
  const query = { clientId, chatId };
  const sort = { timestamp: sortDirection === 'desc' ? -1 : 1 };
  
  const skip = (page - 1) * limit;
  
  const messages = await this.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();
  
  const total = await this.countDocuments(query);
  
  return {
    messages: sortDirection === 'asc' ? messages : messages.reverse(),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Marca todas as mensagens de um chat como lidas
 * @param {string} clientId - ID do cliente
 * @param {string} chatId - ID do chat
 * @param {Object} options - Opções adicionais
 * @returns {Promise<number>} Número de mensagens atualizadas
 */
MessageSchema.statics.markChatAsRead = async function(clientId, chatId, options = {}) {
  const { onlyReceived = true } = options;
  
  const query = {
    clientId,
    chatId,
    'readStatus.isRead': false,
  };
  
  if (onlyReceived) {
    query.fromMe = false;
  }
  
  const updateResult = await this.updateMany(query, {
    $set: {
      'readStatus.isRead': true,
      'readStatus.readAt': new Date(),
    },
  });
  
  return updateResult.modifiedCount;
};

const Message = mongoose.model('WhatsappMessage', MessageSchema);

module.exports = Message;
